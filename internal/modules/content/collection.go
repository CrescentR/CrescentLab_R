package content

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"unicode/utf8"

	platformhttp "CrescentLab_R/internal/platform/http"
	"github.com/gin-gonic/gin"
)

type Collection struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	Slug         string `json:"slug"`
	Description  string `json:"description"`
	SortOrder    int    `json:"sort_order"`
	ArticleCount int    `json:"article_count"`
}

type collectionInput struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

func (h *Handler) RegisterCollectionRoutes(public, admin *gin.RouterGroup) {
	public.GET("/collections", h.listCollections)
	admin.GET("/collections", h.listCollections)
	admin.POST("/collections", h.createCollection)
	admin.POST("/collections/update", h.updateCollection)
	admin.POST("/collections/delete", h.deleteCollection)
}

func (r *Repository) ListCollections(ctx context.Context) ([]Collection, error) {
	query := `SELECT c.id, c.name, c.slug, COALESCE(c.description, ''), c.sort_order,
		(SELECT COUNT(*) FROM articles a WHERE a.category_id = c.id AND a.deleted_at IS NULL)
		FROM post_categories c ORDER BY c.sort_order ASC, c.name ASC`
	if r.driver == "postgres" {
		query = convertPlaceholders(query)
	}
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list collections: %w", err)
	}
	defer rows.Close()
	items := make([]Collection, 0)
	for rows.Next() {
		var item Collection
		if err := rows.Scan(&item.ID, &item.Name, &item.Slug, &item.Description, &item.SortOrder, &item.ArticleCount); err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, rows.Err()
}

func validateCollectionInput(input collectionInput) error {
	if strings.TrimSpace(input.Name) == "" || utf8.RuneCountInString(input.Name) > 100 {
		return errors.New("collection name is required and must not exceed 100 characters")
	}
	if !slugPattern.MatchString(input.Slug) {
		return errors.New("collection slug must contain only lowercase letters, numbers, and hyphens")
	}
	return nil
}

func (r *Repository) CreateCollection(ctx context.Context, input collectionInput) (Collection, error) {
	if err := validateCollectionInput(input); err != nil {
		return Collection{}, err
	}
	query := "INSERT INTO post_categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)"
	if r.driver == "postgres" {
		query = convertPlaceholders(query) + " RETURNING id"
	}
	var id int64
	var err error
	if r.driver == "postgres" {
		err = r.db.QueryRowContext(ctx, query, input.Name, input.Slug, input.Description, input.SortOrder).Scan(&id)
	} else {
		var result sql.Result
		result, err = r.db.ExecContext(ctx, query, input.Name, input.Slug, input.Description, input.SortOrder)
		if err == nil {
			id, err = result.LastInsertId()
		}
	}
	if err != nil {
		return Collection{}, fmt.Errorf("create collection: %w", err)
	}
	items, err := r.ListCollections(ctx)
	if err != nil {
		return Collection{}, err
	}
	for _, item := range items {
		if item.ID == id {
			return item, nil
		}
	}
	return Collection{}, sql.ErrNoRows
}

func (h *Handler) listCollections(c *gin.Context) {
	items, err := h.repo.ListCollections(c.Request.Context())
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) createCollection(c *gin.Context) {
	var input collectionInput
	if err := c.ShouldBindJSON(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	item, err := h.repo.CreateCollection(c.Request.Context(), input)
	if err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError(err.Error()))
		return
	}
	c.JSON(http.StatusCreated, item)
}

func (h *Handler) updateCollection(c *gin.Context) {
	var input collectionInput
	if err := c.ShouldBindJSON(&input); err != nil || input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid collection request"))
		return
	}
	if err := validateCollectionInput(input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError(err.Error()))
		return
	}
	query := "UPDATE post_categories SET name = ?, slug = ?, description = ?, sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
	if h.repo.driver == "postgres" {
		query = convertPlaceholders(query)
	}
	result, err := h.repo.db.ExecContext(c.Request.Context(), query, input.Name, input.Slug, input.Description, input.SortOrder, input.ID)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		platformhttp.WriteError(c, platformhttp.NotFound("collection not found"))
		return
	}
	items, err := h.repo.ListCollections(c.Request.Context())
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	for _, item := range items {
		if item.ID == input.ID {
			c.JSON(http.StatusOK, item)
			return
		}
	}
}

func (h *Handler) deleteCollection(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
	}
	if err := c.ShouldBindJSON(&input); err != nil || input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid collection id"))
		return
	}
	tx, err := h.repo.db.BeginTx(c.Request.Context(), nil)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	clearArticles := "UPDATE articles SET category_id = NULL WHERE category_id = ?"
	deleteCollection := "DELETE FROM post_categories WHERE id = ?"
	if h.repo.driver == "postgres" {
		clearArticles = convertPlaceholders(clearArticles)
		deleteCollection = convertPlaceholders(deleteCollection)
	}
	if _, err = tx.ExecContext(c.Request.Context(), clearArticles, input.ID); err == nil {
		_, err = tx.ExecContext(c.Request.Context(), deleteCollection, input.ID)
	}
	if err != nil {
		_ = tx.Rollback()
		platformhttp.WriteError(c, err)
		return
	}
	if err = tx.Commit(); err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

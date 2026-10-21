package projects

import (
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"strconv"

	platformhttp "CrescentLab_R/internal/platform/http"
	"CrescentLab_R/internal/shared/editorhtml"
	sharedmarkdown "CrescentLab_R/internal/shared/markdown"
	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo     *Repository
	renderer *sharedmarkdown.Renderer
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo, renderer: sharedmarkdown.NewRenderer()}
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/projects", h.adminList)
	group.GET("/projects/detail", h.adminDetail)
	group.POST("/projects", h.create)
	group.POST("/projects/preview", h.preview)
	group.POST("/projects/update", h.update)
	group.POST("/projects/publish", h.publish)
	group.POST("/projects/delete", h.delete)
	group.GET("/projects/artifacts", h.listArtifacts)
	group.POST("/projects/artifacts/upload", h.uploadArtifact)
	group.POST("/projects/artifacts/publish", h.publishArtifact)
}

func (h *Handler) RegisterArtifactRoutes(group *gin.RouterGroup) {
	group.GET("/project-artifacts/:publicID/*path", h.serveArtifact)
	group.GET("/p/:slug/*path", h.servePublishedArtifact)
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.GET("/projects", h.publicList)
	group.GET("/projects/:slug", h.publicDetail)
}

func (h *Handler) publicList(c *gin.Context) {
	filter := parseProjectListFilter(c)
	filter.Public = true
	filter.Status = ""
	result, err := h.repo.List(c.Request.Context(), filter)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) publicDetail(c *gin.Context) {
	project, err := h.repo.GetBySlug(c.Request.Context(), c.Param("slug"))
	if err != nil || (project.Status != ProjectStatusPublished && project.Status != ProjectStatusArchived) {
		platformhttp.WriteError(c, platformhttp.NotFound("project not found"))
		return
	}
	c.JSON(http.StatusOK, project.Detail())
}

func (h *Handler) adminList(c *gin.Context) {
	filter := parseProjectListFilter(c)
	result, err := h.repo.List(c.Request.Context(), filter)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, result)
}

func (h *Handler) adminDetail(c *gin.Context) {
	id, err := strconv.ParseInt(c.Query("id"), 10, 64)
	if err != nil || id < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid project id"))
		return
	}
	project, err := h.repo.GetByID(c.Request.Context(), id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("project not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, project.Detail())
}

func (h *Handler) create(c *gin.Context) {
	var input CreateInput
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	rendered, err := h.renderContent(input)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	project, err := h.repo.Create(c.Request.Context(), input, rendered)
	if err != nil {
		writeProjectMutationError(c, err)
		return
	}
	c.JSON(http.StatusCreated, project.Detail())
}

func (h *Handler) update(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
		CreateInput
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid project id"))
		return
	}
	rendered, err := h.renderContent(input.CreateInput)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	project, err := h.repo.Update(c.Request.Context(), input.ID, input.CreateInput, rendered)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("project not found"))
			return
		}
		writeProjectMutationError(c, err)
		return
	}
	c.JSON(http.StatusOK, project.Detail())
}

func (h *Handler) delete(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid project id"))
		return
	}
	if err := h.repo.SoftDelete(c.Request.Context(), input.ID); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("project not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"success": true})
}

func (h *Handler) preview(c *gin.Context) {
	var input struct {
		ContentMD string `json:"content_md"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	rendered, err := h.renderer.Render(input.ContentMD)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"content_html": rendered.HTML})
}

func (h *Handler) publish(c *gin.Context) {
	var input struct {
		ID int64 `json:"id"`
		CreateInput
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid request body"))
		return
	}
	if input.ID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid project id"))
		return
	}
	input.Status = string(ProjectStatusPublished)
	rendered, err := h.renderContent(input.CreateInput)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	project, err := h.repo.Update(c.Request.Context(), input.ID, input.CreateInput, rendered)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("project not found"))
			return
		}
		writeProjectMutationError(c, err)
		return
	}
	c.JSON(http.StatusOK, project.Detail())
}

func (h *Handler) listArtifacts(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.Query("project_id"), 10, 64)
	if err != nil || projectID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid project id"))
		return
	}
	items, err := h.repo.ListArtifacts(c.Request.Context(), projectID)
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, gin.H{"items": items})
}

func (h *Handler) uploadArtifact(c *gin.Context) {
	projectID, err := strconv.ParseInt(c.PostForm("project_id"), 10, 64)
	if err != nil || projectID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid project id"))
		return
	}
	fileHeader, err := c.FormFile("file")
	if err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError("artifact file is required"))
		return
	}
	file, err := fileHeader.Open()
	if err != nil {
		platformhttp.WriteError(c, err)
		return
	}
	defer file.Close()
	artifact, err := h.repo.CreateArtifact(c.Request.Context(), projectID, c.PostForm("label"), fileHeader.Filename, file, "data/project-artifacts")
	if err != nil {
		platformhttp.WriteError(c, platformhttp.ValidationError(err.Error()))
		return
	}
	c.JSON(http.StatusCreated, artifact)
}

func (h *Handler) publishArtifact(c *gin.Context) {
	var input struct {
		ProjectID  int64 `json:"project_id"`
		ArtifactID int64 `json:"artifact_id"`
	}
	if err := json.NewDecoder(c.Request.Body).Decode(&input); err != nil || input.ProjectID < 1 || input.ArtifactID < 1 {
		platformhttp.WriteError(c, platformhttp.ValidationError("invalid artifact publish request"))
		return
	}
	artifact, err := h.repo.PublishArtifact(c.Request.Context(), input.ProjectID, input.ArtifactID)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			platformhttp.WriteError(c, platformhttp.NotFound("artifact not found"))
			return
		}
		platformhttp.WriteError(c, err)
		return
	}
	c.JSON(http.StatusOK, artifact)
}

func (h *Handler) serveArtifact(c *gin.Context) {
	path, err := h.repo.ArtifactFile(c.Request.Context(), c.Param("publicID"), c.Param("path"))
	if err != nil {
		platformhttp.WriteError(c, platformhttp.NotFound("artifact file not found"))
		return
	}
	c.Header("X-Robots-Tag", "noindex, nofollow")
	h.writeArtifactFile(c, path)
}

func (h *Handler) servePublishedArtifact(c *gin.Context) {
	path, err := h.repo.PublishedArtifactFile(c.Request.Context(), c.Param("slug"), c.Param("path"))
	if err != nil {
		platformhttp.WriteError(c, platformhttp.NotFound("published project artifact not found"))
		return
	}
	h.writeArtifactFile(c, path)
}

func (h *Handler) writeArtifactFile(c *gin.Context, path string) {
	c.Header("Content-Security-Policy", "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'self'; object-src 'none'; base-uri 'self'")
	c.Header("X-Content-Type-Options", "nosniff")
	c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
	c.Header("Cross-Origin-Resource-Policy", "same-site")
	c.Header("Content-Type", artifactContentType(path))
	info, statErr := os.Stat(path)
	if statErr == nil {
		c.Header("Content-Length", strconv.FormatInt(info.Size(), 10))
	}
	c.File(path)
}

func (h *Handler) renderContent(input CreateInput) (string, error) {
	if err := input.Validate(); err != nil {
		return "", platformhttp.ValidationError(err.Error())
	}
	if input.SourceFormat == "mdx" {
		return "", nil
	}
	if input.SourceFormat == "tiptap" || input.SourceFormat == "html" {
		return editorhtml.Sanitize(input.ContentHTML), nil
	}
	if input.ContentMD == "" {
		return "", nil
	}
	rendered, err := h.renderer.Render(input.ContentMD)
	if err != nil {
		return "", err
	}
	return rendered.HTML, nil
}

func writeProjectMutationError(c *gin.Context, err error) {
	if errors.Is(err, ErrProjectSlugConflict) {
		platformhttp.WriteError(c, platformhttp.Conflict("slug already exists"))
		return
	}
	platformhttp.WriteError(c, err)
}

func parseProjectListFilter(c *gin.Context) ListFilter {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	pageSize, _ := strconv.Atoi(c.DefaultQuery("page_size", "10"))
	return ListFilter{
		Status:   ProjectStatus(c.Query("status")),
		Search:   c.Query("search"),
		Page:     page,
		PageSize: pageSize,
	}
}

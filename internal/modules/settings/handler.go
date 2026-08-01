package settings

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"github.com/gin-gonic/gin"
)

type Handler struct {
	repo *Repository
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo}
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/settings", h.list)
	group.POST("/settings", h.upsertBatch)
}

type settingResponse struct {
	ID          int64           `json:"id"`
	Scope       string          `json:"scope"`
	GroupKey    string          `json:"group_key"`
	Key         string          `json:"key"`
	Value       json.RawMessage `json:"value"`
	ValueType   string          `json:"value_type"`
	IsPublic    bool            `json:"is_public"`
	IsEncrypted bool            `json:"is_encrypted"`
	Description *string         `json:"description"`
}

type settingsListResponse struct {
	Settings []settingResponse `json:"settings"`
}

type upsertSettingsRequest struct {
	Settings []upsertSettingRequest `json:"settings"`
}

type upsertSettingRequest struct {
	Scope       string          `json:"scope"`
	GroupKey    string          `json:"group_key"`
	Key         string          `json:"key"`
	Value       json.RawMessage `json:"value"`
	ValueType   string          `json:"value_type"`
	IsPublic    bool            `json:"is_public"`
	IsEncrypted bool            `json:"is_encrypted"`
	Description *string         `json:"description"`
}

type errorResponse struct {
	Error string `json:"error"`
}

func (h *Handler) list(c *gin.Context) {
	settings, err := h.repo.List(c.Request.Context(), ListFilter{
		Scope:    c.Query("scope"),
		GroupKey: c.Query("group_key"),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, errorResponse{Error: err.Error()})
		return
	}

	response := settingsListResponse{Settings: make([]settingResponse, 0, len(settings))}
	for _, setting := range settings {
		response.Settings = append(response.Settings, newSettingResponse(setting))
	}

	c.JSON(http.StatusOK, response)
}

func (h *Handler) upsertBatch(c *gin.Context) {
	var request upsertSettingsRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "request body must be valid JSON"})
		return
	}
	if len(request.Settings) == 0 {
		c.JSON(http.StatusBadRequest, errorResponse{Error: "settings is required"})
		return
	}

	settings := make([]Setting, 0, len(request.Settings))
	for _, item := range request.Settings {
		settings = append(settings, Setting{
			Scope:       item.Scope,
			GroupKey:    item.GroupKey,
			Key:         item.Key,
			Value:       item.Value,
			ValueType:   item.ValueType,
			IsPublic:    item.IsPublic,
			IsEncrypted: item.IsEncrypted,
			Description: newNullString(item.Description),
		})
	}

	updatedSettings, err := h.repo.UpsertMany(c.Request.Context(), settings)
	if err != nil {
		c.JSON(http.StatusBadRequest, errorResponse{Error: err.Error()})
		return
	}

	response := settingsListResponse{Settings: make([]settingResponse, 0, len(updatedSettings))}
	for _, setting := range updatedSettings {
		response.Settings = append(response.Settings, newSettingResponse(setting))
	}

	c.JSON(http.StatusOK, response)
}

func newSettingResponse(setting Setting) settingResponse {
	var description *string
	if setting.Description.Valid {
		description = &setting.Description.String
	}

	return settingResponse{
		ID:          setting.ID,
		Scope:       setting.Scope,
		GroupKey:    setting.GroupKey,
		Key:         setting.Key,
		Value:       setting.Value,
		ValueType:   setting.ValueType,
		IsPublic:    setting.IsPublic,
		IsEncrypted: setting.IsEncrypted,
		Description: description,
	}
}

func newNullString(value *string) sql.NullString {
	if value == nil {
		return sql.NullString{}
	}
	return sql.NullString{String: *value, Valid: true}
}

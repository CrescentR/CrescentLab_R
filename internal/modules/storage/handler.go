package storage

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const maxUploadSize = 20 << 20

type Handler struct {
	repo *Repository
	s3   *S3Client
}

func NewHandler(repo *Repository) *Handler {
	return &Handler{repo: repo, s3: NewS3Client()}
}

func (h *Handler) RegisterAdminRoutes(group *gin.RouterGroup) {
	group.GET("/storage/policies", h.listPolicies)
	group.POST("/storage/policies", h.createPolicy)
	group.POST("/storage/policies/:id", h.updatePolicy)
	group.POST("/storage/policies/:id/status", h.setStatus)
	group.POST("/storage/policies/:id/default", h.setDefault)
	group.POST("/storage/policies/:id/test", h.testPolicy)
	group.POST("/storage/policies/:id/onedrive/authorize", h.authorizeOneDrive)
	group.GET("/storage/files", h.listFiles)
	group.POST("/storage/upload", h.upload)
}

func (h *Handler) RegisterPublicRoutes(group *gin.RouterGroup) {
	group.GET("/f/:id", h.download)
	group.GET("/api/storage/onedrive/callback", h.oneDriveCallback)
}

func (h *Handler) listPolicies(c *gin.Context) {
	policies, err := h.repo.List(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"policies": policies})
}

func (h *Handler) createPolicy(c *gin.Context) {
	var input PolicyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数无效"})
		return
	}
	created, err := h.repo.Create(c.Request.Context(), input.policy())
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, created)
}

func (h *Handler) updatePolicy(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储策略 ID 无效"})
		return
	}
	var input PolicyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数无效"})
		return
	}
	policy := input.policy()
	policy.ID = id
	updated, err := h.repo.Update(c.Request.Context(), policy)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, updated)
}

func (h *Handler) setStatus(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储策略 ID 无效"})
		return
	}
	var request struct {
		Status string `json:"status"`
	}
	if err := c.ShouldBindJSON(&request); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请求参数无效"})
		return
	}
	if err := h.repo.SetStatus(c.Request.Context(), id, request.Status); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) setDefault(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储策略 ID 无效"})
		return
	}
	if err := h.repo.SetDefault(c.Request.Context(), id); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) listFiles(c *gin.Context) {
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "48"))
	files, err := h.repo.ListFiles(c.Request.Context(), c.Query("mime_prefix"), limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"files": files})
}

func (h *Handler) upload(c *gin.Context) {
	c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, maxUploadSize+(1<<20))
	header, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "请选择不超过 20MB 的文件"})
		return
	}
	data, err := readUpload(header)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	policy, err := h.repo.Default(c.Request.Context())
	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusConflict, gin.H{"error": "请先配置默认存储策略"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		}
		return
	}
	contentType := header.Header.Get("Content-Type")
	if contentType == "" {
		contentType = http.DetectContentType(data)
	}
	name := filepath.Base(header.Filename)
	objectKey := strings.Trim(policy.RootPrefix, "/")
	if objectKey != "" {
		objectKey += "/"
	}
	objectKey += time.Now().UTC().Format("2006/01/02/") + fmt.Sprintf("%d-%s", time.Now().UnixNano(), name)
	if err := h.put(c, policy, objectKey, contentType, data); err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	file, err := h.repo.SaveFile(c.Request.Context(), UploadedFile{
		StoragePolicyID: policy.ID,
		Name:            name,
		ObjectKey:       objectKey,
		MIMEType:        contentType,
		SizeBytes:       int64(len(data)),
	})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	file.URL = "/f/" + strconv.FormatInt(file.ID, 10)
	c.JSON(http.StatusCreated, file)
}

func (h *Handler) download(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	file, policy, err := h.repo.File(c.Request.Context(), id)
	if err != nil {
		c.Status(http.StatusNotFound)
		return
	}
	response, err := h.get(c, policy, file.ObjectKey)
	if err != nil {
		c.Status(http.StatusBadGateway)
		return
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		c.Status(http.StatusBadGateway)
		return
	}
	c.Header("Content-Type", file.MIMEType)
	c.Header("Content-Disposition", fmt.Sprintf("inline; filename=%q", strings.ReplaceAll(file.Name, "\"", "")))
	c.Status(http.StatusOK)
	_, _ = io.Copy(c.Writer, response.Body)
}

func (h *Handler) testPolicy(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储策略 ID 无效"})
		return
	}
	policy, err := h.repo.policyWithSecrets(c.Request.Context(), id)
	if err == nil {
		if policy.Type == "onedrive" {
			err = NewOneDriveClient(h.repo).Test(c.Request.Context(), policy)
		} else {
			err = h.s3.Test(policy)
		}
	}
	if err != nil {
		c.JSON(http.StatusBadGateway, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"ok": true})
}

func (h *Handler) authorizeOneDrive(c *gin.Context) {
	id, err := strconv.ParseInt(c.Param("id"), 10, 64)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "存储策略 ID 无效"})
		return
	}
	policy, err := h.repo.policyWithSecrets(c.Request.Context(), id)
	if err != nil || policy.Type != "onedrive" || policy.AuthMode != "delegated" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "委托授权 OneDrive 策略不存在"})
		return
	}
	stateBytes := make([]byte, 24)
	if _, err := rand.Read(stateBytes); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "生成授权状态失败"})
		return
	}
	state := strconv.FormatInt(id, 10) + "." + hex.EncodeToString(stateBytes)
	if err := h.repo.SaveOAuth(c.Request.Context(), id, state, policy.RefreshToken); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	redirectURI := requestBaseURL(c) + "/api/storage/onedrive/callback"
	c.JSON(http.StatusOK, gin.H{"authorization_url": NewOneDriveClient(h.repo).AuthorizationURL(policy, redirectURI, state)})
}

func (h *Handler) oneDriveCallback(c *gin.Context) {
	state := c.Query("state")
	parts := strings.SplitN(state, ".", 2)
	if len(parts) != 2 {
		c.String(http.StatusBadRequest, "OneDrive OAuth state 无效")
		return
	}
	id, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		c.String(http.StatusBadRequest, "OneDrive OAuth state 无效")
		return
	}
	policy, err := h.repo.policyWithSecrets(c.Request.Context(), id)
	if err != nil || policy.OAuthState != state {
		c.String(http.StatusBadRequest, "OneDrive OAuth state 已失效")
		return
	}
	redirectURI := requestBaseURL(c) + "/api/storage/onedrive/callback"
	if err := NewOneDriveClient(h.repo).ExchangeCode(c.Request.Context(), policy, redirectURI, c.Query("code")); err != nil {
		c.String(http.StatusBadRequest, err.Error())
		return
	}
	c.Redirect(http.StatusFound, "/admin/media?onedrive=connected")
}

func (h *Handler) put(c *gin.Context, policy Policy, objectKey, contentType string, data []byte) error {
	if policy.Type == "onedrive" {
		return NewOneDriveClient(h.repo).Put(c.Request.Context(), policy, objectKey, contentType, data)
	}
	return h.s3.Put(policy, objectKey, contentType, data)
}

func (h *Handler) get(c *gin.Context, policy Policy, objectKey string) (*http.Response, error) {
	if policy.Type == "onedrive" {
		return NewOneDriveClient(h.repo).Get(c.Request.Context(), policy, objectKey)
	}
	return h.s3.Get(policy, objectKey)
}

func requestBaseURL(c *gin.Context) string {
	scheme := c.GetHeader("X-Forwarded-Proto")
	if scheme == "" {
		scheme = "http"
		if c.Request.TLS != nil {
			scheme = "https"
		}
	}
	return scheme + "://" + c.Request.Host
}

func readUpload(header *multipart.FileHeader) ([]byte, error) {
	if header.Size > maxUploadSize {
		return nil, fmt.Errorf("文件不能超过 20MB")
	}
	file, err := header.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()
	data, err := io.ReadAll(io.LimitReader(file, maxUploadSize+1))
	if err != nil {
		return nil, err
	}
	if len(data) > maxUploadSize {
		return nil, fmt.Errorf("文件不能超过 20MB")
	}
	return data, nil
}

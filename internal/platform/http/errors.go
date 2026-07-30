package http

import (
	"errors"
	"log/slog"
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

var errorLog = slog.New(slog.NewTextHandler(os.Stdout, &slog.HandlerOptions{Level: slog.LevelDebug}))

// ErrorCode 是稳定的错误码字符串。
type ErrorCode string

const (
	CodeUnauthorized      ErrorCode = "UNAUTHORIZED"
	CodeTokenExpired      ErrorCode = "TOKEN_EXPIRED"
	CodeInvalidToken      ErrorCode = "INVALID_TOKEN"
	CodeForbidden         ErrorCode = "FORBIDDEN"
	CodeNotFound          ErrorCode = "NOT_FOUND"
	CodeValidationError   ErrorCode = "VALIDATION_ERROR"
	CodeConflict          ErrorCode = "CONFLICT"
	CodeRateLimited       ErrorCode = "RATE_LIMITED"
	CodePayloadTooLarge   ErrorCode = "PAYLOAD_TOO_LARGE"
	CodeInternalError     ErrorCode = "INTERNAL_ERROR"
	CodeServiceUnavailable ErrorCode = "SERVICE_UNAVAILABLE"
)

// AppError 是统一的业务错误类型，实现 error 接口。
type AppError struct {
	Code    ErrorCode `json:"code"`
	Message string    `json:"message"`
	Status  int       `json:"-"`
}

func (e *AppError) Error() string {
	return e.Message
}

// NewAppError 创建一个 AppError。
func NewAppError(code ErrorCode, status int, message string) *AppError {
	return &AppError{Code: code, Status: status, Message: message}
}

// 便捷构造函数

func Unauthorized(msg string) *AppError {
	if msg == "" {
		msg = "请先登录"
	}
	return NewAppError(CodeUnauthorized, http.StatusUnauthorized, msg)
}

func Forbidden(msg string) *AppError {
	if msg == "" {
		msg = "无权限访问"
	}
	return NewAppError(CodeForbidden, http.StatusForbidden, msg)
}

func NotFound(msg string) *AppError {
	if msg == "" {
		msg = "资源不存在"
	}
	return NewAppError(CodeNotFound, http.StatusNotFound, msg)
}

func ValidationError(msg string) *AppError {
	if msg == "" {
		msg = "参数校验失败"
	}
	return NewAppError(CodeValidationError, http.StatusBadRequest, msg)
}

func Conflict(msg string) *AppError {
	if msg == "" {
		msg = "状态冲突"
	}
	return NewAppError(CodeConflict, http.StatusConflict, msg)
}

func InternalError(msg string) *AppError {
	if msg == "" {
		msg = "服务暂时不可用"
	}
	return NewAppError(CodeInternalError, http.StatusInternalServerError, msg)
}

func ServiceUnavailable(msg string) *AppError {
	if msg == "" {
		msg = "服务暂时不可用"
	}
	return NewAppError(CodeServiceUnavailable, http.StatusServiceUnavailable, msg)
}

// errorBody 是统一的错误响应 JSON 结构。
type errorBody struct {
	Code      ErrorCode `json:"code"`
	Message   string    `json:"message"`
	RequestID string    `json:"request_id"`
}

// WriteError 将错误以统一格式写入 gin.Context。
// 如果 err 是 *AppError，使用其 Code/Status/Message；
// 否则作为内部错误处理（不泄露详情）。
func WriteError(c *gin.Context, err error) {
	if err == nil {
		return
	}

	var appErr *AppError
	if errors.As(err, &appErr) {
		c.JSON(appErr.Status, errorBody{
			Code:      appErr.Code,
			Message:   appErr.Message,
			RequestID: GetRequestID(c),
		})
		return
	}

	// 非 AppError 一律视为内部错误，记录实际错误后返回 500。
	errorLog.Error("internal error",
		"request_id", GetRequestID(c),
		"method", c.Request.Method,
		"path", c.Request.URL.Path,
		"error", err,
	)
	c.JSON(http.StatusInternalServerError, errorBody{
		Code:      CodeInternalError,
		Message:   "服务暂时不可用",
		RequestID: GetRequestID(c),
	})
}

// WriteErrorCode 直接用错误码和消息写入响应。
func WriteErrorCode(c *gin.Context, code ErrorCode, status int, msg string) {
	c.JSON(status, errorBody{
		Code:      code,
		Message:   msg,
		RequestID: GetRequestID(c),
	})
}

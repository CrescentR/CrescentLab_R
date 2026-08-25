package storage

import (
	"bytes"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"
	"time"
)

type S3Client struct{ httpClient *http.Client }

func NewS3Client() *S3Client {
	return &S3Client{httpClient: &http.Client{Timeout: 60 * time.Second}}
}

func (c *S3Client) Put(policy Policy, objectKey, contentType string, body []byte) error {
	req, err := signedRequest(http.MethodPut, policy, objectKey, contentType, body)
	if err != nil {
		return err
	}
	response, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("上传到 S3: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
		return fmt.Errorf("S3 上传失败（%d）：%s", response.StatusCode, strings.TrimSpace(string(message)))
	}
	return nil
}

func (c *S3Client) Get(policy Policy, objectKey string) (*http.Response, error) {
	req, err := signedRequest(http.MethodGet, policy, objectKey, "", nil)
	if err != nil {
		return nil, err
	}
	return c.httpClient.Do(req)
}

func (c *S3Client) Test(policy Policy) error {
	req, err := signedRequest(http.MethodHead, policy, "", "", nil)
	if err != nil {
		return err
	}
	response, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("连接 S3: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		hint := "请检查 Endpoint、Region、Bucket 和访问凭据"
		switch response.StatusCode {
		case http.StatusMovedPermanently, http.StatusTemporaryRedirect:
			hint = "Endpoint 或 Region 与 Bucket 所在区域不匹配"
		case http.StatusBadRequest:
			hint = "请求签名或 Endpoint、Region 配置不正确"
		case http.StatusForbidden:
			hint = "请检查 Access Key、Secret Access Key、Region、s3:ListBucket 权限及显式拒绝策略"
		case http.StatusNotFound:
			hint = "Bucket 名称或 Endpoint 不正确"
		}
		message := fmt.Sprintf("S3 连接测试失败：HTTP %d；请求地址 %s；%s", response.StatusCode, req.URL.Redacted(), hint)
		if region := response.Header.Get("X-Amz-Bucket-Region"); region != "" {
			message += "；AWS 返回区域 " + region
		}
		if requestID := response.Header.Get("X-Amz-Request-Id"); requestID != "" {
			message += "；AWS Request ID " + requestID
		}
		return fmt.Errorf("%s", message)
	}
	return nil
}

func signedRequest(method string, policy Policy, objectKey, contentType string, body []byte) (*http.Request, error) {
	endpoint, err := url.Parse(policy.Endpoint)
	if err != nil {
		return nil, fmt.Errorf("解析 Endpoint: %w", err)
	}
	objectPath := escapeObjectPath(objectKey)
	basePath := strings.TrimRight(endpoint.Path, "/")
	baseRawPath := strings.TrimRight(endpoint.EscapedPath(), "/")
	if policy.ForcePathStyle {
		endpoint.Path = basePath + "/" + policy.Bucket + "/" + objectKey
		endpoint.RawPath = baseRawPath + "/" + url.PathEscape(policy.Bucket) + "/" + objectPath
	} else {
		endpoint.Host = policy.Bucket + "." + endpoint.Host
		endpoint.Path = basePath + "/" + objectKey
		endpoint.RawPath = baseRawPath + "/" + objectPath
	}
	payloadHash := sha256Hex(body)
	now := time.Now().UTC()
	amzDate, date := now.Format("20060102T150405Z"), now.Format("20060102")
	headers := "host:" + endpoint.Host + "\n" + "x-amz-content-sha256:" + payloadHash + "\n" + "x-amz-date:" + amzDate + "\n"
	signedHeaders := "host;x-amz-content-sha256;x-amz-date"
	if contentType != "" {
		headers = "content-type:" + contentType + "\n" + headers
		signedHeaders = "content-type;" + signedHeaders
	}
	canonical := method + "\n" + endpoint.EscapedPath() + "\n\n" + headers + "\n" + signedHeaders + "\n" + payloadHash
	scope := date + "/" + policy.Region + "/s3/aws4_request"
	stringToSign := "AWS4-HMAC-SHA256\n" + amzDate + "\n" + scope + "\n" + sha256Hex([]byte(canonical))
	signature := hex.EncodeToString(hmacSHA256(signingKey(policy.SecretAccessKey, date, policy.Region), stringToSign))
	authorization := "AWS4-HMAC-SHA256 Credential=" + policy.AccessKeyID + "/" + scope + ", SignedHeaders=" + signedHeaders + ", Signature=" + signature
	req, err := http.NewRequest(method, endpoint.String(), bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	req.Header.Set("X-Amz-Content-Sha256", payloadHash)
	req.Header.Set("X-Amz-Date", amzDate)
	req.Header.Set("Authorization", authorization)
	return req, nil
}

func escapeObjectPath(key string) string {
	if strings.TrimSpace(key) == "" {
		return ""
	}
	parts := strings.Split(strings.TrimLeft(path.Clean("/"+key), "/"), "/")
	for i := range parts {
		parts[i] = url.PathEscape(parts[i])
	}
	return strings.Join(parts, "/")
}

func sha256Hex(value []byte) string {
	sum := sha256.Sum256(value)
	return hex.EncodeToString(sum[:])
}

func hmacSHA256(key []byte, value string) []byte {
	mac := hmac.New(sha256.New, key)
	_, _ = mac.Write([]byte(value))
	return mac.Sum(nil)
}

func signingKey(secret, date, region string) []byte {
	dateKey := hmacSHA256([]byte("AWS4"+secret), date)
	regionKey := hmacSHA256(dateKey, region)
	serviceKey := hmacSHA256(regionKey, "s3")
	return hmacSHA256(serviceKey, "aws4_request")
}

package storage

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type OneDriveClient struct {
	httpClient *http.Client
	repo       *Repository
}

type graphToken struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	Error        string `json:"error"`
	Description  string `json:"error_description"`
}

func NewOneDriveClient(repo *Repository) *OneDriveClient {
	return &OneDriveClient{httpClient: &http.Client{Timeout: 60 * time.Second}, repo: repo}
}

func (c *OneDriveClient) AuthorizationURL(policy Policy, redirectURI, state string) string {
	values := url.Values{
		"client_id":     {policy.ClientID},
		"response_type": {"code"},
		"redirect_uri":  {redirectURI},
		"response_mode": {"query"},
		"scope":         {"offline_access Files.ReadWrite.All"},
		"state":         {state},
	}
	return "https://login.microsoftonline.com/" + url.PathEscape(policy.TenantID) + "/oauth2/v2.0/authorize?" + values.Encode()
}

func (c *OneDriveClient) ExchangeCode(ctx context.Context, policy Policy, redirectURI, code string) error {
	values := url.Values{
		"client_id":     {policy.ClientID},
		"client_secret": {policy.ClientSecret},
		"grant_type":    {"authorization_code"},
		"code":          {code},
		"redirect_uri":  {redirectURI},
		"scope":         {"offline_access Files.ReadWrite.All"},
	}
	token, err := c.tokenRequest(ctx, policy.TenantID, values)
	if err != nil {
		return err
	}
	if token.RefreshToken == "" {
		return fmt.Errorf("Microsoft 未返回 refresh token")
	}
	return c.repo.SaveOAuth(ctx, policy.ID, "", token.RefreshToken)
}

func (c *OneDriveClient) Put(ctx context.Context, policy Policy, objectKey, contentType string, body []byte) error {
	token, err := c.accessToken(ctx, policy)
	if err != nil {
		return err
	}
	endpoint := graphFileURL(policy.DriveID, objectKey) + ":/content"
	req, err := http.NewRequestWithContext(ctx, http.MethodPut, endpoint, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	req.Header.Set("Content-Type", contentType)
	response, err := c.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("上传到 OneDrive: %w", err)
	}
	defer response.Body.Close()
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		message, _ := io.ReadAll(io.LimitReader(response.Body, 2048))
		return fmt.Errorf("OneDrive 上传失败（%d）：%s", response.StatusCode, strings.TrimSpace(string(message)))
	}
	return nil
}

func (c *OneDriveClient) Get(ctx context.Context, policy Policy, objectKey string) (*http.Response, error) {
	token, err := c.accessToken(ctx, policy)
	if err != nil {
		return nil, err
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, graphFileURL(policy.DriveID, objectKey)+":/content", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	return c.httpClient.Do(req)
}

func (c *OneDriveClient) Test(ctx context.Context, policy Policy) error {
	token, err := c.accessToken(ctx, policy)
	if err != nil {
		return err
	}
	req, _ := http.NewRequestWithContext(ctx, http.MethodGet, "https://graph.microsoft.com/v1.0/drives/"+url.PathEscape(policy.DriveID), nil)
	req.Header.Set("Authorization", "Bearer "+token)
	response, err := c.httpClient.Do(req)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return fmt.Errorf("OneDrive 连接测试失败（%d）", response.StatusCode)
	}
	return nil
}

func (c *OneDriveClient) accessToken(ctx context.Context, policy Policy) (string, error) {
	values := url.Values{
		"client_id":     {policy.ClientID},
		"client_secret": {policy.ClientSecret},
	}
	if policy.AuthMode == "application" {
		values.Set("grant_type", "client_credentials")
		values.Set("scope", "https://graph.microsoft.com/.default")
	} else {
		if policy.RefreshToken == "" {
			return "", fmt.Errorf("OneDrive 策略尚未完成管理员授权")
		}
		values.Set("grant_type", "refresh_token")
		values.Set("refresh_token", policy.RefreshToken)
		values.Set("scope", "offline_access Files.ReadWrite.All")
	}
	token, err := c.tokenRequest(ctx, policy.TenantID, values)
	if err != nil {
		return "", err
	}
	if token.RefreshToken != "" && token.RefreshToken != policy.RefreshToken {
		_ = c.repo.SaveOAuth(ctx, policy.ID, "", token.RefreshToken)
	}
	return token.AccessToken, nil
}

func (c *OneDriveClient) tokenRequest(ctx context.Context, tenantID string, values url.Values) (graphToken, error) {
	endpoint := "https://login.microsoftonline.com/" + url.PathEscape(tenantID) + "/oauth2/v2.0/token"
	req, _ := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(values.Encode()))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	response, err := c.httpClient.Do(req)
	if err != nil {
		return graphToken{}, fmt.Errorf("请求 Microsoft Token: %w", err)
	}
	defer response.Body.Close()
	var token graphToken
	if err := json.NewDecoder(io.LimitReader(response.Body, 1<<20)).Decode(&token); err != nil {
		return graphToken{}, err
	}
	if response.StatusCode != http.StatusOK || token.AccessToken == "" {
		return graphToken{}, fmt.Errorf("Microsoft 授权失败：%s", strings.TrimSpace(token.Description))
	}
	return token, nil
}

func graphFileURL(driveID, objectKey string) string {
	parts := strings.Split(strings.Trim(objectKey, "/"), "/")
	for index := range parts {
		parts[index] = url.PathEscape(parts[index])
	}
	return "https://graph.microsoft.com/v1.0/drives/" + url.PathEscape(driveID) + "/root:/" + strings.Join(parts, "/")
}

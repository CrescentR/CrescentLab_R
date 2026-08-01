package storage

import (
	"errors"
	"strings"
	"time"
)

type Policy struct {
	ID              int64     `json:"id"`
	Name            string    `json:"name"`
	Type            string    `json:"type"`
	Bucket          string    `json:"bucket"`
	Endpoint        string    `json:"endpoint"`
	Region          string    `json:"region"`
	BaseURL         string    `json:"base_url"`
	RootPrefix      string    `json:"root_prefix"`
	PublicRead      bool      `json:"public_read"`
	ForcePathStyle  bool      `json:"force_path_style"`
	AccessKeyID     string    `json:"-"`
	SecretAccessKey string    `json:"-"`
	AuthMode        string    `json:"auth_mode,omitempty"`
	TenantID        string    `json:"tenant_id,omitempty"`
	ClientID        string    `json:"client_id,omitempty"`
	ClientSecret    string    `json:"-"`
	DriveID         string    `json:"drive_id,omitempty"`
	RefreshToken    string    `json:"-"`
	OAuthState      string    `json:"-"`
	IsDefault       bool      `json:"is_default"`
	Status          string    `json:"status"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// PolicyInput separates writable secrets from Policy so API responses can keep
// using json:"-" without preventing request binding.
type PolicyInput struct {
	Policy
	AccessKeyID     string `json:"access_key_id"`
	SecretAccessKey string `json:"secret_access_key"`
	ClientSecret    string `json:"client_secret"`
}

func (input PolicyInput) policy() Policy {
	policy := input.Policy
	policy.AccessKeyID = input.AccessKeyID
	policy.SecretAccessKey = input.SecretAccessKey
	policy.ClientSecret = input.ClientSecret
	return policy
}

func (p *Policy) normalize() {
	p.Name = strings.TrimSpace(p.Name)
	p.Type = strings.TrimSpace(p.Type)
	p.Bucket = strings.TrimSpace(p.Bucket)
	p.Endpoint = strings.TrimRight(strings.TrimSpace(p.Endpoint), "/")
	if p.Endpoint != "" && !strings.HasPrefix(p.Endpoint, "https://") && !strings.HasPrefix(p.Endpoint, "http://") {
		p.Endpoint = "https://" + p.Endpoint
	}
	p.Region = strings.TrimSpace(p.Region)
	if p.Region == "" {
		p.Region = "us-east-1"
	}
	p.BaseURL = strings.TrimRight(strings.TrimSpace(p.BaseURL), "/")
	p.RootPrefix = strings.Trim(strings.TrimSpace(p.RootPrefix), "/")
	p.AccessKeyID = strings.TrimSpace(p.AccessKeyID)
	p.AuthMode = strings.TrimSpace(p.AuthMode)
	p.TenantID = strings.TrimSpace(p.TenantID)
	p.ClientID = strings.TrimSpace(p.ClientID)
	p.DriveID = strings.TrimSpace(p.DriveID)
	p.Status = "active"
}

func (p Policy) validate() error {
	if p.Name == "" {
		return errors.New("名称为必填项")
	}
	if p.Type == "onedrive" {
		if p.TenantID == "" || p.ClientID == "" || p.ClientSecret == "" || p.DriveID == "" {
			return errors.New("OneDrive 的 Tenant ID、Client ID、Client Secret 和 Drive ID 均为必填项")
		}
		if p.AuthMode != "delegated" && p.AuthMode != "application" {
			return errors.New("OneDrive 授权模式无效")
		}
		return nil
	}
	switch p.Type {
	case "aws_s3", "cloudflare_r2", "s3_compatible", "aliyun_oss", "tencent_cos", "qiniu":
	default:
		return errors.New("不支持的存储类型")
	}
	if p.Bucket == "" || p.Endpoint == "" || p.AccessKeyID == "" || p.SecretAccessKey == "" {
		return errors.New("名称、Bucket、Endpoint、Access Key ID 和 Secret Access Key 均为必填项")
	}
	if !strings.HasPrefix(p.Endpoint, "https://") && !strings.HasPrefix(p.Endpoint, "http://") {
		return errors.New("Endpoint 必须是 http 或 https URL")
	}
	return nil
}

type UploadedFile struct {
	ID              int64  `json:"id"`
	StoragePolicyID int64  `json:"storage_policy_id"`
	Name            string `json:"name"`
	ObjectKey       string `json:"object_key"`
	URL             string `json:"url"`
	MIMEType        string `json:"mime_type"`
	SizeBytes       int64  `json:"size_bytes"`
}

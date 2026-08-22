package storage

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	_ "modernc.org/sqlite"
)

func TestLoadOrCreateKeyPersistsKey(t *testing.T) {
	path := t.TempDir() + "/storage/storage.key"
	first, err := LoadOrCreateKey(path)
	if err != nil {
		t.Fatal(err)
	}
	second, err := LoadOrCreateKey(path)
	if err != nil {
		t.Fatal(err)
	}
	if string(first) != string(second) || len(first) != 32 {
		t.Fatal("storage encryption key was not persisted")
	}
}

func TestSignedRequestUsesPathStyleAndHidesSecret(t *testing.T) {
	policy := Policy{
		Bucket:          "media",
		Endpoint:        "https://storage.example.com",
		Region:          "us-east-1",
		AccessKeyID:     "key-id",
		SecretAccessKey: "secret-value",
		ForcePathStyle:  true,
	}
	request, err := signedRequest(http.MethodPut, policy, "articles/示例 image.png", "image/png", []byte("image"))
	if err != nil {
		t.Fatal(err)
	}
	if request.URL.Path != "/media/articles/示例 image.png" {
		t.Fatalf("unexpected path: %s", request.URL.Path)
	}
	authorization := request.Header.Get("Authorization")
	if !strings.Contains(authorization, "Credential=key-id/") || strings.Contains(authorization, policy.SecretAccessKey) {
		t.Fatalf("unexpected authorization header: %s", authorization)
	}
}

func TestRepositoryMaintainsSingleDefaultPolicy(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	repo := NewRepository(db, "sqlite")
	if err := repo.EnsureSchema(context.Background()); err != nil {
		t.Fatal(err)
	}
	first, err := repo.Create(context.Background(), testPolicy("first", true))
	if err != nil {
		t.Fatal(err)
	}
	second, err := repo.Create(context.Background(), testPolicy("second", true))
	if err != nil {
		t.Fatal(err)
	}
	policies, err := repo.List(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defaults := 0
	for _, policy := range policies {
		if policy.IsDefault {
			defaults++
			if policy.ID != second.ID {
				t.Fatalf("expected second policy to be default, got %d", policy.ID)
			}
		}
	}
	if defaults != 1 || first.ID == second.ID {
		t.Fatalf("unexpected defaults=%d ids=%d,%d", defaults, first.ID, second.ID)
	}
	var storedSecret string
	if err := db.QueryRow("SELECT secret_access_key FROM storage_policies WHERE id = ?", second.ID).Scan(&storedSecret); err != nil {
		t.Fatal(err)
	}
	if storedSecret == "secret" {
		t.Fatal("secret access key was stored as plaintext")
	}
	defaultPolicy, err := repo.Default(context.Background())
	if err != nil || defaultPolicy.SecretAccessKey != "secret" {
		t.Fatalf("default policy secret was not decrypted: %v", err)
	}
	if err := repo.SetStatus(context.Background(), second.ID, "disabled"); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.Default(context.Background()); err != sql.ErrNoRows {
		t.Fatalf("disabled default policy should not be selected: %v", err)
	}
	if err := repo.SetStatus(context.Background(), second.ID, "deleted"); err != nil {
		t.Fatal(err)
	}
	policies, err = repo.List(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	for _, policy := range policies {
		if policy.ID == second.ID {
			t.Fatal("deleted policy remained visible")
		}
	}
}

func TestCreatePolicyBindsSecretsWithoutReturningThem(t *testing.T) {
	gin.SetMode(gin.TestMode)
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	db.SetMaxOpenConns(1)

	repo := NewRepository(db, "sqlite")
	if err := repo.EnsureSchema(context.Background()); err != nil {
		t.Fatal(err)
	}

	router := gin.New()
	NewHandler(repo).RegisterAdminRoutes(router.Group("/api/admin"))
	body, err := json.Marshal(map[string]any{
		"name":              "r2",
		"type":              "cloudflare_r2",
		"bucket":            "media",
		"endpoint":          "storage.example.com",
		"region":            "us-east-1",
		"root_prefix":       "uploads",
		"access_key_id":     "test-access-key",
		"secret_access_key": "test-secret-key",
	})
	if err != nil {
		t.Fatal(err)
	}

	request := httptest.NewRequest(http.MethodPost, "/api/admin/storage/policies", bytes.NewReader(body))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	router.ServeHTTP(response, request)

	if response.Code != http.StatusCreated {
		t.Fatalf("expected policy creation to succeed, got status %d: %s", response.Code, response.Body.String())
	}
	if strings.Contains(response.Body.String(), "test-access-key") ||
		strings.Contains(response.Body.String(), "test-secret-key") {
		t.Fatal("storage credentials leaked in policy response")
	}
}

func TestRepositoryListsUploadedImageFiles(t *testing.T) {
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatal(err)
	}
	defer db.Close()
	repo := NewRepository(db, "sqlite")
	if err := repo.EnsureSchema(context.Background()); err != nil {
		t.Fatal(err)
	}
	policy, err := repo.Create(context.Background(), testPolicy("default", true))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := repo.SaveFile(context.Background(), UploadedFile{
		StoragePolicyID: policy.ID,
		Name:            "cover.png",
		ObjectKey:       "uploads/cover.png",
		MIMEType:        "image/png",
		SizeBytes:       12,
	}); err != nil {
		t.Fatal(err)
	}
	if _, err := repo.SaveFile(context.Background(), UploadedFile{
		StoragePolicyID: policy.ID,
		Name:            "notes.txt",
		ObjectKey:       "uploads/notes.txt",
		MIMEType:        "text/plain",
		SizeBytes:       4,
	}); err != nil {
		t.Fatal(err)
	}

	files, err := repo.ListFiles(context.Background(), "image/", 20)
	if err != nil {
		t.Fatal(err)
	}
	if len(files) != 1 || files[0].Name != "cover.png" || files[0].URL != "/f/1" {
		t.Fatalf("unexpected image list: %+v", files)
	}
}

func testPolicy(name string, isDefault bool) Policy {
	return Policy{
		Name:            name,
		Type:            "s3_compatible",
		Bucket:          "media",
		Endpoint:        "https://storage.example.com",
		Region:          "us-east-1",
		AccessKeyID:     "key",
		SecretAccessKey: "secret",
		IsDefault:       isDefault,
	}
}

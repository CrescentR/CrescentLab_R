package storage

import (
	"context"
	"database/sql"
	"net/http"
	"strings"
	"testing"

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

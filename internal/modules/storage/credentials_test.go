package storage

import (
	"bytes"
	"database/sql/driver"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"regexp"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/gin-gonic/gin"
)

func TestResetCredentialsReplacesUnreadableCiphertext(t *testing.T) {
	tests := []struct {
		name       string
		policyType string
		body       string
		want       map[string]string
	}{
		{
			name:       "S3 compatible credentials",
			policyType: "s3_compatible",
			body:       `{"access_key_id":"new-access","secret_access_key":"new-secret"}`,
			want:       map[string]string{"access_key_id": "new-access", "secret_access_key": "new-secret"},
		},
		{
			name:       "OneDrive client secret",
			policyType: "onedrive",
			body:       `{"client_secret":"new-client-secret"}`,
			want:       map[string]string{"client_secret": "new-client-secret"},
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			db, mock, err := sqlmock.New()
			if err != nil {
				t.Fatal(err)
			}
			defer db.Close()

			key := bytes.Repeat([]byte{7}, 32)
			repo := NewRepository(db, "postgres", key)
			mock.ExpectBegin()
			mock.ExpectQuery(regexp.QuoteMeta(`SELECT type FROM storage_policies WHERE id=$1 AND deleted_at IS NULL FOR UPDATE`)).
				WithArgs(int64(42)).
				WillReturnRows(sqlmock.NewRows([]string{"type"}).AddRow(test.policyType))
			mock.ExpectExec(regexp.QuoteMeta(`UPDATE storage_policies SET secrets_ciphertext=$1, updated_at=CURRENT_TIMESTAMP WHERE id=$2 AND deleted_at IS NULL`)).
				WithArgs(resetSecretsMatcher{key: key, want: test.want}, int64(42)).
				WillReturnResult(sqlmock.NewResult(0, 1))
			mock.ExpectCommit()

			gin.SetMode(gin.TestMode)
			router := gin.New()
			NewHandler(repo).RegisterAdminRoutes(router.Group("/api/admin"))
			request := httptest.NewRequest(http.MethodPost, "/api/admin/storage/policies/42/credentials/reset", bytes.NewBufferString(test.body))
			request.Header.Set("Content-Type", "application/json")
			response := httptest.NewRecorder()
			router.ServeHTTP(response, request)

			if response.Code != http.StatusOK {
				t.Fatalf("expected credentials reset to succeed, got %d: %s", response.Code, response.Body.String())
			}
			if err := mock.ExpectationsWereMet(); err != nil {
				t.Fatal(err)
			}
		})
	}
}

type resetSecretsMatcher struct {
	key  []byte
	want map[string]string
}

func (matcher resetSecretsMatcher) Match(value driver.Value) bool {
	data, ok := value.([]byte)
	if !ok {
		return false
	}
	var stored map[string]string
	if err := json.Unmarshal(data, &stored); err != nil {
		return false
	}
	for _, name := range []string{"access_key_id", "secret_access_key", "client_secret"} {
		plain, err := decryptSecret(matcher.key, stored[name])
		if err != nil || plain != matcher.want[name] {
			return false
		}
	}
	return stored["refresh_token"] == "" && stored["oauth_state"] == ""
}

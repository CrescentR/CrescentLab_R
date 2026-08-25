package storage

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

func TestS3ConnectionTestReturnsActionableError(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(response http.ResponseWriter, request *http.Request) {
		response.Header().Set("X-Amz-Bucket-Region", "ap-northeast-1")
		response.Header().Set("X-Amz-Request-Id", "request-123")
		response.WriteHeader(http.StatusForbidden)
	}))
	defer server.Close()

	client := &S3Client{httpClient: server.Client()}
	err := client.Test(Policy{
		Bucket:          "cms-bucket",
		Endpoint:        server.URL,
		Region:          "ap-northeast-1",
		AccessKeyID:     "access-key",
		SecretAccessKey: "secret-key",
		ForcePathStyle:  true,
	})
	if err == nil {
		t.Fatal("expected S3 connection test to fail")
	}
	message := err.Error()
	for _, expected := range []string{"HTTP 403", server.URL + "/cms-bucket/", "s3:ListBucket", "ap-northeast-1", "request-123"} {
		if !strings.Contains(message, expected) {
			t.Fatalf("error %q does not include %q", message, expected)
		}
	}
}

package auth

import (
	"errors"
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

func TestPasswordHashAndVerify(t *testing.T) {
	hash, err := HashPassword("correct horse battery staple")
	if err != nil {
		t.Fatalf("HashPassword() error = %v", err)
	}
	if hash == "correct horse battery staple" {
		t.Fatal("HashPassword() returned the plaintext password")
	}
	if err := VerifyPassword(hash, "correct horse battery staple"); err != nil {
		t.Fatalf("VerifyPassword() with correct password error = %v", err)
	}
	if err := VerifyPassword(hash, "wrong password"); !errors.Is(err, ErrInvalidPassword) {
		t.Fatalf("VerifyPassword() with wrong password error = %v, want ErrInvalidPassword", err)
	}
}

func TestServiceIssuesAndParsesAccessToken(t *testing.T) {
	service := newTestService(t, []byte("test-secret"))
	identity := Identity{UserID: 42, Username: "alice", IsAdmin: true}

	raw, err := service.IssueAccessToken(identity)
	if err != nil {
		t.Fatalf("IssueAccessToken() error = %v", err)
	}
	claims, err := service.ParseAccessToken(raw)
	if err != nil {
		t.Fatalf("ParseAccessToken() error = %v", err)
	}
	assertClaims(t, claims, identity, TokenTypeAccess)
}

func TestServiceIssuesAndParsesRefreshToken(t *testing.T) {
	service := newTestService(t, []byte("test-secret"))
	identity := Identity{UserID: 84, Username: "bob", IsAdmin: false}

	raw, err := service.IssueRefreshToken(identity)
	if err != nil {
		t.Fatalf("IssueRefreshToken() error = %v", err)
	}
	claims, err := service.ParseRefreshToken(raw)
	if err != nil {
		t.Fatalf("ParseRefreshToken() error = %v", err)
	}
	assertClaims(t, claims, identity, TokenTypeRefresh)
}

func TestServiceRejectsTokenSignedWithWrongSecret(t *testing.T) {
	issuer := newTestService(t, []byte("issuer-secret"))
	parser := newTestService(t, []byte("parser-secret"))
	raw, err := issuer.IssueAccessToken(Identity{UserID: 42, Username: "alice"})
	if err != nil {
		t.Fatalf("IssueAccessToken() error = %v", err)
	}

	if _, err := parser.ParseAccessToken(raw); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseAccessToken() with wrong secret error = %v, want ErrInvalidToken", err)
	}
}

func TestServiceRejectsMalformedToken(t *testing.T) {
	service := newTestService(t, []byte("test-secret"))

	if _, err := service.ParseAccessToken("not-a-jwt"); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseAccessToken() malformed token error = %v, want ErrInvalidToken", err)
	}
}

func TestServiceRejectsExpiredToken(t *testing.T) {
	secret := []byte("test-secret")
	service := newTestService(t, secret)
	now := time.Now()
	claims := Claims{
		UserID:    42,
		Username:  "alice",
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now.Add(-2 * time.Hour)),
			ExpiresAt: jwt.NewNumericDate(now.Add(-time.Hour)),
		},
	}
	raw, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(secret)
	if err != nil {
		t.Fatalf("sign expired token: %v", err)
	}

	_, err = service.ParseAccessToken(raw)
	if !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseAccessToken() expired token error = %v, want ErrInvalidToken", err)
	}
	if !errors.Is(err, jwt.ErrTokenExpired) {
		t.Fatalf("ParseAccessToken() expired token error = %v, want jwt.ErrTokenExpired", err)
	}
}

func TestServiceRejectsNonHS256Token(t *testing.T) {
	secret := []byte("test-secret")
	service := newTestService(t, secret)
	now := time.Now()
	claims := Claims{
		UserID:    42,
		Username:  "alice",
		TokenType: TokenTypeAccess,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(time.Hour)),
		},
	}
	raw, err := jwt.NewWithClaims(jwt.SigningMethodHS384, claims).SignedString(secret)
	if err != nil {
		t.Fatalf("sign HS384 token: %v", err)
	}

	if _, err := service.ParseAccessToken(raw); !errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseAccessToken() HS384 token error = %v, want ErrInvalidToken", err)
	}
}

func TestServiceRejectsTokenTypeMixing(t *testing.T) {
	service := newTestService(t, []byte("test-secret"))
	identity := Identity{UserID: 42, Username: "alice"}

	accessToken, err := service.IssueAccessToken(identity)
	if err != nil {
		t.Fatalf("IssueAccessToken() error = %v", err)
	}
	if _, err := service.ParseRefreshToken(accessToken); !errors.Is(err, ErrUnexpectedTokenType) {
		t.Fatalf("ParseRefreshToken(access token) error = %v, want ErrUnexpectedTokenType", err)
	} else if errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseRefreshToken(access token) error = %v, do not want ErrInvalidToken", err)
	}

	refreshToken, err := service.IssueRefreshToken(identity)
	if err != nil {
		t.Fatalf("IssueRefreshToken() error = %v", err)
	}
	if _, err := service.ParseAccessToken(refreshToken); !errors.Is(err, ErrUnexpectedTokenType) {
		t.Fatalf("ParseAccessToken(refresh token) error = %v, want ErrUnexpectedTokenType", err)
	} else if errors.Is(err, ErrInvalidToken) {
		t.Fatalf("ParseAccessToken(refresh token) error = %v, do not want ErrInvalidToken", err)
	}
}

func TestNewServiceRejectsInvalidConfiguration(t *testing.T) {
	tests := []struct {
		name       string
		secret     []byte
		accessTTL  time.Duration
		refreshTTL time.Duration
	}{
		{name: "empty secret", accessTTL: time.Hour, refreshTTL: 24 * time.Hour},
		{name: "non-positive access TTL", secret: []byte("secret"), refreshTTL: 24 * time.Hour},
		{name: "non-positive refresh TTL", secret: []byte("secret"), accessTTL: time.Hour},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if _, err := NewService(tt.secret, tt.accessTTL, tt.refreshTTL); err == nil {
				t.Fatal("NewService() error = nil")
			}
		})
	}
}

func newTestService(t *testing.T, secret []byte) *Service {
	t.Helper()
	service, err := NewService(secret, 2*time.Hour, 7*24*time.Hour)
	if err != nil {
		t.Fatalf("NewService() error = %v", err)
	}
	return service
}

func assertClaims(t *testing.T, claims *Claims, identity Identity, tokenType TokenType) {
	t.Helper()
	if claims.UserID != identity.UserID {
		t.Errorf("claims.UserID = %d, want %d", claims.UserID, identity.UserID)
	}
	if claims.Username != identity.Username {
		t.Errorf("claims.Username = %q, want %q", claims.Username, identity.Username)
	}
	if claims.IsAdmin != identity.IsAdmin {
		t.Errorf("claims.IsAdmin = %t, want %t", claims.IsAdmin, identity.IsAdmin)
	}
	if claims.TokenType != tokenType {
		t.Errorf("claims.TokenType = %q, want %q", claims.TokenType, tokenType)
	}
	if claims.IssuedAt == nil {
		t.Error("claims.IssuedAt = nil")
	}
	if claims.ExpiresAt == nil {
		t.Error("claims.ExpiresAt = nil")
	}
}

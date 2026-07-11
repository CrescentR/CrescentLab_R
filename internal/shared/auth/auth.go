package auth

import (
	"errors"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidPassword     = errors.New("invalid password")
	ErrInvalidToken        = errors.New("invalid token")
	ErrUnexpectedTokenType = errors.New("unexpected token type")
)

type TokenType string

const (
	TokenTypeAccess  TokenType = "access"
	TokenTypeRefresh TokenType = "refresh"
)

type Identity struct {
	UserID   int64
	Username string
	IsAdmin  bool
}

type Claims struct {
	UserID    int64     `json:"user_id"`
	Username  string    `json:"username"`
	IsAdmin   bool      `json:"is_admin"`
	TokenType TokenType `json:"token_type"`
	jwt.RegisteredClaims
}

type Service struct {
	secret     []byte
	accessTTL  time.Duration
	refreshTTL time.Duration
}

func NewService(secret []byte, accessTTL, refreshTTL time.Duration) (*Service, error) {
	if len(secret) == 0 {
		return nil, errors.New("JWT secret is required")
	}
	if accessTTL <= 0 {
		return nil, errors.New("access token TTL must be positive")
	}
	if refreshTTL <= 0 {
		return nil, errors.New("refresh token TTL must be positive")
	}

	return &Service{
		secret:     append([]byte(nil), secret...),
		accessTTL:  accessTTL,
		refreshTTL: refreshTTL,
	}, nil
}

func HashPassword(password string) (string, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return "", fmt.Errorf("hash password: %w", err)
	}
	return string(hash), nil
}

func VerifyPassword(hash, password string) error {
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return ErrInvalidPassword
	}
	return nil
}

func (s *Service) IssueAccessToken(identity Identity) (string, error) {
	return s.issueToken(identity, TokenTypeAccess, s.accessTTL)
}

func (s *Service) IssueRefreshToken(identity Identity) (string, error) {
	return s.issueToken(identity, TokenTypeRefresh, s.refreshTTL)
}

func (s *Service) ParseAccessToken(raw string) (*Claims, error) {
	return s.parseToken(raw, TokenTypeAccess)
}

func (s *Service) ParseRefreshToken(raw string) (*Claims, error) {
	return s.parseToken(raw, TokenTypeRefresh)
}

func (s *Service) issueToken(identity Identity, tokenType TokenType, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := Claims{
		UserID:    identity.UserID,
		Username:  identity.Username,
		IsAdmin:   identity.IsAdmin,
		TokenType: tokenType,
		RegisteredClaims: jwt.RegisteredClaims{
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	raw, err := jwt.NewWithClaims(jwt.SigningMethodHS256, claims).SignedString(s.secret)
	if err != nil {
		return "", fmt.Errorf("%w: sign %s token: %w", ErrInvalidToken, tokenType, err)
	}
	return raw, nil
}

func (s *Service) parseToken(raw string, expectedType TokenType) (*Claims, error) {
	claims := new(Claims)
	token, err := jwt.ParseWithClaims(
		raw,
		claims,
		func(token *jwt.Token) (any, error) {
			return s.secret, nil
		},
		jwt.WithValidMethods([]string{jwt.SigningMethodHS256.Alg()}),
		jwt.WithExpirationRequired(),
	)
	if err != nil {
		return nil, fmt.Errorf("%w: parse %s token: %w", ErrInvalidToken, expectedType, err)
	}
	if !token.Valid {
		return nil, ErrInvalidToken
	}
	if claims.TokenType == expectedType {
		return claims, nil
	}
	if claims.TokenType == TokenTypeAccess || claims.TokenType == TokenTypeRefresh {
		return nil, fmt.Errorf("%w: got %q, want %q", ErrUnexpectedTokenType, claims.TokenType, expectedType)
	}
	return nil, fmt.Errorf("%w: unsupported token type %q", ErrInvalidToken, claims.TokenType)
}

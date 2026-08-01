package storage

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"fmt"
)

func encryptSecret(key []byte, value string) (string, error) {
	if value == "" {
		return "", nil
	}
	block, err := aes.NewCipher(storageKey(key))
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := rand.Read(nonce); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(gcm.Seal(nonce, nonce, []byte(value), nil)), nil
}

func decryptSecret(key []byte, value string) (string, error) {
	if value == "" {
		return "", nil
	}
	data, err := base64.RawURLEncoding.DecodeString(value)
	if err != nil {
		return "", fmt.Errorf("解码存储密钥: %w", err)
	}
	block, err := aes.NewCipher(storageKey(key))
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(data) < gcm.NonceSize() {
		return "", fmt.Errorf("存储密钥密文无效")
	}
	plain, err := gcm.Open(nil, data[:gcm.NonceSize()], data[gcm.NonceSize():], nil)
	if err != nil {
		return "", fmt.Errorf("解密存储密钥: %w", err)
	}
	return string(plain), nil
}

func storageKey(key []byte) []byte {
	sum := sha256.Sum256(append([]byte("crescentlab-storage:"), key...))
	return sum[:]
}

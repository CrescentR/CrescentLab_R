package storage

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"
)

type Repository struct {
	db     *sql.DB
	driver string
	secret []byte
}

func NewRepository(db *sql.DB, driver string, secrets ...[]byte) *Repository {
	var secret []byte
	if len(secrets) > 0 {
		secret = secrets[0]
	}
	return &Repository{db: db, driver: driver, secret: secret}
}

func (r *Repository) List(ctx context.Context) ([]Policy, error) {
	query := `SELECT id, name, type, bucket, endpoint, region, COALESCE(base_url, ''), root_prefix, public_read, force_path_style, auth_mode, tenant_id, client_id, drive_id, is_default, status, created_at, updated_at FROM storage_policies WHERE status <> 'deleted' ORDER BY is_default DESC, id DESC`
	if r.driver == "postgres" {
		query = `SELECT id, name, type, COALESCE(bucket, ''), COALESCE(endpoint, ''), COALESCE(region, ''), COALESCE(base_url, ''), root_prefix, public_read, force_path_style, config, is_default, status, created_at, updated_at FROM storage_policies WHERE deleted_at IS NULL ORDER BY is_default DESC, id DESC`
	}
	rows, err := r.db.QueryContext(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("list storage policies: %w", err)
	}
	defer rows.Close()
	policies := make([]Policy, 0)
	for rows.Next() {
		var p Policy
		if r.driver == "postgres" {
			var config []byte
			if err := rows.Scan(&p.ID, &p.Name, &p.Type, &p.Bucket, &p.Endpoint, &p.Region, &p.BaseURL, &p.RootPrefix, &p.PublicRead, &p.ForcePathStyle, &config, &p.IsDefault, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
				return nil, err
			}
			var values struct {
				AuthMode string `json:"auth_mode"`
				TenantID string `json:"tenant_id"`
				ClientID string `json:"client_id"`
				DriveID  string `json:"drive_id"`
			}
			if err := json.Unmarshal(config, &values); err != nil {
				return nil, err
			}
			p.AuthMode, p.TenantID, p.ClientID, p.DriveID = values.AuthMode, values.TenantID, values.ClientID, values.DriveID
		} else if err := rows.Scan(&p.ID, &p.Name, &p.Type, &p.Bucket, &p.Endpoint, &p.Region, &p.BaseURL, &p.RootPrefix, &p.PublicRead, &p.ForcePathStyle, &p.AuthMode, &p.TenantID, &p.ClientID, &p.DriveID, &p.IsDefault, &p.Status, &p.CreatedAt, &p.UpdatedAt); err != nil {
			return nil, err
		}
		policies = append(policies, p)
	}
	return policies, rows.Err()
}

func (r *Repository) Create(ctx context.Context, p Policy) (Policy, error) {
	p.normalize()
	if err := p.validate(); err != nil {
		return Policy{}, err
	}
	var err error
	if p.AccessKeyID, err = encryptSecret(r.secret, p.AccessKeyID); err != nil {
		return Policy{}, err
	}
	if p.SecretAccessKey, err = encryptSecret(r.secret, p.SecretAccessKey); err != nil {
		return Policy{}, err
	}
	if p.ClientSecret, err = encryptSecret(r.secret, p.ClientSecret); err != nil {
		return Policy{}, err
	}
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return Policy{}, err
	}
	defer tx.Rollback()
	if p.IsDefault {
		if _, err = tx.ExecContext(ctx, "UPDATE storage_policies SET is_default = false WHERE is_default = true"); err != nil {
			return Policy{}, err
		}
	}
	if r.driver == "postgres" {
		config, _ := json.Marshal(map[string]any{"force_path_style": p.ForcePathStyle, "auth_mode": p.AuthMode, "tenant_id": p.TenantID, "client_id": p.ClientID, "drive_id": p.DriveID})
		secrets, _ := json.Marshal(map[string]string{"access_key_id": p.AccessKeyID, "secret_access_key": p.SecretAccessKey, "client_secret": p.ClientSecret, "refresh_token": p.RefreshToken})
		err = tx.QueryRowContext(ctx, `INSERT INTO storage_policies (name, type, bucket, endpoint, region, base_url, root_prefix, public_read, force_path_style, is_default, config, secrets_ciphertext) VALUES ($1,$2,NULLIF($3,''),NULLIF($4,''),$5,NULLIF($6,''),$7,$8,$9,$10,$11,$12) RETURNING id`, p.Name, p.Type, p.Bucket, p.Endpoint, p.Region, p.BaseURL, p.RootPrefix, p.PublicRead, p.ForcePathStyle, p.IsDefault, config, secrets).Scan(&p.ID)
	} else {
		result, execErr := tx.ExecContext(ctx, `INSERT INTO storage_policies (name, type, bucket, endpoint, region, base_url, root_prefix, public_read, force_path_style, access_key_id, secret_access_key, auth_mode, tenant_id, client_id, client_secret, drive_id, refresh_token, oauth_state, is_default) VALUES (?, ?, ?, ?, ?, NULLIF(?, ''), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, p.Name, p.Type, p.Bucket, p.Endpoint, p.Region, p.BaseURL, p.RootPrefix, p.PublicRead, p.ForcePathStyle, p.AccessKeyID, p.SecretAccessKey, p.AuthMode, p.TenantID, p.ClientID, p.ClientSecret, p.DriveID, p.RefreshToken, p.OAuthState, p.IsDefault)
		err = execErr
		if err == nil {
			p.ID, err = result.LastInsertId()
		}
	}
	if err != nil {
		return Policy{}, fmt.Errorf("create storage policy: %w", err)
	}
	if err = tx.Commit(); err != nil {
		return Policy{}, err
	}
	return r.Get(ctx, p.ID)
}

func (r *Repository) SetDefault(ctx context.Context, id int64) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()
	if _, err = tx.ExecContext(ctx, "UPDATE storage_policies SET is_default = false WHERE is_default = true"); err != nil {
		return err
	}
	query := "UPDATE storage_policies SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND status = 'active'"
	if r.driver == "postgres" {
		query = "UPDATE storage_policies SET is_default = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1 AND status = 'active' AND deleted_at IS NULL"
	}
	result, err := tx.ExecContext(ctx, query, id)
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count != 1 {
		return errors.New("存储策略不存在或未启用")
	}
	return tx.Commit()
}

func (r *Repository) Update(ctx context.Context, p Policy) (Policy, error) {
	p.normalize()
	current, err := r.policyWithSecrets(ctx, p.ID)
	if err != nil {
		return Policy{}, errors.New("存储策略不存在")
	}
	if p.AccessKeyID == "" {
		p.AccessKeyID = current.AccessKeyID
	}
	if p.SecretAccessKey == "" {
		p.SecretAccessKey = current.SecretAccessKey
	}
	if p.ClientSecret == "" {
		p.ClientSecret = current.ClientSecret
	}
	p.RefreshToken, p.OAuthState, p.Status = current.RefreshToken, current.OAuthState, current.Status
	if err := p.validate(); err != nil {
		return Policy{}, err
	}
	if p.AccessKeyID, err = encryptSecret(r.secret, p.AccessKeyID); err != nil {
		return Policy{}, err
	}
	if p.SecretAccessKey, err = encryptSecret(r.secret, p.SecretAccessKey); err != nil {
		return Policy{}, err
	}
	if p.ClientSecret, err = encryptSecret(r.secret, p.ClientSecret); err != nil {
		return Policy{}, err
	}
	if p.RefreshToken, err = encryptSecret(r.secret, p.RefreshToken); err != nil {
		return Policy{}, err
	}

	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return Policy{}, err
	}
	defer tx.Rollback()
	if p.IsDefault {
		if _, err = tx.ExecContext(ctx, "UPDATE storage_policies SET is_default = false WHERE is_default = true"); err != nil {
			return Policy{}, err
		}
	}
	if r.driver == "postgres" {
		config, _ := json.Marshal(map[string]any{"force_path_style": p.ForcePathStyle, "auth_mode": p.AuthMode, "tenant_id": p.TenantID, "client_id": p.ClientID, "drive_id": p.DriveID})
		secrets, _ := json.Marshal(map[string]string{"access_key_id": p.AccessKeyID, "secret_access_key": p.SecretAccessKey, "client_secret": p.ClientSecret, "refresh_token": p.RefreshToken, "oauth_state": p.OAuthState})
		_, err = tx.ExecContext(ctx, `UPDATE storage_policies SET name=$1, type=$2, bucket=NULLIF($3,''), endpoint=NULLIF($4,''), region=$5, base_url=NULLIF($6,''), root_prefix=$7, public_read=$8, force_path_style=$9, is_default=$10, config=$11, secrets_ciphertext=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 AND deleted_at IS NULL`, p.Name, p.Type, p.Bucket, p.Endpoint, p.Region, p.BaseURL, p.RootPrefix, p.PublicRead, p.ForcePathStyle, p.IsDefault, config, secrets, p.ID)
	} else {
		_, err = tx.ExecContext(ctx, `UPDATE storage_policies SET name=?, type=?, bucket=?, endpoint=?, region=?, base_url=NULLIF(?,''), root_prefix=?, public_read=?, force_path_style=?, access_key_id=?, secret_access_key=?, auth_mode=?, tenant_id=?, client_id=?, client_secret=?, drive_id=?, refresh_token=?, oauth_state=?, is_default=?, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status <> 'deleted'`, p.Name, p.Type, p.Bucket, p.Endpoint, p.Region, p.BaseURL, p.RootPrefix, p.PublicRead, p.ForcePathStyle, p.AccessKeyID, p.SecretAccessKey, p.AuthMode, p.TenantID, p.ClientID, p.ClientSecret, p.DriveID, p.RefreshToken, p.OAuthState, p.IsDefault, p.ID)
	}
	if err != nil {
		return Policy{}, fmt.Errorf("update storage policy: %w", err)
	}
	if err := tx.Commit(); err != nil {
		return Policy{}, err
	}
	return r.Get(ctx, p.ID)
}

func (r *Repository) SetStatus(ctx context.Context, id int64, status string) error {
	if status != "active" && status != "disabled" && status != "deleted" {
		return errors.New("存储策略状态无效")
	}
	var query string
	if r.driver == "postgres" {
		if status == "deleted" {
			query = "UPDATE storage_policies SET is_default=false, deleted_at=CURRENT_TIMESTAMP, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND deleted_at IS NULL"
		} else {
			query = "UPDATE storage_policies SET status=$2, is_default=CASE WHEN $2='active' THEN is_default ELSE false END, updated_at=CURRENT_TIMESTAMP WHERE id=$1 AND deleted_at IS NULL"
		}
	} else {
		query = "UPDATE storage_policies SET status=?, is_default=CASE WHEN ?='active' THEN is_default ELSE false END, updated_at=CURRENT_TIMESTAMP WHERE id=? AND status <> 'deleted'"
	}
	var result sql.Result
	var err error
	if r.driver == "postgres" && status == "deleted" {
		result, err = r.db.ExecContext(ctx, query, id)
	} else if r.driver == "postgres" {
		result, err = r.db.ExecContext(ctx, query, id, status)
	} else {
		result, err = r.db.ExecContext(ctx, query, status, status, id)
	}
	if err != nil {
		return err
	}
	count, _ := result.RowsAffected()
	if count != 1 {
		return errors.New("存储策略不存在")
	}
	return nil
}

func (r *Repository) Default(ctx context.Context) (Policy, error) {
	query := "SELECT id, name, type, bucket, endpoint, region, COALESCE(base_url, ''), root_prefix, public_read, force_path_style, access_key_id, secret_access_key, auth_mode, tenant_id, client_id, client_secret, drive_id, refresh_token, oauth_state, is_default, status FROM storage_policies WHERE is_default = true AND status = 'active' LIMIT 1"
	if r.driver == "postgres" {
		query = "SELECT id, name, type, COALESCE(bucket,''), COALESCE(endpoint,''), COALESCE(region,''), COALESCE(base_url,''), root_prefix, public_read, force_path_style, config, secrets_ciphertext, is_default, status FROM storage_policies WHERE is_default = true AND status = 'active' AND deleted_at IS NULL LIMIT 1"
	}
	var p Policy
	if r.driver == "postgres" {
		var config, secrets []byte
		err := r.db.QueryRowContext(ctx, query).Scan(&p.ID, &p.Name, &p.Type, &p.Bucket, &p.Endpoint, &p.Region, &p.BaseURL, &p.RootPrefix, &p.PublicRead, &p.ForcePathStyle, &config, &secrets, &p.IsDefault, &p.Status)
		if err != nil {
			return Policy{}, err
		}
		if err := decodePostgresPolicy(&p, config, secrets); err != nil {
			return Policy{}, err
		}
		if err := r.decryptPolicy(&p); err != nil {
			return Policy{}, err
		}
		return p, nil
	}
	err := r.db.QueryRowContext(ctx, query).Scan(&p.ID, &p.Name, &p.Type, &p.Bucket, &p.Endpoint, &p.Region, &p.BaseURL, &p.RootPrefix, &p.PublicRead, &p.ForcePathStyle, &p.AccessKeyID, &p.SecretAccessKey, &p.AuthMode, &p.TenantID, &p.ClientID, &p.ClientSecret, &p.DriveID, &p.RefreshToken, &p.OAuthState, &p.IsDefault, &p.Status)
	if err == nil {
		err = r.decryptPolicy(&p)
	}
	return p, err
}

func (r *Repository) Get(ctx context.Context, id int64) (Policy, error) {
	policies, err := r.List(ctx)
	if err != nil {
		return Policy{}, err
	}
	for _, p := range policies {
		if p.ID == id {
			return p, nil
		}
	}
	return Policy{}, sql.ErrNoRows
}

func (r *Repository) SaveFile(ctx context.Context, file UploadedFile) (UploadedFile, error) {
	if r.driver == "postgres" {
		err := r.db.QueryRowContext(ctx, `INSERT INTO files (storage_policy_id, name, name_key, uri, type, mime_type, size_bytes, is_public) VALUES ($1,$2,LOWER($2),$3,'file',$4,$5,true) RETURNING id`, file.StoragePolicyID, file.Name, file.ObjectKey, file.MIMEType, file.SizeBytes).Scan(&file.ID)
		return file, err
	}
	result, err := r.db.ExecContext(ctx, `INSERT INTO files (storage_policy_id, name, object_key, uri, mime_type, size_bytes) VALUES (?, ?, ?, ?, ?, ?)`, file.StoragePolicyID, file.Name, file.ObjectKey, file.ObjectKey, file.MIMEType, file.SizeBytes)
	if err != nil {
		return UploadedFile{}, err
	}
	file.ID, err = result.LastInsertId()
	return file, err
}

func (r *Repository) ListFiles(ctx context.Context, mimePrefix string, limit int) ([]UploadedFile, error) {
	if limit <= 0 || limit > 100 {
		limit = 48
	}
	mimePrefix = strings.TrimSpace(mimePrefix)

	var (
		rows *sql.Rows
		err  error
	)
	if r.driver == "postgres" {
		if mimePrefix == "" {
			rows, err = r.db.QueryContext(ctx, `
SELECT id, COALESCE(storage_policy_id, 0), name, uri, COALESCE(mime_type, ''), size_bytes, created_at::text
FROM files
WHERE deleted_at IS NULL AND type = 'file'
ORDER BY id DESC
LIMIT $1`, limit)
		} else {
			rows, err = r.db.QueryContext(ctx, `
SELECT id, COALESCE(storage_policy_id, 0), name, uri, COALESCE(mime_type, ''), size_bytes, created_at::text
FROM files
WHERE deleted_at IS NULL AND type = 'file' AND COALESCE(mime_type, '') LIKE $1
ORDER BY id DESC
LIMIT $2`, mimePrefix+"%", limit)
		}
	} else if mimePrefix == "" {
		rows, err = r.db.QueryContext(ctx, `
SELECT id, storage_policy_id, name, uri, mime_type, size_bytes, created_at
FROM files
ORDER BY id DESC
LIMIT ?`, limit)
	} else {
		rows, err = r.db.QueryContext(ctx, `
SELECT id, storage_policy_id, name, uri, mime_type, size_bytes, created_at
FROM files
WHERE mime_type LIKE ?
ORDER BY id DESC
LIMIT ?`, mimePrefix+"%", limit)
	}
	if err != nil {
		return nil, fmt.Errorf("list files: %w", err)
	}
	defer rows.Close()

	files := make([]UploadedFile, 0)
	for rows.Next() {
		var file UploadedFile
		var createdAt flexibleTime
		if err := rows.Scan(&file.ID, &file.StoragePolicyID, &file.Name, &file.ObjectKey, &file.MIMEType, &file.SizeBytes, &createdAt); err != nil {
			return nil, err
		}
		file.CreatedAt = createdAt.String()
		file.URL = "/f/" + strconv.FormatInt(file.ID, 10)
		files = append(files, file)
	}
	return files, rows.Err()
}

type flexibleTime struct {
	raw string
}

func (t *flexibleTime) Scan(value any) error {
	if value == nil {
		t.raw = ""
		return nil
	}
	switch v := value.(type) {
	case time.Time:
		t.raw = v.UTC().Format(time.RFC3339)
	case string:
		t.raw = v
	case []byte:
		t.raw = string(v)
	default:
		t.raw = fmt.Sprint(v)
	}
	return nil
}

func (t flexibleTime) String() string {
	return t.raw
}

func (r *Repository) File(ctx context.Context, id int64) (UploadedFile, Policy, error) {
	placeholder := "?"
	if r.driver == "postgres" {
		placeholder = "$1"
	}
	var file UploadedFile
	if err := r.db.QueryRowContext(ctx, `SELECT id, storage_policy_id, name, uri, mime_type, size_bytes FROM files WHERE id = `+placeholder, id).Scan(&file.ID, &file.StoragePolicyID, &file.Name, &file.ObjectKey, &file.MIMEType, &file.SizeBytes); err != nil {
		return UploadedFile{}, Policy{}, err
	}
	policy, err := r.policyWithSecrets(ctx, file.StoragePolicyID)
	return file, policy, err
}

func (r *Repository) policyWithSecrets(ctx context.Context, id int64) (Policy, error) {
	if r.driver == "postgres" {
		var p Policy
		var config, secrets []byte
		err := r.db.QueryRowContext(ctx, `SELECT id, name, type, COALESCE(bucket,''), COALESCE(endpoint,''), COALESCE(region,''), COALESCE(base_url,''), root_prefix, public_read, force_path_style, config, secrets_ciphertext, is_default, status FROM storage_policies WHERE id = $1`, id).Scan(&p.ID, &p.Name, &p.Type, &p.Bucket, &p.Endpoint, &p.Region, &p.BaseURL, &p.RootPrefix, &p.PublicRead, &p.ForcePathStyle, &config, &secrets, &p.IsDefault, &p.Status)
		if err != nil {
			return Policy{}, err
		}
		if err := decodePostgresPolicy(&p, config, secrets); err != nil {
			return Policy{}, err
		}
		if err := r.decryptPolicy(&p); err != nil {
			return Policy{}, err
		}
		return p, nil
	}
	var p Policy
	err := r.db.QueryRowContext(ctx, `SELECT id, name, type, bucket, endpoint, region, COALESCE(base_url,''), root_prefix, public_read, force_path_style, access_key_id, secret_access_key, auth_mode, tenant_id, client_id, client_secret, drive_id, refresh_token, oauth_state, is_default, status FROM storage_policies WHERE id = ?`, id).Scan(&p.ID, &p.Name, &p.Type, &p.Bucket, &p.Endpoint, &p.Region, &p.BaseURL, &p.RootPrefix, &p.PublicRead, &p.ForcePathStyle, &p.AccessKeyID, &p.SecretAccessKey, &p.AuthMode, &p.TenantID, &p.ClientID, &p.ClientSecret, &p.DriveID, &p.RefreshToken, &p.OAuthState, &p.IsDefault, &p.Status)
	if err == nil {
		err = r.decryptPolicy(&p)
	}
	return p, err
}

func (r *Repository) decryptPolicy(p *Policy) error {
	var err error
	if p.AccessKeyID, err = decryptSecret(r.secret, p.AccessKeyID); err != nil {
		return err
	}
	if p.SecretAccessKey, err = decryptSecret(r.secret, p.SecretAccessKey); err != nil {
		return err
	}
	if p.ClientSecret, err = decryptSecret(r.secret, p.ClientSecret); err != nil {
		return err
	}
	p.RefreshToken, err = decryptSecret(r.secret, p.RefreshToken)
	return err
}

func decodePostgresPolicy(p *Policy, configJSON, secretsJSON []byte) error {
	var config struct {
		AuthMode string `json:"auth_mode"`
		TenantID string `json:"tenant_id"`
		ClientID string `json:"client_id"`
		DriveID  string `json:"drive_id"`
	}
	if err := json.Unmarshal(configJSON, &config); err != nil {
		return err
	}
	var secrets map[string]string
	if err := json.Unmarshal(secretsJSON, &secrets); err != nil {
		return err
	}
	p.AuthMode, p.TenantID, p.ClientID, p.DriveID = config.AuthMode, config.TenantID, config.ClientID, config.DriveID
	p.AccessKeyID, p.SecretAccessKey = secrets["access_key_id"], secrets["secret_access_key"]
	p.ClientSecret, p.RefreshToken, p.OAuthState = secrets["client_secret"], secrets["refresh_token"], secrets["oauth_state"]
	return nil
}

func (r *Repository) SaveOAuth(ctx context.Context, id int64, state, refreshToken string) error {
	if r.driver == "postgres" {
		p, err := r.policyWithSecrets(ctx, id)
		if err != nil {
			return err
		}
		p.OAuthState, p.RefreshToken = state, refreshToken
		if p.AccessKeyID, err = encryptSecret(r.secret, p.AccessKeyID); err != nil {
			return err
		}
		if p.SecretAccessKey, err = encryptSecret(r.secret, p.SecretAccessKey); err != nil {
			return err
		}
		if p.ClientSecret, err = encryptSecret(r.secret, p.ClientSecret); err != nil {
			return err
		}
		if p.RefreshToken, err = encryptSecret(r.secret, p.RefreshToken); err != nil {
			return err
		}
		secrets, _ := json.Marshal(map[string]string{"access_key_id": p.AccessKeyID, "secret_access_key": p.SecretAccessKey, "client_secret": p.ClientSecret, "refresh_token": p.RefreshToken, "oauth_state": p.OAuthState})
		_, err = r.db.ExecContext(ctx, "UPDATE storage_policies SET secrets_ciphertext = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", secrets, id)
		return err
	}
	encryptedRefresh, err := encryptSecret(r.secret, refreshToken)
	if err != nil {
		return err
	}
	_, err = r.db.ExecContext(ctx, "UPDATE storage_policies SET oauth_state = ?, refresh_token = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", state, encryptedRefresh, id)
	return err
}

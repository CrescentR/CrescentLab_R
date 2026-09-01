import { apiFetch, apiJson } from "@/lib/api/client";

export type StorageType =
  | "aws_s3"
  | "cloudflare_r2"
  | "s3_compatible"
  | "aliyun_oss"
  | "tencent_cos"
  | "qiniu"
  | "onedrive";

export type StoragePolicy = {
  id: number;
  name: string;
  type: StorageType;
  bucket: string;
  endpoint: string;
  region: string;
  base_url: string;
  root_prefix: string;
  public_read: boolean;
  force_path_style: boolean;
  auth_mode?: "delegated" | "application";
  tenant_id?: string;
  client_id?: string;
  drive_id?: string;
  is_default: boolean;
  status: "active" | "disabled";
};

export type StoragePolicyInput = Omit<StoragePolicy, "id" | "status"> & {
  access_key_id: string;
  secret_access_key: string;
  client_secret: string;
};

export type StorageCredentialResetInput = Pick<
  StoragePolicyInput,
  "access_key_id" | "secret_access_key" | "client_secret"
>;

export type UploadedStorageFile = {
  id: number;
  name: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  created_at?: string;
};

export function listStoragePolicies() {
  return apiJson<{ policies: StoragePolicy[] }>("/api/admin/storage/policies");
}

export function listStorageFiles(params: { mime_prefix?: string; limit?: number } = {}) {
  const search = new URLSearchParams();
  if (params.mime_prefix) search.set("mime_prefix", params.mime_prefix);
  if (params.limit) search.set("limit", String(params.limit));
  const suffix = search.size > 0 ? `?${search.toString()}` : "";
  return apiJson<{ files: UploadedStorageFile[] }>(`/api/admin/storage/files${suffix}`);
}

export function createStoragePolicy(policy: StoragePolicyInput) {
  return apiJson<StoragePolicy>("/api/admin/storage/policies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(policy),
  });
}

export function updateStoragePolicy(id: number, policy: StoragePolicyInput) {
  return apiJson<StoragePolicy>(`/api/admin/storage/policies/${id}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(policy),
  });
}

export function resetStoragePolicyCredentials(id: number, credentials: StorageCredentialResetInput) {
  return apiJson<{ ok: boolean }>(`/api/admin/storage/policies/${id}/credentials/reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export function setStoragePolicyStatus(id: number, status: "active" | "disabled" | "deleted") {
  return apiJson<{ ok: boolean }>(`/api/admin/storage/policies/${id}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
}

export function setDefaultStoragePolicy(id: number) {
  return apiJson<{ ok: boolean }>(`/api/admin/storage/policies/${id}/default`, { method: "POST" });
}

export function testStoragePolicy(id: number) {
  return apiJson<{ ok: boolean }>(`/api/admin/storage/policies/${id}/test`, { method: "POST" });
}

export async function authorizeOneDrive(id: number) {
  const result = await apiJson<{ authorization_url: string }>(`/api/admin/storage/policies/${id}/onedrive/authorize`, { method: "POST" });
  window.location.href = result.authorization_url;
}

export async function uploadStorageFile(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await apiFetch("/api/admin/storage/upload", { method: "POST", body: form });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message = payload && typeof payload === "object" && "error" in payload ? String(payload.error) : "上传失败";
    throw new Error(message);
  }
  return payload as UploadedStorageFile;
}


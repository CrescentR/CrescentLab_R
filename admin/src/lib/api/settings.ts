import { apiJson } from "@/lib/api/client";

export type AdminSettingValue = string | number | boolean | null | Record<string, unknown> | unknown[];

export type AdminSetting = {
  id?: number;
  scope: string;
  group_key: string;
  key: string;
  value: AdminSettingValue;
  value_type: "string" | "number" | "boolean" | "json" | "array" | "secret";
  is_public: boolean;
  is_encrypted: boolean;
  description?: string | null;
};

type AdminSettingsResponse = {
  settings: AdminSetting[];
};

export async function listAdminSettings(params: { scope?: string; group_key?: string } = {}) {
  const searchParams = new URLSearchParams();
  if (params.scope) {
    searchParams.set("scope", params.scope);
  }
  if (params.group_key) {
    searchParams.set("group_key", params.group_key);
  }

  const suffix = searchParams.size > 0 ? `?${searchParams.toString()}` : "";
  return apiJson<AdminSettingsResponse>(`/api/admin/settings${suffix}`);
}

export async function saveAdminSettings(settings: AdminSetting[]) {
  return apiJson<AdminSettingsResponse>("/api/admin/settings", {
    body: JSON.stringify({ settings }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });
}


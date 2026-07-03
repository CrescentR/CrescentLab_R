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
  const response = await fetch(`/api/admin/settings${suffix}`, {
    headers: { Accept: "application/json" },
  });

  return readAdminSettingsResponse(response);
}

export async function saveAdminSettings(settings: AdminSetting[]) {
  const response = await fetch("/api/admin/settings", {
    body: JSON.stringify({ settings }),
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    method: "PUT",
  });

  return readAdminSettingsResponse(response);
}

async function readAdminSettingsResponse(response: Response) {
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const message = typeof payload?.error === "string" ? payload.error : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return payload as AdminSettingsResponse;
}

// 公开前台 API 客户端：封装 fetch 与统一错误响应。

export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly request_id?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
// ---- 公开前台请求 ----

// 服务端渲染时使用绝对 URL，否则相对路径的 fetch 不会经过 Next.js rewrites 代理。
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8091";

function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (typeof window !== "undefined") return path;
  return `${BACKEND_URL}${path}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const url = resolveApiUrl(path);

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  return fetch(url, { ...init, headers });
}

export async function apiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await apiFetch(path, init);
  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw toApiError(payload, res.status);
  }

  return payload as T;
}

// ---- 工具 ----

function toApiError(payload: unknown, status: number): ApiError {
  if (payload && typeof payload === "object" && "message" in payload) {
    const p = payload as { code?: string; message: string; request_id?: string };
    return new ApiError(p.code ?? "INTERNAL_ERROR", p.message, status, p.request_id);
  }
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return new ApiError("REQUEST_FAILED", payload.error, status);
  }
  return new ApiError("INTERNAL_ERROR", `请求失败（${status}）`, status);
}

// API 客户端：封装 fetch，自动携带 JWT token 并处理刷新。

const ACCESS_TOKEN_KEY = "crescentlab-access-token";
const REFRESH_TOKEN_KEY = "crescentlab-refresh-token";
const USER_KEY = "crescentlab-user";

export type AuthUser = {
  id: number;
  username: string;
  nickname: string;
  is_admin: boolean;
};

export type ApiError = {
  code: string;
  message: string;
  request_id?: string;
  status: number;
};

// ---- token 存取 ----

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getAuthUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

function setTokens(accessToken: string, refreshToken: string, user: AuthUser) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ---- 认证接口 ----

export async function login(username: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const payload = await res.json().catch(() => null);

  if (!res.ok) {
    throw toApiError(payload, res.status);
  }

  const data = payload as {
    access_token: string;
    refresh_token: string;
    user: AuthUser;
  };

  setTokens(data.access_token, data.refresh_token, data.user);
  return data.user;
}

export async function register(username: string, nickname: string, password: string): Promise<AuthUser> {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, nickname, password }),
  });
  const payload = await res.json().catch(() => null);
  if (!res.ok) throw toApiError(payload, res.status);
  const data = payload as { access_token: string; refresh_token: string; user: AuthUser };
  setTokens(data.access_token, data.refresh_token, data.user);
  return data.user;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const user = await apiJson<AuthUser>("/api/auth/me");
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

let refreshPromise: Promise<string> | null = null;

export async function refreshAccessToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw { code: "UNAUTHORIZED", message: "无 refresh token", status: 401 } as ApiError;
  }

  // 单飞：避免并发请求同时触发多次刷新
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const res = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    const payload = await res.json().catch(() => null);

    if (!res.ok) {
      clearTokens();
      throw toApiError(payload, res.status);
    }

    const accessToken = (payload as { access_token: string }).access_token;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    return accessToken;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function logout(): Promise<void> {
  const refreshToken = getRefreshToken();
  const accessToken = getAccessToken();

  if (refreshToken && accessToken) {
    await fetch("/api/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    }).catch(() => {});
  }

  clearTokens();
}

// ---- 通用请求 ----

// 服务端渲染时使用绝对 URL，否则相对路径的 fetch 不会经过 Next.js rewrites 代理。
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8091";

function resolveApiUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (typeof window !== "undefined") return path;
  return `${BACKEND_URL}${path}`;
}

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const accessToken = getAccessToken();
  const url = resolveApiUrl(path);

  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  let res = await fetch(url, { ...init, headers });

  // 401 时尝试刷新一次
  if (res.status === 401 && accessToken) {
    try {
      await refreshAccessToken();
      headers.set("Authorization", `Bearer ${getAccessToken()!}`);
      res = await fetch(path, { ...init, headers });
    } catch {
      clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    }
  }

  return res;
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
    return {
      code: p.code ?? "INTERNAL_ERROR",
      message: p.message,
      request_id: p.request_id,
      status,
    };
  }
  if (payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string") {
    return {
      code: "REQUEST_FAILED",
      message: payload.error,
      status,
    };
  }
  return {
    code: "INTERNAL_ERROR",
    message: `请求失败（${status}）`,
    status,
  };
}

/**
 * API client for the MinePanel backend.
 * Handles authentication tokens and automatic refresh.
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

let accessToken: string | null = null;
let refreshToken: string | null = null;

// On load, restore tokens from localStorage (with security trade-off awareness)
if (typeof window !== "undefined") {
  accessToken = localStorage.getItem("mp_access_token");
  refreshToken = localStorage.getItem("mp_refresh_token");
}

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  if (typeof window !== "undefined") {
    localStorage.setItem("mp_access_token", access);
    localStorage.setItem("mp_refresh_token", refresh);
  }
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("mp_access_token");
    localStorage.removeItem("mp_refresh_token");
  }
}

export function getAccessToken() {
  return accessToken;
}

/**
 * Attempt to refresh the access token using the refresh token.
 */
async function tryRefresh(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

/**
 * Make an authenticated API request.
 * Automatically retries once with a refreshed token on 401.
 */
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const doFetch = async (): Promise<Response> => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    return fetch(`${API_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let response = await doFetch();

  // If 401, try refresh and retry once
  if (response.status === 401 && refreshToken) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await doFetch();
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new ApiError(response.status, error.error || "Request failed");
  }

  return response.json();
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

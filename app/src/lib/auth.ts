import type { AuthResponse, CurrentUser, LoginRequest } from "@/types/auth";

async function apiRequest<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { message?: string }
      | null;
    throw new Error(payload?.message ?? "Request failed.");
  }

  return (await response.json()) as T;
}

export function login(input: LoginRequest) {
  return apiRequest<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return apiRequest<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });
}

export function getCurrentUser() {
  return apiRequest<CurrentUser>("/api/auth/me");
}

import type { ApiResponse } from "@/types/api";

export class ApiError extends Error {
  status: number;
  errors: string[];
  traceId?: string | null;

  constructor({
    message,
    status,
    errors,
    traceId,
  }: {
    message: string;
    status: number;
    errors?: string[];
    traceId?: string | null;
  }) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors ?? [];
    this.traceId = traceId;
  }
}

let refreshRequest: Promise<boolean> | null = null;

async function refreshSession() {
  if (!refreshRequest) {
    refreshRequest = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

function redirectToLogin() {
  if (typeof window === "undefined" || window.location.pathname === "/login") {
    return;
  }

  window.location.href = "/login";
}

function normalizeErrorMessage(status: number, message?: string | null) {
  if (message) {
    return message;
  }

  switch (status) {
    case 400:
      return "Validation failed.";
    case 401:
      return "Your session has expired. Please sign in again.";
    case 403:
      return "You do not have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    default:
      return "An unexpected error occurred.";
  }
}

async function readApiResponse<T>(response: Response) {
  if (response.status === 204) {
    return {
      success: true,
      data: null,
      errors: [],
    } satisfies ApiResponse<T>;
  }

  return (await response.json().catch(() => null)) as ApiResponse<T> | null;
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  let response: Response;

  try {
    response = await fetch(path, {
      ...init,
      credentials: "include",
      headers: {
        Accept: "application/json",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });
  } catch {
    throw new ApiError({
      message: "Unable to reach the API. Confirm the backend is running.",
      status: 0,
    });
  }

  if (
    response.status === 401 &&
    allowRefresh &&
    path !== "/api/auth/login" &&
    path !== "/api/auth/refresh"
  ) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return request<T>(path, init, false);
    }

    redirectToLogin();
    throw new ApiError({
      message: "Your session has expired. Please sign in again.",
      status: 401,
    });
  }

  const payload = await readApiResponse<T>(response);

  if (!response.ok || !payload?.success) {
    throw new ApiError({
      message: normalizeErrorMessage(response.status, payload?.message),
      status: response.status,
      errors: payload?.errors,
      traceId: payload?.traceId,
    });
  }

  return payload.data as T;
}

export const apiClient = {
  get<T>(path: string, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "GET",
    });
  },
  post<T>(path: string, body?: BodyInit | object, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "POST",
      body:
        body && typeof body === "object" && !(body instanceof FormData)
          ? JSON.stringify(body)
          : (body as BodyInit | null | undefined),
    });
  },
  put<T>(path: string, body?: BodyInit | object, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "PUT",
      body:
        body && typeof body === "object" && !(body instanceof FormData)
          ? JSON.stringify(body)
          : (body as BodyInit | null | undefined),
    });
  },
  delete<T>(path: string, init?: RequestInit) {
    return request<T>(path, {
      ...init,
      method: "DELETE",
    });
  },
};

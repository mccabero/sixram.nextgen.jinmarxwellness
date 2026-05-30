import "server-only";

import { getBackendApiBaseUrl } from "@/lib/backend-api";
import type { ApiResponse } from "@/types/api";
import type { CurrentUser, PermissionClaim, UserRole } from "@/types/auth";

export interface BackendCurrentUser {
  id: number | string;
  userName?: string | null;
  username?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  roles?: string[] | null;
  permissions?: PermissionClaim[] | null;
}

export interface BackendAuthResponse {
  accessToken: string;
  accessTokenExpiresAt: string;
  user: BackendCurrentUser;
}

export function toCurrentUser(user: BackendCurrentUser): CurrentUser {
  const username = user.userName ?? user.username ?? user.email ?? "";
  const fullName =
    user.fullName?.trim() ||
    `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() ||
    username ||
    "Jinmarx User";
  const [fallbackFirstName, ...fallbackLastNameParts] = fullName.split(/\s+/);

  return {
    id: String(user.id),
    username,
    fullName,
    firstName: user.firstName?.trim() || fallbackFirstName || fullName,
    lastName: user.lastName?.trim() || fallbackLastNameParts.join(" "),
    roles: (user.roles ?? []) as UserRole[],
    permissions: user.permissions ?? [],
  };
}

export async function readBackendApiData<T>(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | ApiResponse<T>
    | null;

  if (!response.ok || !payload?.success || !payload.data) {
    throw new Error(payload?.message ?? "Backend request failed.");
  }

  return payload.data;
}

export async function getBackendCurrentUser(cookieHeader: string) {
  const response = await fetch(`${getBackendApiBaseUrl()}/api/auth/me`, {
    headers: {
      Accept: "application/json",
      Cookie: cookieHeader,
    },
    cache: "no-store",
  });
  const user = await readBackendApiData<BackendCurrentUser>(response);

  return toCurrentUser(user);
}

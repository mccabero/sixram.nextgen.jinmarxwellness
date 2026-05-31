import { NextRequest, NextResponse } from "next/server";
import {
  readBackendApiData,
  toCurrentUser,
  type BackendAuthResponse,
} from "@/lib/backend-auth";
import { getBackendApiBaseUrl, getSetCookieValues } from "@/lib/backend-api";
import {
  createSessionToken,
  getSessionCookieOptions,
  sessionCookieName,
} from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const backendResponse = await fetch(`${getBackendApiBaseUrl()}/api/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  }).catch(() => null);

  if (!backendResponse) {
    return NextResponse.json(
      { message: "Unable to refresh the backend session." },
      { status: 503 },
    );
  }

  let user;
  try {
    const auth = await readBackendApiData<BackendAuthResponse>(backendResponse);
    user = toCurrentUser(auth.user);
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to refresh the backend session.",
      },
      { status: backendResponse.status },
    );
  }

  const response = NextResponse.json({ user });
  response.cookies.set(
    sessionCookieName,
    createSessionToken(user),
    getSessionCookieOptions(),
  );

  for (const cookie of getSetCookieValues(backendResponse.headers)) {
    response.headers.append("Set-Cookie", cookie);
  }

  return response;
}

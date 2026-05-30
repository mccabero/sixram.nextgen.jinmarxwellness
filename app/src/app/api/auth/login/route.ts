import { NextResponse } from "next/server";
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
import type { LoginRequest } from "@/types/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as LoginRequest | null;

  if (!input || (input.loginMode !== "pin" && input.loginMode !== "password")) {
    return NextResponse.json(
      { message: "Enter valid sign-in credentials." },
      { status: 400 },
    );
  }

  const backendResponse = await fetch(`${getBackendApiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
    cache: "no-store",
  }).catch(() => null);

  if (!backendResponse) {
    return NextResponse.json(
      { message: "Unable to initialize the backend session." },
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
            : "Unable to initialize the backend session.",
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

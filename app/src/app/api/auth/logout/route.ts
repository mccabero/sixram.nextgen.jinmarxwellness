import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl, getSetCookieValues } from "@/lib/backend-api";
import { getSessionCookieOptions, sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const backendResponse = await fetch(`${getBackendApiBaseUrl()}/api/auth/logout`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Cookie: request.headers.get("cookie") ?? "",
    },
    cache: "no-store",
  }).catch(() => null);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    ...getSessionCookieOptions(),
    expires: new Date(0),
    maxAge: 0,
  });

  if (backendResponse) {
    for (const cookie of getSetCookieValues(backendResponse.headers)) {
      response.headers.append("Set-Cookie", cookie);
    }
  }

  return response;
}

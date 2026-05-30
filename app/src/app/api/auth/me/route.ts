import { NextRequest, NextResponse } from "next/server";
import { getBackendCurrentUser } from "@/lib/backend-auth";
import { readSessionToken, sessionCookieName } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const payload = readSessionToken(request.cookies.get(sessionCookieName)?.value);

  if (!payload) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  const user = await getBackendCurrentUser(
    request.headers.get("cookie") ?? "",
  ).catch(() => null);

  if (!user || payload.sub !== user.id) {
    return NextResponse.json({ message: "Not authenticated." }, { status: 401 });
  }

  return NextResponse.json(user);
}

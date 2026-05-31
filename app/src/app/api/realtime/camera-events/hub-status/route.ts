import { NextRequest, NextResponse } from "next/server";
import { getBackendApiBaseUrl } from "@/lib/backend-api";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const response = await fetch(
    `${getBackendApiBaseUrl()}/hubs/camera-events/negotiate?negotiateVersion=1`,
    {
      method: "POST",
      headers: {
        Cookie: request.headers.get("cookie") ?? "",
      },
      cache: "no-store",
    },
  ).catch(() => null);

  return NextResponse.json({
    available: Boolean(response?.ok),
    status: response?.status ?? 0,
  });
}

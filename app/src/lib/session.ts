import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import type { CurrentUser } from "@/types/auth";

export const sessionCookieName = "jinmarx_session";

interface SessionPayload {
  sub: string;
  exp: number;
}

function getSessionSecret() {
  const value = process.env.JINMARX_SESSION_SECRET?.trim();

  if (value) {
    return value;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JINMARX_SESSION_SECRET must be configured in production.");
  }

  return "jinmarx-local-development-session-secret-change-before-production";
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function safeEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function createSessionToken(user: CurrentUser) {
  const payload: SessionPayload = {
    sub: user.id,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 12,
  };
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function readSessionToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature || !safeEquals(signature, sign(encodedPayload))) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;

    if (!payload.sub || payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}

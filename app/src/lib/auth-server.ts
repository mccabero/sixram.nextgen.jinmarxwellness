import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendCurrentUser } from "@/lib/backend-auth";
import { readSessionToken, sessionCookieName } from "@/lib/session";

function toCookieHeader(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  return cookieStore
    .getAll()
    .map((cookie) => `${cookie.name}=${cookie.value}`)
    .join("; ");
}

export async function getServerSession() {
  const cookieStore = await cookies();
  const payload = readSessionToken(cookieStore.get(sessionCookieName)?.value);

  if (!payload) {
    return null;
  }

  const user = await getBackendCurrentUser(toCookieHeader(cookieStore)).catch(
    () => null,
  );

  return user && payload.sub === user.id ? user : null;
}

export async function requireServerSession() {
  const user = await getServerSession();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function redirectHomeRoute() {
  const user = await getServerSession();
  redirect(user ? "/dashboard" : "/login");
}

export async function redirectAuthenticatedUserFromLogin() {
  const user = await getServerSession();

  if (user) {
    redirect("/dashboard");
  }
}

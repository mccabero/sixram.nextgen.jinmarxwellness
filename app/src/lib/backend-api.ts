const defaultDevelopmentApiBaseUrl = "http://localhost:5196";
const defaultProductionInternalApiBaseUrl = "http://127.0.0.1:5000";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getBackendApiBaseUrl() {
  return trimTrailingSlash(
    process.env.INTERNAL_API_BASE_URL ??
      (process.env.NODE_ENV === "production"
        ? defaultProductionInternalApiBaseUrl
        : process.env.NEXT_PUBLIC_API_BASE_URL ?? defaultDevelopmentApiBaseUrl),
  );
}

export function getSetCookieValues(headers: Headers) {
  const getSetCookie = (
    headers as Headers & { getSetCookie?: () => string[] }
  ).getSetCookie;

  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headers);
  }

  return splitSetCookieHeader(headers.get("set-cookie"));
}

function splitSetCookieHeader(header: string | null) {
  if (!header) {
    return [];
  }

  return header.split(/,(?=\s*[^;,]+=[^;,]+)/g).map((value) => value.trim());
}

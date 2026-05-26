export const adminSessionCookieName = "macos-web-admin-session";
export const adminSessionCookieValue = "unlocked";

export function isAdminSessionCookieValue(value: string | undefined | null) {
  return value === adminSessionCookieValue;
}

export function requestHasAdminSession(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .some((part) => {
      const [name, ...valueParts] = part.split("=");
      return name === adminSessionCookieName && isAdminSessionCookieValue(decodeURIComponent(valueParts.join("=")));
    });
}

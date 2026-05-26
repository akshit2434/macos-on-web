export const isolatedSessionHeader = "x-macos-web-session-mode";

export function isIsolatedSessionRequest(request: Request) {
  return request.headers.get(isolatedSessionHeader) === "test";
}

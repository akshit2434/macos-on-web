import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { password } = (await request.json()) as { password?: string };
  const expectedPassword = process.env.MACOS_WEB_ACCESS_PASSWORD || "demo-access";
  const testPassword = process.env.MACOS_WEB_TEST_ACCESS_PASSWORD || "demo-test";

  if (password === testPassword) {
    return NextResponse.json({ ok: true, mode: "test" });
  }

  if (password === expectedPassword) {
    return NextResponse.json({ ok: true, mode: "owner" });
  }

  return NextResponse.json({ ok: false });
}

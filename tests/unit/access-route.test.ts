import { describe, expect, it } from "vitest";

describe("access route", () => {
  it("returns the owner session for the normal password", async () => {
    const { POST } = await import("@/app/api/access/route");

    const response = await POST(new Request("http://localhost/api/access", {
      method: "POST",
      body: JSON.stringify({ password: "demo-access" }),
    }));

    await expect(response.json()).resolves.toMatchObject({ ok: true, mode: "owner" });
  });

  it("returns the test session for the isolated testing password", async () => {
    const { POST } = await import("@/app/api/access/route");

    const response = await POST(new Request("http://localhost/api/access", {
      method: "POST",
      body: JSON.stringify({ password: "demo-test" }),
    }));

    await expect(response.json()).resolves.toMatchObject({ ok: true, mode: "test" });
  });
});

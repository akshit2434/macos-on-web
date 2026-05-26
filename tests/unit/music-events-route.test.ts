import { describe, expect, it } from "vitest";

describe("music events route", () => {
  it("returns a 400 instead of throwing when the request body is empty", async () => {
    const { POST } = await import("@/app/api/music/events/route");

    const response = await POST(new Request("http://localhost/api/music/events", {
      method: "POST",
    }));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({ ok: false, error: "Missing music event fields" });
  });
});

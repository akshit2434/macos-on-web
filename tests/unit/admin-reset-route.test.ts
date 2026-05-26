import { beforeEach, describe, expect, it, vi } from "vitest";

import { adminSessionCookieName, adminSessionCookieValue } from "@/features/admin/admin-auth";
import { adminResetTableOrder } from "@/features/admin/admin-reset";

const createSupabaseAdminClientMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

describe("admin reset route", () => {
  beforeEach(() => {
    createSupabaseAdminClientMock.mockReset();
  });

  it("rejects requests without an admin session cookie", async () => {
    const { POST } = await import("@/app/api/admin/reset/route");

    const response = await POST(new Request("http://localhost/api/admin/reset", {
      method: "POST",
      body: JSON.stringify({ confirmation: "RESET" }),
    }));

    expect(response.status).toBe(401);
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("rejects requests without the destructive confirmation", async () => {
    const { POST } = await import("@/app/api/admin/reset/route");

    const response = await POST(new Request("http://localhost/api/admin/reset", {
      method: "POST",
      body: JSON.stringify({ confirmation: "NOPE" }),
      headers: { cookie: `${adminSessionCookieName}=${adminSessionCookieValue}` },
    }));

    expect(response.status).toBe(401);
    expect(createSupabaseAdminClientMock).not.toHaveBeenCalled();
  });

  it("removes captured storage files and clears only runtime tables", async () => {
    const mock = createMockSupabase();
    createSupabaseAdminClientMock.mockReturnValue(mock.supabase);
    const { POST } = await import("@/app/api/admin/reset/route");

    const response = await POST(new Request("http://localhost/api/admin/reset", {
      method: "POST",
      body: JSON.stringify({ confirmation: "RESET" }),
      headers: { cookie: `${adminSessionCookieName}=${adminSessionCookieValue}` },
    }));
    const body = await response.json() as { ok: boolean; storageRemoved: number };

    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.storageRemoved).toBe(2);
    expect(mock.deleteCalls).toEqual(adminResetTableOrder);
    expect(mock.storageRemove).toHaveBeenCalledWith(["photo-1.jpg", "unlock-1.jpg"]);
  });
});

function createMockSupabase() {
  const deleteCalls: string[] = [];
  const storageRemove = vi.fn(async (paths: string[]) => ({
    data: paths.map((name) => ({ name })),
    error: null,
  }));

  return {
    deleteCalls,
    storageRemove,
    supabase: {
      from: vi.fn((table: string) => ({
        select: vi.fn(async () => {
          if (table === "captured_photos") {
            return { data: [{ storage_path: "photo-1.jpg" }], error: null };
          }
          if (table === "unlock_events") {
            return { data: [{ metadata: { storagePath: "unlock-1.jpg" } }], error: null };
          }
          return { data: [], error: null };
        }),
        delete: vi.fn(() => ({
          gte: vi.fn(async () => {
            deleteCalls.push(table);
            return { count: 1, error: null };
          }),
        })),
      })),
      storage: {
        from: vi.fn(() => ({ remove: storageRemove })),
      },
    },
  };
}

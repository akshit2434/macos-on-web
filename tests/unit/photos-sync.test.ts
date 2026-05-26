import { afterEach, describe, expect, it, vi } from "vitest";

import { syncPhotosStateToCloud } from "@/features/apps/photos/photos-sync";

describe("photos sync", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("syncs gallery state to the admin-visible photos endpoint", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ ok: true })));
    vi.stubGlobal("fetch", fetchMock);

    await syncPhotosStateToCloud(
      [
        {
          id: "photo-1",
          albumId: "design-sprint",
          title: "Campus Walk",
          caption: "A photo",
          src: "/photo.jpg",
          favorite: true,
        },
      ],
      { "photo-1": { viewedAt: "2026-05-23T09:00:00.000Z", viewCount: 2 } },
    );

    expect(fetchMock).toHaveBeenCalledWith("/api/photos/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        photos: [
          {
            id: "photo-1",
            albumId: "design-sprint",
            title: "Campus Walk",
            caption: "A photo",
            src: "/photo.jpg",
            favorite: true,
          },
        ],
        engagement: { "photo-1": { viewedAt: "2026-05-23T09:00:00.000Z", viewCount: 2 } },
      }),
      keepalive: true,
    });
  });
});

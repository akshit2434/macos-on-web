import { NextResponse } from "next/server";

import { type PhotoRecord } from "@/content/apps/photos";
import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type PhotoEngagement = {
  viewedAt?: string;
  viewCount?: number;
};

type IncomingPhotosSync = {
  photos?: PhotoRecord[];
  engagement?: Record<string, PhotoEngagement>;
};

export async function POST(request: Request) {
  const payload = (await request.json()) as IncomingPhotosSync;
  const photos = Array.isArray(payload.photos) ? payload.photos : [];

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, upserted: 0, mode: "test-session" });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase || photos.length === 0) {
    return NextResponse.json({ ok: true, upserted: 0, mode: supabase ? "empty" : "local-only" });
  }

  const rows = photos.map((photo) => {
    const engagement = payload.engagement?.[photo.id] ?? {};

    return {
      content_type: "photo",
      content_id: photo.id,
      state: photo.favorite ? "favorite" : "available",
      metadata: {
        title: photo.title,
        caption: photo.caption,
        albumId: photo.albumId,
        src: photo.src,
        date: photo.date ?? null,
        favorite: Boolean(photo.favorite),
        protected: Boolean(photo.protected),
        viewedAt: engagement.viewedAt ?? null,
        viewCount: Math.max(0, Math.round(engagement.viewCount ?? 0)),
      },
    };
  });

  const { error } = await supabase.from("content_state").upsert(rows, {
    onConflict: "content_type,content_id",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, upserted: rows.length });
}

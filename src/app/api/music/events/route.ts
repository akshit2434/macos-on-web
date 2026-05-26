import { NextResponse } from "next/server";

import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IncomingMusicEvent = {
  sessionId?: string;
  trackId?: string;
  playlistId?: string;
  eventType?: string;
  progress?: number;
  duration?: number;
};

export async function POST(request: Request) {
  const event = await parseIncomingMusicEvent(request);

  if (!event.trackId || !event.eventType) {
    return NextResponse.json({ ok: false, error: "Missing music event fields" }, { status: 400 });
  }

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "test-session" });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "local-only" });
  }

  if (event.sessionId && event.sessionId !== "local") {
    await supabase.from("sessions").upsert(
      {
        id: event.sessionId,
        started_at: new Date().toISOString(),
        device_info: {},
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  const { error } = await supabase.from("music_events").insert({
    session_id: event.sessionId && event.sessionId !== "local" ? event.sessionId : null,
    track_id: event.trackId,
    playlist_id: event.playlistId ?? null,
    event_type: event.eventType,
    progress: clampNumber(event.progress),
    duration: clampNumber(event.duration),
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, inserted: 1 });
}

function clampNumber(value: number | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return Math.max(0, Math.round(value));
}

async function parseIncomingMusicEvent(request: Request): Promise<IncomingMusicEvent> {
  try {
    return (await request.json()) as IncomingMusicEvent;
  } catch {
    return {};
  }
}

import { NextResponse } from "next/server";

import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IncomingEvent = {
  id?: string;
  sessionId: string;
  eventType: string;
  appId?: string;
  occurredAt: string;
  duration?: number;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const { events } = (await request.json()) as { events?: IncomingEvent[] };

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "test-session" });
  }

  if (!events?.length) {
    return NextResponse.json({ ok: true, inserted: 0 });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "local-only" });
  }

  const sessionRows = Array.from(new Set(events.map((event) => event.sessionId))).map((id) => ({
    id,
    started_at: new Date().toISOString(),
    device_info: {},
  }));

  await supabase.from("sessions").upsert(sessionRows, { onConflict: "id", ignoreDuplicates: true });

  const { error } = await supabase.from("activity_events").insert(
    events.map((event) => ({
      id: event.id,
      session_id: event.sessionId,
      app_id: event.appId,
      event_type: event.eventType,
      occurred_at: event.occurredAt,
      duration: event.duration,
      metadata: event.metadata ?? {},
    })),
  );

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, inserted: events.length });
}

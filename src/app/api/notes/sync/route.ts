import { NextResponse } from "next/server";

import { buildNoteContentStateRows, type IncomingNotesSync } from "@/features/apps/notes/notes-sync";
import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const payload = (await request.json()) as IncomingNotesSync;
  const notes = Array.isArray(payload.notes) ? payload.notes : [];

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, upserted: 0, mode: "test-session" });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase || notes.length === 0) {
    return NextResponse.json({ ok: true, upserted: 0, mode: supabase ? "empty" : "local-only" });
  }

  const rows = buildNoteContentStateRows(payload);

  const { error } = await supabase.from("content_state").upsert(rows, {
    onConflict: "content_type,content_id",
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, upserted: rows.length });
}

import { NextResponse } from "next/server";

import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type IncomingPuzzleAttempt = {
  sessionId?: string;
  puzzleType?: string;
  levelId?: string;
  startedAt?: string;
  completedAt?: string;
  duration?: number;
  moves?: number;
  hintsUsed?: number;
  resets?: number;
  result?: string;
  metadata?: Record<string, unknown>;
};

export async function POST(request: Request) {
  const attempt = (await request.json()) as IncomingPuzzleAttempt;

  if (!attempt.puzzleType || !attempt.levelId) {
    return NextResponse.json({ ok: false, error: "Missing puzzle attempt fields" }, { status: 400 });
  }

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "test-session" });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "local-only" });
  }

  if (attempt.sessionId && attempt.sessionId !== "local") {
    await supabase.from("sessions").upsert(
      {
        id: attempt.sessionId,
        started_at: new Date().toISOString(),
        device_info: {},
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  const { error } = await supabase.from("puzzle_attempts").insert({
    session_id: attempt.sessionId && attempt.sessionId !== "local" ? attempt.sessionId : null,
    puzzle_type: attempt.puzzleType,
    level_id: attempt.levelId,
    started_at: attempt.startedAt ?? new Date().toISOString(),
    completed_at: attempt.completedAt ?? null,
    duration: Math.max(0, Math.round(attempt.duration ?? 0)),
    moves: Math.max(0, Math.round(attempt.moves ?? 0)),
    hints_used: Math.max(0, Math.round(attempt.hintsUsed ?? 0)),
    resets: Math.max(0, Math.round(attempt.resets ?? 0)),
    result: attempt.result ?? "completed",
    metadata: attempt.metadata ?? {},
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, inserted: 1 });
}

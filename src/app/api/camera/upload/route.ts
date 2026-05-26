import { NextResponse } from "next/server";

import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");
  const sessionId = String(formData.get("sessionId") ?? "");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, mode: "test-session" });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, mode: "local-only" });
  }

  const extension = file.type.includes("png") ? "png" : "jpg";
  const storagePath = `${sessionId || "local"}/${Date.now()}.${extension}`;
  const upload = await supabase.storage.from("camera-captures").upload(storagePath, file, {
    contentType: file.type,
  });

  if (upload.error) {
    return NextResponse.json({ ok: false, error: upload.error.message }, { status: 202 });
  }

  await supabase.from("captured_photos").insert({
    session_id: sessionId || null,
    storage_path: storagePath,
    album_id: "camera-roll",
    captured_at: new Date().toISOString(),
    metadata: { mimeType: file.type, size: file.size },
  });

  return NextResponse.json({ ok: true, storagePath });
}

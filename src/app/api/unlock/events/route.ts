import { NextResponse } from "next/server";

import { isIsolatedSessionRequest } from "@/features/session/session-isolation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const sessionId = String(formData.get("sessionId") ?? "");
  const eventType = String(formData.get("eventType") ?? "unlock_attempt");
  const success = String(formData.get("success") ?? "false") === "true";
  const file = formData.get("file");
  const metadataInput = formData.get("metadata");

  if (isIsolatedSessionRequest(request)) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "test-session" });
  }

  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json({ ok: true, inserted: 0, mode: "local-only" });
  }

  if (sessionId && sessionId !== "local") {
    await supabase.from("sessions").upsert(
      {
        id: sessionId,
        started_at: new Date().toISOString(),
        device_info: {},
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }

  const metadata: Record<string, unknown> = parseMetadata(metadataInput);

  if (file instanceof File) {
    const extension = file.type.includes("png") ? "png" : "jpg";
    const storagePath = `unlock/${sessionId || "local"}/${Date.now()}.${extension}`;
    const upload = await supabase.storage.from("camera-captures").upload(storagePath, file, {
      contentType: file.type || "image/jpeg",
    });

    if (upload.error) {
      metadata.uploadError = upload.error.message;
    } else {
      metadata.storagePath = storagePath;
      metadata.mimeType = file.type;
      metadata.size = file.size;
    }
  }

  const { error } = await supabase.from("unlock_events").insert({
    session_id: sessionId && sessionId !== "local" ? sessionId : null,
    event_type: eventType,
    success,
    metadata,
  });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 503 });
  }

  return NextResponse.json({ ok: true, inserted: 1, metadata });
}

function parseMetadata(value: FormDataEntryValue | null): Record<string, unknown> {
  if (typeof value !== "string" || !value.trim()) {
    return {};
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed as Record<string, unknown> : {};
  } catch {
    return {};
  }
}

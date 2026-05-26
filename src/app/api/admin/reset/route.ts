import { NextResponse } from "next/server";

import { requestHasAdminSession } from "@/features/admin/admin-auth";
import { adminResetTableOrder, type AdminResetTable } from "@/features/admin/admin-reset";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ResetRequest = {
  confirmation?: string;
};

type StoragePathRow = {
  storage_path?: string | null;
  metadata?: Record<string, unknown> | null;
};

const deleteAllRowsDateFloor = "0001-01-01T00:00:00.000Z";

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as ResetRequest;

  if (!requestHasAdminSession(request) || payload.confirmation !== "RESET") {
    return NextResponse.json({ ok: false, error: "Reset confirmation failed." }, { status: 401 });
  }

  const supabase = createSupabaseAdminClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Admin Supabase credentials are not configured." }, { status: 503 });
  }

  const storagePathsResult = await collectCameraCapturePaths(supabase);
  if (storagePathsResult.error) {
    return NextResponse.json({ ok: false, error: storagePathsResult.error }, { status: 503 });
  }

  const storageResult = await removeCameraCapturePaths(supabase, storagePathsResult.paths);
  if (storageResult.error) {
    return NextResponse.json({ ok: false, error: storageResult.error }, { status: 503 });
  }

  const deleted: Partial<Record<AdminResetTable, number>> = {};

  for (const table of adminResetTableOrder) {
    const { error, count } = await supabase
      .from(table)
      .delete({ count: "exact" })
      .gte("created_at", deleteAllRowsDateFloor);

    if (error) {
      return NextResponse.json({ ok: false, error: `Could not reset ${table}: ${error.message}` }, { status: 503 });
    }

    deleted[table] = count ?? 0;
  }

  return NextResponse.json({
    ok: true,
    deleted,
    storageRemoved: storageResult.removed,
  });
}

async function collectCameraCapturePaths(supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>) {
  const [capturesResult, unlocksResult] = await Promise.all([
    supabase.from("captured_photos").select("storage_path"),
    supabase.from("unlock_events").select("metadata"),
  ]);

  const error = capturesResult.error?.message ?? unlocksResult.error?.message;
  if (error) {
    return { paths: [], error };
  }

  const rows = [
    ...((capturesResult.data ?? []) as StoragePathRow[]),
    ...((unlocksResult.data ?? []) as StoragePathRow[]),
  ];
  const paths = rows
    .map((row) => row.storage_path ?? row.metadata?.storagePath)
    .filter((path): path is string => typeof path === "string" && path.trim().length > 0);

  return { paths: Array.from(new Set(paths)), error: null };
}

async function removeCameraCapturePaths(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  paths: string[],
) {
  let removed = 0;

  for (let index = 0; index < paths.length; index += 100) {
    const chunk = paths.slice(index, index + 100);
    const { error, data } = await supabase.storage.from("camera-captures").remove(chunk);
    if (error) {
      return { removed, error: `Could not remove camera captures: ${error.message}` };
    }
    removed += data?.length ?? chunk.length;
  }

  return { removed, error: null };
}

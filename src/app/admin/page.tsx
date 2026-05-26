import {
  type AdminActivityEventRow,
  type AdminCapturedPhotoRow,
  type AdminContentStateRow,
  type AdminDashboardData,
  type AdminMusicEventRow,
  type AdminPuzzleAttemptRow,
  type AdminSessionRow,
  type AdminUnlockEventRow,
} from "@/features/admin/admin-analytics";
import { adminSessionCookieName, adminSessionCookieValue, isAdminSessionCookieValue } from "@/features/admin/admin-auth";
import { resolveAdminPassword } from "@/features/admin/admin-reset";
import { AdminDashboard } from "@/features/admin/AdminDashboard";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type AdminSearchParams = Promise<{ password?: string }>;

export default async function AdminPage({ searchParams }: { searchParams: AdminSearchParams }) {
  const { password } = await searchParams;

  if (password) {
    redirect("/admin");
  }

  const cookieStore = await cookies();
  if (!isAdminSessionCookieValue(cookieStore.get(adminSessionCookieName)?.value)) {
    return <AdminPasswordGate />;
  }

  const data = await loadAdminData();
  return <AdminDashboard data={data} />;
}

async function unlockAdmin(formData: FormData) {
  "use server";

  const password = String(formData.get("password") ?? "");
  if (password === resolveAdminPassword()) {
    const cookieStore = await cookies();
    setAdminCookie(cookieStore);
    redirect("/admin");
  }

  redirect("/admin");
}

function AdminPasswordGate() {
  return (
    <main className="grid min-h-dvh place-items-center overflow-y-auto bg-[#f5f5f7] p-6 text-slate-950">
      <form action={unlockAdmin} className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">macOS on Web Console</p>
        <h1 className="mt-2 text-2xl font-bold">Enter dashboard password</h1>
        <input
          name="password"
          type="password"
          autoFocus
          placeholder="Password"
          className="mt-5 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
        />
        <button type="submit" className="mt-4 h-11 w-full rounded-xl bg-slate-950 text-sm font-semibold text-white">
          Open dashboard
        </button>
      </form>
    </main>
  );
}

function setAdminCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  cookieStore.set(adminSessionCookieName, adminSessionCookieValue, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

async function loadAdminData(): Promise<AdminDashboardData> {
  const supabase = createSupabaseAdminClient();

  if (!supabase) {
    return emptyAdminData("local-only");
  }

  const [sessionsResult, attemptsResult, eventsResult, capturesResult, musicResult, contentResult, unlocksResult] = await Promise.all([
    supabase.from("sessions").select("id,started_at,ended_at,duration,device_info,created_at").order("started_at", { ascending: false }).limit(150),
    supabase.from("puzzle_attempts").select("session_id,puzzle_type,level_id,completed_at,created_at,duration,moves,hints_used,resets,result,metadata").order("created_at", { ascending: false }).limit(1000),
    supabase.from("activity_events").select("session_id,app_id,event_type,occurred_at,duration,metadata").order("occurred_at", { ascending: false }).limit(500),
    supabase.from("captured_photos").select("id,session_id,storage_path,album_id,captured_at,metadata").order("captured_at", { ascending: false }).limit(250),
    supabase.from("music_events").select("id,session_id,track_id,playlist_id,event_type,progress,duration,created_at").order("created_at", { ascending: false }).limit(250),
    supabase.from("content_state").select("id,content_type,content_id,state,unlocked_at,metadata,created_at").order("created_at", { ascending: false }).limit(250),
    supabase.from("unlock_events").select("id,session_id,event_type,success,occurred_at,metadata").order("occurred_at", { ascending: false }).limit(500),
  ]);

  const error = [sessionsResult, attemptsResult, eventsResult, capturesResult, musicResult, contentResult, unlocksResult]
    .map((result) => result.error?.message)
    .find(Boolean);

  if (error) {
    return { ...emptyAdminData("error"), error };
  }

  const captures = await withSignedImages(
    supabase,
    (capturesResult.data ?? []) as AdminCapturedPhotoRow[],
    (row) => row.storage_path,
  );
  const unlocks = await withSignedImages(
    supabase,
    (unlocksResult.data ?? []) as AdminUnlockEventRow[],
    (row) => typeof row.metadata?.storagePath === "string" ? row.metadata.storagePath : null,
  );

  return {
    mode: "cloud",
    sessions: (sessionsResult.data ?? []) as AdminSessionRow[],
    attempts: (attemptsResult.data ?? []) as AdminPuzzleAttemptRow[],
    events: (eventsResult.data ?? []) as AdminActivityEventRow[],
    captures,
    music: (musicResult.data ?? []) as AdminMusicEventRow[],
    contentState: (contentResult.data ?? []) as AdminContentStateRow[],
    unlocks,
  };
}

function emptyAdminData(mode: AdminDashboardData["mode"]): AdminDashboardData {
  return {
    mode,
    sessions: [],
    attempts: [],
    events: [],
    captures: [],
    music: [],
    contentState: [],
    unlocks: [],
  };
}

async function withSignedImages<T extends object>(
  supabase: NonNullable<ReturnType<typeof createSupabaseAdminClient>>,
  rows: T[],
  getPath: (row: T) => string | null,
): Promise<Array<T & { imageUrl?: string }>> {
  return Promise.all(
    rows.map(async (row) => {
      const path = getPath(row);
      if (!path) return row;
      const signed = await supabase.storage.from("camera-captures").createSignedUrl(path, 60 * 30);
      return signed.data?.signedUrl ? { ...row, imageUrl: signed.data.signedUrl } : row;
    }),
  );
}

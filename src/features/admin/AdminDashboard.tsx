import { Activity, FileText, Images, KeyRound, Music2, Puzzle, Radio } from "lucide-react";
import type { ReactNode } from "react";

import {
  buildGameStats,
  buildSessionActivityGroups,
  buildSessionSummaries,
  formatAdminDuration,
  summarizeActivityEvents,
  summarizePuzzleAttempts,
  type AdminDashboardData,
  type AdminSessionActivityItem,
} from "./admin-analytics";
import { AdminActivityTable } from "./AdminActivityTable";
import { formatAdminDate } from "./admin-display";
import { AdminNoteStateCard } from "./AdminNoteStateCard";
import { AdminPuzzleArchive } from "./AdminPuzzleArchive";
import { AdminResetButton } from "./AdminResetButton";
import { AdminUnlockGallery } from "./AdminUnlockGallery";

export function AdminDashboard({ data }: { data: AdminDashboardData }) {
  const puzzleSummary = summarizePuzzleAttempts(data.attempts);
  const activitySummary = summarizeActivityEvents(data.events);
  const gameStats = buildGameStats(data.attempts);
  const sessionSummaries = buildSessionSummaries(data);
  const sessionActivityGroups = buildSessionActivityGroups(data, 4);
  const noteRows = data.contentState.filter((row) => row.content_type === "note");
  const photoRows = data.contentState.filter((row) => row.content_type === "photo");

  return (
    <main className="fixed inset-0 overflow-y-auto bg-[#f4efe7] p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#9b6b2f]">macOS on Web Dashboard</p>
            <h1 className="mt-2 text-4xl font-bold tracking-normal text-[#2b2118]">Demo analytics console</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Review sessions, unlocks, puzzle completions, gallery activity, notes, and music events captured by the simulator.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill mode={data.mode} error={data.error} />
            <AdminResetButton disabled={data.mode !== "cloud"} />
          </div>
        </div>

        <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard icon={<Radio className="size-5" />} title="Sessions" value={String(data.sessions.length)} detail={sessionSummaries[0] ? `Latest ${formatAdminDate(sessionSummaries[0].startedAt)}` : "No sessions yet"} />
          <MetricCard icon={<Activity className="size-5" />} title="Activity" value={String(activitySummary.total)} detail={activitySummary.latestEventAt ? `Latest ${formatAdminDate(activitySummary.latestEventAt)}` : "No events yet"} />
          <MetricCard icon={<Puzzle className="size-5" />} title="Puzzles" value={String(puzzleSummary.total)} detail={`${puzzleSummary.completed} completed`} />
          <MetricCard icon={<KeyRound className="size-5" />} title="Unlocks" value={String(data.unlocks.length)} detail={`${data.unlocks.filter((event) => event.success).length} successful`} />
          <MetricCard icon={<Images className="size-5" />} title="Gallery" value={String(data.captures.length)} detail="Camera and Face ID captures" />
        </section>

        <section className="mt-6">
          <Panel title="Recent sessions" icon={<Radio className="size-5 text-slate-400" />}>
            <div className="grid gap-3 lg:grid-cols-2">
              {sessionActivityGroups.length ? sessionActivityGroups.slice(0, 6).map((group) => {
                const summary = sessionSummaries.find((session) => session.id === group.id);
                const session = data.sessions.find((item) => item.id === group.id);

                return (
                  <div key={group.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-semibold">{formatAdminDate(group.startedAt)}</span>
                      <span className="font-mono text-xs text-slate-400">{group.id.slice(0, 8)}</span>
                    </div>
                    <p className="mt-2 text-slate-500">
                      {summary?.eventCount ?? 0} events · {summary?.puzzleCount ?? 0} puzzles · {summary?.unlockCount ?? 0} unlocks · {summary?.captureCount ?? 0} captures · {summary?.musicCount ?? 0} music
                    </p>
                    {session ? <SessionDetailChips session={session} /> : null}
                    <div className="mt-3 space-y-2">
                      {group.items.length ? group.items.map((item, itemIndex) => <SessionActivityRow key={`${group.id}-${item.kind}-${item.occurredAt}-${item.title}-${itemIndex}`} item={item} />) : (
                        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-2 text-xs text-slate-500">No linked events yet.</p>
                      )}
                    </div>
                  </div>
                );
              }) : <EmptyState message="Sessions will appear here after someone opens the simulator." />}
            </div>
          </Panel>
        </section>

        <div className="mt-6">
          <AdminUnlockGallery unlocks={data.unlocks} captures={data.captures} />
        </div>

        <div className="mt-6">
          <AdminPuzzleArchive attempts={data.attempts} gameStats={gameStats} />
        </div>

        <section className="mt-6 grid gap-4 xl:grid-cols-3">
          <Panel title="Gallery library" icon={<Images className="size-5 text-slate-400" />}>
            <div className="mt-4 space-y-2">
              {photoRows.length ? photoRows.map((row) => (
                <div key={row.id} className="rounded-xl bg-slate-50 p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="truncate font-semibold">{String(row.metadata?.title ?? row.content_id)}</span>
                    <span className={row.state === "favorite" ? "text-xs font-semibold text-red-500" : "text-xs text-slate-500"}>
                      {row.state}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-xs text-slate-500">{String(row.metadata?.caption ?? "")}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Views {String(row.metadata?.viewCount ?? 0)}
                    {row.metadata?.viewedAt ? ` · Last ${formatAdminDate(String(row.metadata.viewedAt))}` : ""}
                  </p>
                </div>
              )) : <EmptyState message="Photo library activity will appear here." />}
            </div>
          </Panel>

          <Panel title="Notes and content state" icon={<FileText className="size-5 text-slate-400" />}>
            <div className="space-y-2">
              {noteRows.length ? noteRows.slice(0, 6).map((row) => (
                <AdminNoteStateCard key={row.id} row={row} />
              )) : (
                <CompactTable
                  headers={["Type", "Content", "State"]}
                  rows={data.contentState.slice(0, 8).map((row) => [row.content_type, row.content_id, row.state])}
                  empty="Notes will appear here after the Notes app syncs to the database."
                />
              )}
            </div>
          </Panel>

          <Panel title="Music history" icon={<Music2 className="size-5 text-slate-400" />}>
            <CompactTable
              headers={["Track", "Event", "When"]}
              rows={data.music.map((event) => [event.track_id, event.event_type, formatAdminDate(event.created_at)])}
              empty="Music events will appear here when player events are synced."
            />
          </Panel>
        </section>

        <Panel title="Recent activity timeline" icon={<Activity className="size-5 text-slate-400" />} className="mt-6">
          <AdminActivityTable events={data.events} empty={data.mode === "local-only" ? "Set SUPABASE_SERVICE_ROLE_KEY to read cloud activity." : "No activity rows found yet."} />
        </Panel>

        <Panel title="All content state" icon={<FileText className="size-5 text-slate-400" />} className="mt-6">
          <CompactTable
            headers={["Type", "Content", "State", "Updated"]}
            rows={data.contentState.slice(0, 18).map((row) => [
              row.content_type,
              row.content_id,
              row.state,
              formatAdminDate(row.created_at),
            ])}
            empty="No content_state rows found yet."
          />
        </Panel>
      </div>
    </main>
  );
}

function StatusPill({ mode, error }: { mode: AdminDashboardData["mode"]; error?: string }) {
  const label = mode === "cloud" ? "Cloud reads enabled" : mode === "error" ? "Cloud read error" : "Local-only admin";

  return (
    <div className={`flex max-w-sm items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold shadow-sm ring-1 ${
      mode === "cloud" ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-white text-slate-600 ring-black/5"
    }`}>
      <span>{label}</span>
      {error ? <span className="max-w-[180px] truncate font-normal text-slate-500">{error}</span> : null}
    </div>
  );
}

function MetricCard({ icon, title, value, detail }: { icon: ReactNode; title: string; value: string; detail: string }) {
  return (
    <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div className="flex items-center justify-between text-slate-500">
        <p className="text-sm font-medium">{title}</p>
        {icon}
      </div>
      <p className="mt-3 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-sm text-slate-500">{detail}</p>
    </section>
  );
}

function SessionActivityRow({ item }: { item: AdminSessionActivityItem }) {
  const tone = {
    activity: "bg-sky-500",
    capture: "bg-fuchsia-500",
    music: "bg-emerald-500",
    puzzle: "bg-amber-500",
    unlock: "bg-violet-500",
  }[item.kind];

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2 rounded-lg bg-white px-3 py-2 ring-1 ring-black/5">
      <span className={`size-2 rounded-full ${tone}`} aria-hidden />
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-700">{item.title}</p>
        <p className="truncate text-xs text-slate-500">{item.detail || "No extra detail"}</p>
      </div>
      <time className="text-xs text-slate-400">{formatAdminDate(item.occurredAt)}</time>
    </div>
  );
}

function SessionDetailChips({ session }: { session: AdminDashboardData["sessions"][number] }) {
  const details = [
    session.ended_at ? "ended" : "active",
    typeof session.duration === "number" && Number.isFinite(session.duration) ? formatAdminDuration(Math.max(0, Math.round(session.duration))) : "",
    ...sessionDeviceParts(session.device_info),
  ].filter(Boolean);

  if (!details.length) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {details.map((detail) => (
        <span key={detail} className="rounded-md bg-white px-1.5 py-0.5 text-xs text-slate-500 ring-1 ring-black/5">{detail}</span>
      ))}
    </div>
  );
}

function Panel({ title, icon, className = "", children }: { title: string; icon: ReactNode; className?: string; children: ReactNode }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {icon}
      </div>
      {children}
    </section>
  );
}

function CompactTable({ headers, rows, empty }: { headers: string[]; rows: string[][]; empty: string }) {
  if (!rows.length) return <EmptyState message={empty} />;

  return (
    <div className="overflow-hidden rounded-xl border border-black/5">
      <div className="grid bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
        {headers.map((header) => <span key={header}>{header}</span>)}
      </div>
      {rows.map((row, index) => (
        <div key={`${row.join("-")}-${index}`} className="grid border-t border-black/5 px-3 py-2 text-sm" style={{ gridTemplateColumns: `repeat(${headers.length}, minmax(0, 1fr))` }}>
          {row.map((cell, cellIndex) => <span key={`${cell}-${cellIndex}`} className="truncate text-slate-600">{cell}</span>)}
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">{message}</div>;
}

function sessionDeviceParts(deviceInfo: Record<string, unknown> | null) {
  if (!deviceInfo) {
    return [];
  }

  return [deviceInfo.browser, deviceInfo.os, deviceInfo.platform, deviceInfo.device]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .slice(0, 3);
}

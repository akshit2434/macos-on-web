import { formatAdminDuration, type AdminActivityEventRow } from "./admin-analytics";

export function AdminActivityTable({ events, empty }: { events: AdminActivityEventRow[]; empty: string }) {
  if (!events.length) {
    return <div className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500">{empty}</div>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-black/5">
      <div className="grid grid-cols-[0.9fr_0.75fr_1fr_1.7fr] bg-slate-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>When</span>
        <span>App</span>
        <span>Event</span>
        <span>Details</span>
      </div>
      {events.slice(0, 14).map((event) => (
        <div key={`${event.occurred_at}-${event.event_type}-${event.app_id ?? "system"}`} className="grid grid-cols-[0.9fr_0.75fr_1fr_1.7fr] gap-2 border-t border-black/5 px-3 py-2 text-sm">
          <span className="truncate text-slate-600">{formatDate(event.occurred_at)}</span>
          <span className="truncate text-slate-600">{event.app_id ?? "system"}</span>
          <span className="truncate text-slate-600">{event.event_type}</span>
          <span className="flex min-w-0 flex-wrap gap-1">
            {activityDetailParts(event).map((part) => (
              <span key={part} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">{part}</span>
            ))}
          </span>
        </div>
      ))}
    </div>
  );
}

function activityDetailParts(event: AdminActivityEventRow) {
  const details = [
    event.session_id ? `session ${event.session_id.slice(0, 14)}` : "",
    typeof event.duration === "number" && Number.isFinite(event.duration) ? formatAdminDuration(Math.max(0, Math.round(event.duration))) : "",
    ...metadataParts(event.metadata),
  ].filter(Boolean);

  return details.length ? details : ["no details"];
}

function metadataParts(metadata: Record<string, unknown> | null | undefined) {
  if (!metadata) {
    return [];
  }

  return Object.entries(metadata)
    .filter(([, value]) => value !== null && value !== undefined && typeof value !== "object")
    .slice(0, 4)
    .map(([key, value]) => `${key}: ${String(value)}`);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

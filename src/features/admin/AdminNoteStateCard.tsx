import { type AdminDashboardData } from "./admin-analytics";

export function AdminNoteStateCard({ row }: { row: AdminDashboardData["contentState"][number] }) {
  const title = String(row.metadata?.title ?? row.content_id);
  const doodlePreviewUrl = getDoodlePreviewUrl(row.metadata?.doodlePreviewUrl);

  return (
    <div className="rounded-xl bg-slate-50 p-3 text-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-semibold">{title}</span>
        <span className="text-xs text-slate-500">{row.state}</span>
      </div>
      <p className="mt-1 text-xs text-slate-500">{String(row.metadata?.folder ?? "Notes")}</p>
      <p className="mt-2 line-clamp-2 text-slate-600">{stripHtml(String(row.metadata?.body ?? "")) || "Empty note"}</p>
      {doodlePreviewUrl ? (
        <div className="mt-3 overflow-hidden rounded-lg bg-[#fffdf8] ring-1 ring-black/5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={doodlePreviewUrl} alt={`Note doodle preview for ${title}`} className="h-28 w-full object-contain" />
        </div>
      ) : row.metadata?.hasDoodle ? (
        <p className="mt-3 rounded-lg bg-white px-3 py-2 text-xs text-slate-500 ring-1 ring-black/5">Doodle exists but no preview was stored.</p>
      ) : null}
    </div>
  );
}

function stripHtml(value: string) {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function getDoodlePreviewUrl(value: unknown) {
  return typeof value === "string" && value.startsWith("data:image/png;base64,") ? value : "";
}

import { KeyRound, LockKeyhole, ScanFace } from "lucide-react";

import { type AdminDashboardData } from "./admin-analytics";
import { formatAdminDate, formatAdminTextLabel } from "./admin-display";

export function AdminUnlockGallery({ unlocks, captures }: { unlocks: AdminDashboardData["unlocks"]; captures: AdminDashboardData["captures"] }) {
  const faceUnlocks = unlocks.filter((event) => event.imageUrl);

  return (
    <section className="rounded-[2rem] bg-[#eef7f4] p-5 shadow-sm ring-1 ring-[#12372d]/10 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#24715e]">Unlocks</p>
          <h2 className="mt-2 text-2xl font-bold text-[#12372d]">Face ID and entry history</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#496d62]">
            A visual log of unlocks, PIN entries, and camera captures, ordered by the moments they happened.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold text-[#496d62]">
          <div className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-[#12372d]/10">
            <p className="text-2xl font-bold text-[#12372d]">{unlocks.length}</p>
            <p>entries</p>
          </div>
          <div className="rounded-2xl bg-white/70 px-4 py-3 ring-1 ring-[#12372d]/10">
            <p className="text-2xl font-bold text-[#12372d]">{faceUnlocks.length + captures.length}</p>
            <p>images</p>
          </div>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {unlocks.length ? unlocks.map((event) => (
          <article key={event.id} className="overflow-hidden rounded-3xl bg-white/80 shadow-sm ring-1 ring-[#12372d]/10">
            {event.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.imageUrl} alt="Face unlock capture" className="aspect-[4/3] w-full object-cover" />
            ) : (
              <div className="grid aspect-[4/3] place-items-center bg-[#d9ebe4] text-[#24715e]">
                {event.event_type.includes("face") ? <ScanFace className="size-10" /> : <LockKeyhole className="size-10" />}
              </div>
            )}
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold capitalize text-[#12372d]">{formatAdminTextLabel(event.event_type)}</h3>
                  <p className="mt-1 text-xs text-[#63877b]">{formatAdminDate(event.occurred_at)}</p>
                </div>
                <span className={event.success ? "rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700"}>
                  {event.success ? "Success" : "Failed"}
                </span>
              </div>
            </div>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-[#7db6a8] p-4 text-sm text-[#496d62] sm:col-span-2 xl:col-span-4">
            Face ID/PIN unlock events will appear here.
          </div>
        )}
      </div>

      {captures.length ? (
        <div className="mt-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-bold text-[#12372d]">
            <KeyRound className="size-4" />
            Camera captures
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {captures.map((capture) => (
              <figure key={capture.id} className="w-44 shrink-0 overflow-hidden rounded-2xl bg-white/80 ring-1 ring-[#12372d]/10">
                {capture.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={capture.imageUrl} alt="Camera capture" className="aspect-square w-full object-cover" />
                ) : (
                  <div className="grid aspect-square place-items-center text-xs text-[#63877b]">No signed image</div>
                )}
                <figcaption className="p-3 text-xs font-semibold text-[#496d62]">{formatAdminDate(capture.captured_at)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

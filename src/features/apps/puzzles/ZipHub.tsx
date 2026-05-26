"use client";

import { CalendarDays, Check, Flame, Lock, Play } from "lucide-react";

import type { ZipHubProgress } from "./zip-progress";

export function ZipHub({ progress, onPlayDaily, onPlayLevel }: { progress: ZipHubProgress; onPlayDaily: () => void; onPlayLevel: (index: number) => void }) {
  return (
    <div className="min-h-full bg-[#061434] px-5 py-5 text-white">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-sky-200/60">Zip</p>
          <h1 className="text-4xl font-black tracking-normal">Daily path</h1>
        </div>
        <div className="flex gap-2">
          <StreakPill label="Streak" value={progress.currentStreak} />
          <StreakPill label="Max" value={progress.maxStreak} />
        </div>
      </header>

      <section className="mb-5 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_18%_10%,rgba(56,189,248,0.55),transparent_30%),linear-gradient(135deg,#172554,#1e1b4b_55%,#020617)] p-5 shadow-[0_26px_70px_rgba(2,6,23,0.45)] ring-1 ring-white/12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/16">
              <CalendarDays className="size-6 text-sky-100" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-100/55">Today&apos;s challenge</p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">One board. One streak.</h2>
            <p className="mt-2 max-w-md text-sm font-medium text-sky-100/70">A harder board unlocks each day. Finish today&apos;s route to keep the streak alive.</p>
          </div>
          <button
            type="button"
            disabled={!progress.dailyLevel}
            onClick={onPlayDaily}
            className="flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-[#061434] shadow-[0_14px_30px_rgba(255,255,255,0.18)] hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play className="size-4 fill-[#061434]" />
            Play Daily
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white/8 p-4 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-normal">Levels</h2>
          <span className="text-xs font-bold text-sky-100/55">Complete a level to unlock the next</span>
        </div>
        <div className="grid grid-cols-5 gap-3 sm:grid-cols-6 md:grid-cols-8">
          {progress.levelStates.map(({ level, locked, completed }, index) => (
            <button
              key={level.metadata.id}
              type="button"
              disabled={locked}
              aria-label={locked ? `Level ${index + 1} locked` : `Play level ${index + 1}`}
              onClick={() => onPlayLevel(index)}
              className={`aspect-square rounded-2xl text-base font-black transition ${
                locked
                  ? "bg-white/5 text-white/24 ring-1 ring-white/8"
                  : completed
                    ? "bg-emerald-300 text-emerald-950 shadow-[0_10px_26px_rgba(110,231,183,0.2)]"
                    : "bg-sky-100 text-[#061434] shadow-[0_10px_26px_rgba(125,211,252,0.18)] hover:scale-[1.04]"
              }`}
            >
              <span className="grid size-full place-items-center">
                {locked ? <Lock className="size-4" /> : completed ? <Check className="size-5" /> : index + 1}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

function StreakPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white/10 px-3 py-2 text-right ring-1 ring-white/12">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-sky-100/45">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-lg font-black">
        <Flame className={`size-4 ${value >= 7 ? "text-orange-300" : value >= 3 ? "text-amber-300" : "text-sky-200"}`} />
        {value}
      </p>
    </div>
  );
}

"use client";

import { CalendarDays, Check, Flame, Lock, Play } from "lucide-react";

import type { ArrowHubProgress } from "./arrow-progress";

export function ArrowHub({ progress, onPlayDaily, onPlayLevel }: { progress: ArrowHubProgress; onPlayDaily: () => void; onPlayLevel: (index: number) => void }) {
  return (
    <div className="min-h-full bg-[#f1dfbd] px-5 py-5 text-[#6f4712]">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#9b6b22]/65">Arrow Escape</p>
          <h1 className="text-4xl font-black tracking-normal">Challenge on</h1>
        </div>
        <div className="flex gap-2">
          <StreakPill label="Streak" value={progress.currentStreak} />
          <StreakPill label="Max" value={progress.maxStreak} />
        </div>
      </header>

      <section className="mb-5 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_18%_10%,rgba(255,255,255,0.55),transparent_32%),linear-gradient(135deg,#f7ebcf,#d7b171)] p-5 shadow-[0_24px_60px_rgba(91,54,13,0.28)] ring-1 ring-[#7c4d16]/15">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/50 ring-1 ring-[#7c4d16]/12">
              <CalendarDays className="size-6 text-[#8a5a19]" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a5a19]/60">Today&apos;s challenge</p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">Clear every arrow.</h2>
          </div>
          <button
            type="button"
            disabled={!progress.dailyLevel}
            onClick={onPlayDaily}
            className="flex items-center gap-2 rounded-full bg-[#6f4712] px-5 py-3 text-sm font-black text-[#fff7e6] shadow-[0_14px_30px_rgba(111,71,18,0.22)] hover:bg-[#5d3a0e] disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play className="size-4 fill-[#fff7e6]" />
            Play Daily
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white/36 p-4 ring-1 ring-[#7c4d16]/12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-normal">Levels</h2>
          <span className="text-xs font-bold text-[#8a5a19]/55">Clear one to unlock the next</span>
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
                  ? "bg-[#7c4d16]/8 text-[#6f4712]/28 ring-1 ring-[#7c4d16]/10"
                  : completed
                    ? "bg-emerald-300 text-emerald-950 shadow-[0_10px_24px_rgba(16,185,129,0.18)]"
                    : "bg-[#fff7e6] text-[#6f4712] shadow-[0_10px_24px_rgba(111,71,18,0.14)] hover:scale-[1.04]"
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
    <div className="rounded-2xl bg-white/42 px-3 py-2 text-right ring-1 ring-[#7c4d16]/12">
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#8a5a19]/45">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-lg font-black">
        <Flame className={`size-4 ${value >= 7 ? "text-orange-500" : value >= 3 ? "text-amber-500" : "text-[#9b6b22]"}`} />
        {value}
      </p>
    </div>
  );
}

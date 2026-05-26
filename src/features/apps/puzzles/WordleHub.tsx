"use client";

import { CalendarDays, Check, Flame, Lock, Play } from "lucide-react";

import type { WordleHubProgress } from "./wordle-progress";

export function WordleHub({ progress, onPlayDaily, onPlayLevel }: { progress: WordleHubProgress; onPlayDaily: () => void; onPlayLevel: (index: number) => void }) {
  return (
    <div className="min-h-full bg-[#102418] px-5 py-5 text-[#f6f3df]">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-[12px] font-black uppercase tracking-[0.18em] text-emerald-100/58">Wordle</p>
          <h1 className="text-4xl font-black tracking-normal">Daily word</h1>
        </div>
        <div className="flex gap-2">
          <StreakPill label="Streak" value={progress.currentStreak} />
          <StreakPill label="Max" value={progress.maxStreak} />
        </div>
      </header>

      <section className="mb-5 overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_18%_10%,rgba(187,247,208,0.34),transparent_32%),linear-gradient(135deg,#1f3b28,#294c31_55%,#102418)] p-5 shadow-[0_24px_60px_rgba(2,23,10,0.38)] ring-1 ring-white/10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="mb-3 flex size-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/14">
              <CalendarDays className="size-6 text-emerald-100" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100/55">Today&apos;s challenge</p>
            <h2 className="mt-1 text-2xl font-black tracking-normal">Six guesses. One word.</h2>
          </div>
          <button
            type="button"
            disabled={!progress.dailyLevel}
            onClick={onPlayDaily}
            className="flex items-center gap-2 rounded-full bg-[#f6f3df] px-5 py-3 text-sm font-black text-[#102418] shadow-[0_14px_30px_rgba(246,243,223,0.16)] hover:bg-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Play className="size-4 fill-[#102418]" />
            Play Daily
          </button>
        </div>
      </section>

      <section className="rounded-[28px] bg-white/8 p-4 ring-1 ring-white/10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-black tracking-normal">Levels</h2>
          <span className="text-xs font-bold text-emerald-100/55">Solve one to unlock the next</span>
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
                    ? "bg-emerald-300 text-emerald-950 shadow-[0_10px_26px_rgba(110,231,183,0.18)]"
                    : "bg-[#f6f3df] text-[#102418] shadow-[0_10px_26px_rgba(246,243,223,0.14)] hover:scale-[1.04]"
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
      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-100/45">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 text-lg font-black">
        <Flame className={`size-4 ${value >= 7 ? "text-orange-300" : value >= 3 ? "text-amber-300" : "text-emerald-200"}`} />
        {value}
      </p>
    </div>
  );
}

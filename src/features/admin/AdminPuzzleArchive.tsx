import { CalendarDays, Flame, Gamepad2, Timer, Trophy } from "lucide-react";
import type { ReactNode } from "react";

import { formatAdminDuration, type AdminDashboardData, type GameStat } from "./admin-analytics";
import { formatAdminDate, formatAdminLevelLabel, formatAdminTextLabel } from "./admin-display";

export function AdminPuzzleArchive({ attempts, gameStats }: { attempts: AdminDashboardData["attempts"]; gameStats: GameStat[] }) {
  const completedAttempts = attempts.filter((attempt) => attempt.result === "completed" || Boolean(attempt.completed_at));

  return (
    <section className="rounded-[2rem] bg-[#fffaf0] p-5 shadow-sm ring-1 ring-[#2b2118]/10 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#9b6b2f]">Games</p>
          <h2 className="mt-2 text-2xl font-bold text-[#2b2118]">Puzzle trail</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6f5a3e]">
            Every solved level, daily challenge, streak, and time record in one place.
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 px-4 py-3 text-right ring-1 ring-[#2b2118]/10">
          <p className="text-3xl font-bold text-[#2b2118]">{completedAttempts.length}</p>
          <p className="text-xs font-semibold text-[#8a6b48]">levels solved</p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {gameStats.length ? gameStats.map((game) => (
          <article key={game.puzzleType} className="rounded-2xl bg-white/75 p-4 ring-1 ring-[#2b2118]/10">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="grid size-9 place-items-center rounded-2xl bg-[#2b2118] text-[#fffaf0]">
                  <Gamepad2 className="size-4" />
                </span>
                <h3 className="font-bold capitalize text-[#2b2118]">{formatAdminTextLabel(game.puzzleType)}</h3>
              </div>
              <span className="rounded-full bg-[#f5d78c] px-2.5 py-1 text-xs font-bold text-[#5b3b08]">
                {game.completed}/{game.attempts}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs text-[#755d3f]">
              <StatChip icon={<Flame className="size-4" />} label="Streak" value={String(game.currentStreak)} />
              <StatChip icon={<Trophy className="size-4" />} label="Max" value={String(game.maxStreak)} />
              <StatChip icon={<CalendarDays className="size-4" />} label="Daily" value={String(game.daily)} />
            </div>
            <p className="mt-3 text-xs text-[#806645]">
              Latest {game.latestCompletedAt ? formatAdminDate(game.latestCompletedAt) : "not yet"}
            </p>
          </article>
        )) : (
          <div className="rounded-2xl border border-dashed border-[#c9a66f] p-4 text-sm text-[#806645] md:col-span-3">
            Game stats will appear after completed attempts sync.
          </div>
        )}
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl bg-white/80 ring-1 ring-[#2b2118]/10">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-[#f7e3af] px-4 py-3 text-xs font-bold uppercase tracking-wide text-[#6a4617]">
          <span>Level</span>
          <span>Result</span>
          <span>Time</span>
          <span>When</span>
        </div>
        <div className="max-h-[28rem] overflow-y-auto">
          {attempts.length ? attempts.map((attempt, index) => (
            <div key={`${attempt.puzzle_type}-${attempt.level_id}-${attempt.created_at}-${index}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-t border-[#2b2118]/10 px-4 py-3 text-sm text-[#3a2a1b]">
              <div className="min-w-0">
                <p className="truncate font-bold capitalize">{formatAdminTextLabel(attempt.puzzle_type)}</p>
                <p className="truncate text-xs text-[#7d6648]">
                  {formatAdminLevelLabel(attempt.level_id)}
                  {attempt.metadata?.daily || attempt.level_id.includes("daily") ? " · daily" : ""}
                </p>
              </div>
              <span className={attempt.result === "completed" || attempt.completed_at ? "text-emerald-700" : "text-rose-700"}>
                {attempt.result}
              </span>
              <span className="inline-flex items-center gap-1 whitespace-nowrap text-[#6b5438]">
                <Timer className="size-3.5" />
                {formatAdminDuration(Math.max(0, Math.round(attempt.duration ?? 0)))}
              </span>
              <span className="whitespace-nowrap text-xs text-[#7d6648]">{formatAdminDate(attempt.completed_at ?? attempt.created_at)}</span>
            </div>
          )) : (
            <p className="p-4 text-sm text-[#806645]">No puzzle attempts found yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}

function StatChip({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#fff8e8] px-2 py-2 ring-1 ring-[#2b2118]/5">
      <div className="mx-auto flex w-fit text-[#9b6b2f]">{icon}</div>
      <p className="mt-1 text-base font-bold text-[#2b2118]">{value}</p>
      <p>{label}</p>
    </div>
  );
}

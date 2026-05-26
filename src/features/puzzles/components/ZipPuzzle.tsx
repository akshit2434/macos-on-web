"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ArrowLeft, RotateCcw } from "lucide-react";

import { validateZipState } from "../validators";
import type { Cell, PuzzleShellProps, ZipLevel, ZipState } from "../types";
import { applyZipCellToPath, zipCellKey } from "../zip-path";

const cellSize = 58;
const cellGap = 8;
const boardPadding = 12;

export function ZipPuzzle({
  level,
  state,
  onStateChange,
  onReset,
  onBack,
  onNextLevel,
  onHome,
  hasNextLevel = false,
}: PuzzleShellProps<ZipLevel, ZipState> & {
  onBack?: () => void;
  onNextLevel?: () => void;
  onHome?: () => void;
  hasNextLevel?: boolean;
}) {
  const validation = validateZipState(level, state);
  const isComplete = state.status === "complete" || validation.isComplete;
  const pathRef = useRef(state.path);
  const pathKeys = new Set(state.path.map(zipCellKey));
  const blocked = new Set((level.blocked ?? []).map(zipCellKey));
  const boardWidth = level.cols * cellSize + (level.cols - 1) * cellGap + boardPadding * 2;
  const boardHeight = level.rows * cellSize + (level.rows - 1) * cellGap + boardPadding * 2;
  const nextCheckpointIndex = level.checkpoints.findIndex((checkpoint) => !pathKeys.has(zipCellKey(checkpoint)));

  useEffect(() => {
    pathRef.current = state.path;
  }, [state.path]);

  function applyCell(cell: Cell) {
    if (isComplete) return;

    const nextPath = applyZipCellToPath(pathRef.current, cell, level.checkpoints, level.walls);
    if (nextPath === pathRef.current) return;

    pathRef.current = nextPath;
    onStateChange?.({ ...state, status: "playing", path: nextPath });
  }

  return (
    <section className="relative flex min-h-full flex-col overflow-auto bg-[#061434] px-5 py-4 text-white" aria-label="Zip game">
      <header className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid size-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/16"
          aria-label="Back to Zip levels"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-blue-200/65">
            {level.metadata.daily ? "Daily Challenge" : "Level"}
          </p>
          <h2 className="truncate text-lg font-black tracking-normal">
            {level.metadata.daily ? "Today" : `Level ${level.metadata.id.replace("zip-level-", "").replace(/^0+/, "")}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-white ring-1 ring-white/12">
            {Math.floor(state.elapsedMs / 1000)}s
          </span>
          <button
            type="button"
            onClick={onReset}
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white ring-1 ring-white/15 hover:bg-white/16"
            aria-label="Reset level"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>

      <div className="min-h-0 flex-1 select-none overflow-auto pb-3">
        <div className="flex min-h-full min-w-max items-center justify-center px-1">
        <div
          className="relative touch-none rounded-[30px] bg-[radial-gradient(circle_at_20%_20%,#3b82f6,transparent_28%),linear-gradient(135deg,#0f172a,#111827_48%,#312e81)] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_18px_50px_rgba(15,23,42,0.28)]"
          style={{ width: boardWidth, height: boardHeight }}
          onPointerMove={(event) => {
            if (event.buttons !== 1) return;
            const target = document.elementFromPoint(event.clientX, event.clientY)?.closest<HTMLButtonElement>("[data-zip-cell]");
            const cellValue = target?.dataset.zipCell;
            if (!cellValue) return;
            const [row, col] = cellValue.split(",").map(Number);
            applyCell([row, col]);
          }}
        >
          <svg
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20"
            width={boardWidth}
            height={boardHeight}
            viewBox={`0 0 ${boardWidth} ${boardHeight}`}
          >
            <polyline
              points={state.path.map(cellCenter).map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="#facc15"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="12"
              opacity="0.92"
            />
            <polyline
              points={state.path.map(cellCenter).map(([x, y]) => `${x},${y}`).join(" ")}
              fill="none"
              stroke="#ffffff"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
              opacity="0.75"
            />
            {(level.walls ?? []).map(([left, right]) => {
              const line = wallLine(left, right);
              return (
                <g key={`${zipCellKey(left)}-${zipCellKey(right)}`}>
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#020617"
                    strokeLinecap="round"
                    strokeWidth="11"
                    opacity="0.86"
                  />
                  <line
                    x1={line.x1}
                    y1={line.y1}
                    x2={line.x2}
                    y2={line.y2}
                    stroke="#cbd5e1"
                    strokeLinecap="round"
                    strokeWidth="2"
                    opacity="0.52"
                  />
                </g>
              );
            })}
          </svg>
          <div className="relative grid" style={{ gridTemplateColumns: `repeat(${level.cols}, ${cellSize}px)`, gap: cellGap }}>
          {Array.from({ length: level.rows * level.cols }, (_, index) => {
            const cell: Cell = [Math.floor(index / level.cols), index % level.cols];
            const key = zipCellKey(cell);
            const isBlocked = blocked.has(key);
            const isVisited = pathKeys.has(key);
            const checkpoint = level.checkpoints.findIndex(([row, col]) => row === cell[0] && col === cell[1]);

            if (isBlocked) {
              return (
                <div
                  key={key}
                  aria-label={`Blocked cell ${cell[0] + 1},${cell[1] + 1}`}
                  className="grid size-[58px] place-items-center rounded-2xl border border-white/10 bg-slate-950/72 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                >
                  <span className="size-7 rounded-lg bg-[linear-gradient(135deg,rgba(255,255,255,0.18)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.18)_50%,rgba(255,255,255,0.18)_75%,transparent_75%)] bg-[length:10px_10px] opacity-70" />
                </div>
              );
            }

            return (
              <button
                key={key}
                data-zip-cell={key}
                type="button"
                aria-label={checkpoint >= 0 ? `Zip number ${checkpoint + 1}` : `Zip cell ${cell[0] + 1},${cell[1] + 1}`}
                disabled={isComplete}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  applyCell(cell);
                }}
                onPointerCancel={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
                onPointerUp={(event) => {
                  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                    event.currentTarget.releasePointerCapture(event.pointerId);
                  }
                }}
                className={`relative grid size-[58px] place-items-center rounded-2xl border text-sm font-semibold transition disabled:cursor-default ${
                  isVisited
                    ? "border-white/18 bg-white/86 text-slate-800"
                    : "border-white/10 bg-white/90 text-slate-700 hover:bg-white"
                }`}
              >
                {checkpoint >= 0 ? (
                  <span className="relative z-30 grid size-8 place-items-center rounded-full bg-slate-950 text-sm font-black text-white shadow-[0_4px_12px_rgba(2,6,23,0.32)]">
                    {checkpoint + 1}
                  </span>
                ) : null}
              </button>
            );
          })}
          </div>
        </div>
        </div>
      </div>
      <StatusLine
        complete={validation.isComplete}
        errors={validation.errors}
        pathLength={state.path.length}
        totalCells={level.rows * level.cols - blocked.size}
        blockerCount={blocked.size}
        nextCheckpoint={nextCheckpointIndex >= 0 ? nextCheckpointIndex + 1 : null}
      />
      {isComplete ? (
        <CompletionOverlay
          elapsedMs={state.elapsedMs}
          isDaily={Boolean(level.metadata.daily)}
          hasNextLevel={hasNextLevel}
          onNextLevel={onNextLevel}
          onHome={onHome ?? onBack}
        />
      ) : null}
    </section>
  );
}

function cellCenter([row, col]: Cell) {
  return [
    boardPadding + col * (cellSize + cellGap) + cellSize / 2,
    boardPadding + row * (cellSize + cellGap) + cellSize / 2,
  ] as const;
}

function CompletionOverlay({
  elapsedMs,
  isDaily,
  hasNextLevel,
  onNextLevel,
  onHome,
}: {
  elapsedMs: number;
  isDaily: boolean;
  hasNextLevel: boolean;
  onNextLevel?: () => void;
  onHome?: () => void;
}) {
  const [isLeaving, setIsLeaving] = useState(false);

  function leave(action?: () => void) {
    setIsLeaving(true);
    window.setTimeout(() => action?.(), 220);
  }

  return (
    <div
      role="dialog"
      aria-label="Level complete"
      className={`absolute inset-0 z-50 grid place-items-center overflow-hidden bg-[#061434]/96 px-6 text-center backdrop-blur-xl transition-opacity duration-200 ${
        isLeaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div data-testid="zip-completion-confetti" aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 22 }, (_, index) => (
          <span
            key={index}
            className="absolute top-1/2 size-2 rounded-full bg-sky-200 opacity-0 motion-safe:animate-[zip-confetti_1.35s_ease-out_forwards]"
            style={{
              left: `${12 + ((index * 37) % 76)}%`,
              animationDelay: `${(index % 7) * 45}ms`,
              "--zip-confetti-x": `${((index % 2 ? 1 : -1) * (48 + (index % 6) * 22)).toString()}px`,
              "--zip-confetti-y": `${(-120 - (index % 8) * 24).toString()}px`,
              backgroundColor: ["#facc15", "#38bdf8", "#f472b6", "#a7f3d0", "#ffffff"][index % 5],
            } as CSSProperties}
          />
        ))}
      </div>
      <div
        className={`w-full max-w-[360px] rounded-[32px] border border-white/14 bg-white/10 p-7 shadow-[0_30px_90px_rgba(2,6,23,0.45)] backdrop-blur-2xl transition-all duration-300 motion-safe:animate-[zip-complete-card_420ms_ease-out_both] ${
          isLeaving ? "translate-y-3 scale-[0.98]" : ""
        }`}
      >
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-blue-200/70">Level complete</p>
        <h3 className="mt-2 text-4xl font-black tracking-normal text-white">{formatElapsed(elapsedMs)}</h3>
        <p className="mt-2 text-sm font-semibold text-blue-100/70">Clean run saved.</p>
        <div className="mt-7 flex flex-col gap-3">
          {isDaily || !hasNextLevel ? (
            <button
              type="button"
              onClick={() => leave(onHome)}
              className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.32)] transition hover:scale-[1.01]"
              aria-label="Back to Zip home"
            >
              Back to Zip home
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => leave(onNextLevel)}
                className="rounded-2xl bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-[0_18px_40px_rgba(15,23,42,0.32)] transition hover:scale-[1.01]"
              >
                Next level
              </button>
              <button type="button" onClick={() => leave(onHome)} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-white ring-1 ring-white/15">
                Back home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatElapsed(elapsedMs: number) {
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

function wallLine(left: Cell, right: Cell) {
  const [leftX, leftY] = cellCenter(left);
  const [rightX, rightY] = cellCenter(right);
  const midX = (leftX + rightX) / 2;
  const midY = (leftY + rightY) / 2;
  const length = cellSize * 0.72;

  if (left[0] === right[0]) {
    return { x1: midX, y1: midY - length / 2, x2: midX, y2: midY + length / 2 };
  }

  return { x1: midX - length / 2, y1: midY, x2: midX + length / 2, y2: midY };
}

function StatusLine({
  complete,
  errors,
  pathLength,
  totalCells,
  blockerCount,
  nextCheckpoint,
}: {
  complete: boolean;
  errors: string[];
  pathLength: number;
  totalCells: number;
  blockerCount: number;
  nextCheckpoint: number | null;
}) {
  const visibleError = pathLength >= totalCells ? errors[0] : undefined;
  const checkpointText = nextCheckpoint ? ` Next: ${nextCheckpoint}.` : "";
  const blockerText = blockerCount ? ` Avoid ${blockerCount} blocked cells.` : "";

  return (
    <p className={`m-0 rounded-2xl bg-white/8 px-4 py-3 text-center text-[13px] ${complete ? "text-emerald-200" : "text-blue-100/75"}`}>
      {complete ? "Complete" : visibleError ?? `Drag from 1 through every open square.${checkpointText}${blockerText} ${pathLength}/${totalCells} cells traced.`}
    </p>
  );
}

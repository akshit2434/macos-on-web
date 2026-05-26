"use client";

import { useEffect, useRef, useState } from "react";

import { useAnalytics } from "@/lib/analytics/use-analytics";
import { isTestSessionActive, testSessionHeaders } from "@/features/session/session-mode";
import type { PuzzleMetadata, TimerFriendlyState, ValidationResult } from "@/features/puzzles";
import {
  appendPuzzleAttemptHistory,
  loadPuzzleAttemptHistory,
  type LocalPuzzleAttempt,
} from "./puzzle-attempt-history";

export function usePuzzleAttempt<TState extends TimerFriendlyState>({
  appId,
  metadata,
  createInitialState,
  validate,
  resetState,
  onCompleted,
}: {
  appId: string;
  metadata: PuzzleMetadata;
  createInitialState: () => TState;
  validate: (state: TState) => ValidationResult;
  resetState?: (currentState: TState) => TState;
  onCompleted?: (attempt: LocalPuzzleAttempt) => void;
}) {
  const [state, setState] = useState<TState>(createInitialState);
  const [history, setHistory] = useState<LocalPuzzleAttempt[]>(() => loadPuzzleAttemptHistory(metadata.id));
  const completedAttempt = useRef<string | null>(null);
  const moves = useRef(0);
  const resets = useRef(0);
  const { sessionId, track } = useAnalytics();

  useEffect(() => {
    if (state.status !== "playing") return;

    const interval = window.setInterval(() => {
      setState((current) =>
        current.status === "playing"
          ? ({ ...current, elapsedMs: Date.now() - current.startedAtMs } as TState)
          : current,
      );
    }, 1000);

    return () => window.clearInterval(interval);
  }, [state.status]);

  useEffect(() => {
    if (state.status !== "complete" || completedAttempt.current === metadata.id) return;

    completedAttempt.current = metadata.id;
    const completedAt = new Date().toISOString();
    const attempt = {
      sessionId,
      puzzleType: metadata.kind,
      levelId: metadata.id,
      startedAt: new Date(state.startedAtMs).toISOString(),
      completedAt,
      duration: state.elapsedMs,
      moves: moves.current,
      hintsUsed: state.hintsUsed,
      resets: resets.current,
      result: "completed" as const,
      metadata: {
        difficulty: metadata.difficulty,
        daily: metadata.daily,
        date: metadata.date,
        tags: metadata.tags,
      },
    };
    persistPuzzleAttempt(attempt);
    const localAttempt = {
      id: `${metadata.id}-${completedAt}`,
      puzzleType: metadata.kind,
      levelId: metadata.id,
      completedAt,
      duration: state.elapsedMs,
      moves: moves.current,
      hintsUsed: state.hintsUsed,
      resets: resets.current,
      result: "completed",
    } satisfies LocalPuzzleAttempt;
    setHistory(appendPuzzleAttemptHistory(localAttempt));
    onCompleted?.(localAttempt);
    track({
      eventType: "PUZZLE_COMPLETED",
      appId,
      metadata: {
        levelId: metadata.id,
        elapsedMs: state.elapsedMs,
        hintsUsed: state.hintsUsed,
        moves: moves.current,
        resets: resets.current,
      },
    });
  }, [appId, metadata, onCompleted, sessionId, state.elapsedMs, state.hintsUsed, state.startedAtMs, state.status, track]);

  function commitState(nextState: TState) {
    moves.current += 1;
    setState((current) => {
      if (current.status === "complete" || current.status === "failed") {
        return current;
      }

      const now = Date.now();
      const startedAtMs = current.status === "idle" ? now : current.startedAtMs;
      const elapsedMs = now - startedAtMs;
      const nextStatus = nextState.status;
      const candidate = {
        ...nextState,
        startedAtMs,
        elapsedMs,
        hintsUsed: current.hintsUsed,
        status: nextStatus === "failed" ? "failed" : "playing",
      } as TState;
      const validation = validate(candidate);

      return {
        ...candidate,
        elapsedMs: validation.isComplete || nextStatus === "failed" ? Math.max(1000, elapsedMs) : elapsedMs,
        status: nextStatus === "failed" ? "failed" : validation.isComplete ? "complete" : "playing",
      } as TState;
    });
    track({ eventType: "PUZZLE_MOVE", appId, metadata: { levelId: metadata.id } });
  }

  function reset() {
    completedAttempt.current = null;
    moves.current = 0;
    resets.current += 1;
    setState((current) => resetState?.(current) ?? createInitialState());
    track({ eventType: "PUZZLE_RESET", appId, metadata: { levelId: metadata.id } });
  }

  function hint() {
    setState((current) => {
      if (current.status === "complete") {
        return current;
      }

      const now = Date.now();
      const startedAtMs = current.status === "idle" ? now : current.startedAtMs;

      return {
        ...current,
        startedAtMs,
        elapsedMs: now - startedAtMs,
        hintsUsed: current.hintsUsed + 1,
        status: "playing",
      } as TState;
    });
    track({ eventType: "PUZZLE_HINT_USED", appId, metadata: { levelId: metadata.id } });
  }

  return { state, history, commitState, reset, hint };
}

type PersistedPuzzleAttempt = {
  sessionId: string;
  puzzleType: string;
  levelId: string;
  startedAt: string;
  completedAt: string;
  duration: number;
  moves: number;
  hintsUsed: number;
  resets: number;
  result: "completed";
  metadata: Record<string, unknown>;
};

function persistPuzzleAttempt(attempt: PersistedPuzzleAttempt) {
  if (isTestSessionActive()) {
    return;
  }

  void fetch("/api/puzzles/attempts", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...testSessionHeaders() },
    body: JSON.stringify(attempt),
    keepalive: true,
  }).catch(() => {
    // Gameplay remains local-first; the analytics queue also records completion.
  });
}

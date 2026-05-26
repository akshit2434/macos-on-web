"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { zipLevels } from "@/content/puzzles";
import { createZipState, validateZipState, ZipPuzzle } from "@/features/puzzles";
import type { ZipState } from "@/features/puzzles/types";
import { loadPuzzleAttemptsForType } from "./puzzle-attempt-history";
import {
  clearPuzzleSessionState,
  loadPuzzleSessionStates,
  restartTimerFriendlyState,
  resumeTimerFriendlyState,
  savePuzzleSessionState,
} from "./puzzle-session-state";
import { ZipHub } from "./ZipHub";
import { buildZipHubProgress } from "./zip-progress";
import { usePuzzleAttempt } from "./use-puzzle-attempt";

export function ZipGame() {
  const [mode, setMode] = useState<"hub" | "play">("hub");
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Record<string, ZipState>>(() => loadPuzzleSessionStates("zip"));
  const [progressVersion, setProgressVersion] = useState(0);
  const attempts = useMemo(() => {
    void progressVersion;
    return loadPuzzleAttemptsForType("zip");
  }, [progressVersion]);
  const progress = useMemo(() => buildZipHubProgress({ levels: zipLevels, attempts }), [attempts]);
  const activeLevel = zipLevels.find((level) => level.metadata.id === activeLevelId) ?? progress.dailyLevel ?? progress.levels[0];
  const activeLevelIndex = activeLevel ? progress.levels.findIndex((level) => level.metadata.id === activeLevel.metadata.id) : -1;
  const nextLevel = activeLevelIndex >= 0 ? progress.levels[activeLevelIndex + 1] : undefined;

  const refreshProgress = useCallback(() => setProgressVersion((version) => version + 1), []);
  const saveLevelState = useCallback((levelId: string, nextState: ZipState) => {
    setSavedStates((current) => ({ ...current, [levelId]: nextState }));
    savePuzzleSessionState("zip", levelId, nextState);
  }, []);
  const clearLevelState = useCallback((levelId: string) => {
    setSavedStates((current) => {
      const next = { ...current };
      delete next[levelId];
      return next;
    });
    clearPuzzleSessionState("zip", levelId);
  }, []);

  function playDaily() {
    if (!progress.dailyLevel) return;
    setActiveLevelId(progress.dailyLevel.metadata.id);
    setMode("play");
  }

  function playLevel(levelIndex: number) {
    const state = progress.levelStates[levelIndex];
    if (!state || state.locked) return;
    setActiveLevelId(state.level.metadata.id);
    setMode("play");
  }

  return (
    <div className="h-full overflow-auto bg-[#061434]">
      <div className={mode === "hub" ? "h-full" : "hidden"}>
        <ZipHub progress={progress} onPlayDaily={playDaily} onPlayLevel={playLevel} />
      </div>
      {activeLevel ? (
        <div className={mode === "play" ? "h-full overflow-auto" : "hidden"}>
          <ZipGameAttempt
            key={activeLevel.metadata.id}
            level={activeLevel}
            savedState={savedStates[activeLevel.metadata.id]}
            onSaveState={saveLevelState}
            onClearSavedState={clearLevelState}
            onBack={() => {
              refreshProgress();
              setMode("hub");
            }}
            onCompleted={refreshProgress}
            hasNextLevel={Boolean(nextLevel)}
            onNextLevel={() => {
              if (!nextLevel) return;
              refreshProgress();
              setActiveLevelId(nextLevel.metadata.id);
              setMode("play");
            }}
          />
        </div>
      ) : null}
    </div>
  );
}

function ZipGameAttempt({
  level,
  savedState,
  onSaveState,
  onClearSavedState,
  onBack,
  onCompleted,
  hasNextLevel,
  onNextLevel,
}: {
  level: (typeof zipLevels)[number];
  savedState?: ZipState;
  onSaveState: (levelId: string, state: ZipState) => void;
  onClearSavedState: (levelId: string) => void;
  onBack: () => void;
  onCompleted: () => void;
  hasNextLevel: boolean;
  onNextLevel: () => void;
}) {
  const attempt = usePuzzleAttempt({
    appId: "zip",
    metadata: level.metadata,
    createInitialState: () => resumeTimerFriendlyState(savedState ?? createZipState()),
    resetState: (currentState) => restartTimerFriendlyState(createZipState, currentState),
    validate: (state) => validateZipState(level, state),
    onCompleted: () => {
      onClearSavedState(level.metadata.id);
      onCompleted();
    },
  });

  useEffect(() => {
    if (attempt.state.status === "complete") return;
    onSaveState(level.metadata.id, attempt.state);
  }, [attempt.state, level.metadata.id, onSaveState]);

  return (
    <ZipPuzzle
      level={level}
      state={attempt.state}
      onStateChange={attempt.commitState}
      onReset={attempt.reset}
      onBack={onBack}
      onHome={onBack}
      hasNextLevel={hasNextLevel}
      onNextLevel={onNextLevel}
    />
  );
}

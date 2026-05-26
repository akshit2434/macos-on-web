"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { arrowEscapeLevels } from "@/content/puzzles";
import { ArrowEscapePuzzle, createArrowEscapeState, validateArrowEscapeState } from "@/features/puzzles";
import type { ArrowEscapeState } from "@/features/puzzles/types";
import { ArrowHub } from "./ArrowHub";
import { buildArrowHubProgress } from "./arrow-progress";
import { restartArrowEscapeState, resumeArrowEscapeState } from "./arrow-session-state";
import { loadPuzzleAttemptsForType } from "./puzzle-attempt-history";
import { clearPuzzleSessionState, loadPuzzleSessionStates, savePuzzleSessionState } from "./puzzle-session-state";
import { usePuzzleAttempt } from "./use-puzzle-attempt";

export function ArrowGame() {
  const [mode, setMode] = useState<"hub" | "play">("hub");
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Record<string, ArrowEscapeState>>(() => loadPuzzleSessionStates("arrow"));
  const [progressVersion, setProgressVersion] = useState(0);
  const attempts = useMemo(() => {
    void progressVersion;
    return loadPuzzleAttemptsForType(["arrow", "arrow-escape"]);
  }, [progressVersion]);
  const progress = useMemo(() => buildArrowHubProgress({ levels: arrowEscapeLevels, attempts }), [attempts]);
  const activeLevel = arrowEscapeLevels.find((level) => level.metadata.id === activeLevelId) ?? progress.dailyLevel ?? progress.levels[0];
  const activeLevelIndex = activeLevel ? progress.levels.findIndex((level) => level.metadata.id === activeLevel.metadata.id) : -1;
  const nextLevel = activeLevelIndex >= 0 ? progress.levels[activeLevelIndex + 1] : undefined;

  const refreshProgress = useCallback(() => setProgressVersion((version) => version + 1), []);
  const saveLevelState = useCallback((levelId: string, nextState: ArrowEscapeState) => {
    setSavedStates((current) => ({ ...current, [levelId]: nextState }));
    savePuzzleSessionState("arrow", levelId, nextState);
  }, []);
  const clearLevelState = useCallback((levelId: string) => {
    setSavedStates((current) => {
      const next = { ...current };
      delete next[levelId];
      return next;
    });
    clearPuzzleSessionState("arrow", levelId);
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
    <div className="h-full overflow-auto bg-[#f1dfbd]">
      <div className={mode === "hub" ? "h-full" : "hidden"}>
        <ArrowHub progress={progress} onPlayDaily={playDaily} onPlayLevel={playLevel} />
      </div>
      {activeLevel ? (
        <div className={mode === "play" ? "h-full overflow-auto" : "hidden"}>
          <ArrowGameAttempt
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

function ArrowGameAttempt({
  level,
  savedState,
  onSaveState,
  onClearSavedState,
  onBack,
  onCompleted,
  hasNextLevel,
  onNextLevel,
}: {
  level: (typeof arrowEscapeLevels)[number];
  savedState?: ArrowEscapeState;
  onSaveState: (levelId: string, state: ArrowEscapeState) => void;
  onClearSavedState: (levelId: string) => void;
  onBack: () => void;
  onCompleted: () => void;
  hasNextLevel: boolean;
  onNextLevel: () => void;
}) {
  const attempt = usePuzzleAttempt({
    appId: "arrow",
    metadata: level.metadata,
    createInitialState: () => resumeArrowEscapeState(savedState ?? createArrowEscapeState(level)),
    resetState: (currentState) => restartArrowEscapeState(level, currentState),
    validate: (state) => validateArrowEscapeState(level, state),
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
    <ArrowEscapePuzzle
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

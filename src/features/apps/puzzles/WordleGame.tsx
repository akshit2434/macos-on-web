"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { wordleLevels } from "@/content/puzzles";
import { createWordleState, validateWordleState, WordlePuzzle } from "@/features/puzzles";
import type { WordleState } from "@/features/puzzles/types";
import { loadPuzzleAttemptsForType } from "./puzzle-attempt-history";
import {
  clearPuzzleSessionState,
  loadPuzzleSessionStates,
  restartTimerFriendlyState,
  resumeTimerFriendlyState,
  savePuzzleSessionState,
} from "./puzzle-session-state";
import { usePuzzleAttempt } from "./use-puzzle-attempt";
import { WordleHub } from "./WordleHub";
import { buildWordleHubProgress } from "./wordle-progress";

export function WordleGame() {
  const [mode, setMode] = useState<"hub" | "play">("hub");
  const [activeLevelId, setActiveLevelId] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Record<string, WordleState>>(() => loadPuzzleSessionStates("wordle"));
  const [progressVersion, setProgressVersion] = useState(0);
  const attempts = useMemo(() => {
    void progressVersion;
    return loadPuzzleAttemptsForType("wordle");
  }, [progressVersion]);
  const progress = useMemo(() => buildWordleHubProgress({ levels: wordleLevels, attempts }), [attempts]);
  const activeLevel = wordleLevels.find((level) => level.metadata.id === activeLevelId) ?? progress.dailyLevel ?? progress.levels[0];
  const activeLevelIndex = activeLevel ? progress.levels.findIndex((level) => level.metadata.id === activeLevel.metadata.id) : -1;
  const nextLevel = activeLevelIndex >= 0 ? progress.levels[activeLevelIndex + 1] : undefined;
  const refreshProgress = useCallback(() => setProgressVersion((version) => version + 1), []);
  const saveLevelState = useCallback((levelId: string, nextState: WordleState) => {
    setSavedStates((current) => ({ ...current, [levelId]: nextState }));
    savePuzzleSessionState("wordle", levelId, nextState);
  }, []);
  const clearLevelState = useCallback((levelId: string) => {
    setSavedStates((current) => {
      const next = { ...current };
      delete next[levelId];
      return next;
    });
    clearPuzzleSessionState("wordle", levelId);
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
    <div className="h-full overflow-auto bg-[#102418]">
      <div className={mode === "hub" ? "h-full" : "hidden"}>
        <WordleHub progress={progress} onPlayDaily={playDaily} onPlayLevel={playLevel} />
      </div>
      {activeLevel ? (
        <div className={mode === "play" ? "h-full overflow-auto" : "hidden"}>
          <WordleGameAttempt
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

function WordleGameAttempt({
  level,
  savedState,
  onSaveState,
  onClearSavedState,
  onBack,
  onCompleted,
  hasNextLevel,
  onNextLevel,
}: {
  level: (typeof wordleLevels)[number];
  savedState?: WordleState;
  onSaveState: (levelId: string, state: WordleState) => void;
  onClearSavedState: (levelId: string) => void;
  onBack: () => void;
  onCompleted: () => void;
  hasNextLevel: boolean;
  onNextLevel: () => void;
}) {
  const attempt = usePuzzleAttempt({
    appId: "wordle",
    metadata: level.metadata,
    createInitialState: () => resumeTimerFriendlyState(savedState ?? createWordleState()),
    resetState: (currentState) => restartTimerFriendlyState(createWordleState, currentState),
    validate: (state) => validateWordleState(level, state),
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
    <WordlePuzzle
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

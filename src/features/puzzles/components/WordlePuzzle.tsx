"use client";

import { type CSSProperties, useEffect, useRef, useState } from "react";
import { ArrowLeft, Delete, RotateCcw } from "lucide-react";

import { validateWordleState } from "../validators";
import type { PuzzleShellProps, WordleLevel, WordleState } from "../types";
import { scoreWordleGuess, type WordleLetterScore } from "../wordle-scoring";

const keyboardRows = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

export function WordlePuzzle({
  level,
  state,
  onStateChange,
  onReset,
  onBack,
  onNextLevel,
  onHome,
  hasNextLevel = false,
}: PuzzleShellProps<WordleLevel, WordleState> & {
  onBack?: () => void;
  onNextLevel?: () => void;
  onHome?: () => void;
  hasNextLevel?: boolean;
}) {
  const validation = validateWordleState(level, state);
  const isComplete = state.status === "complete" || validation.isComplete;
  const sectionRef = useRef<HTMLElement | null>(null);
  const [notice, setNotice] = useState("");
  const [isLeaving, setIsLeaving] = useState(false);
  const [invalidGuessId, setInvalidGuessId] = useState(0);
  const guesses = state.guesses.slice(0, level.maxGuesses);
  const draft = isComplete ? "" : state.currentGuess ?? "";
  const rows = Array.from({ length: level.maxGuesses }, (_, index) => guesses[index] ?? (index === guesses.length ? draft : ""));
  const keyboardScores = buildKeyboardScores(level.answer, guesses);

  function updateDraft(nextDraft: string) {
    if (isComplete || guesses.length >= level.maxGuesses) return;
    setNotice("");
    onStateChange?.({
      ...state,
      status: "playing",
      currentGuess: nextDraft.replace(/[^a-z]/gi, "").toLowerCase().slice(0, level.answer.length),
    });
  }

  function submitGuess() {
    if (isComplete || guesses.length >= level.maxGuesses) return;
    const normalized = draft.toLowerCase();

    if (normalized.length !== level.answer.length) {
      rejectGuess("Not enough letters.");
      return;
    }
    if (!level.allowedWords.includes(normalized)) {
      rejectGuess("Not in word list.");
      return;
    }

    setNotice("");
    onStateChange?.({
      ...state,
      status: "playing",
      currentGuess: "",
      guesses: [...guesses, normalized],
    });
  }

  function appendLetter(letter: string) {
    updateDraft(`${draft}${letter}`);
  }

  function deleteLetter() {
    updateDraft(draft.slice(0, -1));
  }

  function rejectGuess(message: string) {
    setNotice(message);
    setInvalidGuessId((value) => value + 1);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey || isComplete) return;
      if (!sectionRef.current || isHidden(sectionRef.current)) return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const key = event.key.toLowerCase();

      if (/^[a-z]$/.test(key)) {
        event.preventDefault();
        event.stopPropagation();
        appendLetter(key);
      } else if (key === "backspace" || key === "delete") {
        event.preventDefault();
        event.stopPropagation();
        deleteLetter();
      } else if (key === "enter") {
        event.preventDefault();
        event.stopPropagation();
        submitGuess();
      }
    }

    document.addEventListener("keydown", handleKeyDown, { capture: true });
    return () => document.removeEventListener("keydown", handleKeyDown, { capture: true });
  });

  function leave(action?: () => void) {
    setIsLeaving(true);
    window.setTimeout(() => action?.(), 200);
  }

  return (
    <section ref={sectionRef} className="relative flex min-h-full flex-col overflow-auto bg-[#102418] px-5 py-4 text-[#f6f3df]" aria-label="Wordle game">
      <header className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid size-10 place-items-center rounded-full bg-white/10 text-[#f6f3df] ring-1 ring-white/12 hover:bg-white/16"
          aria-label="Back to Wordle levels"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-100/52">
            {level.metadata.daily ? "Daily Challenge" : "Level"}
          </p>
          <h2 className="truncate text-lg font-black tracking-normal">
            {level.metadata.daily ? "Today" : `Level ${level.metadata.id.replace("wordle-level-", "").replace(/^0+/, "")}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/10 px-3 py-2 text-xs font-black text-[#f6f3df] ring-1 ring-white/12">
            {Math.floor(state.elapsedMs / 1000)}s
          </span>
          <button
            type="button"
            onClick={onReset}
            className="grid size-10 place-items-center rounded-full bg-white/10 text-[#f6f3df] ring-1 ring-white/12 hover:bg-white/16"
            aria-label="Reset level"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 place-items-center overflow-auto pb-5">
        <div className="w-full max-w-[460px]">
          <div className="mx-auto grid w-fit gap-2">
            {rows.map((guess, rowIndex) => (
              <div
                key={`${rowIndex}-${rowIndex === guesses.length ? invalidGuessId : 0}`}
                className={`grid grid-cols-5 gap-2 ${
                  rowIndex === guesses.length && invalidGuessId > 0 ? "motion-safe:animate-[wordle-invalid_360ms_ease-in-out]" : ""
                }`}
              >
                {Array.from({ length: level.answer.length }, (_, colIndex) => {
                  const letter = guess[colIndex] ?? "";
                  const submitted = rowIndex < guesses.length;
                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`grid size-[54px] place-items-center rounded-[10px] border text-2xl font-black uppercase shadow-[0_8px_18px_rgba(2,8,4,0.22)] transition motion-safe:animate-[wordle-tile-pop_180ms_ease-out_both] ${
                        submitted ? tileState(scoreWordleGuess(level.answer, guess)[colIndex]) : "border-white/14 bg-white/8 text-[#f6f3df]"
                      }`}
                    >
                      {letter}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-2">
            {keyboardRows.map((row, rowIndex) => (
              <div key={row} className={`flex justify-center gap-1.5 ${rowIndex === 2 ? "px-6" : ""}`}>
                {rowIndex === 2 ? (
                  <button
                    type="button"
                    onClick={submitGuess}
                    disabled={isComplete}
                    className="h-10 min-w-14 rounded-lg bg-[#f6f3df] px-2 text-[11px] font-black uppercase text-[#102418] shadow-[0_8px_18px_rgba(246,243,223,0.12)] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Enter
                  </button>
                ) : null}
                {row.split("").map((letter) => (
                  <button
                    key={letter}
                    type="button"
                    aria-label={`Letter ${letter}`}
                    onClick={() => appendLetter(letter.toLowerCase())}
                    disabled={isComplete}
                    className={`grid h-10 min-w-8 place-items-center rounded-lg px-2 text-xs font-black shadow-[0_8px_18px_rgba(2,8,4,0.18)] ring-1 transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-40 ${keyboardKeyClass(
                      keyboardScores[letter.toLowerCase()],
                    )}`}
                  >
                    {letter}
                  </button>
                ))}
                {rowIndex === 2 ? (
                  <button
                    type="button"
                    aria-label="Delete letter"
                    onClick={deleteLetter}
                    disabled={isComplete}
                    className="grid h-10 min-w-12 place-items-center rounded-lg bg-white/12 px-2 text-xs font-black text-[#f6f3df] shadow-[0_8px_18px_rgba(2,8,4,0.18)] ring-1 ring-white/8 hover:bg-white/18 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Delete className="size-4" />
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <p className={`mt-4 min-h-5 text-center text-sm font-bold ${notice ? "text-amber-200" : "text-emerald-100/55"}`}>
            {notice || `${guesses.length}/${level.maxGuesses} guesses`}
          </p>
        </div>
      </div>

      {isComplete ? (
        <div
          role="dialog"
          aria-label="Level complete"
          className={`absolute inset-0 z-50 grid place-items-center overflow-hidden bg-[#102418]/94 px-6 text-center backdrop-blur-xl transition-opacity duration-200 ${
            isLeaving ? "opacity-0" : "opacity-100"
          }`}
        >
          <div data-testid="wordle-completion-confetti" aria-hidden className="pointer-events-none absolute inset-0">
            {Array.from({ length: 20 }, (_, index) => (
              <span
                key={index}
                className="absolute top-1/2 size-2 rounded-sm opacity-0 motion-safe:animate-[zip-confetti_1.15s_ease-out_forwards]"
                style={{
                  left: `${10 + ((index * 37) % 80)}%`,
                  animationDelay: `${(index % 6) * 44}ms`,
                  "--zip-confetti-x": `${((index % 2 ? 1 : -1) * (38 + (index % 5) * 22)).toString()}px`,
                  "--zip-confetti-y": `${(-96 - (index % 7) * 22).toString()}px`,
                  backgroundColor: ["#34d399", "#f6f3df", "#fbbf24", "#86efac"][index % 4],
                } as CSSProperties}
              />
            ))}
          </div>
          <div className={`w-full max-w-[340px] rounded-[30px] border border-white/12 bg-white/12 p-7 text-[#f6f3df] shadow-[0_28px_70px_rgba(0,0,0,0.35)] backdrop-blur-2xl transition-all duration-300 motion-safe:animate-[zip-complete-card_360ms_ease-out_both] ${isLeaving ? "translate-y-3 scale-[0.98]" : ""}`}>
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100/62">Solved</p>
            <h3 className="mt-2 text-4xl font-black tracking-normal">{guesses.length}/6</h3>
            <p className="mt-2 text-sm font-bold uppercase tracking-[0.2em] text-emerald-100/58">{level.answer}</p>
            <div className="mt-7 flex flex-col gap-3">
              {level.metadata.daily || !hasNextLevel ? (
                <button type="button" onClick={() => leave(onHome ?? onBack)} className="rounded-2xl bg-[#f6f3df] px-5 py-3 text-sm font-black text-[#102418]" aria-label="Back to Wordle home">
                  Back to Wordle home
                </button>
              ) : (
                <>
                  <button type="button" onClick={() => leave(onNextLevel)} className="rounded-2xl bg-[#f6f3df] px-5 py-3 text-sm font-black text-[#102418]">
                    Next level
                  </button>
                  <button type="button" onClick={() => leave(onHome ?? onBack)} className="rounded-2xl bg-white/10 px-5 py-3 text-sm font-black text-[#f6f3df] ring-1 ring-white/12">
                    Back home
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function tileState(score: WordleLetterScore) {
  if (score === "correct") {
    return "border-emerald-400 bg-emerald-500 text-emerald-950";
  }
  if (score === "present") {
    return "border-amber-300 bg-amber-400 text-amber-950";
  }
  return "border-slate-500 bg-slate-600 text-white";
}

function buildKeyboardScores(answer: string, guesses: string[]) {
  const scorePriority: Record<WordleLetterScore, number> = {
    absent: 1,
    present: 2,
    correct: 3,
  };
  const scores: Record<string, WordleLetterScore> = {};

  for (const guess of guesses) {
    scoreWordleGuess(answer, guess).forEach((score, index) => {
      const letter = guess[index]?.toLowerCase();
      if (!letter) return;
      const currentScore = scores[letter];
      if (!currentScore || scorePriority[score] > scorePriority[currentScore]) {
        scores[letter] = score;
      }
    });
  }

  return scores;
}

function keyboardKeyClass(score?: WordleLetterScore) {
  if (score === "correct") {
    return "bg-emerald-500 text-emerald-950 ring-emerald-300/70";
  }
  if (score === "present") {
    return "bg-amber-400 text-amber-950 ring-amber-200/70";
  }
  if (score === "absent") {
    return "bg-slate-600 text-white ring-slate-400/40";
  }
  return "bg-white/12 text-[#f6f3df] ring-white/8 hover:bg-white/18";
}

function isHidden(element: HTMLElement) {
  if (element.closest(".hidden")) {
    return true;
  }
  if (typeof window === "undefined") {
    return false;
  }
  return window.getComputedStyle(element).display === "none" || window.getComputedStyle(element).visibility === "hidden";
}

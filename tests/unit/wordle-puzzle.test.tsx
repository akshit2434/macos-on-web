import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { wordleLevels } from "@/content/puzzles";
import { WordlePuzzle } from "@/features/puzzles";
import type { WordleState } from "@/features/puzzles/types";

describe("WordlePuzzle", () => {
  it("rejects fake keyboard-submitted words and accepts real keyboard input", async () => {
    const user = userEvent.setup();
    const level = wordleLevels[0];
    let state: WordleState = {
      startedAtMs: 0,
      elapsedMs: 0,
      hintsUsed: 0,
      status: "idle",
      guesses: [],
      currentGuess: "",
    };

    const onStateChange = vi.fn((nextState: WordleState) => {
      state = nextState;
      view.rerender(
        <WordlePuzzle
          level={level}
          state={state}
          onStateChange={onStateChange}
          onReset={vi.fn()}
          onBack={vi.fn()}
        />,
      );
    });

    const view = render(
      <WordlePuzzle
        level={level}
        state={state}
        onStateChange={onStateChange}
        onReset={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.keyboard("zzzzz{Enter}");

    expect(screen.getByText("Not in word list.")).toBeInTheDocument();
    expect(state.guesses).toEqual([]);
    expect(state.currentGuess).toBe("zzzzz");

    await user.keyboard("{Backspace}{Backspace}{Backspace}{Backspace}{Backspace}cocoa{Enter}");

    expect(state.guesses).toEqual(["cocoa"]);
    expect(state.currentGuess).toBe("");
    expect(screen.getByRole("dialog", { name: "Level complete" })).toBeInTheDocument();
  });

  it("accepts A/S/D from the physical keyboard and A from the on-screen keyboard", async () => {
    const user = userEvent.setup();
    const level = wordleLevels[0];
    let state: WordleState = {
      startedAtMs: 0,
      elapsedMs: 0,
      hintsUsed: 0,
      status: "idle",
      guesses: [],
      currentGuess: "",
    };

    const onStateChange = vi.fn((nextState: WordleState) => {
      state = nextState;
      view.rerender(
        <WordlePuzzle
          level={level}
          state={state}
          onStateChange={onStateChange}
          onReset={vi.fn()}
          onBack={vi.fn()}
        />,
      );
    });

    const view = render(
      <WordlePuzzle
        level={level}
        state={state}
        onStateChange={onStateChange}
        onReset={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    await user.keyboard("ASD");
    expect(state.currentGuess).toBe("asd");

    await user.click(screen.getByRole("button", { name: "Letter A" }));
    expect(state.currentGuess).toBe("asda");
  });

  it("colors the virtual keyboard from submitted guesses", () => {
    const level = wordleLevels[0];
    render(
      <WordlePuzzle
        level={level}
        state={{
          startedAtMs: 0,
          elapsedMs: 0,
          hintsUsed: 0,
          status: "playing",
          guesses: ["actor"],
          currentGuess: "",
        }}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onBack={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Letter A" })).toHaveClass("bg-amber-400");
    expect(screen.getByRole("button", { name: "Letter T" })).toHaveClass("bg-slate-600");
  });
});

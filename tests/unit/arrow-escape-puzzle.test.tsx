import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ArrowEscapePuzzle } from "@/features/puzzles";
import type { ArrowEscapeLevel, ArrowEscapeState } from "@/features/puzzles/types";

const testLevel = {
  metadata: {
    id: "arrow-concurrent-test",
    kind: "arrow-escape",
    title: "Concurrent Test",
    difficulty: "easy",
    daily: false,
    estimatedMinutes: 1,
    tags: ["logic"],
  },
  rows: 4,
  cols: 5,
  blockers: [],
  pieces: [
    {
      id: "p01",
      start: [1, 1],
      direction: "right",
      cells: [
        [1, 1],
        [1, 0],
        [2, 0],
        [2, 1],
      ],
    },
    {
      id: "p02",
      start: [2, 3],
      direction: "up",
      cells: [
        [2, 3],
        [3, 3],
        [3, 2],
      ],
    },
  ],
} satisfies ArrowEscapeLevel;

const blockedLevel = {
  ...testLevel,
  pieces: [
    testLevel.pieces[0],
    {
      ...testLevel.pieces[1],
      start: [1, 3],
      cells: [
        [1, 3],
        [2, 3],
      ],
    },
  ],
} satisfies ArrowEscapeLevel;

function initialState(level: ArrowEscapeLevel = testLevel): ArrowEscapeState {
  return {
    startedAtMs: 0,
    elapsedMs: 0,
    hintsUsed: 0,
    status: "playing",
    livesRemaining: 3,
    piecePositions: Object.fromEntries(level.pieces.map((piece) => [piece.id, piece.start])),
    escapedPieceIds: [],
  };
}

describe("ArrowEscapePuzzle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows multiple escapable arrows to animate and commit in a quick burst", () => {
    vi.useFakeTimers();
    let state = initialState();
    const onStateChange = vi.fn((nextState: ArrowEscapeState) => {
      state = nextState;
      view.rerender(<ArrowEscapePuzzle level={testLevel} state={state} onStateChange={onStateChange} onReset={vi.fn()} />);
    });
    const view = render(<ArrowEscapePuzzle level={testLevel} state={state} onStateChange={onStateChange} onReset={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Escape arrow 1" })[0]);
    fireEvent.click(screen.getAllByRole("button", { name: "Escape arrow 2" })[0]);

    expect(document.querySelectorAll('[data-arrow-escaping="true"]')).toHaveLength(2);

    act(() => {
      vi.advanceTimersByTime(1_200);
    });

    expect(new Set(state.escapedPieceIds)).toEqual(new Set(["p01", "p02"]));
    expect(Object.keys(state.piecePositions)).toEqual([]);
  });

  it("cancels pending escape commits when reset is clicked", () => {
    vi.useFakeTimers();
    const onStateChange = vi.fn();
    const onReset = vi.fn();
    render(<ArrowEscapePuzzle level={testLevel} state={initialState()} onStateChange={onStateChange} onReset={onReset} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Escape arrow 1" })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Reset level" }));

    act(() => {
      vi.advanceTimersByTime(1_200);
    });

    expect(onReset).toHaveBeenCalledTimes(1);
    expect(onStateChange).not.toHaveBeenCalled();
    expect(document.querySelectorAll('[data-arrow-escaping="true"]')).toHaveLength(0);
  });

  it("spends one heart and flashes a blocked arrow red on a wrong tap", () => {
    vi.useFakeTimers();
    let state = initialState(blockedLevel);
    const onStateChange = vi.fn((nextState: ArrowEscapeState) => {
      state = nextState;
      view.rerender(<ArrowEscapePuzzle level={blockedLevel} state={state} onStateChange={onStateChange} onReset={vi.fn()} />);
    });
    const view = render(<ArrowEscapePuzzle level={blockedLevel} state={state} onStateChange={onStateChange} onReset={vi.fn()} />);

    fireEvent.click(screen.getAllByRole("button", { name: "Escape arrow 1" })[0]);

    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ livesRemaining: 2, status: "playing" }));
    expect(screen.getByLabelText("2 hearts remaining")).toBeInTheDocument();
    expect(document.querySelector('[data-arrow-piece-path="p01"]')).toHaveAttribute("data-arrow-wrong", "true");
  });

  it("shows a level-lost overlay after the third wrong tap", () => {
    vi.useFakeTimers();
    let state: ArrowEscapeState = { ...initialState(blockedLevel), livesRemaining: 1 };
    const onStateChange = vi.fn((nextState: ArrowEscapeState) => {
      state = nextState;
      view.rerender(
        <ArrowEscapePuzzle
          level={blockedLevel}
          state={state}
          onStateChange={onStateChange}
          onReset={vi.fn()}
        />,
      );
    });
    const view = render(
      <ArrowEscapePuzzle
        level={blockedLevel}
        state={state}
        onStateChange={onStateChange}
        onReset={vi.fn()}
      />,
    );

    fireEvent.click(screen.getAllByRole("button", { name: "Escape arrow 1" })[0]);

    expect(onStateChange).toHaveBeenCalledWith(expect.objectContaining({ livesRemaining: 0, status: "failed" }));
    act(() => vi.advanceTimersByTime(380));
    expect(screen.getByRole("dialog", { name: "Level lost" })).toBeInTheDocument();
  });

  it("zooms, clamps, resets, and pans the board viewport", () => {
    render(<ArrowEscapePuzzle level={testLevel} state={initialState()} onStateChange={vi.fn()} onReset={vi.fn()} />);

    const transformLayer = screen.getByTestId("arrow-board-transform");
    expect(transformLayer).toHaveStyle({ transform: "translate(-50%, -50%) translate3d(0px, 0px, 0) scale(1)" });

    fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    expect(transformLayer).toHaveStyle({ transform: "translate(-50%, -50%) translate3d(0px, 0px, 0) scale(1.15)" });

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Zoom in" }));
    }
    expect(transformLayer).toHaveStyle({ transform: "translate(-50%, -50%) translate3d(0px, 0px, 0) scale(2.2)" });

    fireEvent.pointerDown(screen.getByLabelText("Arrow board viewport"), { clientX: 100, clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(screen.getByLabelText("Arrow board viewport"), { clientX: 132, clientY: 88, pointerId: 1 });
    fireEvent.pointerUp(screen.getByLabelText("Arrow board viewport"), { pointerId: 1 });
    expect(transformLayer).toHaveStyle({ transform: "translate(-50%, -50%) translate3d(32px, -12px, 0) scale(2.2)" });

    fireEvent.click(screen.getByRole("button", { name: "Reset board view" }));
    expect(transformLayer).toHaveStyle({ transform: "translate(-50%, -50%) translate3d(0px, 0px, 0) scale(1)" });

    for (let index = 0; index < 20; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: "Zoom out" }));
    }
    expect(transformLayer).toHaveStyle({ transform: "translate(-50%, -50%) translate3d(0px, 0px, 0) scale(0.12)" });
  });
});

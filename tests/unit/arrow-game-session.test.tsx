import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { arrowEscapeLevels } from "@/content/puzzles";
import { canArrowPieceEscape } from "@/content/puzzles/arrow-escape-generator";
import { ArrowGame } from "@/features/apps/puzzles/ArrowGame";
import { calculateArrowBoardFitZoom, calculatePinchZoom, calculateWheelZoom } from "@/features/puzzles/components/ArrowEscapePuzzle";

describe("ArrowGame session behavior", () => {
  afterEach(() => {
    window.localStorage.clear();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("keeps a partially played level when returning from the hub", () => {
    const level = arrowEscapeLevels.find((candidate) => !candidate.metadata.daily)!;
    const piecePositions = Object.fromEntries(level.pieces.map((piece) => [piece.id, piece.start]));
    const blockedPiece = level.pieces.find((piece) => !canArrowPieceEscape(level, piece, piecePositions, []));
    expect(blockedPiece).toBeDefined();

    render(<ArrowGame />);

    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));
    fireEvent.click(screen.getAllByRole("button", { name: `Escape arrow ${pieceLabel(blockedPiece!.id)}` })[0]);
    expect(screen.getByLabelText("2 hearts remaining")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back to Arrow levels" }));
    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));

    expect(screen.getByLabelText("2 hearts remaining")).toBeInTheDocument();
  });

  it("restarts the board without zeroing the active timer", () => {
    vi.useFakeTimers({ now: new Date("2026-05-22T09:00:00.000Z") });
    render(<ArrowGame />);

    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));
    act(() => {
      vi.advanceTimersByTime(2_100);
    });
    expect(screen.getByText("2s")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Reset level" }));

    expect(screen.getByText("2s")).toBeInTheDocument();
  });

  it("fits very large boards inside the available viewport by default", () => {
    expect(
      calculateArrowBoardFitZoom({
        boardWidth: 1_588,
        boardHeight: 1_588,
        playableCells: 1_900,
        viewportWidth: 390,
        viewportHeight: 520,
      }),
    ).toBeCloseTo(0.24, 2);
  });

  it("varies the default fit by level scale", () => {
    const smallLevelZoom = calculateArrowBoardFitZoom({
      boardWidth: 636,
      boardHeight: 636,
      playableCells: 500,
      viewportWidth: 390,
      viewportHeight: 520,
    });
    const bossLevelZoom = calculateArrowBoardFitZoom({
      boardWidth: 1_588,
      boardHeight: 1_588,
      playableCells: 1_900,
      viewportWidth: 390,
      viewportHeight: 520,
    });

    expect(smallLevelZoom).toBeCloseTo(0.56, 2);
    expect(bossLevelZoom).toBeCloseTo(0.24, 2);
  });

  it("dampens pinch zoom while staying responsive to finger movement", () => {
    expect(calculatePinchZoom({ startZoom: 0.4, startDistance: 200, currentDistance: 240 })).toBeCloseTo(0.45, 2);
    expect(calculatePinchZoom({ startZoom: 0.4, startDistance: 200, currentDistance: 120 })).toBeCloseTo(0.28, 2);
  });

  it("scales wheel zoom by delta so trackpad pinch streams stay smooth", () => {
    expect(calculateWheelZoom({ currentZoom: 1, deltaY: -10 })).toBeCloseTo(1.01, 2);
    expect(calculateWheelZoom({ currentZoom: 1, deltaY: -120 })).toBeCloseTo(1.08, 2);
    expect(calculateWheelZoom({ currentZoom: 1, deltaY: 120 })).toBeCloseTo(0.92, 2);
  });
});

function pieceLabel(pieceId: string) {
  return pieceId.replace(/^p0?/, "");
}

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { zipLevels } from "@/content/puzzles";
import { ZipPuzzle } from "@/features/puzzles";

describe("ZipPuzzle", () => {
  it("shows a full-game completion overlay with next level action", async () => {
    const user = userEvent.setup();
    const level = zipLevels.find((item) => !item.metadata.daily)!;
    const onNextLevel = vi.fn();

    render(
      <ZipPuzzle
        level={level}
        state={{
          startedAtMs: 0,
          elapsedMs: 12_500,
          hintsUsed: 0,
          status: "complete",
          path: level.solutionPath ?? [],
        }}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onBack={vi.fn()}
        hasNextLevel
        onNextLevel={onNextLevel}
      />,
    );

    expect(screen.getByRole("dialog", { name: "Level complete" })).toBeInTheDocument();
    expect(screen.getByTestId("zip-completion-confetti")).toBeInTheDocument();
    expect(screen.getByText("12.5s")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next level" }));

    await waitFor(() => expect(onNextLevel).toHaveBeenCalledTimes(1));
  });

  it("sends completed daily challenges back to the Zip home screen", async () => {
    const user = userEvent.setup();
    const level = zipLevels.find((item) => item.metadata.daily)!;
    const onHome = vi.fn();

    render(
      <ZipPuzzle
        level={level}
        state={{
          startedAtMs: 0,
          elapsedMs: 42_000,
          hintsUsed: 0,
          status: "complete",
          path: level.solutionPath ?? [],
        }}
        onStateChange={vi.fn()}
        onReset={vi.fn()}
        onBack={vi.fn()}
        onHome={onHome}
      />,
    );

    expect(screen.getByRole("button", { name: "Back to Zip home" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back to Zip home" }));

    await waitFor(() => expect(onHome).toHaveBeenCalledTimes(1));
  });
});

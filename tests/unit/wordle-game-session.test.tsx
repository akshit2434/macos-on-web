import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import { WordleGame } from "@/features/apps/puzzles/WordleGame";

describe("WordleGame session behavior", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("restores a partial current guess after leaving and remounting the app", async () => {
    const user = userEvent.setup();
    const firstView = render(<WordleGame />);

    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));
    await user.keyboard("fl");
    fireEvent.click(screen.getByRole("button", { name: "Back to Wordle levels" }));
    firstView.unmount();

    render(<WordleGame />);
    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));
    await user.keyboard("ame{Enter}");

    expect(screen.getByRole("dialog", { name: "Level complete" })).toBeInTheDocument();
  });
});

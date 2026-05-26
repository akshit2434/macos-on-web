import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ZipGame } from "@/features/apps/puzzles/ZipGame";

describe("ZipGame session behavior", () => {
  beforeEach(() => {
    Object.defineProperty(HTMLElement.prototype, "setPointerCapture", {
      configurable: true,
      value: vi.fn(),
    });
  });

  afterEach(() => {
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("restores a partially traced level after leaving and remounting the app", async () => {
    const firstView = render(<ZipGame />);

    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Zip number 1" }));

    await waitFor(() => expect(screen.getByText(/1\/\d+ cells traced\./)).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Back to Zip levels" }));
    firstView.unmount();

    render(<ZipGame />);
    fireEvent.click(screen.getByRole("button", { name: "Play level 1" }));

    expect(screen.getByText(/1\/\d+ cells traced\./)).toBeInTheDocument();
  });
});

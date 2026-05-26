import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { FinderApp } from "@/features/apps/finder/FinderApp";

describe("FinderApp", () => {
  it("renders an actual image preview for image files", async () => {
    const user = userEvent.setup();
    render(<FinderApp />);

    await user.click(screen.getByRole("button", { name: "Moodboard" }));
    await user.click(screen.getByRole("button", { name: /Interface Direction\.svg Image/ }));

    expect(screen.getByRole("img", { name: "Preview of Interface Direction.svg" })).toBeInTheDocument();
    expect(screen.getByText(/self-contained placeholder asset/i)).toBeInTheDocument();
  });

  it("keeps the locked Hidden folder from revealing files", async () => {
    const user = userEvent.setup();
    render(<FinderApp />);

    await user.click(screen.getByRole("button", { name: "Locked" }));

    expect(screen.queryByRole("button", { name: /Open Later.note/ })).not.toBeInTheDocument();
    expect(screen.getByText("Hidden is locked.")).toBeInTheDocument();
  });

  it("supports Finder-style back and forward folder navigation", async () => {
    const user = userEvent.setup();
    render(<FinderApp />);

    await user.click(screen.getByRole("button", { name: "Moodboard" }));
    expect(screen.getByRole("heading", { name: "Moodboard" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("heading", { name: "Recents" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Forward" }));
    expect(screen.getByRole("heading", { name: "Moodboard" })).toBeInTheDocument();
  });

  it("turns selected-file toolbar actions into visible local state", async () => {
    const user = userEvent.setup();
    render(<FinderApp />);

    await user.click(screen.getByRole("button", { name: /Product Brief\.pdf PDF/ }));
    await user.click(screen.getByRole("button", { name: "Tag selected file" }));

    expect(screen.getByLabelText("Local tag")).toBeInTheDocument();
    expect(screen.getByText("Tagged locally.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "More actions" }));
    await user.click(screen.getByRole("button", { name: "Quick Look" }));

    expect(screen.getByText("Quick Look is already visible.")).toBeInTheDocument();
  });
});

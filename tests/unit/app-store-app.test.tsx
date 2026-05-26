import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { AppStoreApp } from "@/features/apps/app-store/AppStoreApp";

describe("AppStoreApp", () => {
  it("renders Mac App Store sections and updates installed apps without future placeholders", async () => {
    const user = userEvent.setup();
    render(<AppStoreApp />);

    expect(screen.getByRole("button", { name: "Discover" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Work" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Coming Soon" })).not.toBeInTheDocument();
    expect(screen.getByTestId("app-store-header")).not.toHaveClass("sticky");

    await user.click(screen.getByRole("button", { name: "Update Finder" }));

    expect(screen.getByRole("button", { name: "Finder updated" })).toBeInTheDocument();
  });
});

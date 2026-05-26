import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { PhotosApp } from "@/features/apps/photos/PhotosApp";

describe("PhotosApp", () => {
  it("resizes thumbnail grid tracks instead of visually scaling cards over each other", async () => {
    const user = userEvent.setup();
    render(<PhotosApp />);

    const grid = screen.getByTestId("photos-grid");
    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" });

    await user.click(screen.getByRole("button", { name: "Increase thumbnail size" }));

    expect(grid).toHaveStyle({ gridTemplateColumns: "repeat(auto-fill, minmax(165px, 1fr))" });
  });

  it("opens the in-app photo viewer with working protected actions", async () => {
    const user = userEvent.setup();
    render(<PhotosApp />);

    await user.click(screen.getByRole("button", { name: "Open Sprint Board" }));
    await user.click(screen.getByRole("button", { name: "Delete photo" }));

    expect(screen.getByText("Cannot Delete Photo")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "OK" }));
    await user.click(screen.getByRole("button", { name: "Close photo viewer" }));

    await waitFor(() => expect(screen.queryByRole("button", { name: "Delete photo" })).not.toBeInTheDocument());
  });

  it("shows the bundled demo photo dates on gallery cards and opens the fullscreen viewer", async () => {
    const user = userEvent.setup();
    render(<PhotosApp />);

    expect(screen.getByRole("button", { name: "Open Sprint Board" })).toHaveTextContent("Jun 1, 2026");

    await user.click(screen.getByRole("button", { name: "Open Sprint Board" }));

    expect(screen.getByTestId("photos-viewer-overlay")).toHaveClass("absolute");
    expect(screen.getByRole("button", { name: "Next photo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zoom in" })).toBeInTheDocument();
  });

  it("has a dedicated albums stage with safe demo albums to explore", async () => {
    const user = userEvent.setup();
    render(<PhotosApp />);

    await user.click(screen.getByRole("button", { name: "Albums" }));

    expect(screen.getByRole("heading", { name: "Albums" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Design Sprint album/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Open Night Ops album/ })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Open Night Ops album/ }));

    expect(screen.getByRole("heading", { name: "Night Ops" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open Prototype Notes" })).toBeInTheDocument();
  });

  it("has a first-class favourites section that updates from favourite actions", async () => {
    const user = userEvent.setup();
    render(<PhotosApp />);

    await user.click(screen.getByRole("button", { name: "Favourites" }));

    expect(screen.getByRole("heading", { name: "Favourites" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open Sprint Board" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Gallery" }));
    await user.click(screen.getByRole("button", { name: "Add Sprint Board to Favourites" }));
    await user.click(screen.getByRole("button", { name: "Favourites" }));

    expect(screen.getByRole("button", { name: "Open Sprint Board" })).toBeInTheDocument();
  });

  it("supports keyboard navigation in the fullscreen viewer", async () => {
    const user = userEvent.setup();
    render(<PhotosApp />);

    await user.click(screen.getByRole("button", { name: "Open Sprint Board" }));

    expect(screen.getByTestId("photos-viewer-media")).toHaveAttribute("src", expect.stringContaining("/photos/demo/photo-1.svg"));

    await user.keyboard("{ArrowRight}");

    await waitFor(() =>
      expect(screen.getByTestId("photos-viewer-media")).toHaveAttribute("src", expect.stringContaining("/photos/demo/photo-2.svg")),
    );
  });
});

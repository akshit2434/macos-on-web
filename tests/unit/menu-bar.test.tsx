import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MenuBar } from "@/features/shell/components/MenuBar";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";

describe("MenuBar", () => {
  beforeEach(() => {
    useWindowStore.setState({
      windows: [],
      focusedWindowId: null,
      nextZIndex: 1,
      notifications: [],
    });
  });

  it("opens mac-like menu panels instead of notification banners", async () => {
    const user = userEvent.setup();
    const onLock = vi.fn();
    render(<MenuBar isLocked={false} onLock={onLock} />);

    await user.click(screen.getByRole("button", { name: "Apple menu" }));
    expect(screen.getByRole("button", { name: "About This Mac" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Finder app menu" }));
    expect(screen.getByRole("button", { name: "About Finder" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "File menu" }));
    expect(screen.getByText("New Window")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(screen.getByPlaceholderText("Spotlight Search")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Wi-Fi" }));
    expect(screen.getByText("Connected to Studio Fiber")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Battery" }));
    expect(screen.getByText("96% charged")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Date and time" }));
    expect(screen.getByText("Asia/Kolkata")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Lock Screen" }));
    expect(onLock).toHaveBeenCalledTimes(1);

    expect(useWindowStore.getState().notifications).toEqual([]);
  });
});

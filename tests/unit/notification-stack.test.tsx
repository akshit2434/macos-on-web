import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NotificationStack } from "@/features/shell/components/NotificationStack";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";

describe("NotificationStack", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useWindowStore.setState({
      windows: [],
      focusedWindowId: null,
      nextZIndex: 1,
      notifications: [
        {
          id: "notification-test",
          appId: "calendar",
          title: "Today",
          body: "Your notification should fade away.",
          createdAt: "2026-05-23T02:30:00.000Z",
        },
      ],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-dismisses notification banners after a few seconds", () => {
    render(<NotificationStack />);

    expect(screen.getByText("Today")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4_800);
    });

    expect(useWindowStore.getState().notifications).toEqual([]);
  });
});

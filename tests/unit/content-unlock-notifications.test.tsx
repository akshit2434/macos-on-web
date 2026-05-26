import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useContentUnlockNotifications } from "@/features/content-unlocks/use-content-unlock-notifications";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";

function UnlockNotificationProbe({ isLocked }: { isLocked: boolean }) {
  useContentUnlockNotifications(isLocked);
  return null;
}

describe("content unlock notifications", () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: new Date("2030-01-15T09:05:00+05:30") });
    window.localStorage.clear();
    useWindowStore.setState({
      windows: [],
      focusedWindowId: null,
      nextZIndex: 1,
      notifications: [],
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows one daily notification per unlocked content app after the OS is unlocked", async () => {
    const firstView = render(<UnlockNotificationProbe isLocked={false} />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(useWindowStore.getState().notifications.map((notification) => notification.appId)).toEqual(["spotify", "notes", "photos"]);

    firstView.unmount();
    useWindowStore.setState({ notifications: [] });
    render(<UnlockNotificationProbe isLocked={false} />);

    expect(useWindowStore.getState().notifications).toEqual([]);
  });
});

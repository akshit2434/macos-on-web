import { describe, expect, it } from "vitest";

import { clampWindowPosition, resolveWindowFrameStyle } from "@/features/shell/components/WindowFrame";
import { hasMaximizedWindow, type DesktopWindow } from "@/features/shell/windowing/window-reducer";

describe("WindowFrame", () => {
  it("clamps dragged windows so a reachable title area remains onscreen", () => {
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1600 });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });

    expect(clampWindowPosition({ x: 2400, y: 1400 }, { width: 920, height: 620 })).toEqual({
      x: 1180,
      y: 740,
    });
  });

  it("maximized windows cover the full viewport above dock chrome", () => {
    const window: DesktopWindow = {
      id: "zip",
      appId: "zip",
      title: "Zip",
      position: { x: 80, y: 70 },
      size: { width: 880, height: 660 },
      zIndex: 4,
      isMinimized: false,
      isMaximized: true,
    };

    expect(resolveWindowFrameStyle(window)).toMatchObject({
      left: 0,
      top: 0,
      width: "100dvw",
      height: "100dvh",
      zIndex: 220,
    });
  });

  it("detects when shell chrome should yield to a fullscreen window", () => {
    const window: DesktopWindow = {
      id: "zip",
      appId: "zip",
      title: "Zip",
      position: { x: 80, y: 70 },
      size: { width: 880, height: 660 },
      zIndex: 4,
      isMinimized: false,
      isMaximized: true,
    };

    expect(hasMaximizedWindow([window])).toBe(true);
    expect(hasMaximizedWindow([{ ...window, isMaximized: false }])).toBe(false);
    expect(hasMaximizedWindow([{ ...window, isMinimized: true }])).toBe(false);
  });
});

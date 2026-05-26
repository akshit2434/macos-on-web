import { describe, expect, it } from "vitest";

import {
  createInitialWindowState,
  openWindow,
  focusWindow,
  minimizeWindow,
  toggleMaximizeWindow,
  closeWindow,
  moveWindow,
  resizeWindow,
} from "@/features/shell/windowing/window-reducer";

describe("window reducer", () => {
  it("opens apps as focused windows with increasing z-index", () => {
    let state = createInitialWindowState();

    state = openWindow(state, { appId: "notes", title: "Notes" });
    state = openWindow(state, { appId: "photos", title: "Photos" });

    expect(state.windows).toHaveLength(2);
    expect(state.focusedWindowId).toBe("photos");
    expect(state.windows[0]).toMatchObject({ appId: "notes", zIndex: 1 });
    expect(state.windows[1]).toMatchObject({ appId: "photos", zIndex: 2 });
  });

  it("focuses an existing window instead of duplicating one for the same app", () => {
    let state = createInitialWindowState();

    state = openWindow(state, { appId: "notes", title: "Notes" });
    state = openWindow(state, { appId: "photos", title: "Photos" });
    state = openWindow(state, { appId: "notes", title: "Notes" });

    expect(state.windows).toHaveLength(2);
    expect(state.focusedWindowId).toBe("notes");
    expect(state.windows.find((window) => window.id === "notes")?.zIndex).toBe(3);
  });

  it("minimizes, restores, maximizes, moves, resizes, and closes predictably", () => {
    let state = createInitialWindowState();

    state = openWindow(state, { appId: "notes", title: "Notes" });
    state = minimizeWindow(state, "notes");
    expect(state.windows[0].isMinimized).toBe(true);
    expect(state.focusedWindowId).toBeNull();

    state = focusWindow(state, "notes");
    expect(state.windows[0].isMinimized).toBe(false);
    expect(state.focusedWindowId).toBe("notes");

    state = toggleMaximizeWindow(state, "notes");
    expect(state.windows[0].isMaximized).toBe(true);

    state = moveWindow(state, "notes", { x: 120, y: 80 });
    state = resizeWindow(state, "notes", { width: 920, height: 640 });

    expect(state.windows[0].position).toEqual({ x: 120, y: 80 });
    expect(state.windows[0].size).toEqual({ width: 920, height: 640 });

    state = closeWindow(state, "notes");
    expect(state.windows).toHaveLength(0);
    expect(state.focusedWindowId).toBeNull();
  });
});


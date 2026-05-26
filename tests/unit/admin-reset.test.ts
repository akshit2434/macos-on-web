import { describe, expect, it } from "vitest";

import { adminResetTableOrder, adminRuntimeLocalStorageKeys, resetLocalRuntimeState } from "@/features/admin/admin-reset";

describe("admin reset helpers", () => {
  it("targets runtime database tables without level or app content tables", () => {
    expect(adminResetTableOrder).toEqual([
      "activity_events",
      "music_events",
      "puzzle_attempts",
      "captured_photos",
      "unlock_events",
      "content_state",
      "sessions",
    ]);
    expect(adminResetTableOrder).not.toContain("puzzle_levels");
    expect(adminResetTableOrder).not.toContain("apps");
  });

  it("clears browser runtime state while leaving unrelated preferences alone", () => {
    window.localStorage.clear();
    for (const key of adminRuntimeLocalStorageKeys) {
      window.localStorage.setItem(key, "testing");
    }
    window.localStorage.setItem("macos-web.static-level-bank", "keep");

    resetLocalRuntimeState(window.localStorage);

    for (const key of adminRuntimeLocalStorageKeys) {
      expect(window.localStorage.getItem(key)).toBeNull();
    }
    expect(window.localStorage.getItem("macos-web.static-level-bank")).toBe("keep");
  });
});

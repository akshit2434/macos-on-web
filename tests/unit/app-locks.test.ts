import { describe, expect, it } from "vitest";

import {
  getLockedAppMessage,
  isAppLockedForSession,
} from "@/features/session/app-locks";

describe("app locks", () => {
  it("locks Notes and Chat for the owner session", () => {
    expect(isAppLockedForSession("notes", "owner")).toBe(true);
    expect(isAppLockedForSession("whatsapp", "owner")).toBe(true);
    expect(getLockedAppMessage("notes")).toContain("locked in owner mode");
  });

  it("unlocks Notes and Chat in the isolated test session", () => {
    expect(isAppLockedForSession("notes", "test")).toBe(false);
    expect(isAppLockedForSession("whatsapp", "test")).toBe(false);
  });
});

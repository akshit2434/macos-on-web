import { describe, expect, it } from "vitest";

import { scoreWordleGuess } from "@/features/puzzles";

describe("scoreWordleGuess", () => {
  it("does not over-highlight duplicate letters beyond the answer count", () => {
    expect(scoreWordleGuess("level", "lllll")).toEqual(["correct", "absent", "absent", "absent", "correct"]);
  });

  it("uses remaining answer counts after exact matches", () => {
    expect(scoreWordleGuess("cocoa", "ooooo")).toEqual(["absent", "correct", "absent", "correct", "absent"]);
    expect(scoreWordleGuess("cocoa", "actor")).toEqual(["present", "present", "absent", "correct", "absent"]);
  });
});

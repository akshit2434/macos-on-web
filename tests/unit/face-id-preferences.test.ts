import { describe, expect, it } from "vitest";

import { faceIdPreferenceStorageKey, isFaceIdEnabled, setFaceIdEnabled } from "@/features/face-id/face-id-preferences";

describe("Face ID preferences", () => {
  it("is disabled by default and only turns on after the preference is saved", () => {
    window.localStorage.clear();

    expect(isFaceIdEnabled()).toBe(false);

    setFaceIdEnabled(true);
    expect(window.localStorage.getItem(faceIdPreferenceStorageKey)).toBe("enabled");
    expect(isFaceIdEnabled()).toBe(true);

    setFaceIdEnabled(false);
    expect(window.localStorage.getItem(faceIdPreferenceStorageKey)).toBeNull();
    expect(isFaceIdEnabled()).toBe(false);
  });
});

import { describe, expect, it } from "vitest";

import { desktopGridMetrics, getDesktopGridDropIndex, reorderDesktopIconOrder, resolveDesktopIconOrder } from "@/features/shell/desktop-layout";

describe("desktop layout", () => {
  it("keeps stored icon order and appends newly available desktop apps", () => {
    expect(resolveDesktopIconOrder(["finder", "notes", "photos", "zip"], ["photos", "finder", "ghost"])).toEqual([
      "photos",
      "finder",
      "notes",
      "zip",
    ]);
  });

  it("moves a dragged icon into the target grid position", () => {
    expect(reorderDesktopIconOrder(["finder", "notes", "photos", "zip"], "finder", 2)).toEqual([
      "notes",
      "photos",
      "finder",
      "zip",
    ]);
  });

  it("maps desktop pointer release positions to the column-flow grid order", () => {
    const rect = { left: 0, top: 0 } as DOMRect;

    expect(getDesktopGridDropIndex(67, 100, rect, 12)).toBe(0);
    expect(getDesktopGridDropIndex(67, 212, rect, 12)).toBe(1);
    expect(getDesktopGridDropIndex(173, 100, rect, 12)).toBe(6);
  });

  it("reserves enough desktop cell height for two-line app labels", () => {
    expect(desktopGridMetrics.rows).toBe(6);
    expect(desktopGridMetrics.cellHeight).toBeGreaterThanOrEqual(104);
  });
});

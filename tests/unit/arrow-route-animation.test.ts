import { describe, expect, it } from "vitest";

import { arrowHeadPolygonPoints, buildArrowEscapeRoute, getArrowRouteFrame } from "@/features/puzzles/arrow-route-animation";
import type { Cell } from "@/features/puzzles/types";

const cells: Cell[] = [
  [1, 1],
  [1, 0],
  [2, 0],
  [2, 1],
];

describe("arrow route animation geometry", () => {
  it("builds one tail-to-head route with a short exit segment", () => {
    const route = buildArrowEscapeRoute({
      cells,
      direction: "right",
      cellSize: 34,
      boardPadding: 12,
    });

    expect(route.points).toHaveLength(5);
    expect(route.points[0]).toEqual({ x: 63, y: 97 });
    expect(route.points[3]).toEqual({ x: 63, y: 63 });
    expect(route.points[4].x).toBeGreaterThan(route.points[3].x);
    expect(route.points[4].y).toBe(route.points[3].y);
    expect(route.totalLength).toBeGreaterThan(route.shapeLength);
  });

  it("keeps the arrowhead pinned to the visible body while the body flows", () => {
    const route = buildArrowEscapeRoute({
      cells,
      direction: "right",
      cellSize: 34,
      boardPadding: 12,
    });
    const start = getArrowRouteFrame(route, 0);
    const middle = getArrowRouteFrame(route, 0.5);
    const bodyEnd = middle.bodyPoints[middle.bodyPoints.length - 1];

    expect(start.head).toEqual({ x: 63, y: 63 });
    expect(middle.head.x).toBeGreaterThan(start.head.x);
    expect(middle.headDirection).toBe("right");
    expect(bodyEnd.x).toBeCloseTo(middle.head.x, 2);
    expect(bodyEnd.y).toBeCloseTo(middle.head.y, 2);
    expect(arrowHeadPolygonPoints(middle.head, middle.headDirection)).toContain(`${middle.head.x + 10}`);
  });

  it("fades only near the very end after the route has nearly left", () => {
    const route = buildArrowEscapeRoute({
      cells,
      direction: "up",
      cellSize: 34,
      boardPadding: 12,
    });

    expect(getArrowRouteFrame(route, 0.75).opacity).toBe(1);
    expect(getArrowRouteFrame(route, 0.96).opacity).toBeLessThan(0.4);
    expect(getArrowRouteFrame(route, 1).isVisible).toBe(false);
  });
});

import type { Cell, Direction } from "./types";

export type ArrowRoutePoint = {
  x: number;
  y: number;
};

export type ArrowRouteFrame = {
  bodyPoints: ArrowRoutePoint[];
  head: ArrowRoutePoint;
  headDirection: Direction;
  opacity: number;
  isVisible: boolean;
};

type ArrowRouteOptions = {
  cells: Cell[];
  direction: Direction;
  cellSize: number;
  boardPadding: number;
  exitDistance?: number;
};

type Segment = {
  from: ArrowRoutePoint;
  to: ArrowRoutePoint;
  length: number;
  startDistance: number;
  direction: Direction;
};

const headFadeStart = 0.86;

export function buildArrowEscapeRoute({
  cells,
  direction,
  cellSize,
  boardPadding,
  exitDistance,
}: ArrowRouteOptions) {
  const headFirstCells = cells.length ? cells : [[0, 0] as Cell];
  const tailToHeadPoints = [...headFirstCells]
    .reverse()
    .map(([row, col]) => cellCenter(row, col, cellSize, boardPadding));
  const head = tailToHeadPoints[tailToHeadPoints.length - 1];
  const exit = exitPoint(head, direction, exitDistance ?? cellSize * 1.75);
  const points = [...tailToHeadPoints, exit];
  const segments = buildSegments(points);
  const shapeLength = measurePolyline(tailToHeadPoints);
  const totalLength = measurePolyline(points);

  return {
    points,
    segments,
    shapeLength,
    totalLength,
  };
}

export function getArrowRouteFrame(
  route: ReturnType<typeof buildArrowEscapeRoute>,
  progress: number,
): ArrowRouteFrame {
  const easedProgress = easeInOutCubic(clamp(progress, 0, 1));
  const travelDistance = route.totalLength * easedProgress;
  const startDistance = Math.min(route.totalLength, travelDistance);
  const endDistance = Math.min(route.totalLength, travelDistance + route.shapeLength);
  const bodyPoints = slicePolyline(route, startDistance, endDistance);
  const head = pointAtDistance(route, endDistance);
  const headDirection = directionAtDistance(route, endDistance);
  const opacity = progress < headFadeStart ? 1 : clamp((1 - progress) / (1 - headFadeStart), 0, 1);

  return {
    bodyPoints,
    head,
    headDirection,
    opacity,
    isVisible: bodyPoints.length > 1 && opacity > 0.02,
  };
}

export function arrowHeadPolygonPoints(point: ArrowRoutePoint, direction: Direction, size = 10) {
  const { x, y } = point;

  if (direction === "up") return `${x},${y - size} ${x - size},${y + size * 0.7} ${x + size},${y + size * 0.7}`;
  if (direction === "right") return `${x + size},${y} ${x - size * 0.7},${y - size} ${x - size * 0.7},${y + size}`;
  if (direction === "down") return `${x},${y + size} ${x - size},${y - size * 0.7} ${x + size},${y - size * 0.7}`;
  return `${x - size},${y} ${x + size * 0.7},${y - size} ${x + size * 0.7},${y + size}`;
}

export function polylinePoints(points: ArrowRoutePoint[]) {
  return points.map((point) => `${roundPoint(point.x)},${roundPoint(point.y)}`).join(" ");
}

function cellCenter(row: number, col: number, cellSize: number, boardPadding: number): ArrowRoutePoint {
  return {
    x: boardPadding + col * cellSize + cellSize / 2,
    y: boardPadding + row * cellSize + cellSize / 2,
  };
}

function exitPoint(head: ArrowRoutePoint, direction: Direction, exitRun: number) {
  if (direction === "up") return { x: head.x, y: head.y - exitRun };
  if (direction === "right") return { x: head.x + exitRun, y: head.y };
  if (direction === "down") return { x: head.x, y: head.y + exitRun };
  return { x: head.x - exitRun, y: head.y };
}

function buildSegments(points: ArrowRoutePoint[]): Segment[] {
  let cursor = 0;
  const segments: Segment[] = [];

  for (let index = 1; index < points.length; index += 1) {
    const from = points[index - 1];
    const to = points[index];
    const length = distance(from, to);
    if (length <= 0) continue;
    segments.push({
      from,
      to,
      length,
      startDistance: cursor,
      direction: directionFromPoints(from, to),
    });
    cursor += length;
  }

  return segments;
}

function measurePolyline(points: ArrowRoutePoint[]) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distance(points[index - 1], points[index]);
  }
  return Math.max(1, total);
}

function slicePolyline(route: ReturnType<typeof buildArrowEscapeRoute>, startDistance: number, endDistance: number) {
  if (endDistance <= startDistance) return [];

  const points: ArrowRoutePoint[] = [pointAtDistance(route, startDistance)];

  for (const segment of route.segments) {
    const segmentEnd = segment.startDistance + segment.length;
    if (segmentEnd <= startDistance || segment.startDistance >= endDistance) continue;
    if (segment.startDistance > startDistance && segment.startDistance < endDistance) {
      points.push(segment.from);
    }
    if (segmentEnd > startDistance && segmentEnd < endDistance) {
      points.push(segment.to);
    }
  }

  points.push(pointAtDistance(route, endDistance));
  return dedupePoints(points);
}

function pointAtDistance(route: ReturnType<typeof buildArrowEscapeRoute>, requestedDistance: number): ArrowRoutePoint {
  const currentDistance = clamp(requestedDistance, 0, route.totalLength);
  const segment =
    route.segments.find((item) => currentDistance <= item.startDistance + item.length) ??
    route.segments[route.segments.length - 1];

  if (!segment) return route.points[0] ?? { x: 0, y: 0 };

  const localProgress = clamp((currentDistance - segment.startDistance) / segment.length, 0, 1);
  return {
    x: segment.from.x + (segment.to.x - segment.from.x) * localProgress,
    y: segment.from.y + (segment.to.y - segment.from.y) * localProgress,
  };
}

function directionAtDistance(route: ReturnType<typeof buildArrowEscapeRoute>, requestedDistance: number): Direction {
  const currentDistance = clamp(requestedDistance, 0, route.totalLength);
  const segment =
    route.segments.find((item) => currentDistance <= item.startDistance + item.length) ??
    route.segments[route.segments.length - 1];

  return segment?.direction ?? "right";
}

function directionFromPoints(from: ArrowRoutePoint, to: ArrowRoutePoint): Direction {
  const dx = to.x - from.x;
  const dy = to.y - from.y;

  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "down" : "up";
}

function distance(from: ArrowRoutePoint, to: ArrowRoutePoint) {
  return Math.hypot(to.x - from.x, to.y - from.y);
}

function easeInOutCubic(value: number) {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function dedupePoints(points: ArrowRoutePoint[]) {
  return points.filter((point, index) => {
    const previous = points[index - 1];
    return !previous || Math.abs(previous.x - point.x) > 0.01 || Math.abs(previous.y - point.y) > 0.01;
  });
}

function roundPoint(value: number) {
  return Number(value.toFixed(2));
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

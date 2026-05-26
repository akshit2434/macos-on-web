"use client";

import { type CSSProperties, type PointerEvent, type WheelEvent, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, Minus, Plus, RotateCcw, Scan } from "lucide-react";

import { canArrowPieceEscape } from "@/content/puzzles/arrow-escape-generator";
import { arrowHeadPolygonPoints, buildArrowEscapeRoute, getArrowRouteFrame, polylinePoints } from "../arrow-route-animation";
import { validateArrowEscapeState } from "../validators";
import type { ArrowEscapeLevel, ArrowEscapePiece, ArrowEscapeState, Cell, Direction, PuzzleShellProps } from "../types";

const cellSize = 34;
const boardPadding = 12;
const arrowStroke = "#744417";
const escapingArrowStroke = "#38bdf8";
const escapeDurationMs = 1120;
const minBoardZoom = 0.12;
const maxBoardZoom = 2.2;
const boardZoomStep = 0.15;
const pinchZoomSensitivity = 0.7;
const wheelZoomSensitivity = 0.0007;
const maxWheelZoomDelta = 0.08;

type ArrowBoardViewport = {
  levelId: string;
  zoom: number;
  panX: number;
  panY: number;
};

export function ArrowEscapePuzzle({
  level,
  state,
  onStateChange,
  onReset,
  onBack,
  onNextLevel,
  onHome,
  hasNextLevel = false,
}: PuzzleShellProps<ArrowEscapeLevel, ArrowEscapeState> & {
  onBack?: () => void;
  onNextLevel?: () => void;
  onHome?: () => void;
  hasNextLevel?: boolean;
}) {
  const validation = validateArrowEscapeState(level, state);
  const isComplete = state.status === "complete" || validation.isComplete;
  const isFailed = state.status === "failed" || (state.livesRemaining ?? 3) <= 0;
  const [blockedPieceId, setBlockedPieceId] = useState<string | null>(null);
  const [wrongPiece, setWrongPiece] = useState<{ id: string; token: number } | null>(null);
  const [showFailedOverlay, setShowFailedOverlay] = useState(false);
  const [escapingPieces, setEscapingPieces] = useState<Record<string, number>>({});
  const [animationNow, setAnimationNow] = useState(() => Date.now());
  const [customViewport, setCustomViewport] = useState<ArrowBoardViewport | null>(null);
  const [boardViewportSize, setBoardViewportSize] = useState({ width: 0, height: 0 });
  const boardViewportRef = useRef<HTMLDivElement | null>(null);
  const pendingEscapes = useRef<Record<string, number>>({});
  const wrongFlashToken = useRef(0);
  const panGesture = useRef<{ pointerId: number; startX: number; startY: number; panX: number; panY: number } | null>(null);
  const activePointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchGesture = useRef<{ startDistance: number; startZoom: number } | null>(null);
  const stateRef = useRef(state);
  const completedEscapedIdsRef = useRef(new Set(state.escapedPieceIds));
  const latestPiecePositionsRef = useRef(state.piecePositions);
  const boardWidth = level.cols * cellSize + boardPadding * 2;
  const boardHeight = level.rows * cellSize + boardPadding * 2;
  const fitZoom = calculateArrowBoardFitZoom({
    boardWidth,
    boardHeight,
    playableCells: level.rows * level.cols - level.blockers.length,
    viewportWidth: boardViewportSize.width,
    viewportHeight: boardViewportSize.height,
  });
  const viewport = customViewport?.levelId === level.metadata.id ? customViewport : { levelId: level.metadata.id, zoom: fitZoom, panX: 0, panY: 0 };
  const escapingPieceIds = Object.keys(escapingPieces);
  const effectiveEscapedPieceIds = Array.from(new Set([...state.escapedPieceIds, ...escapingPieceIds]));

  useEffect(() => {
    stateRef.current = state;
    completedEscapedIdsRef.current = new Set(state.escapedPieceIds);
    latestPiecePositionsRef.current = state.piecePositions;
  }, [state]);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(pendingEscapes.current)) {
        window.clearTimeout(timeoutId);
      }
    };
  }, []);

  useLayoutEffect(() => {
    const element = boardViewportRef.current;
    if (!element) return;

    const updateSize = () => {
      setBoardViewportSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSize();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isFailed) return;

    const overlayTimer = window.setTimeout(() => setShowFailedOverlay(true), 360);
    return () => window.clearTimeout(overlayTimer);
  }, [isFailed]);

  useEffect(() => {
    if (!escapingPieceIds.length) return;

    let frameId = 0;
    let fallbackId = 0;
    const tick = () => {
      setAnimationNow(Date.now());
      if (window.requestAnimationFrame) {
        frameId = window.requestAnimationFrame(tick);
      } else {
        fallbackId = window.setTimeout(tick, 16);
      }
    };

    tick();
    return () => {
      if (frameId) window.cancelAnimationFrame(frameId);
      if (fallbackId) window.clearTimeout(fallbackId);
    };
  }, [escapingPieceIds.length]);

  function cancelPendingEscapes() {
    for (const timeoutId of Object.values(pendingEscapes.current)) {
      window.clearTimeout(timeoutId);
    }
    pendingEscapes.current = {};
    setEscapingPieces({});
    setBlockedPieceId(null);
    setWrongPiece(null);
    setShowFailedOverlay(false);
  }

  function resetLevel() {
    cancelPendingEscapes();
    onReset?.();
  }

  function changeZoom(delta: number) {
    setCustomViewport((current) => ({
      levelId: level.metadata.id,
      panX: current?.levelId === level.metadata.id ? current.panX : 0,
      panY: current?.levelId === level.metadata.id ? current.panY : 0,
      zoom: clampZoom(Number(((current?.levelId === level.metadata.id ? current.zoom : fitZoom) + delta).toFixed(2))),
    }));
  }

  function resetViewport() {
    setCustomViewport(null);
  }

  function startPan(event: PointerEvent<HTMLDivElement>) {
    if (event.target instanceof Element && event.target.closest("button")) return;
    activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (activePointers.current.size >= 2) {
      const [first, second] = Array.from(activePointers.current.values());
      pinchGesture.current = {
        startDistance: distanceBetweenPointers(first, second),
        startZoom: viewport.zoom,
      };
      panGesture.current = null;
      event.currentTarget.setPointerCapture?.(event.pointerId);
      return;
    }

    panGesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      panX: viewport.panX,
      panY: viewport.panY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function movePan(event: PointerEvent<HTMLDivElement>) {
    if (activePointers.current.has(event.pointerId)) {
      activePointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    if (pinchGesture.current && activePointers.current.size >= 2) {
      const [first, second] = Array.from(activePointers.current.values());
      const nextZoom = calculatePinchZoom({
        startZoom: pinchGesture.current.startZoom,
        startDistance: pinchGesture.current.startDistance,
        currentDistance: distanceBetweenPointers(first, second),
      });
      setCustomViewport((current) => ({
        levelId: level.metadata.id,
        panX: current?.levelId === level.metadata.id ? current.panX : 0,
        panY: current?.levelId === level.metadata.id ? current.panY : 0,
        zoom: nextZoom,
      }));
      return;
    }

    const gesture = panGesture.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;
    setCustomViewport((current) => ({
      levelId: level.metadata.id,
      zoom: current?.levelId === level.metadata.id ? current.zoom : fitZoom,
      panX: Math.round(gesture.panX + event.clientX - gesture.startX),
      panY: Math.round(gesture.panY + event.clientY - gesture.startY),
    }));
  }

  function stopPan(event: PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(event.pointerId);
    if (activePointers.current.size < 2) {
      pinchGesture.current = null;
    }

    if (panGesture.current?.pointerId === event.pointerId) {
      panGesture.current = null;
    }
  }

  function zoomWithWheel(event: WheelEvent<HTMLDivElement>) {
    event.preventDefault();
    setCustomViewport((current) => ({
      levelId: level.metadata.id,
      panX: current?.levelId === level.metadata.id ? current.panX : 0,
      panY: current?.levelId === level.metadata.id ? current.panY : 0,
      zoom: calculateWheelZoom({ currentZoom: current?.levelId === level.metadata.id ? current.zoom : fitZoom, deltaY: event.deltaY }),
    }));
  }

  function escapePiece(piece: ArrowEscapePiece) {
    if (isComplete || isFailed || piece.id in escapingPieces || state.escapedPieceIds.includes(piece.id)) return;

    if (!canArrowPieceEscape(level, piece, state.piecePositions, effectiveEscapedPieceIds)) {
      const latestState = stateRef.current;
      const nextLivesRemaining = Math.max(0, (latestState.livesRemaining ?? 3) - 1);
      const token = wrongFlashToken.current + 1;
      wrongFlashToken.current = token;
      setBlockedPieceId(piece.id);
      setWrongPiece({ id: piece.id, token });
      window.setTimeout(() => setBlockedPieceId((current) => (current === piece.id ? null : current)), 360);
      window.setTimeout(() => setWrongPiece((current) => (current?.token === token ? null : current)), 520);
      onStateChange?.({
        ...latestState,
        status: nextLivesRemaining === 0 ? "failed" : "playing",
        livesRemaining: nextLivesRemaining,
      });
      return;
    }

    setEscapingPieces((current) => (piece.id in current ? current : { ...current, [piece.id]: Date.now() }));
    pendingEscapes.current[piece.id] = window.setTimeout(() => {
      const latestState = stateRef.current;
      completedEscapedIdsRef.current = new Set([...completedEscapedIdsRef.current, piece.id]);
      latestPiecePositionsRef.current = Object.fromEntries(
        Object.entries(latestPiecePositionsRef.current).filter(([pieceId]) => pieceId !== piece.id),
      );
      onStateChange?.({
        ...latestState,
        status: "playing",
        piecePositions: latestPiecePositionsRef.current,
        escapedPieceIds: [...completedEscapedIdsRef.current],
      });
      delete pendingEscapes.current[piece.id];
      setEscapingPieces((current) => {
        const next = { ...current };
        delete next[piece.id];
        return next;
      });
      setBlockedPieceId(null);
    }, escapeDurationMs);
  }

  return (
    <section className="relative flex min-h-full flex-col overflow-auto bg-[#f1dfbd] px-5 py-4 text-[#6f4712]" aria-label="Arrow Escape game">
      <header className="mb-4 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="grid size-10 place-items-center rounded-full bg-white/48 text-[#6f4712] ring-1 ring-[#7c4d16]/12 hover:bg-white/68"
          aria-label="Back to Arrow levels"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="min-w-0 text-center">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#8a5a19]/55">
            {level.metadata.daily ? "Daily Challenge" : "Level"}
          </p>
          <h2 className="truncate text-lg font-black tracking-normal">
            {level.metadata.daily ? "Today" : `Level ${level.metadata.id.replace("arrow-escape-level-", "").replace(/^0+/, "")}`}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Hearts livesRemaining={state.livesRemaining ?? 3} />
          <span className="rounded-full bg-white/48 px-3 py-2 text-xs font-black text-[#6f4712] ring-1 ring-[#7c4d16]/12">
            {Math.floor(state.elapsedMs / 1000)}s
          </span>
          <div className="flex items-center overflow-hidden rounded-full bg-white/42 ring-1 ring-[#7c4d16]/12">
            <button type="button" onClick={() => changeZoom(-boardZoomStep)} className="grid size-9 place-items-center hover:bg-white/55" aria-label="Zoom out">
              <Minus className="size-4" />
            </button>
            <button type="button" onClick={resetViewport} className="grid size-9 place-items-center border-x border-[#7c4d16]/10 hover:bg-white/55" aria-label="Reset board view">
              <Scan className="size-4" />
            </button>
            <button type="button" onClick={() => changeZoom(boardZoomStep)} className="grid size-9 place-items-center hover:bg-white/55" aria-label="Zoom in">
              <Plus className="size-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={resetLevel}
            className="grid size-10 place-items-center rounded-full bg-white/48 text-[#6f4712] ring-1 ring-[#7c4d16]/12 hover:bg-white/68"
            aria-label="Reset level"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>
      </header>

      <div
        ref={boardViewportRef}
        className="relative min-h-0 flex-1 touch-none select-none overflow-hidden pb-4"
        aria-label="Arrow board viewport"
        onPointerDown={startPan}
        onPointerMove={movePan}
        onPointerUp={stopPan}
        onPointerCancel={stopPan}
        onWheel={zoomWithWheel}
      >
        <div
          data-testid="arrow-board-transform"
          className="absolute left-1/2 top-1/2 will-change-transform"
          style={{
            width: boardWidth,
            height: boardHeight,
            transform: `translate(-50%, -50%) translate3d(${viewport.panX}px, ${viewport.panY}px, 0) scale(${viewport.zoom})`,
            transformOrigin: "center",
          }}
        >
          <div
            className="relative touch-none overflow-visible"
            style={{ width: boardWidth, height: boardHeight }}
          >
            {level.pieces.map((piece) => {
              const position = state.piecePositions[piece.id];
              const escapeStartedAt = escapingPieces[piece.id];
              const isEscaping = escapeStartedAt !== undefined;
              const canEscape = canArrowPieceEscape(level, piece, state.piecePositions, effectiveEscapedPieceIds);

              if (!position) return null;

              return (
                <div
                  key={piece.id}
                  className={`pointer-events-none absolute inset-0 transition ${
                    blockedPieceId === piece.id ? "motion-safe:animate-[arrow-denied_320ms_ease-out]" : ""
                  }`}
                >
                  <PiecePath
                    piece={piece}
                    isEscapable={canEscape}
                    isDimmed={false}
                    isEscaping={isEscaping}
                    escapeProgress={escapeStartedAt !== undefined ? (animationNow - escapeStartedAt) / escapeDurationMs : 0}
                    isWrong={wrongPiece?.id === piece.id}
                  />
                  {(piece.cells ?? [piece.start]).map((cell) => (
                    <button
                      key={`${piece.id}-${cell[0]}-${cell[1]}`}
                      type="button"
                      disabled={isComplete || isFailed || isEscaping}
                      onClick={() => escapePiece(piece)}
                      className="pointer-events-auto absolute rounded-md opacity-0"
                      style={pieceCellHitAreaStyle(cell)}
                      aria-label={`Escape arrow ${pieceLabel(piece.id)}`}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {isComplete ? (
        <CompletionOverlay
          elapsedMs={state.elapsedMs}
          isDaily={Boolean(level.metadata.daily)}
          hasNextLevel={hasNextLevel}
          onNextLevel={onNextLevel}
          onHome={onHome ?? onBack}
        />
      ) : null}
      {showFailedOverlay ? (
        <FailedOverlay
          elapsedMs={state.elapsedMs}
          onRestart={resetLevel}
          onHome={onHome ?? onBack}
        />
      ) : null}
    </section>
  );
}

export function calculateArrowBoardFitZoom({
  boardWidth,
  boardHeight,
  playableCells,
  viewportWidth,
  viewportHeight,
}: {
  boardWidth: number;
  boardHeight: number;
  playableCells: number;
  viewportWidth: number;
  viewportHeight: number;
}) {
  if (boardWidth <= 0 || boardHeight <= 0 || viewportWidth <= 0 || viewportHeight <= 0) return 1;

  const fitInset = arrowBoardFitInsetForLevel(playableCells);
  const availableWidth = Math.max(1, viewportWidth - fitInset * 2);
  const availableHeight = Math.max(1, viewportHeight - fitInset * 2);
  const fitZoom = Math.min(availableWidth / boardWidth, availableHeight / boardHeight, maxBoardZoom);

  return clampZoom(Number(fitZoom.toFixed(2)));
}

function arrowBoardFitInsetForLevel(playableCells: number) {
  if (playableCells >= 1_300) return 4;
  if (playableCells >= 850) return 8;
  return 16;
}

export function calculatePinchZoom({
  startZoom,
  startDistance,
  currentDistance,
}: {
  startZoom: number;
  startDistance: number;
  currentDistance: number;
}) {
  if (startDistance <= 0 || currentDistance <= 0) return clampZoom(startZoom);

  const distanceRatio = currentDistance / startDistance;
  const dampedRatio = distanceRatio ** pinchZoomSensitivity;
  return clampZoom(startZoom * dampedRatio);
}

export function calculateWheelZoom({ currentZoom, deltaY }: { currentZoom: number; deltaY: number }) {
  const zoomDelta = Math.max(-maxWheelZoomDelta, Math.min(maxWheelZoomDelta, -deltaY * wheelZoomSensitivity));
  return clampZoom(currentZoom + zoomDelta);
}

function distanceBetweenPointers(first: { x: number; y: number }, second: { x: number; y: number }) {
  return Math.hypot(first.x - second.x, first.y - second.y);
}

function Hearts({ livesRemaining }: { livesRemaining: number }) {
  return (
    <div
      className="flex items-center gap-1 rounded-full bg-white/48 px-3 py-2 text-[#b91c1c] ring-1 ring-[#7c4d16]/12"
      aria-label={`${livesRemaining} hearts remaining`}
    >
      {Array.from({ length: 3 }, (_, index) => {
        const active = index < livesRemaining;
        return (
          <Heart
            key={index}
            className={`size-4 transition ${active ? "fill-red-500 text-red-500" : "fill-transparent text-[#7c4d16]/24"} ${
              !active && index === livesRemaining ? "motion-safe:animate-[arrow-heart-spend_420ms_cubic-bezier(.34,1.56,.64,1)_both]" : ""
            }`}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

function FailedOverlay({
  elapsedMs,
  onRestart,
  onHome,
}: {
  elapsedMs: number;
  onRestart?: () => void;
  onHome?: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-label="Level lost"
      className="absolute inset-0 z-50 grid place-items-center overflow-hidden bg-[#f1dfbd]/96 px-6 text-center backdrop-blur-xl motion-safe:animate-[zip-complete-card_260ms_ease-out_both]"
    >
      <div className="w-full max-w-[340px] rounded-[30px] border border-red-900/10 bg-white/60 p-7 text-[#6f4712] shadow-[0_28px_70px_rgba(101,67,20,0.24)] backdrop-blur-2xl">
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700/70">Level lost</p>
        <h3 className="mt-2 text-4xl font-black tracking-normal">{(elapsedMs / 1000).toFixed(1)}s</h3>
        <p className="mt-2 text-sm font-bold text-[#8a5a19]/70">No hearts left.</p>
        <div className="mt-7 flex flex-col gap-3">
          <button type="button" onClick={onRestart} className="rounded-2xl bg-[#6f4712] px-5 py-3 text-sm font-black text-[#fff7e6] shadow-[0_16px_34px_rgba(111,71,18,0.22)]">
            Restart
          </button>
          <button type="button" onClick={onHome} className="rounded-2xl bg-white/55 px-5 py-3 text-sm font-black text-[#6f4712] ring-1 ring-[#7c4d16]/12">
            Back home
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletionOverlay({
  elapsedMs,
  isDaily,
  hasNextLevel,
  onNextLevel,
  onHome,
}: {
  elapsedMs: number;
  isDaily: boolean;
  hasNextLevel: boolean;
  onNextLevel?: () => void;
  onHome?: () => void;
}) {
  const [isLeaving, setIsLeaving] = useState(false);

  function leave(action?: () => void) {
    setIsLeaving(true);
    window.setTimeout(() => action?.(), 200);
  }

  return (
    <div
      role="dialog"
      aria-label="Level complete"
      className={`absolute inset-0 z-50 grid place-items-center overflow-hidden bg-[#f1dfbd]/96 px-6 text-center backdrop-blur-xl transition-opacity duration-200 ${
        isLeaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <div data-testid="arrow-completion-confetti" aria-hidden className="pointer-events-none absolute inset-0">
        {Array.from({ length: 18 }, (_, index) => (
          <span
            key={index}
            className="absolute top-1/2 size-2 rounded-sm opacity-0 motion-safe:animate-[zip-confetti_1.15s_ease-out_forwards]"
            style={{
              left: `${12 + ((index * 41) % 76)}%`,
              animationDelay: `${(index % 6) * 42}ms`,
              "--zip-confetti-x": `${((index % 2 ? 1 : -1) * (42 + (index % 5) * 22)).toString()}px`,
              "--zip-confetti-y": `${(-100 - (index % 7) * 24).toString()}px`,
              backgroundColor: ["#2563eb", "#dc2626", "#f59e0b", "#16a34a"][index % 4],
            } as CSSProperties}
          />
        ))}
      </div>
      <div className={`w-full max-w-[340px] rounded-[30px] border border-[#7c4d16]/12 bg-white/54 p-7 text-[#6f4712] shadow-[0_28px_70px_rgba(101,67,20,0.25)] backdrop-blur-2xl transition-all duration-300 motion-safe:animate-[zip-complete-card_360ms_ease-out_both] ${isLeaving ? "translate-y-3 scale-[0.98]" : ""}`}>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#8a5a19]/62">Level complete</p>
        <h3 className="mt-2 text-4xl font-black tracking-normal">{(elapsedMs / 1000).toFixed(1)}s</h3>
        <div className="mt-7 flex flex-col gap-3">
          {isDaily || !hasNextLevel ? (
            <button type="button" onClick={() => leave(onHome)} className="rounded-2xl bg-[#6f4712] px-5 py-3 text-sm font-black text-[#fff7e6] shadow-[0_16px_34px_rgba(111,71,18,0.22)]" aria-label="Back to Arrow home">
              Back to Arrow home
            </button>
          ) : (
            <>
              <button type="button" onClick={() => leave(onNextLevel)} className="rounded-2xl bg-[#6f4712] px-5 py-3 text-sm font-black text-[#fff7e6] shadow-[0_16px_34px_rgba(111,71,18,0.22)]">
                Next level
              </button>
              <button type="button" onClick={() => leave(onHome)} className="rounded-2xl bg-white/55 px-5 py-3 text-sm font-black text-[#6f4712] ring-1 ring-[#7c4d16]/12">
                Back home
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function pieceLabel(pieceId: string) {
  return pieceId.replace(/^p0?/, "");
}

function PiecePath({
  piece,
  isEscapable,
  isDimmed,
  isEscaping,
  escapeProgress,
  isWrong,
}: {
  piece: ArrowEscapePiece;
  isEscapable: boolean;
  isDimmed: boolean;
  isEscaping: boolean;
  escapeProgress: number;
  isWrong: boolean;
}) {
  const cells = piece.cells?.length ? piece.cells : [piece.start];
  const width = boardPadding * 2 + Math.max(...cells.map((cell) => cell[1] + 1)) * cellSize + 18;
  const height = boardPadding * 2 + Math.max(...cells.map((cell) => cell[0] + 1)) * cellSize + 18;
  const drawCells = [...cells].reverse();
  const points = drawCells.map(([row, col]) => `${centerX(col)},${centerY(row)}`).join(" ");
  const head = cells[0];
  const headPoints = arrowHeadPoints(head, piece.direction);
  const stroke = isWrong ? "#dc2626" : isEscaping ? escapingArrowStroke : arrowStroke;
  const shadowStroke = isWrong ? "rgba(220,38,38,0.28)" : isEscaping ? "rgba(56,189,248,0.34)" : "rgba(92,55,18,0.16)";
  const route = isEscaping
    ? buildArrowEscapeRoute({
        cells,
        direction: piece.direction,
        cellSize,
        boardPadding,
        exitDistance: getViewportEscapeDistance(),
      })
    : null;
  const routeFrame = route ? getArrowRouteFrame(route, escapeProgress) : null;
  const escapingBodyPoints = routeFrame ? polylinePoints(routeFrame.bodyPoints) : "";
  const escapingHeadPoints = routeFrame ? arrowHeadPolygonPoints(routeFrame.head, routeFrame.headDirection) : "";

  return (
    <svg
      aria-hidden
      className={`absolute inset-0 overflow-visible transition-opacity ${isDimmed ? "opacity-40" : "opacity-100"}`}
      width={width}
      height={height}
      data-arrow-piece-path={piece.id}
      data-arrow-escaping={isEscaping ? "true" : "false"}
      data-arrow-wrong={isWrong ? "true" : "false"}
      data-arrow-head-x={routeFrame ? routeFrame.head.x.toFixed(2) : undefined}
      data-arrow-head-y={routeFrame ? routeFrame.head.y.toFixed(2) : undefined}
    >
      {isEscaping && routeFrame?.isVisible ? (
        <>
          <polyline
            points={escapingBodyPoints}
            fill="none"
            stroke="rgba(186,230,253,0.38)"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="8"
            opacity={routeFrame.opacity}
          />
          <polyline
            points={escapingBodyPoints}
            fill="none"
            stroke={stroke}
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeWidth="4"
            opacity={routeFrame.opacity}
          />
          <polygon
            points={escapingHeadPoints}
            fill={stroke}
            opacity={routeFrame.opacity}
            filter="drop-shadow(0 1px 2px rgba(56,189,248,0.42))"
          />
        </>
      ) : (
        <>
          <polyline
            points={points}
            fill="none"
            stroke={shadowStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="7"
          />
          <polyline
            points={points}
            fill="none"
            stroke={stroke}
            strokeLinecap="square"
            strokeLinejoin="round"
            strokeOpacity={isEscapable ? 0.98 : 0.76}
            strokeWidth="4"
          />
          <polygon
            points={headPoints}
            fill={stroke}
            opacity={1}
            filter={isEscapable ? `drop-shadow(0 1px 2px ${isEscaping ? "rgba(56,189,248,0.42)" : "rgba(116,68,23,0.26)"})` : undefined}
          />
        </>
      )}
    </svg>
  );
}

function pieceCellHitAreaStyle([row, col]: Cell): CSSProperties {
  return {
    left: centerX(col) - cellSize / 2,
    top: centerY(row) - cellSize / 2,
    width: cellSize,
    height: cellSize,
  };
}

function clampZoom(value: number) {
  return Math.min(maxBoardZoom, Math.max(minBoardZoom, value));
}

function getViewportEscapeDistance() {
  if (typeof window === "undefined") return 1200;
  return Math.max(900, Math.max(window.innerWidth, window.innerHeight) * 1.45);
}

function arrowHeadPoints([row, col]: Cell, direction: Direction) {
  const x = centerX(col);
  const y = centerY(row);
  const size = 10;

  if (direction === "up") return `${x},${y - size} ${x - size},${y + size * 0.7} ${x + size},${y + size * 0.7}`;
  if (direction === "right") return `${x + size},${y} ${x - size * 0.7},${y - size} ${x - size * 0.7},${y + size}`;
  if (direction === "down") return `${x},${y + size} ${x - size},${y - size * 0.7} ${x + size},${y - size * 0.7}`;
  return `${x - size},${y} ${x + size * 0.7},${y - size} ${x + size * 0.7},${y + size}`;
}

function centerX(col: number) {
  return boardPadding + col * cellSize + cellSize / 2;
}

function centerY(row: number) {
  return boardPadding + row * cellSize + cellSize / 2;
}

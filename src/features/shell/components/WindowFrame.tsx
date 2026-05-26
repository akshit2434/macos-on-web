"use client";

import { Minus, Plus, X } from "lucide-react";
import { motion } from "motion/react";
import { type CSSProperties, type ReactNode, useEffect, useRef } from "react";

import type { DesktopWindow } from "../windowing/window-reducer";
import { getAppDefinition } from "../apps";
import { useWindowStore } from "../windowing/use-window-store";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { useUiSound } from "@/lib/media/use-ui-sound";

export function WindowFrame({ window, children }: { window: DesktopWindow; children: ReactNode }) {
  const focus = useWindowStore((state) => state.focusApp);
  const close = useWindowStore((state) => state.closeApp);
  const minimize = useWindowStore((state) => state.minimizeApp);
  const maximize = useWindowStore((state) => state.maximizeApp);
  const move = useWindowStore((state) => state.moveApp);
  const resize = useWindowStore((state) => state.resizeApp);
  const { track } = useAnalytics();
  const playSound = useUiSound();
  const dragStart = useRef<{ pointerX: number; pointerY: number; x: number; y: number } | null>(null);
  const resizeStart = useRef<{
    pointerX: number;
    pointerY: number;
    x: number;
    y: number;
    width: number;
    height: number;
    edge: ResizeEdge;
  } | null>(null);
  const app = getAppDefinition(window.appId);
  const minWidth = app?.minSize.width ?? 560;
  const minHeight = app?.minSize.height ?? 420;
  const windowSize = window.isMaximized
    ? { width: globalThis.window?.innerWidth ?? window.size.width, height: globalThis.window?.innerHeight ?? window.size.height }
    : window.size;
  const style = resolveWindowFrameStyle(window);

  useEffect(() => {
    if (!window.isMaximized) {
      return;
    }

    const exitOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        maximize(window.id);
      }
    };

    globalThis.window?.addEventListener("keydown", exitOnEscape);
    return () => globalThis.window?.removeEventListener("keydown", exitOnEscape);
  }, [maximize, window.id, window.isMaximized]);

  return (
    <motion.section
      aria-label={`${window.title} window`}
      data-window-id={window.appId}
      layout
      className={`pointer-events-auto absolute overflow-hidden bg-zinc-100 text-slate-950 shadow-[0_28px_90px_rgba(15,23,42,0.45)] ${
        window.isMaximized ? "rounded-none border-0 ring-0" : "rounded-xl border border-white/35 ring-1 ring-black/10"
      }`}
      style={style}
      initial={{ opacity: 0, scale: 0.38, y: 220, transformOrigin: "bottom center" }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.22, y: 260, transformOrigin: "bottom center" }}
      transition={{ duration: window.isMaximized ? 0.36 : 0.24, ease: [0.22, 1, 0.36, 1] }}
      onMouseDown={() => focus(window.id)}
    >
      <div
        className={`flex h-9 cursor-default items-center gap-2 border-b border-black/10 bg-white/70 px-3 backdrop-blur-xl ${
          window.isMaximized ? "relative z-50 bg-white/80 shadow-sm" : ""
        }`}
        onPointerDown={(event) => {
          if (window.isMaximized) {
            return;
          }
          dragStart.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            x: window.position.x,
            y: window.position.y,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (!dragStart.current) {
            return;
          }
          move(
            window.id,
            clampWindowPosition(
              {
                x: dragStart.current.x + event.clientX - dragStart.current.pointerX,
                y: dragStart.current.y + event.clientY - dragStart.current.pointerY,
              },
              windowSize,
            ),
          );
        }}
        onPointerUp={(event) => {
          dragStart.current = null;
          releasePointerCapture(event.currentTarget, event.pointerId);
          track({ eventType: "WINDOW_MOVED", appId: window.appId, metadata: window.position });
        }}
        onPointerCancel={(event) => {
          dragStart.current = null;
          releasePointerCapture(event.currentTarget, event.pointerId);
        }}
        onLostPointerCapture={() => {
          dragStart.current = null;
        }}
      >
        <div className="flex items-center gap-2" onPointerDown={(event) => event.stopPropagation()}>
          <button
            type="button"
            aria-label="Close window"
            onClick={() => {
              close(window.id);
              playSound("close");
              track({ eventType: "APP_CLOSED", appId: window.appId });
              track({ eventType: "SOUND_PLAYED", appId: window.appId, metadata: { sound: "close" } });
            }}
            className="group grid size-3.5 place-items-center rounded-full bg-[#ff5f57]"
          >
            <X className="hidden size-2.5 text-red-950 group-hover:block" />
          </button>
          <button
            type="button"
            aria-label="Minimize window"
            onClick={() => {
              minimize(window.id);
              track({ eventType: "APP_MINIMIZED", appId: window.appId });
            }}
            className="group grid size-3.5 place-items-center rounded-full bg-[#ffbd2e]"
          >
            <Minus className="hidden size-2.5 text-yellow-950 group-hover:block" />
          </button>
          <button
            type="button"
            aria-label={window.isMaximized ? "Exit fullscreen" : "Maximize window"}
            onClick={() => {
              maximize(window.id);
              track({ eventType: "APP_MAXIMIZED", appId: window.appId });
            }}
            className="group grid size-3.5 place-items-center rounded-full bg-[#28c840]"
          >
            <Plus className="hidden size-2.5 text-green-950 group-hover:block" />
          </button>
        </div>
        <div className="flex-1 select-none text-center text-[13px] font-semibold text-slate-700">{window.title}</div>
        <div className="w-[52px]" />
      </div>

      <div className="h-[calc(100%-36px)] overflow-auto bg-white">{children}</div>

      {!window.isMaximized ? (
        <ResizeHandles
          onStart={(edge, event) => {
            resizeStart.current = {
              pointerX: event.clientX,
              pointerY: event.clientY,
              x: window.position.x,
              y: window.position.y,
              width: window.size.width,
              height: window.size.height,
              edge,
            };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onMove={(event) => {
            const start = resizeStart.current;
            if (!start) {
              return;
            }

            const deltaX = event.clientX - start.pointerX;
            const deltaY = event.clientY - start.pointerY;
            let nextX = start.x;
            let nextY = start.y;
            let nextWidth = start.width;
            let nextHeight = start.height;

            if (start.edge.includes("e")) {
              nextWidth = Math.max(minWidth, start.width + deltaX);
            }
            if (start.edge.includes("s")) {
              nextHeight = Math.max(minHeight, start.height + deltaY);
            }
            if (start.edge.includes("w")) {
              nextWidth = Math.max(minWidth, start.width - deltaX);
              nextX = start.x + start.width - nextWidth;
            }
            if (start.edge.includes("n")) {
              nextHeight = Math.max(minHeight, start.height - deltaY);
              nextY = start.y + start.height - nextHeight;
            }

            move(window.id, clampWindowPosition({ x: nextX, y: nextY }, { width: nextWidth, height: nextHeight }));
            resize(window.id, { width: nextWidth, height: nextHeight });
          }}
          onEnd={(event) => {
            resizeStart.current = null;
            releasePointerCapture(event.currentTarget, event.pointerId);
            track({ eventType: "WINDOW_RESIZED", appId: window.appId, metadata: window.size });
          }}
          onCancel={(event) => {
            resizeStart.current = null;
            releasePointerCapture(event.currentTarget, event.pointerId);
          }}
          onLostCapture={() => {
            resizeStart.current = null;
          }}
        />
      ) : null}
    </motion.section>
  );
}

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const resizeHandleClass: Record<ResizeEdge, string> = {
  n: "left-3 right-3 top-0 h-2",
  s: "bottom-0 left-3 right-3 h-2",
  e: "bottom-3 right-0 top-3 w-2",
  w: "bottom-3 left-0 top-3 w-2",
  ne: "right-0 top-0 size-4",
  nw: "left-0 top-0 size-4",
  se: "bottom-0 right-0 size-5",
  sw: "bottom-0 left-0 size-4",
};

const resizeCursor: Record<ResizeEdge, CSSProperties["cursor"]> = {
  n: "ns-resize",
  s: "ns-resize",
  e: "ew-resize",
  w: "ew-resize",
  ne: "nesw-resize",
  nw: "nwse-resize",
  se: "nwse-resize",
  sw: "nesw-resize",
};

function ResizeHandles({
  onStart,
  onMove,
  onEnd,
  onCancel,
  onLostCapture,
}: {
  onStart: (edge: ResizeEdge, event: React.PointerEvent<HTMLDivElement>) => void;
  onMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  onEnd: (event: React.PointerEvent<HTMLDivElement>) => void;
  onCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  onLostCapture: () => void;
}) {
  return (
    <>
      {(Object.keys(resizeHandleClass) as ResizeEdge[]).map((edge) => (
        <div
          key={edge}
          aria-hidden
          data-resize-edge={edge}
          className={`absolute ${resizeHandleClass[edge]}`}
          style={{ cursor: resizeCursor[edge] }}
          onPointerDown={(event) => onStart(edge, event)}
          onPointerMove={onMove}
          onPointerUp={onEnd}
          onPointerCancel={onCancel}
          onLostPointerCapture={onLostCapture}
        />
      ))}
    </>
  );
}

export function clampWindowPosition(position: { x: number; y: number }, size: { width: number; height: number }) {
  const viewportWidth = globalThis.window?.innerWidth ?? 1440;
  const viewportHeight = globalThis.window?.innerHeight ?? 900;
  const visibleWidth = Math.min(size.width, 420);
  const visibleHeight = Math.min(size.height, 160);

  return {
    x: Math.min(Math.max(8, position.x), Math.max(8, viewportWidth - visibleWidth)),
    y: Math.min(Math.max(36, position.y), Math.max(36, viewportHeight - visibleHeight)),
  };
}

export function resolveWindowFrameStyle(window: DesktopWindow) {
  if (window.isMaximized) {
    return {
      left: 0,
      top: 0,
      width: "100dvw",
      height: "100dvh",
      zIndex: Math.max(window.zIndex, 220),
    };
  }

  return {
    left: window.position.x,
    top: window.position.y,
    width: window.size.width,
    height: window.size.height,
    zIndex: window.zIndex,
  };
}

function releasePointerCapture(element: Element, pointerId: number) {
  if (element.hasPointerCapture?.(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

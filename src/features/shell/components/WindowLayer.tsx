"use client";

import { AnimatePresence } from "motion/react";

import { AppRenderer } from "@/features/apps/AppRenderer";

import { useWindowStore } from "../windowing/use-window-store";
import { hasMaximizedWindow } from "../windowing/window-reducer";
import { WindowFrame } from "./WindowFrame";

export function WindowLayer() {
  const windows = useWindowStore((state) => state.windows);
  const fullscreenActive = hasMaximizedWindow(windows);

  return (
    <div className={`pointer-events-none absolute inset-0 ${fullscreenActive ? "z-[180]" : "z-[80]"}`}>
      <AnimatePresence>
        {windows
          .filter((window) => !window.isMinimized)
          .map((window) => (
            <WindowFrame key={window.id} window={window}>
              <AppRenderer appId={window.appId} />
            </WindowFrame>
          ))}
      </AnimatePresence>
    </div>
  );
}

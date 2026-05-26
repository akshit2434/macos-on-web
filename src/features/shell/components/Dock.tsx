"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { getLockedAppMessage, isAppLockedForSession } from "@/features/session/app-locks";
import { useSessionMode } from "@/features/session/session-mode";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { useUiSound } from "@/lib/media/use-ui-sound";
import { dockApps, getAppDefinition } from "../apps";
import type { AppDefinition } from "../types";
import { useWindowStore } from "../windowing/use-window-store";
import { AppIcon } from "./AppIcon";

export function Dock() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const openApp = useWindowStore((state) => state.openApp);
  const notify = useWindowStore((state) => state.notify);
  const windows = useWindowStore((state) => state.windows);
  const { track } = useAnalytics();
  const playSound = useUiSound();
  const sessionMode = useSessionMode();
  const visibleDockApps: AppDefinition[] = [
    ...dockApps,
    ...windows
      .filter((window) => !dockApps.some((app) => app.id === window.appId))
      .map((window) => getAppDefinition(window.appId))
      .filter((app): app is AppDefinition => Boolean(app)),
  ];

  const getDockTransform = (index: number) => {
    if (hoveredIndex === null) {
      return { scale: 1, y: 0 };
    }

    const distance = Math.abs(index - hoveredIndex);
    if (distance === 0) {
      return { scale: 1.48, y: -18 };
    }
    if (distance === 1) {
      return { scale: 1.22, y: -10 };
    }
    if (distance === 2) {
      return { scale: 1.08, y: -4 };
    }
    return { scale: 1, y: 0 };
  };

  return (
    <div className="absolute bottom-2 left-1/2 z-[130] -translate-x-1/2 px-3 pb-1 pt-8">
      <div
        onMouseLeave={() => setHoveredIndex(null)}
        className="flex h-[74px] items-end gap-1.5 rounded-[24px] border border-white/45 bg-white/35 px-3 pb-2 pt-2 shadow-[0_22px_52px_rgba(0,0,0,0.32),inset_0_1px_0_rgba(255,255,255,0.55)] ring-1 ring-black/10 backdrop-blur-2xl"
      >
        <AnimatePresence initial={false} mode="popLayout">
        {visibleDockApps.map((app, index) => {
          const window = windows.find((item) => item.appId === app.id);
          const isOpen = Boolean(window);
          const isMinimized = Boolean(window?.isMinimized);
          const transform = getDockTransform(index);
          const showDivider = app.id === "settings";

          return (
            <motion.div
              key={app.id}
              layout
              initial={{ opacity: 0, scale: 0.5, y: 22 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.45, y: 26, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }}
              transition={{
                layout: { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
                opacity: { duration: 0.16 },
                scale: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
                y: { duration: 0.24, ease: [0.22, 1, 0.36, 1] },
              }}
              className="flex items-end gap-1.5"
            >
              {showDivider ? <span className="mx-1 mb-2 h-11 w-px bg-black/20 shadow-[1px_0_0_rgba(255,255,255,0.35)]" /> : null}
              <button
                type="button"
                title={app.name}
                aria-label={app.name}
                onMouseEnter={() => setHoveredIndex(index)}
                onFocus={() => setHoveredIndex(index)}
                onBlur={() => setHoveredIndex(null)}
                onClick={() => {
                  if (isAppLockedForSession(app.id, sessionMode)) {
                    notify({ appId: app.id, title: "App locked", body: getLockedAppMessage(app.id) });
                    track({ eventType: "LOCKED_APP_OPEN_ATTEMPTED", appId: app.id });
                    return;
                  }

                  openApp(app.id);
                  playSound("open");
                  track({ eventType: "DOCK_APP_CLICKED", appId: app.id });
                  track({ eventType: "APP_OPENED", appId: app.id });
                  track({ eventType: "SOUND_PLAYED", appId: app.id, metadata: { sound: "open" } });
                }}
                className="group relative grid size-[54px] origin-bottom place-items-center rounded-[15px] transition-[transform,filter] duration-150 ease-out will-change-transform"
                style={{
                  transform: `translate3d(0, ${transform.y}px, 0) scale(${transform.scale})`,
                  zIndex: hoveredIndex === index ? 2 : Math.max(0, 2 - Math.abs(index - (hoveredIndex ?? index))),
                }}
              >
                <span className="absolute inset-0 rounded-[15px] opacity-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_10px_18px_rgba(0,0,0,0.22)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
                <AppIcon app={app} />
                <span className="pointer-events-none absolute -top-9 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-white/50 bg-neutral-900/78 px-2 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur-xl group-hover:block group-focus-visible:block">
                  {app.name}
                </span>
                {isOpen ? <span className="absolute -bottom-1.5 size-1 rounded-full bg-slate-950/80 shadow-[0_0_0_1px_rgba(255,255,255,0.35)]" /> : null}
                {isMinimized ? <span className="absolute -bottom-3 h-1 w-5 rounded-full bg-sky-200/90 shadow-[0_0_10px_rgba(186,230,253,0.7)]" /> : null}
              </button>
            </motion.div>
          );
        })}
        </AnimatePresence>
      </div>
    </div>
  );
}

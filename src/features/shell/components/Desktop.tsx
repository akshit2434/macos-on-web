"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";

import { getLockedAppMessage, isAppLockedForSession } from "@/features/session/app-locks";
import { useSessionMode } from "@/features/session/session-mode";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { useUiSound } from "@/lib/media/use-ui-sound";
import { desktopApps } from "../apps";
import {
  desktopIconOrderStorageKey,
  getDesktopGridDropIndex,
  reorderDesktopIconOrder,
  resolveDesktopIconOrder,
} from "../desktop-layout";
import { useWallpaperPreference } from "../wallpaper-preferences";
import { useWindowStore } from "../windowing/use-window-store";
import { AppIcon } from "./AppIcon";

const desktopDragThreshold = 6;

type DesktopIconDrag = {
  appId: string;
  pointerId: number;
  startX: number;
  startY: number;
  deltaX: number;
  deltaY: number;
  didMove: boolean;
};

export function Desktop() {
  const openApp = useWindowStore((state) => state.openApp);
  const notify = useWindowStore((state) => state.notify);
  const { track } = useAnalytics();
  const playSound = useUiSound();
  const sessionMode = useSessionMode();
  const gridRef = useRef<HTMLDivElement | null>(null);
  const suppressClickAppIdRef = useRef<string | null>(null);
  const appIds = useMemo(() => desktopApps.map((app) => app.id), []);
  const appById = useMemo(() => new Map(desktopApps.map((app) => [app.id, app])), []);
  const [orderedIds, setOrderedIds] = useState(appIds);
  const [drag, setDrag] = useState<DesktopIconDrag | null>(null);
  const { wallpaper } = useWallpaperPreference();

  useEffect(() => {
    const frameId = window.requestAnimationFrame(() => {
      const storedOrder = readStoredDesktopIconOrder();
      setOrderedIds(resolveDesktopIconOrder(appIds, storedOrder));
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [appIds]);

  function launchDesktopApp(appId: string) {
    if (isAppLockedForSession(appId, sessionMode)) {
      notify({ appId, title: "App locked", body: getLockedAppMessage(appId) });
      track({ eventType: "LOCKED_APP_OPEN_ATTEMPTED", appId });
      return;
    }

    openApp(appId);
    playSound("open");
    track({ eventType: "DESKTOP_ICON_OPENED", appId });
    track({ eventType: "APP_OPENED", appId });
    track({ eventType: "SOUND_PLAYED", appId, metadata: { sound: "open" } });
  }

  function persistOrder(nextOrder: string[]) {
    try {
      window.localStorage.setItem(desktopIconOrderStorageKey, JSON.stringify(nextOrder));
    } catch {
      // Desktop order still updates for the current session if storage is unavailable.
    }
  }

  function reorderAtPointer(appId: string, clientX: number, clientY: number) {
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (!gridRect) {
      return;
    }

    setOrderedIds((currentOrder) => {
      const targetIndex = getDesktopGridDropIndex(clientX, clientY, gridRect, currentOrder.length);
      const nextOrder = reorderDesktopIconOrder(currentOrder, appId, targetIndex);
      persistOrder(nextOrder);
      return nextOrder;
    });
  }

  return (
    <section className="absolute inset-0 bg-cover bg-center transition-[background-image] duration-500" style={{ backgroundImage: `url(${wallpaper.src})` }}>
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 via-transparent to-black/20" />
      <div ref={gridRef} className="relative grid w-fit grid-flow-col grid-rows-[repeat(6,104px)] gap-x-5 gap-y-2 p-6 pt-12">
        {orderedIds.map((appId) => {
          const app = appById.get(appId);
          if (!app) {
            return null;
          }

          const isDragging = drag?.appId === app.id;

          return (
            <motion.button
              key={app.id}
              layout
              type="button"
              animate={{
                x: isDragging ? drag.deltaX : 0,
                y: isDragging ? drag.deltaY : 0,
                scale: isDragging ? 1.04 : 1,
              }}
              transition={{ type: "spring", stiffness: 520, damping: 38, mass: 0.55 }}
              onPointerDown={(event) => {
                if (event.button !== 0) {
                  return;
                }

                setDrag({
                  appId: app.id,
                  pointerId: event.pointerId,
                  startX: event.clientX,
                  startY: event.clientY,
                  deltaX: 0,
                  deltaY: 0,
                  didMove: false,
                });
                event.currentTarget.setPointerCapture(event.pointerId);
              }}
              onPointerMove={(event) => {
                setDrag((currentDrag) => {
                  if (!currentDrag || currentDrag.pointerId !== event.pointerId || currentDrag.appId !== app.id) {
                    return currentDrag;
                  }

                  const deltaX = event.clientX - currentDrag.startX;
                  const deltaY = event.clientY - currentDrag.startY;
                  return {
                    ...currentDrag,
                    deltaX,
                    deltaY,
                    didMove: currentDrag.didMove || Math.hypot(deltaX, deltaY) > desktopDragThreshold,
                  };
                });
              }}
              onPointerUp={(event) => {
                if (!drag || drag.pointerId !== event.pointerId || drag.appId !== app.id) {
                  return;
                }

                if (drag.didMove) {
                  suppressClickAppIdRef.current = app.id;
                  reorderAtPointer(app.id, event.clientX, event.clientY);
                  event.preventDefault();
                  event.stopPropagation();
                }

                releasePointerCapture(event.currentTarget, event.pointerId);
                setDrag(null);
              }}
              onPointerCancel={(event) => {
                if (drag?.pointerId === event.pointerId) {
                  releasePointerCapture(event.currentTarget, event.pointerId);
                  setDrag(null);
                }
              }}
              onClick={(event) => {
                if (suppressClickAppIdRef.current === app.id) {
                  suppressClickAppIdRef.current = null;
                  event.preventDefault();
                  return;
                }

                launchDesktopApp(app.id);
              }}
              className={`group flex w-[86px] touch-none select-none flex-col items-center gap-1.5 rounded-lg p-1.5 text-center text-white outline-none transition-colors hover:bg-white/15 focus:bg-white/15 ${
                isDragging ? "z-20 cursor-grabbing bg-white/18 shadow-[0_18px_35px_rgba(0,0,0,0.24)]" : "cursor-grab"
              }`}
            >
              <AppIcon app={app} />
              <span className="max-w-full rounded bg-black/28 px-1.5 py-0.5 text-[12px] font-medium leading-tight shadow-sm backdrop-blur">
                {app.name}
              </span>
            </motion.button>
          );
        })}
      </div>
    </section>
  );
}

function readStoredDesktopIconOrder() {
  try {
    const storedOrder = window.localStorage.getItem(desktopIconOrderStorageKey);
    return storedOrder ? JSON.parse(storedOrder) : null;
  } catch {
    return null;
  }
}

function releasePointerCapture(element: Element, pointerId: number) {
  if (element.hasPointerCapture?.(pointerId)) {
    element.releasePointerCapture(pointerId);
  }
}

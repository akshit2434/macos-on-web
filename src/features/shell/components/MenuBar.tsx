"use client";

import { BatteryFull, Lock, Search, Wifi } from "lucide-react";
import { useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";

import { appRegistry, getAppDefinition } from "../apps";
import { useWindowStore } from "../windowing/use-window-store";
import { formatClock } from "@/lib/utils";
import { BatteryPanel, ClockPanel, MenuDropdown, SpotlightPanel, WifiPanel } from "./MenuBarPanels";
import { getDropdownItems } from "./menu-bar-items";

type ActiveMenu = {
  id: string;
  left: number;
};

const menuWidth = 236;
const statusPanelWidth = 286;
const spotlightPanelWidth = 360;
const defaultMenuItems = ["File", "Edit", "View", "Window", "Help"];

export function MenuBar({ isLocked, onLock }: { isLocked: boolean; onLock: () => void }) {
  const focusedWindowId = useWindowStore((state) => state.focusedWindowId);
  const openApp = useWindowStore((state) => state.openApp);
  const app = focusedWindowId ? getAppDefinition(focusedWindowId) : null;
  const [now, setNow] = useState<Date | null>(null);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu | null>(null);
  const [spotlightQuery, setSpotlightQuery] = useState("");
  const appName = app?.name ?? "Finder";
  const menuItems = (app?.menuItems ?? defaultMenuItems).filter((item) => item !== appName);

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const initialTick = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 30_000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!activeMenu) {
      return;
    }

    const closeMenu = () => setActiveMenu(null);
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenu(null);
      }
    };

    window.addEventListener("pointerdown", closeMenu);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeMenu);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeMenu]);

  if (isLocked) {
    return null;
  }

  function toggleMenu(id: string, element: HTMLElement, options: { width?: number; align?: "left" | "right" } = {}) {
    const rect = element.getBoundingClientRect();
    const width = options.width ?? menuWidth;
    const rawLeft = options.align === "right" ? rect.right - width : rect.left;
    const nextLeft = Math.min(Math.max(8, rawLeft), Math.max(8, window.innerWidth - width - 8));
    setActiveMenu((current) => current?.id === id ? null : { id, left: nextLeft });
  }

  function menuButtonClass(id: string) {
    return `rounded px-1.5 py-0.5 hover:bg-white/35 ${activeMenu?.id === id ? "bg-white/35" : ""}`;
  }

  const spotlightResults = appRegistry
    .filter((item) => item.name.toLowerCase().includes(spotlightQuery.trim().toLowerCase()))
    .slice(0, 5);

  return (
    <header className="absolute left-0 right-0 top-0 z-[120] flex h-8 items-center justify-between bg-white/34 px-4 text-[13px] font-medium text-slate-950 shadow-sm backdrop-blur-2xl">
      <nav className="flex items-center gap-4">
        <button
          type="button"
          aria-label="Apple menu"
          onClick={(event) => toggleMenu("apple", event.currentTarget)}
          className={menuButtonClass("apple")}
        >
          <span className="text-[17px] leading-none"></span>
        </button>
        <button
          type="button"
          aria-label={`${appName} app menu`}
          onClick={(event) => toggleMenu("app", event.currentTarget)}
          className={`${menuButtonClass("app")} font-semibold`}
        >
          {appName}
        </button>
        {menuItems.map((item) => (
          <button
            key={item}
            type="button"
            aria-label={`${item} menu`}
            onClick={(event) => toggleMenu(`menu:${item}`, event.currentTarget)}
            className={menuButtonClass(`menu:${item}`)}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label="Search"
          onClick={(event) => toggleMenu("spotlight", event.currentTarget, { width: spotlightPanelWidth, align: "right" })}
          className={menuButtonClass("spotlight")}
        >
          <Search className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Wi-Fi"
          onClick={(event) => toggleMenu("wifi", event.currentTarget, { width: statusPanelWidth, align: "right" })}
          className={menuButtonClass("wifi")}
        >
          <Wifi className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Battery"
          onClick={(event) => toggleMenu("battery", event.currentTarget, { width: statusPanelWidth, align: "right" })}
          className={menuButtonClass("battery")}
        >
          <BatteryFull className="size-4" />
        </button>
        <button type="button" aria-label="Lock Screen" onClick={onLock} className="rounded px-1 py-0.5 hover:bg-white/35" title="Lock Screen">
          <Lock className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Date and time"
          onClick={(event) => toggleMenu("clock", event.currentTarget, { width: statusPanelWidth, align: "right" })}
          className={`${menuButtonClass("clock")} ${!now ? "opacity-0" : ""}`}
        >
          {now ? formatClock(now) : "12:00 AM"}
        </button>
      </div>
      <AnimatePresence>
        {activeMenu ? (
          activeMenu.id === "spotlight" ? (
            <SpotlightPanel
              left={activeMenu.left}
              query={spotlightQuery}
              setQuery={setSpotlightQuery}
              results={spotlightResults}
              onOpen={(appId) => {
                openApp(appId);
                setActiveMenu(null);
              }}
            />
          ) : activeMenu.id === "wifi" ? (
            <WifiPanel left={activeMenu.left} />
          ) : activeMenu.id === "battery" ? (
            <BatteryPanel left={activeMenu.left} />
          ) : activeMenu.id === "clock" ? (
            <ClockPanel left={activeMenu.left} date={now ?? new Date()} />
          ) : (
            <MenuDropdown
              left={activeMenu.left}
              items={getDropdownItems(activeMenu.id, appName)}
              onClose={() => setActiveMenu(null)}
            />
          )
        ) : null}
      </AnimatePresence>
    </header>
  );
}

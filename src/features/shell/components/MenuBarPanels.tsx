"use client";

import { BatteryCharging, CalendarDays, Check, Moon, Power, Search, Wifi } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";

import { appRegistry } from "../apps";
import { formatClock } from "@/lib/utils";
import type { MenuItem } from "./menu-bar-items";

export function MenuDropdown({ left, items, onClose }: { left: number; items: MenuItem[]; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-8 w-[236px] overflow-hidden rounded-xl border border-white/45 bg-white/78 p-1.5 text-[13px] text-slate-950 shadow-[0_20px_55px_rgba(15,23,42,0.28)] backdrop-blur-2xl"
      style={{ left }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {items.map((item, index) =>
        item.type === "separator" ? (
          <div key={`separator-${index}`} className="my-1 h-px bg-black/10" />
        ) : (
          <button
            key={`${item.label}-${index}`}
            type="button"
            disabled={item.disabled}
            onClick={onClose}
            className="flex h-6 w-full items-center justify-between rounded-md px-2 text-left disabled:text-slate-400 enabled:hover:bg-[#0066ff] enabled:hover:text-white"
          >
            <span>{item.label}</span>
            {item.shortcut ? <span className="pl-4 text-[12px] opacity-70">{item.shortcut}</span> : null}
          </button>
        ),
      )}
    </motion.div>
  );
}

export function SpotlightPanel({
  left,
  query,
  setQuery,
  results,
  onOpen,
}: {
  left: number;
  query: string;
  setQuery: (value: string) => void;
  results: typeof appRegistry;
  onOpen: (appId: string) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-8 w-[360px] overflow-hidden rounded-2xl border border-white/45 bg-white/82 p-2 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)] backdrop-blur-2xl"
      style={{ left }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex h-10 items-center gap-2 rounded-xl bg-white/80 px-3 ring-1 ring-black/5">
        <Search className="size-4 text-slate-500" />
        <input
          autoFocus
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Spotlight Search"
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-slate-400"
        />
      </div>
      <div className="mt-2 space-y-1">
        {results.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-[#0066ff] hover:text-white"
            >
              <span className="grid size-8 place-items-center rounded-lg text-white" style={{ background: item.accent }}>
                <Icon className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{item.name}</span>
                <span className="block text-xs opacity-65">Application</span>
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

export function WifiPanel({ left }: { left: number }) {
  const networks = ["Studio Fiber", "Guest Mesh", "Demo Hotspot"];

  return (
    <StatusPanel left={left}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold">Wi-Fi</p>
          <p className="text-xs text-slate-500">Connected to {networks[0]}</p>
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-blue-500 text-white">
          <Wifi className="size-5" />
        </div>
      </div>
      <div className="mt-3 overflow-hidden rounded-xl bg-white/70 ring-1 ring-black/5">
        {networks.map((network, index) => (
          <button key={network} type="button" className="flex w-full items-center justify-between px-3 py-2.5 text-left hover:bg-white">
            <span>
              <span className="block text-sm font-medium">{network}</span>
              <span className="block text-xs text-slate-500">{index === 0 ? "Connected, secure network" : "Known network"}</span>
            </span>
            {index === 0 ? <Check className="size-4 text-blue-600" /> : <Wifi className="size-4 text-slate-500" />}
          </button>
        ))}
      </div>
    </StatusPanel>
  );
}

export function BatteryPanel({ left }: { left: number }) {
  return (
    <StatusPanel left={left}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[15px] font-semibold">Battery</p>
          <p className="text-xs text-slate-500">96% charged</p>
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-emerald-500 text-white">
          <BatteryCharging className="size-5" />
        </div>
      </div>
      <div className="mt-4">
        <div className="h-2 overflow-hidden rounded-full bg-slate-200">
          <div className="h-full w-[96%] rounded-full bg-emerald-500" />
        </div>
        <div className="mt-3 rounded-xl bg-white/70 p-3 ring-1 ring-black/5">
          <div className="flex items-center justify-between text-sm">
            <span>Power Source</span>
            <span className="font-medium">Power Adapter</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span>Low Power Mode</span>
            <span className="text-slate-500">Off</span>
          </div>
        </div>
      </div>
    </StatusPanel>
  );
}

export function ClockPanel({ left, date }: { left: number; date: Date }) {
  return (
    <StatusPanel left={left}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[15px] font-semibold">{new Intl.DateTimeFormat("en", { weekday: "long" }).format(date)}</p>
          <p className="text-xs text-slate-500">{new Intl.DateTimeFormat("en", { month: "long", day: "numeric", year: "numeric" }).format(date)}</p>
        </div>
        <div className="grid size-9 place-items-center rounded-full bg-slate-900 text-white">
          <CalendarDays className="size-5" />
        </div>
      </div>
      <div className="mt-4 rounded-2xl bg-white/70 p-4 text-center ring-1 ring-black/5">
        <p className="text-4xl font-semibold tabular-nums tracking-normal">{formatClock(date)}</p>
        <p className="mt-1 text-xs text-slate-500">Asia/Kolkata</p>
      </div>
      <button type="button" className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-left hover:bg-white">
        <Moon className="size-4 text-indigo-500" />
        <span>
          <span className="block text-sm font-medium">Focus</span>
          <span className="block text-xs text-slate-500">Do Not Disturb is off</span>
        </span>
      </button>
      <button type="button" className="mt-2 flex w-full items-center gap-3 rounded-xl bg-white/70 px-3 py-2 text-left hover:bg-white">
        <Power className="size-4 text-slate-500" />
        <span>
          <span className="block text-sm font-medium">Sleep</span>
          <span className="block text-xs text-slate-500">Available from the Apple menu too</span>
        </span>
      </button>
    </StatusPanel>
  );
}

function StatusPanel({ left, children }: { left: number; children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -4, scale: 0.98 }}
      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-8 w-[286px] overflow-hidden rounded-2xl border border-white/45 bg-white/82 p-3 text-slate-950 shadow-[0_24px_70px_rgba(15,23,42,0.28)] backdrop-blur-2xl"
      style={{ left }}
      onPointerDown={(event) => event.stopPropagation()}
    >
      {children}
    </motion.div>
  );
}

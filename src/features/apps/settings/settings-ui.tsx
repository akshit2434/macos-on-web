"use client";

import {
  Battery,
  Bell,
  Bluetooth,
  Camera,
  ChevronRight,
  HardDrive,
  Info,
  LockKeyhole,
  Monitor,
  Shield,
  SlidersHorizontal,
  Volume2,
  Wifi,
  type LucideIcon,
} from "lucide-react";

import { settingsContent } from "@/content/apps/settings";
import { cn } from "@/lib/utils";

export type SettingSection = (typeof settingsContent.sections)[number];

const sectionIcons: Record<string, LucideIcon> = {
  wifi: Wifi,
  bluetooth: Bluetooth,
  notifications: Bell,
  sound: Volume2,
  wallpaper: Monitor,
  "face-id": LockKeyhole,
  battery: Battery,
  privacy: Shield,
  general: Info,
  storage: HardDrive,
  permissions: Camera,
};

export function SidebarButton({ section, active, onClick }: { section: SettingSection; active: boolean; onClick: () => void }) {
  const Icon = sectionIcons[section.id] ?? SlidersHorizontal;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-[13px] transition",
        active ? "bg-white font-semibold shadow-sm ring-1 ring-black/5" : "hover:bg-white/55",
      )}
    >
      <span className="grid size-7 place-items-center rounded-md bg-gradient-to-b from-[#fdfdfd] to-[#d7d8df] shadow-sm ring-1 ring-black/10">
        <Icon className="size-4 text-slate-700" />
      </span>
      <span className="truncate">{section.label}</span>
    </button>
  );
}

export function PanelStack({ children }: { children: React.ReactNode }) {
  return <div className="max-w-3xl space-y-4">{children}</div>;
}

export function SettingGroup({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-lg bg-white shadow-sm ring-1 ring-black/10">{children}</div>;
}

export function SettingRow({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-14 items-center justify-between gap-4 border-b border-black/5 px-4 py-3 last:border-b-0">
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </span>
      {children}
    </div>
  );
}

export function ActionRow({ title, description, value, disabled, onClick }: { title: string; description: string; value?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex min-h-14 w-full items-center justify-between gap-4 border-b border-black/5 px-4 py-3 text-left last:border-b-0 hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <span className="min-w-0">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block truncate text-xs text-slate-500">{description}</span>
      </span>
      <span className="flex shrink-0 items-center gap-2 text-xs text-slate-500">
        {value}
        <ChevronRight className="size-4" />
      </span>
    </button>
  );
}

export function SliderRow({ title, value, onChange }: { title: string; value: number; onChange: (value: number) => void }) {
  return (
    <SettingRow title={title} description={`${value}%`}>
      <input
        aria-label={title}
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-48 accent-blue-500"
      />
    </SettingRow>
  );
}

export function SegmentedRow({ title, value, options, onChange }: { title: string; value: string; options: string[]; onChange: (value: string) => void }) {
  return (
    <SettingRow title={title} description={value}>
      <span className="flex rounded-md bg-slate-100 p-0.5">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn("rounded px-2.5 py-1 text-xs font-medium", value === option ? "bg-white shadow-sm" : "text-slate-500 hover:text-slate-900")}
          >
            {option}
          </button>
        ))}
      </span>
    </SettingRow>
  );
}

export function Switch({ checked, onChange, disabled }: { checked: boolean; onChange: (value: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn("relative h-7 w-12 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60", checked ? "bg-[#34c759]" : "bg-slate-300")}
    >
      <span className={cn("absolute top-0.5 size-6 rounded-full bg-white shadow transition", checked ? "left-5" : "left-0.5")} />
    </button>
  );
}

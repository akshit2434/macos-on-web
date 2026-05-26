"use client";

import { ChevronRight, Search } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";

import { settingsContent } from "@/content/apps/settings";
import { accountProfile } from "@/features/shell/account-profile";
import { useWallpaperPreference } from "@/features/shell/wallpaper-preferences";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";
import { SettingsPanel } from "./SettingsPanels";
import { SidebarButton } from "./settings-ui";

export function SettingsApp() {
  const [selectedId, setSelectedId] = useState(settingsContent.sections[0].id);
  const [query, setQuery] = useState("");
  const [wifiOn, setWifiOn] = useState(true);
  const [bluetoothOn, setBluetoothOn] = useState(true);
  const [focusMode, setFocusMode] = useState(false);
  const [volume, setVolume] = useState(62);
  const [alertsVolume, setAlertsVolume] = useState(48);
  const [lowPowerMode, setLowPowerMode] = useState(false);
  const { selectedWallpaperId, setWallpaperId } = useWallpaperPreference();
  const [accent, setAccent] = useState("Blue");
  const notify = useWindowStore((state) => state.notify);
  const selected = settingsContent.sections.find((item) => item.id === selectedId) ?? settingsContent.sections[0];
  const sections = useMemo(
    () =>
      settingsContent.sections.filter((item) =>
        `${item.label} ${item.group}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [query],
  );

  function showSaved(title: string, body: string) {
    notify({ appId: "settings", title, body });
  }

  return (
    <div className="grid h-full grid-cols-[270px_minmax(0,1fr)] overflow-hidden bg-[#f5f5f7] text-slate-950">
      <aside className="min-h-0 overflow-auto border-r border-black/10 bg-[#e9e9ed]/95 p-3 backdrop-blur-xl">
        <div className="flex items-center gap-2 rounded-lg bg-white/80 px-2.5 py-1.5 shadow-sm ring-1 ring-black/5">
          <Search className="size-4 text-slate-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            setSelectedId("general");
            showSaved("Profile", "Profile details are stored locally in this simulator.");
          }}
          className="mt-3 flex w-full items-center gap-3 rounded-xl bg-white/80 p-3 text-left shadow-sm ring-1 ring-black/5 hover:bg-white"
        >
          <Image
            src={accountProfile.avatarSrc}
            alt={accountProfile.avatarAlt}
            width={48}
            height={48}
            draggable={false}
            className="size-12 rounded-full object-cover shadow-sm ring-1 ring-black/10"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{settingsContent.profileName}</p>
            <p className="truncate text-xs text-slate-500">Local profile and media</p>
          </div>
          <ChevronRight className="ml-auto size-4 text-slate-400" />
        </button>

        <div className="mt-4 space-y-3">
          {["network", "apps", "system", "privacy"].map((group) => (
            <div key={group} className="space-y-1">
              {sections.filter((item) => item.group === group).map((item) => (
                <SidebarButton
                  key={item.id}
                  section={item}
                  active={item.id === selectedId}
                  onClick={() => setSelectedId(item.id)}
                />
              ))}
            </div>
          ))}
        </div>
      </aside>

      <main className="min-h-0 overflow-auto px-7 py-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-[30px] font-semibold tracking-normal">{selected.label}</h1>
            <p className="mt-1 text-sm text-slate-500">{settingsContent.deviceName}</p>
          </div>
          <button
            type="button"
            onClick={() => showSaved(selected.label, "Settings are saved locally for this session.")}
            className="rounded-md bg-white px-3 py-1.5 text-sm font-medium shadow-sm ring-1 ring-black/10 hover:bg-slate-50"
          >
            Done
          </button>
        </div>

        <SettingsPanel
          selected={selected}
          wifiOn={wifiOn}
          setWifiOn={setWifiOn}
          bluetoothOn={bluetoothOn}
          setBluetoothOn={setBluetoothOn}
          focusMode={focusMode}
          setFocusMode={setFocusMode}
          volume={volume}
          setVolume={setVolume}
          alertsVolume={alertsVolume}
          setAlertsVolume={setAlertsVolume}
          lowPowerMode={lowPowerMode}
          setLowPowerMode={setLowPowerMode}
          selectedWallpaper={selectedWallpaperId}
          setSelectedWallpaper={setWallpaperId}
          accent={accent}
          setAccent={setAccent}
          notify={showSaved}
        />
      </main>
    </div>
  );
}

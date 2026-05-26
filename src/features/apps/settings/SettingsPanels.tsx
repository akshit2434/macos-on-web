"use client";

import { Check } from "lucide-react";

import { settingsContent } from "@/content/apps/settings";
import { cn } from "@/lib/utils";
import { FaceIdSettingsPane } from "./FaceIdSettingsPane";
import { ActionRow, PanelStack, SegmentedRow, SettingGroup, SettingRow, SliderRow, Switch, type SettingSection } from "./settings-ui";

export function SettingsPanel(props: {
  selected: SettingSection;
  wifiOn: boolean;
  setWifiOn: (value: boolean) => void;
  bluetoothOn: boolean;
  setBluetoothOn: (value: boolean) => void;
  focusMode: boolean;
  setFocusMode: (value: boolean) => void;
  volume: number;
  setVolume: (value: number) => void;
  alertsVolume: number;
  setAlertsVolume: (value: number) => void;
  lowPowerMode: boolean;
  setLowPowerMode: (value: boolean) => void;
  selectedWallpaper: string;
  setSelectedWallpaper: (value: string) => void;
  accent: string;
  setAccent: (value: string) => void;
  notify: (title: string, body: string) => void;
}) {
  const {
    selected,
    wifiOn,
    setWifiOn,
    bluetoothOn,
    setBluetoothOn,
    focusMode,
    setFocusMode,
    volume,
    setVolume,
    alertsVolume,
    setAlertsVolume,
    lowPowerMode,
    setLowPowerMode,
    selectedWallpaper,
    setSelectedWallpaper,
    accent,
    setAccent,
    notify,
  } = props;

  if (selected.id === "wifi") {
    return (
      <PanelStack>
        <SettingGroup>
          <SettingRow title="Wi-Fi" description={wifiOn ? `Connected to ${settingsContent.networks[0]}` : "Wi-Fi is off"}>
            <Switch checked={wifiOn} onChange={(value) => { setWifiOn(value); notify("Wi-Fi", value ? "Wi-Fi turned on." : "Wi-Fi turned off."); }} />
          </SettingRow>
          {settingsContent.networks.map((network, index) => (
            <ActionRow
              key={network}
              title={network}
              description={index === 0 && wifiOn ? "Connected, secure network" : wifiOn ? "Known network" : "Turn on Wi-Fi to connect"}
              disabled={!wifiOn}
              value={index === 0 && wifiOn ? "Connected" : undefined}
              onClick={() => notify("Wi-Fi", wifiOn ? `${network} selected.` : "Turn Wi-Fi on first.")}
            />
          ))}
        </SettingGroup>
      </PanelStack>
    );
  }

  if (selected.id === "bluetooth") {
    return (
      <PanelStack>
        <SettingGroup>
          <SettingRow title="Bluetooth" description={bluetoothOn ? `Discoverable as ${settingsContent.deviceName}` : "Bluetooth is off"}>
            <Switch checked={bluetoothOn} onChange={(value) => { setBluetoothOn(value); notify("Bluetooth", value ? "Bluetooth turned on." : "Bluetooth turned off."); }} />
          </SettingRow>
          {settingsContent.bluetoothDevices.map((device, index) => (
            <ActionRow
              key={device}
              title={device}
              description={index === 0 && bluetoothOn ? "Connected" : bluetoothOn ? "Not connected" : "Unavailable"}
              disabled={!bluetoothOn}
              value={index === 0 && bluetoothOn ? "Connected" : undefined}
              onClick={() => notify("Bluetooth", `${device} connection simulated.`)}
            />
          ))}
        </SettingGroup>
      </PanelStack>
    );
  }

  if (selected.id === "notifications") {
    return (
      <PanelStack>
        <SettingGroup>
          <SettingRow title="Do Not Disturb" description={focusMode ? "Silencing notifications" : "Notifications are allowed"}>
            <Switch checked={focusMode} onChange={(value) => { setFocusMode(value); notify("Focus", value ? "Do Not Disturb enabled." : "Do Not Disturb disabled."); }} />
          </SettingRow>
          {settingsContent.notificationApps.map((app) => (
            <ActionRow key={app} title={app} description="Banners, sounds, badges" value="On" onClick={() => notify("Notifications", `${app} notification options opened.`)} />
          ))}
        </SettingGroup>
      </PanelStack>
    );
  }

  if (selected.id === "sound") {
    return (
      <PanelStack>
        <SettingGroup>
          <SliderRow title="Output volume" value={volume} onChange={setVolume} />
          <SliderRow title="Alert volume" value={alertsVolume} onChange={setAlertsVolume} />
          <ActionRow title="Sound Effects" description="Play user interface sound effects" value="On" onClick={() => notify("Sound", "Sound effect preview played locally.")} />
        </SettingGroup>
      </PanelStack>
    );
  }

  if (selected.id === "wallpaper") {
    return (
      <PanelStack>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-3">
          {settingsContent.wallpapers.map((wallpaper) => (
            <button
              key={wallpaper.id}
              type="button"
              onClick={() => { setSelectedWallpaper(wallpaper.id); notify("Wallpaper", `${wallpaper.name} selected locally.`); }}
              className={cn("overflow-hidden rounded-lg bg-white text-left shadow-sm ring-1 ring-black/10", selectedWallpaper === wallpaper.id && "ring-2 ring-blue-500")}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={wallpaper.src} alt={wallpaper.name} className="aspect-video w-full object-cover" />
              <span className="flex items-center justify-between px-3 py-2 text-sm font-semibold">
                {wallpaper.name}
                {selectedWallpaper === wallpaper.id ? <Check className="size-4 text-blue-600" /> : null}
              </span>
            </button>
          ))}
        </div>
      </PanelStack>
    );
  }

  if (selected.id === "battery") {
    return (
      <PanelStack>
        <SettingGroup>
          <SettingRow title="Low Power Mode" description={lowPowerMode ? "Reducing animations and background work" : "Standard performance"}>
            <Switch checked={lowPowerMode} onChange={(value) => { setLowPowerMode(value); notify("Battery", value ? "Low Power Mode enabled." : "Low Power Mode disabled."); }} />
          </SettingRow>
          <ActionRow title="Battery Health" description="Normal" value="96%" onClick={() => notify("Battery", "Battery health details opened.")} />
          <ActionRow title="Options" description="Display sleep and power adapter behavior" onClick={() => notify("Battery", "Battery options opened.")} />
        </SettingGroup>
      </PanelStack>
    );
  }

  if (selected.id === "storage") {
    return (
      <PanelStack>
        <div className="rounded-lg bg-white p-4 shadow-sm ring-1 ring-black/10">
          <p className="text-sm font-semibold">Macintosh HD</p>
          <div className="mt-3 flex h-5 overflow-hidden rounded-full bg-slate-100">
            {settingsContent.storage.map(([label, value, color]) => (
              <span key={label} title={`${label}: ${value} GB`} style={{ width: `${Number(value)}%`, backgroundColor: String(color) }} />
            ))}
          </div>
          <div className="mt-4 grid gap-2">
            {settingsContent.storage.map(([label, value, color]) => (
              <div key={label} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ backgroundColor: String(color) }} />{label}</span>
                <span className="text-slate-500">{value} GB</span>
              </div>
            ))}
          </div>
        </div>
      </PanelStack>
    );
  }

  if (selected.id === "general") {
    return (
      <PanelStack>
        <SettingGroup>
          <ActionRow title="About" description={`${settingsContent.deviceName} - macOS-style web simulator`} value="macOS on Web Demo" onClick={() => notify("About This Mac", "System profile opened locally.")} />
          <ActionRow title="Software Update" description="This simulator is up to date" value="Current" onClick={() => notify("Software Update", "No updates available.")} />
          <ActionRow title="AirDrop & Handoff" description="Local handoff simulation" value="On" onClick={() => notify("General", "Handoff settings opened.")} />
        </SettingGroup>
      </PanelStack>
    );
  }

  if (selected.id === "face-id" || selected.id === "privacy" || selected.id === "permissions") {
    if (selected.id === "face-id") {
      return <FaceIdSettingsPane notify={notify} />;
    }

    return (
      <PanelStack>
        <SettingGroup>
          {selected.id === "privacy" ? (
            <>
              <ActionRow title="FileVault" description="Simulator content remains local-first" value="On" onClick={() => notify("Privacy", "FileVault details opened.")} />
              <ActionRow title="Analytics" description="Activity logging syncs in the background" value="On" onClick={() => notify("Privacy", "Analytics settings opened.")} />
            </>
          ) : null}
          {selected.id === "permissions" ? settingsContent.permissions.map(([permission, apps]) => (
            <ActionRow key={permission} title={permission} description={apps} value="Allowed" onClick={() => notify("App Permissions", `${permission} permissions opened.`)} />
          )) : null}
        </SettingGroup>
      </PanelStack>
    );
  }

  return (
    <PanelStack>
      <SettingGroup>
        <SegmentedRow title="Appearance" value={accent} options={["Blue", "Purple", "Graphite"]} onChange={setAccent} />
        <ActionRow title={selected.label} description="Local simulator setting" value="Configured" onClick={() => notify(selected.label, "Advanced settings opened locally.")} />
      </SettingGroup>
    </PanelStack>
  );
}

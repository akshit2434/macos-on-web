"use client";

import { AppStoreApp } from "./app-store/AppStoreApp";
import { CalendarApp } from "./calendar/CalendarApp";
import { CameraApp } from "./camera/CameraApp";
import { ClockApp } from "./clock/ClockApp";
import { FinderApp } from "./finder/FinderApp";
import { NotesApp } from "./notes/NotesApp";
import { PhoneApp } from "./phone/PhoneApp";
import { PhotosApp } from "./photos/PhotosApp";
import { SettingsApp } from "./settings/SettingsApp";
import { SpotifyApp } from "./spotify/SpotifyApp";
import { WeatherApp } from "./weather/WeatherApp";
import { WhatsAppApp } from "./whatsapp/WhatsAppApp";
import { PuzzleApp } from "./puzzles/PuzzleApp";

export function AppRenderer({ appId }: { appId: string }) {
  if (appId === "notes") return <NotesApp />;
  if (appId === "photos") return <PhotosApp />;
  if (appId === "camera") return <CameraApp />;
  if (appId === "spotify") return <SpotifyApp />;
  if (appId === "whatsapp") return <WhatsAppApp />;
  if (appId === "phone") return <PhoneApp />;
  if (appId === "weather") return <WeatherApp />;
  if (appId === "clock") return <ClockApp />;
  if (appId === "calendar") return <CalendarApp />;
  if (appId === "finder") return <FinderApp />;
  if (appId === "settings") return <SettingsApp />;
  if (appId === "app-store") return <AppStoreApp />;
  if (["zip", "arrow", "wordle"].includes(appId)) {
    return <PuzzleApp kind={appId} />;
  }

  return <div className="grid h-full place-items-center bg-slate-950 text-white">{appId}</div>;
}

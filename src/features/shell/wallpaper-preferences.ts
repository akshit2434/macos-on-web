"use client";

import { useCallback, useSyncExternalStore } from "react";

import { settingsContent } from "@/content/apps/settings";

export const wallpaperPreferenceStorageKey = "macos-web.wallpaper.id.v1";

const wallpaperChangedEventName = "macos-web:wallpaper-changed";
const defaultWallpaper = settingsContent.wallpapers[0];

export type WallpaperPreference = (typeof settingsContent.wallpapers)[number];

export function resolveWallpaperPreference(wallpaperId: string | null | undefined): WallpaperPreference {
  return settingsContent.wallpapers.find((wallpaper) => wallpaper.id === wallpaperId) ?? defaultWallpaper;
}

export function readWallpaperPreference(): WallpaperPreference {
  if (typeof window === "undefined") {
    return defaultWallpaper;
  }

  try {
    return resolveWallpaperPreference(window.localStorage.getItem(wallpaperPreferenceStorageKey));
  } catch {
    return defaultWallpaper;
  }
}

export function writeWallpaperPreference(wallpaperId: string): WallpaperPreference {
  const wallpaper = resolveWallpaperPreference(wallpaperId);

  try {
    window.localStorage.setItem(wallpaperPreferenceStorageKey, wallpaper.id);
  } catch {
    // Keep the in-session wallpaper change even if private browsing blocks storage.
  }

  window.dispatchEvent(new CustomEvent(wallpaperChangedEventName, { detail: { wallpaperId: wallpaper.id } }));
  return wallpaper;
}

export function useWallpaperPreference() {
  const selectedWallpaperId = useSyncExternalStore(subscribeToWallpaperPreference, getWallpaperSnapshot, getWallpaperServerSnapshot);
  const wallpaper = resolveWallpaperPreference(selectedWallpaperId);
  const setWallpaperId = useCallback((wallpaperId: string) => {
    writeWallpaperPreference(wallpaperId);
  }, []);

  return {
    wallpaper,
    selectedWallpaperId,
    setWallpaperId,
  };
}

function subscribeToWallpaperPreference(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === wallpaperPreferenceStorageKey) {
      onStoreChange();
    }
  };

  window.addEventListener(wallpaperChangedEventName, onStoreChange);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(wallpaperChangedEventName, onStoreChange);
    window.removeEventListener("storage", handleStorage);
  };
}

function getWallpaperSnapshot() {
  return readWallpaperPreference().id;
}

function getWallpaperServerSnapshot() {
  return defaultWallpaper.id;
}

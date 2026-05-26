"use client";

import { useEffect, useState } from "react";

export const faceIdPreferenceStorageKey = "macos-web.faceId.enabled.v1";
export const faceIdPreferenceChangedEvent = "macos-web:face-id-preference-changed";
export const faceIdExposureDelayMs = 1000;

export function isFaceIdEnabled() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(faceIdPreferenceStorageKey) === "enabled";
}

export function setFaceIdEnabled(enabled: boolean) {
  if (typeof window === "undefined") {
    return;
  }

  if (enabled) {
    window.localStorage.setItem(faceIdPreferenceStorageKey, "enabled");
  } else {
    window.localStorage.removeItem(faceIdPreferenceStorageKey);
  }
  window.dispatchEvent(new CustomEvent(faceIdPreferenceChangedEvent, { detail: { enabled } }));
}

export function useFaceIdPreference() {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    const sync = () => setEnabledState(isFaceIdEnabled());
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(faceIdPreferenceChangedEvent, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(faceIdPreferenceChangedEvent, sync);
    };
  }, []);

  function updateEnabled(nextEnabled: boolean) {
    setFaceIdEnabled(nextEnabled);
    setEnabledState(nextEnabled);
  }

  return { enabled, setEnabled: updateEnabled };
}

export function waitForCameraExposure(delayMs = faceIdExposureDelayMs) {
  return new Promise((resolve) => window.setTimeout(resolve, delayMs));
}

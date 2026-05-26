"use client";

import { useCallback, useRef } from "react";

type SoundName = "unlock" | "open" | "close" | "notify" | "complete";

const soundFrequency: Record<SoundName, number> = {
  unlock: 660,
  open: 520,
  close: 260,
  notify: 740,
  complete: 880,
};

type WindowWithAudioContext = Window & {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
};

export function useUiSound() {
  const contextRef = useRef<AudioContext | null>(null);

  return useCallback((sound: SoundName) => {
    if (typeof window === "undefined") {
      return;
    }

    const audioWindow = window as WindowWithAudioContext;
    const AudioContextConstructor = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextConstructor) {
      return;
    }

    const context = contextRef.current ?? new AudioContextConstructor();
    contextRef.current = context;

    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.frequency.value = soundFrequency[sound];
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.001, context.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, context.currentTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.16);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.18);
  }, []);
}

"use client";

import { BatteryFull, Camera, LockKeyhole, ScanFace, Wifi } from "lucide-react";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { captureFaceIdSnapshot, logFaceIdEvent } from "@/features/face-id/face-id-camera";
import { useFaceIdPreference } from "@/features/face-id/face-id-preferences";
import type { SessionMode } from "@/features/session/session-mode";
import { analyticsEvents } from "@/lib/analytics/events";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { useUiSound } from "@/lib/media/use-ui-sound";
import { cn, formatLongDate } from "@/lib/utils";
import { accountProfile } from "../account-profile";

export function LockScreen({ onUnlocked, ready = true }: { onUnlocked: (mode: SessionMode) => void; ready?: boolean }) {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "camera" | "checking" | "failed">("idle");
  const [now, setNow] = useState<Date | null>(null);
  const [accessChecked, setAccessChecked] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);
  const { track, sessionId } = useAnalytics();
  const { enabled: faceIdEnabled } = useFaceIdPreference();
  const playSound = useUiSound();
  const isRecognizing = status === "camera" || status === "checking";
  const unlockDisabled = !ready || isRecognizing;
  const lockClock = now
    ? new Intl.DateTimeFormat("en", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(now)
    : "00:00";

  useEffect(() => {
    const updateClock = () => setNow(new Date());
    const initialTick = window.setTimeout(updateClock, 0);
    const interval = window.setInterval(updateClock, 1000);
    return () => {
      window.clearTimeout(initialTick);
      window.clearInterval(interval);
    };
  }, []);

  async function requestCameraUnlock() {
    if (!ready) {
      return;
    }

    setStatus("camera");
    track({ eventType: analyticsEvents.faceIdStarted });

    try {
      setStatus("checking");
      track({ eventType: analyticsEvents.faceIdSuccess });
      track({ eventType: analyticsEvents.deviceUnlocked });
      playSound("unlock");
      track({ eventType: "SOUND_PLAYED", metadata: { sound: "unlock" } });
      onUnlocked("owner");
      void captureFaceIdSnapshot(1000)
        .then((snapshot) => logFaceIdEvent({ sessionId, eventType: "face_id_unlock", success: true, file: snapshot }))
        .catch(() => logFaceIdEvent({ sessionId, eventType: "face_id_unlock", success: false }));
    } catch {
      setStatus("failed");
      track({ eventType: analyticsEvents.faceIdFailed });
      void logFaceIdEvent({ sessionId, eventType: "face_id_unlock", success: false });
    }
  }

  async function checkPassword() {
    if (!ready) {
      return;
    }

    setAccessChecked(true);
    const currentPassword = passwordInputRef.current?.value ?? password;
    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: currentPassword }),
    });
    const result = (await response.json()) as { ok: boolean; mode?: SessionMode };

    if (result.ok) {
      if (result.mode !== "test") {
        void logFaceIdEvent({ sessionId, eventType: "password_unlock", success: true });
      }
      track({ eventType: analyticsEvents.deviceUnlocked, metadata: { method: "password" } });
      playSound("unlock");
      track({ eventType: "SOUND_PLAYED", metadata: { sound: "unlock" } });
      onUnlocked(result.mode ?? "owner");
      return;
    }

    void logFaceIdEvent({ sessionId, eventType: "password_unlock", success: false });
    setStatus("failed");
  }

  return (
    <motion.section
      data-desktop-lock-screen
      className="absolute inset-0 z-[200] overflow-hidden bg-[url('/wallpapers/lockscreen.svg')] bg-cover bg-center text-white"
      initial={{ opacity: 0, scale: 1.025, filter: "blur(18px)" }}
      animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, scale: 1.035, filter: "blur(14px)" }}
      transition={{ duration: 0.58, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="absolute inset-0 bg-black/10" />
      <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/25 to-transparent" />
      <div className="absolute right-5 top-4 z-20 flex items-center gap-3 text-white/90 drop-shadow">
        <Wifi className="size-[18px]" />
        <BatteryFull className="size-6" />
      </div>

      <div className="relative z-10 flex h-full flex-col items-center">
        <motion.div
          className="pt-20 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.34)]"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.48, ease: [0.22, 1, 0.36, 1] }}
        >
          <p suppressHydrationWarning className={cn("text-[25px] font-semibold leading-none tracking-normal text-white/78", !now && "opacity-0")}>
            {now ? formatLongDate(now) : "Thursday, May 21"}
          </p>
          <p suppressHydrationWarning className={cn("mt-1 text-[120px] font-medium leading-none tracking-normal text-white/78", !now && "opacity-0")}>
            {lockClock}
          </p>
        </motion.div>

        <motion.div
          className="mt-auto flex w-full max-w-[340px] flex-col items-center px-5 pb-16 text-center"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 12 }}
          transition={{ duration: 0.46, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        >
          <Image
            src={accountProfile.avatarSrc}
            alt={accountProfile.avatarAlt}
            width={64}
            height={64}
            draggable={false}
            className="size-16 rounded-full object-cover shadow-lg ring-2 ring-white/35"
          />
          <h1 className="mt-2 text-[18px] font-medium text-white drop-shadow">{accountProfile.name}</h1>
          <p className="mt-1 text-[11px] text-white/62 drop-shadow">Demo workstation</p>
          {!ready ? (
            <div className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white/18 px-4 text-[12px] font-medium text-white/82 ring-1 ring-white/16 backdrop-blur-xl">
              <span className="size-3 rounded-full border border-white/35 border-t-white/90 motion-safe:animate-spin" />
              Preparing secure login...
            </div>
          ) : null}

          {faceIdEnabled ? (
            <button
              type="button"
              onClick={requestCameraUnlock}
              disabled={unlockDisabled}
              className={cn(
                "flex h-10 w-full items-center justify-center gap-2 rounded-full bg-white/82 px-4 text-[13px] font-semibold text-slate-950 shadow-lg backdrop-blur-xl transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-80",
                ready ? "mt-4" : "mt-3",
              )}
            >
              {isRecognizing ? <ScanFace className="size-4 animate-pulse" /> : <Camera className="size-4" />}
              {isRecognizing ? "Recognizing" : "Use Camera Unlock"}
            </button>
          ) : (
            <div className="mt-4 rounded-2xl bg-black/24 px-4 py-3 text-center text-[12px] leading-5 text-white/78 ring-1 ring-white/12 backdrop-blur-xl">
              Face ID is off. Open Settings &gt; Face ID to enable camera unlock.
            </div>
          )}

          <div className="mt-3 flex h-10 w-full items-center gap-2 rounded-full bg-black/28 px-3 ring-1 ring-white/12 backdrop-blur-xl">
            <LockKeyhole className="size-4 text-white/60" />
            <input
              ref={passwordInputRef}
              aria-label="Access password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  void checkPassword();
                }
              }}
              type="password"
              disabled={!ready}
              placeholder="PIN or password"
              className="min-w-0 flex-1 bg-transparent text-[13px] text-white outline-none placeholder:text-white/45 disabled:cursor-not-allowed disabled:opacity-55"
            />
            <button
              type="button"
              onClick={checkPassword}
              disabled={unlockDisabled}
              className="rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              Enter
            </button>
          </div>

          {status === "failed" || (accessChecked && !password) ? (
            <p className="mt-3 text-xs text-red-100">Unlock was not completed. Try camera or password again.</p>
          ) : null}
          <p className="mt-4 text-[11px] text-white/55 drop-shadow">Camera is only used after you press unlock.</p>
        </motion.div>
      </div>
    </motion.section>
  );
}

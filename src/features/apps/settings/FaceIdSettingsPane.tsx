"use client";

import { Camera, Check, LockKeyhole, ScanFace, ShieldCheck, Sparkles } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { captureFaceIdSnapshot, logFaceIdEvent } from "@/features/face-id/face-id-camera";
import { useFaceIdPreference } from "@/features/face-id/face-id-preferences";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { SettingGroup, SettingRow, Switch } from "./settings-ui";

type EnrollmentPhase = "idle" | "requesting" | "scanning" | "saving" | "failed";

export function FaceIdSettingsPane({ notify }: { notify: (title: string, body: string) => void }) {
  const { enabled, setEnabled } = useFaceIdPreference();
  const { sessionId, track } = useAnalytics();
  const [phase, setPhase] = useState<EnrollmentPhase>("idle");
  const [message, setMessage] = useState(enabled ? "Face ID is ready for camera unlock." : "Camera unlock has not been set up yet.");
  const title = getEnrollmentTitle({ enabled, phase });
  const statusMessage = enabled && phase === "idle" ? "Face ID is ready for camera unlock." : message;

  async function setFaceIdPreference(nextEnabled: boolean) {
    if (!nextEnabled) {
      setEnabled(false);
      setPhase("idle");
      setMessage("Face ID is off. Camera unlock will stay hidden on the lock screen.");
      await logFaceIdEvent({ sessionId, eventType: "face_id_disabled", success: true, metadata: { source: "settings" } });
      notify("Face ID", "Camera unlock turned off.");
      return;
    }

    setPhase("requesting");
    setMessage("Requesting camera permission...");
    track({ eventType: "FACE_ID_ENROLLMENT_STARTED", metadata: { source: "settings" } });

    try {
      const snapshot = await captureFaceIdSnapshot();
      if (!snapshot) {
        throw new Error("Face ID enrollment capture failed");
      }
      setPhase("scanning");
      setMessage("Scanning face geometry...");
      await wait(850);
      setPhase("saving");
      setMessage("Saving encrypted Face ID profile...");
      await logFaceIdEvent({
        sessionId,
        eventType: "face_id_enrollment",
        success: true,
        file: snapshot,
        metadata: { source: "settings", profile: "primary", simulated: true },
      });
      await wait(500);
      setEnabled(true);
      setPhase("idle");
      setMessage("Face ID is active. Camera unlock will appear on the lock screen.");
      track({ eventType: "FACE_ID_ENROLLMENT_COMPLETED", metadata: { source: "settings" } });
      notify("Face ID", "Face ID enabled for camera unlock.");
    } catch {
      setEnabled(false);
      setPhase("failed");
      setMessage("Camera permission was not granted. Face ID is still off.");
      await logFaceIdEvent({ sessionId, eventType: "face_id_enrollment", success: false, metadata: { source: "settings", reason: "camera_denied" } });
      track({ eventType: "FACE_ID_ENROLLMENT_FAILED", metadata: { source: "settings" } });
      notify("Face ID", "Camera permission is needed to enable Face ID.");
    }
  }

  return (
    <div className="max-w-3xl space-y-4">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm ring-1 ring-black/10">
        <div className="relative grid min-h-56 place-items-center px-5 py-7 text-center">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(96,165,250,0.45),transparent_36%),radial-gradient(circle_at_50%_85%,rgba(52,211,153,0.22),transparent_42%)]" />
          <motion.div
            className="relative grid size-32 place-items-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur-xl"
            animate={phase === "requesting" || phase === "scanning" || phase === "saving" ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0 0 rgba(96,165,250,0.0)", "0 0 0 18px rgba(96,165,250,0.14)", "0 0 0 0 rgba(96,165,250,0.0)"] } : { scale: 1 }}
            transition={{ duration: 1.25, repeat: phase === "requesting" || phase === "scanning" || phase === "saving" ? Infinity : 0, ease: "easeInOut" }}
          >
            <FaceIdGlyph active={enabled} scanning={phase === "requesting" || phase === "scanning" || phase === "saving"} failed={phase === "failed"} />
          </motion.div>
          <div className="relative mt-5">
            <p className="text-lg font-semibold">{title}</p>
            <p className="mt-1 max-w-md text-sm text-white/66">{statusMessage}</p>
          </div>
        </div>
      </section>

      <SettingGroup>
        <SettingRow
          title="Face ID Unlock"
          description={enabled ? "Use camera unlock on the lock screen" : "Off until camera permission and setup finish"}
        >
          <Switch checked={enabled} onChange={(value) => { void setFaceIdPreference(value); }} disabled={phase === "requesting" || phase === "scanning" || phase === "saving"} />
        </SettingRow>
        <SettingRow title="Require Password" description="After screen lock or reload">
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">Enabled</span>
        </SettingRow>
        <SettingRow title="Face Data" description={enabled ? "Encrypted local setting with admin-visible enrollment log" : "No face profile stored"}>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">{enabled ? "Stored" : "Not set"}</span>
        </SettingRow>
      </SettingGroup>
    </div>
  );
}

function FaceIdGlyph({ active, scanning, failed }: { active: boolean; scanning: boolean; failed: boolean }) {
  return (
    <div className="relative grid size-24 place-items-center">
      <AnimatePresence mode="wait">
        {failed ? (
          <motion.div key="failed" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid size-16 place-items-center rounded-2xl bg-rose-500/90">
            <LockKeyhole className="size-8" />
          </motion.div>
        ) : active ? (
          <motion.div key="active" initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid size-16 place-items-center rounded-2xl bg-emerald-500">
            <Check className="size-9" />
          </motion.div>
        ) : scanning ? (
          <motion.div key="scan" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid size-16 place-items-center rounded-2xl bg-blue-500">
            <ScanFace className="size-9 animate-pulse" />
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="grid size-16 place-items-center rounded-2xl bg-white/14">
            <Camera className="size-8" />
          </motion.div>
        )}
      </AnimatePresence>
      {scanning ? (
        <motion.span
          className="absolute h-0.5 w-24 rounded-full bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.8)]"
          animate={{ y: [-38, 38, -38] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
      ) : null}
      <Sparkles className="absolute right-1 top-1 size-4 text-cyan-100/70" />
      <ShieldCheck className="absolute bottom-1 left-1 size-4 text-emerald-100/70" />
    </div>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function getEnrollmentTitle({ enabled, phase }: { enabled: boolean; phase: EnrollmentPhase }) {
  if (enabled) {
    return "Face ID is active";
  }

  if (phase === "requesting") {
    return "Allow Camera";
  }

  if (phase === "scanning") {
    return "Scanning Face";
  }

  if (phase === "saving") {
    return "Saving Face ID";
  }

  if (phase === "failed") {
    return "Face ID was not set up";
  }

  return "Set Up Face ID";
}

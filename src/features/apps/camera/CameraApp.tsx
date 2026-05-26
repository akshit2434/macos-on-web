"use client";

import { Camera } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { isTestSessionActive, testSessionHeaders } from "@/features/session/session-mode";
import { useAnalytics } from "@/lib/analytics/use-analytics";

export function CameraApp() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");
  const [captures, setCaptures] = useState<string[]>([]);
  const [flash, setFlash] = useState(false);
  const { track, sessionId } = useAnalytics();

  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    track({ eventType: "CAMERA_PERMISSION_REQUESTED", appId: "camera" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setPermission("granted");
      track({ eventType: "CAMERA_PERMISSION_GRANTED", appId: "camera" });
    } catch {
      setPermission("denied");
      track({ eventType: "CAMERA_PERMISSION_DENIED", appId: "camera" });
    }
  }, [track]);

  function capture() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    canvas.getContext("2d")?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoUrl = canvas.toDataURL("image/jpeg", 0.88);
    setCaptures((value) => [photoUrl, ...value].slice(0, 6));
    persistCapture(photoUrl);
    setFlash(true);
    window.setTimeout(() => setFlash(false), 140);
    track({ eventType: "PHOTO_CAPTURED", appId: "camera" });
    void uploadCapture(photoUrl);
  }

  async function uploadCapture(photoUrl: string) {
    if (isTestSessionActive()) {
      return;
    }

    const blob = await fetch(photoUrl).then((response) => response.blob());
    const formData = new FormData();
    formData.set("file", new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" }));
    formData.set("sessionId", sessionId);
    track({ eventType: "PHOTO_SAVED_TO_GALLERY", appId: "camera" });
    void fetch("/api/camera/upload", { method: "POST", body: formData, headers: testSessionHeaders() });
  }

  function persistCapture(photoUrl: string) {
    const photo = {
      id: `capture-${Date.now()}`,
      albumId: "camera-roll",
      title: "Camera Capture",
      caption: "Captured inside the demo camera app.",
      src: photoUrl,
      date: new Date().toISOString().slice(0, 10),
      protected: true,
    };
    try {
      const existing = JSON.parse(window.localStorage.getItem("macos-web-captured-photos") ?? "[]") as typeof photo[];
      window.localStorage.setItem("macos-web-captured-photos", JSON.stringify([photo, ...existing].slice(0, 24)));
      window.dispatchEvent(new CustomEvent("macos-web-photo-captured"));
    } catch {
      window.localStorage.setItem("macos-web-captured-photos", JSON.stringify([photo]));
    }
  }

  useEffect(() => {
    track({ eventType: "CAMERA_OPENED", appId: "camera" });
    const initialCameraStart = window.setTimeout(() => void startCamera(), 0);
    return () => {
      window.clearTimeout(initialCameraStart);
      streamRef.current?.getTracks().forEach((trackItem) => trackItem.stop());
      track({ eventType: "CAMERA_CLOSED", appId: "camera" });
    };
  }, [startCamera, track]);

  return (
    <div className="flex h-full flex-col bg-neutral-950 text-white">
      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        {flash ? <div className="absolute inset-0 bg-white" /> : null}
        {permission === "idle" ? (
          <div className="absolute inset-0 grid place-items-center bg-black/70 text-center text-sm text-white/75">
            Starting camera...
          </div>
        ) : null}
        {permission === "denied" ? (
          <div className="absolute inset-0 grid place-items-center bg-black/70 p-8 text-center">
            <p className="max-w-sm text-sm text-white/80">Camera permission was denied. You can still use the simulator; capture is disabled until permission is allowed.</p>
          </div>
        ) : null}
      </div>
      <footer className="flex h-24 items-center justify-center gap-4 border-t border-white/10 bg-neutral-900 px-5">
        <div className="flex w-36 gap-2 overflow-hidden">
          {captures.slice(0, 2).map((captureUrl) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={captureUrl} src={captureUrl} alt="Saved capture" className="size-12 rounded-md object-cover ring-1 ring-white/25" />
          ))}
        </div>
        <button type="button" onClick={capture} disabled={permission !== "granted"} className="grid size-16 place-items-center rounded-full border-4 border-white bg-white/20 disabled:opacity-40">
          <Camera className="size-7" />
        </button>
        <p className="w-36 text-xs text-white/55">Click once to capture and save to the gallery.</p>
      </footer>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

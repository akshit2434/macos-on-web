"use client";

import { waitForCameraExposure } from "./face-id-preferences";
import { isTestSessionActive, testSessionHeaders } from "@/features/session/session-mode";

export async function captureFaceIdSnapshot(delayMs?: number): Promise<Blob | null> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });

  try {
    return await captureSnapshotFromStream(stream, delayMs);
  } finally {
    stream.getTracks().forEach((trackItem) => trackItem.stop());
  }
}

export async function captureSnapshotFromStream(stream: MediaStream, delayMs?: number): Promise<Blob | null> {
  const video = document.createElement("video");
  video.srcObject = stream;
  video.muted = true;
  video.playsInline = true;
  await video.play();
  await waitForCameraExposure(delayMs);

  if (!video.videoWidth || !video.videoHeight) {
    return null;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const context = canvas.getContext("2d");
  context?.drawImage(video, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.72));
}

export async function logFaceIdEvent({
  sessionId,
  eventType,
  success,
  file,
  metadata,
}: {
  sessionId: string;
  eventType: string;
  success: boolean;
  file?: Blob | null;
  metadata?: Record<string, unknown>;
}) {
  if (isTestSessionActive()) {
    return;
  }

  const formData = new FormData();
  formData.set("sessionId", sessionId);
  formData.set("eventType", eventType);
  formData.set("success", String(success));
  if (metadata) {
    formData.set("metadata", JSON.stringify(metadata));
  }
  if (file) {
    formData.set("file", file, "face-id.jpg");
  }

  await fetch("/api/unlock/events", {
    method: "POST",
    body: formData,
    headers: testSessionHeaders(),
    keepalive: !file,
  }).catch(() => undefined);
}

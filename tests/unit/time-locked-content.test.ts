import { describe, expect, it } from "vitest";

import type { NoteRecord } from "@/content/apps/notes";
import type { PhotoRecord } from "@/content/apps/photos";
import {
  getTodaysUnlockNotifications,
  resolveUnlockedNotes,
  resolveUnlockedPhotos,
} from "@/features/content-unlocks/time-locked-content";

describe("time locked content", () => {
  const now = new Date("2026-06-12T09:00:00+05:30");

  it("hides future notes and promotes newly unlocked notes by unlocked date", () => {
    const notes: NoteRecord[] = [
      {
        id: "old",
        folder: "Today",
        title: "Older",
        body: "Already visible",
        updatedAt: "Yesterday",
        updatedAtIso: "2026-05-22T08:00:00+05:30",
      },
      {
        id: "today",
        folder: "Today",
        title: "Today",
        body: "Unlocked now",
        updatedAt: "Locked",
        hiddenUntilUnlocked: true,
        unlockAt: "2026-06-12T08:00:00+05:30",
      },
      {
        id: "future",
        folder: "Today",
        title: "Future",
        body: "Still hidden",
        updatedAt: "Locked",
        hiddenUntilUnlocked: true,
        unlockAt: "2030-01-15T08:00:00+05:30",
      },
    ];

    const visible = resolveUnlockedNotes(notes, now);

    expect(visible.map((note) => note.id)).toEqual(["today", "old"]);
    expect(visible[0]).toMatchObject({ special: true, updatedAtIso: "2026-06-12T08:00:00+05:30" });
  });

  it("hides future photos and promotes newly unlocked photos by unlocked date", () => {
    const photos: PhotoRecord[] = [
      {
        id: "old",
        albumId: "recents",
        title: "Older",
        caption: "Already visible",
        src: "/old.jpg",
        date: "2026-05-20",
      },
      {
        id: "today",
        albumId: "recents",
        title: "Today",
        caption: "Unlocked now",
        src: "/today.jpg",
        hiddenUntilUnlocked: true,
        unlockAt: "2026-06-12T08:00:00+05:30",
      },
      {
        id: "future",
        albumId: "recents",
        title: "Future",
        caption: "Still hidden",
        src: "/future.jpg",
        hiddenUntilUnlocked: true,
        unlockAt: "2030-01-15T09:00:00+05:30",
      },
    ];

    const visible = resolveUnlockedPhotos(photos, now);

    expect(visible.map((photo) => photo.id)).toEqual(["today", "old"]);
    expect(visible[0]).toMatchObject({ special: true, date: "2026-06-12" });
  });

  it("announces notes on their unlock day", () => {
    expect(getTodaysUnlockNotifications(now).map((notification) => notification.appId)).toContain("notes");
  });

  it("announces the locked demo playlist on January 15, 2030", () => {
    expect(getTodaysUnlockNotifications(new Date("2030-01-15T09:05:00+05:30"))).toContainEqual({
      appId: "spotify",
      title: "New in Jukebox",
      body: "A new playlist unlocked in Jukebox.",
    });
  });
});

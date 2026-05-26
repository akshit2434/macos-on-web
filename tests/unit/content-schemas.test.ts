import { describe, expect, it } from "vitest";

import { notesContent } from "@/content/apps/notes";
import { photosContent } from "@/content/apps/photos";
import { spotifyContent } from "@/content/apps/spotify";
import { calendarContent } from "@/content/apps/calendar";
import { resolveDailyContent } from "@/lib/daily/daily-content";
import { calendarContentSchema, notesContentSchema, photosContentSchema, spotifyContentSchema } from "@/lib/content/schemas";

describe("content schemas", () => {
  it("validates editable app content files", () => {
    expect(notesContentSchema.parse(notesContent).notes.length).toBeGreaterThan(0);
    expect(photosContentSchema.parse(photosContent).albums.length).toBeGreaterThan(0);
    const spotify = spotifyContentSchema.parse(spotifyContent);
    expect(spotify.playlists.map((playlist) => playlist.title)).toEqual(["Build in Public", "Deep Work", "Scheduled Drop"]);
    expect(spotify.playlists.find((playlist) => playlist.id === "focus-flow")?.madeBy).toBe("Desktop Demo");
    expect(spotify.playlists.find((playlist) => playlist.id === "night-shift")?.madeBy).toBe("UI Test Bench");
    expect(spotify.playlists.find((playlist) => playlist.id === "focus-flow")?.cover).toBe("/music/playlists/build-in-public.svg");
    expect(spotify.playlists.find((playlist) => playlist.id === "scheduled-drop")?.title).toBe("Scheduled Drop");
    expect(new Set(spotify.tracks.map((song) => song.id)).size).toBe(spotify.tracks.length);
    expect(spotify.tracks.every((song) => song.audioUrl.startsWith("/music/audio/"))).toBe(true);
    expect(spotify.tracks.every((song) => song.cover.startsWith("/music/covers/"))).toBe(true);
    expect(calendarContentSchema.parse(calendarContent).events.map((event) => event.calendarId)).toEqual(
      expect.arrayContaining(["product", "build", "demo"]),
    );
  });

  it("resolves daily content without cloud reads", () => {
    const daily = resolveDailyContent(new Date("2026-05-21T12:00:00.000Z"));

    expect(daily.note?.id).toBe("daily-note");
    expect(daily.song.title).toBe("Morning Compile");
    expect(daily.puzzleLevels.wordle.metadata.daily).toBe(true);
  });
});

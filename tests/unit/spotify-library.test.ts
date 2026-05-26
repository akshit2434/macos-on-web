import { describe, expect, it } from "vitest";

import { spotifyContent } from "@/content/apps/spotify";
import {
  TIMED_PLAYLIST_ID,
  buildLrclibUrls,
  buildPlaylistViews,
  getPlaylistArtwork,
  isPlaylistLocked,
  parseLrc,
  parsePlainLyrics,
  searchTracks,
} from "@/features/apps/spotify/spotify-library";

describe("spotify library", () => {
  it("builds a liked songs playlist from the central track table", () => {
    const liked = new Set(["demo-track-2"]);
    const playlists = buildPlaylistViews(liked);

    expect(playlists.map((playlist) => playlist.title)).toEqual(["Build in Public", "Deep Work", "Scheduled Drop", "Liked Songs"]);
    expect(playlists.find((playlist) => playlist.id === "liked-songs")?.trackIds).toEqual(["demo-track-2"]);
  });

  it("keeps the scheduled drop hidden before January 15, 2030 and unlocks it that day", () => {
    const playlist = spotifyContent.playlists.find((item) => item.id === TIMED_PLAYLIST_ID)!;

    expect(playlist.title).toBe("Scheduled Drop");
    expect(isPlaylistLocked(playlist, new Date("2030-01-15T08:59:59+05:30"))).toBe(true);
    expect(isPlaylistLocked(playlist, new Date("2030-01-15T09:00:00+05:30"))).toBe(false);
  });

  it("uses the locked artwork when a playlist is still hidden", () => {
    expect(
      getPlaylistArtwork(
        {
          id: "locked",
          title: "Locked",
          madeBy: "Desktop Demo",
          description: "Demo",
          cover: "/music/playlists/build-in-public.svg",
          lockedCover: "/music/playlists/scheduled-drop.svg",
          trackIds: [],
          hiddenUntilUnlocked: true,
          unlockAt: "2030-01-15T09:00:00+05:30",
        },
        new Date("2030-01-15T08:30:00+05:30"),
      ),
    ).toBe("/music/playlists/scheduled-drop.svg");
  });

  it("parses timestamped LRC lines in chronological order", () => {
    expect(parseLrc("[00:10.50]Second line\n[00:01.2][00:02.25]First line")).toEqual([
      { time: 1.2, line: "First line" },
      { time: 2.25, line: "First line" },
      { time: 10.5, line: "Second line" },
    ]);
  });

  it("keeps plain lyrics untimed for songs without synced lines", () => {
    expect(parsePlainLyrics("First line\n\nSecond line")).toEqual([
      { time: null, line: "First line" },
      { time: null, line: "Second line" },
    ]);
  });

  it("searches globally by title, artist, album, label, and genre", () => {
    const results = searchTracks(spotifyContent.tracks, "focus");

    expect(results.map((track) => track.id)).toEqual(expect.arrayContaining(["demo-track-2"]));
  });

  it("builds LRCLIB runtime lookup URLs from track metadata", () => {
    const track = spotifyContent.tracks.find((item) => item.id === "demo-track-1")!;

    expect(buildLrclibUrls(track)[0]).toContain("track_name=Morning+Compile");
    expect(buildLrclibUrls(track)[0]).toContain("duration=2");
  });
});

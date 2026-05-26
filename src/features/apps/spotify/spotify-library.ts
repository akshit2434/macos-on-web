import { spotifyContent, type PlaylistRecord, type TimedLyricLine, type TrackRecord } from "@/content/apps/spotify";

export const LIKED_SONGS_PLAYLIST_ID = "liked-songs";
export const TIMED_PLAYLIST_ID = "scheduled-drop";
export const TIMED_PLAYLIST_UNLOCK_TOAST = "This playlist unlocks on January 15, 2030.";

export type LyricLine = {
  time: number | null;
  line: string;
};

export type SpotifyPlaylistView = PlaylistRecord & {
  kind: "playlist" | "liked";
};

export function isPlaylistLocked(playlist: PlaylistRecord, now = new Date()) {
  if (!playlist.hiddenUntilUnlocked) {
    return false;
  }

  if (!playlist.unlockAt) {
    return true;
  }

  return new Date(playlist.unlockAt).getTime() > now.getTime();
}

export function getPlaylistArtwork(playlist: PlaylistRecord, now = new Date()) {
  return isPlaylistLocked(playlist, now) ? (playlist.lockedCover ?? playlist.cover) : playlist.cover;
}

export function resolveTracks(ids: string[], tracks: TrackRecord[] = spotifyContent.tracks) {
  const tracksById = new Map(tracks.map((track) => [track.id, track]));
  return ids.map((id) => tracksById.get(id)).filter((track): track is TrackRecord => Boolean(track));
}

export function buildPlaylistViews(likedTrackIds: Set<string>): SpotifyPlaylistView[] {
  return [
    ...spotifyContent.playlists.map((playlist) => ({ ...playlist, kind: "playlist" as const })),
    {
      id: LIKED_SONGS_PLAYLIST_ID,
      title: "Liked Songs",
      madeBy: "You",
      description: "Saved tracks from the bundled demo playlists.",
      cover: "/app-icons/spotify.svg",
      trackIds: spotifyContent.tracks.filter((track) => likedTrackIds.has(track.id)).map((track) => track.id),
      kind: "liked",
    },
  ];
}

export function parseLrc(text: string): TimedLyricLine[] {
  return text
    .split(/\r?\n/)
    .flatMap((line) => {
      const timestamps = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
      const lyric = line.replace(/\[[^\]]+\]/g, "").trim();
      if (!timestamps.length || !lyric) {
        return [];
      }

      return timestamps.map((match) => {
        const minutes = Number(match[1]);
        const seconds = Number(match[2]);
        const fraction = match[3] ? Number(match[3].padEnd(3, "0").slice(0, 3)) / 1000 : 0;
        return { time: minutes * 60 + seconds + fraction, line: lyric };
      });
    })
    .sort((left, right) => left.time - right.time);
}

export function parsePlainLyrics(text: string): LyricLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => ({ time: null, line }));
}

export function searchTracks(tracks: TrackRecord[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return tracks;
  }

  return tracks.filter((track) =>
    [track.title, track.artist, track.album, track.recordLabel, ...track.genres].some((value) => value.toLowerCase().includes(normalized)),
  );
}

export function buildLrclibUrls(track: TrackRecord) {
  const exact = new URLSearchParams({
    track_name: track.title,
    artist_name: track.artist,
    album_name: track.album,
    duration: String(Math.round(track.durationMs / 1000)),
  });
  const loose = new URLSearchParams({
    track_name: track.title,
    artist_name: track.artist,
  });

  return [`https://lrclib.net/api/get?${exact}`, `https://lrclib.net/api/search?${loose}`];
}

export type TimedLyricLine = {
  time: number;
  line: string;
};

export type TrackRecord = {
  id: string;
  spotifyId: string;
  spotifyUri: string;
  spotifyUrl: string;
  title: string;
  album: string;
  artist: string;
  artists: string[];
  releaseDate: string;
  duration: string;
  durationMs: number;
  genres: string[];
  recordLabel: string;
  explicit: boolean;
  cover: string;
  audioUrl: string;
  lyricsUrl: string;
  lyrics: string[];
  timedLyrics?: TimedLyricLine[];
};

export type PlaylistRecord = {
  id: string;
  title: string;
  madeBy: string;
  description: string;
  cover: string;
  lockedCover?: string;
  trackIds: string[];
  hiddenUntilUnlocked?: boolean;
  unlockAt?: string;
};

export const spotifyContent: {
  playlists: PlaylistRecord[];
  tracks: TrackRecord[];
} = {
  playlists: [
    {
      id: "focus-flow",
      title: "Build in Public",
      madeBy: "Desktop Demo",
      description: "A short demo playlist focused on product polish and iteration.",
      cover: "/music/playlists/build-in-public.svg",
      trackIds: ["demo-track-1", "demo-track-2"],
    },
    {
      id: "night-shift",
      title: "Deep Work",
      madeBy: "UI Test Bench",
      description: "A second playlist for search, queue, and liked-song coverage.",
      cover: "/music/playlists/deep-work.svg",
      trackIds: ["demo-track-2", "demo-track-3"],
    },
    {
      id: "scheduled-drop",
      title: "Scheduled Drop",
      madeBy: "Desktop Demo",
      description: "A timed-unlock playlist used to demo gated UI states.",
      cover: "/music/playlists/scheduled-drop.svg",
      lockedCover: "/music/playlists/scheduled-drop.svg",
      hiddenUntilUnlocked: true,
      unlockAt: "2030-01-15T09:00:00+05:30",
      trackIds: [],
    },
  ],
  tracks: [
    {
      id: "demo-track-1",
      spotifyId: "demo-track-1",
      spotifyUri: "demo:track:1",
      spotifyUrl: "https://example.com/demo-track-1",
      title: "Morning Compile",
      album: "Local Test Tones",
      artist: "Desktop Demo",
      artists: ["Desktop Demo"],
      releaseDate: "2026-06-01",
      duration: "0:02",
      durationMs: 2200,
      genres: ["demo", "ambient"],
      recordLabel: "Generated in repo",
      explicit: false,
      audioUrl: "/music/audio/demo-track-1.wav",
      cover: "/music/covers/track-1.svg",
      lyricsUrl: "/music/lyrics/demo-track-1.lrc",
      lyrics: [],
    },
    {
      id: "demo-track-2",
      spotifyId: "demo-track-2",
      spotifyUri: "demo:track:2",
      spotifyUrl: "https://example.com/demo-track-2",
      title: "Window Stack",
      album: "Local Test Tones",
      artist: "Desktop Demo",
      artists: ["Desktop Demo"],
      releaseDate: "2026-06-01",
      duration: "0:02",
      durationMs: 2200,
      genres: ["demo", "focus"],
      recordLabel: "Generated in repo",
      explicit: false,
      audioUrl: "/music/audio/demo-track-2.wav",
      cover: "/music/covers/track-2.svg",
      lyricsUrl: "/music/lyrics/demo-track-2.lrc",
      lyrics: [],
    },
    {
      id: "demo-track-3",
      spotifyId: "demo-track-3",
      spotifyUri: "demo:track:3",
      spotifyUrl: "https://example.com/demo-track-3",
      title: "Ship Notes",
      album: "Local Test Tones",
      artist: "Desktop Demo",
      artists: ["Desktop Demo"],
      releaseDate: "2026-06-01",
      duration: "0:02",
      durationMs: 2200,
      genres: ["demo", "notes"],
      recordLabel: "Generated in repo",
      explicit: false,
      audioUrl: "/music/audio/demo-track-3.wav",
      cover: "/music/covers/track-3.svg",
      lyricsUrl: "/music/lyrics/demo-track-3.lrc",
      lyrics: [],
    },
  ],
};

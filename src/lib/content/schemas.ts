import { z } from "zod";

export const noteSchema = z.object({
  id: z.string(),
  folder: z.string(),
  title: z.string(),
  body: z.string(),
  updatedAt: z.string(),
  author: z.enum(["owner", "collaborator"]).optional(),
  readonly: z.boolean().optional(),
  pinned: z.boolean().optional(),
  locked: z.boolean().optional(),
  protected: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

export const notesContentSchema = z.object({
  folders: z.array(z.string()).min(1),
  deleteModal: z.object({
    title: z.string(),
    body: z.string(),
  }),
  daily: z.object({
    noteId: z.string(),
    quoteId: z.string(),
    featuredNoteId: z.string(),
  }),
  notes: z.array(noteSchema).min(1),
});

export const photoSchema = z.object({
  id: z.string(),
  albumId: z.string(),
  title: z.string(),
  caption: z.string(),
  src: z.string(),
  date: z.string().optional(),
  favorite: z.boolean().optional(),
  protected: z.boolean().optional(),
});

export const photosContentSchema = z.object({
  deleteModal: z.object({
    title: z.string(),
    body: z.string(),
  }),
  albums: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      description: z.string(),
      kind: z.enum(["library", "album", "book", "featured", "smart"]),
      accent: z.string(),
      coverPhotoId: z.string().optional(),
      protected: z.boolean().optional(),
    }),
  ),
  photos: z.array(photoSchema),
});

export const trackSchema = z.object({
  id: z.string(),
  spotifyId: z.string(),
  spotifyUri: z.string(),
  spotifyUrl: z.string(),
  title: z.string(),
  album: z.string(),
  artist: z.string(),
  artists: z.array(z.string()).min(1),
  releaseDate: z.string(),
  duration: z.string(),
  durationMs: z.number(),
  genres: z.array(z.string()),
  recordLabel: z.string(),
  explicit: z.boolean(),
  cover: z.string(),
  audioUrl: z.string(),
  lyricsUrl: z.string(),
  lyrics: z.array(z.string()),
  timedLyrics: z.array(z.object({ time: z.number(), line: z.string() })).optional(),
});

export const spotifyContentSchema = z.object({
  playlists: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        madeBy: z.string(),
        description: z.string(),
        cover: z.string(),
        trackIds: z.array(z.string()),
      }),
    )
    .min(1),
  tracks: z.array(trackSchema).min(1),
}).superRefine((content, context) => {
  const trackIds = new Set<string>();

  for (const track of content.tracks) {
    if (trackIds.has(track.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate Spotify track id: ${track.id}`,
        path: ["tracks"],
      });
    }
    trackIds.add(track.id);

    if (!track.audioUrl.startsWith("/music/audio/") || !/\.(mp3|wav)$/.test(track.audioUrl)) {
      context.addIssue({
        code: "custom",
        message: `Spotify track ${track.id} must use a local audio asset`,
        path: ["tracks", track.id, "audioUrl"],
      });
    }

    if (!track.cover.startsWith("/music/covers/") || !/\.(jpg|png|svg)$/.test(track.cover)) {
      context.addIssue({
        code: "custom",
        message: `Spotify track ${track.id} must use a local cover asset`,
        path: ["tracks", track.id, "cover"],
      });
    }

    if (!track.lyricsUrl.startsWith("/music/lyrics/") || !track.lyricsUrl.endsWith(".lrc")) {
      context.addIssue({
        code: "custom",
        message: `Spotify track ${track.id} must use a local LRC path`,
        path: ["tracks", track.id, "lyricsUrl"],
      });
    }

    if (track.timedLyrics) {
      for (let index = 1; index < track.timedLyrics.length; index += 1) {
        if (track.timedLyrics[index].time < track.timedLyrics[index - 1].time) {
          context.addIssue({
            code: "custom",
            message: `Timed lyrics must be sorted for track ${track.id}`,
            path: ["tracks", track.id, "timedLyrics"],
          });
        }
      }
    }
  }

  const playlistIds = new Set<string>();
  for (const playlist of content.playlists) {
    if (playlistIds.has(playlist.id)) {
      context.addIssue({
        code: "custom",
        message: `Duplicate Spotify playlist id: ${playlist.id}`,
        path: ["playlists"],
      });
    }
    playlistIds.add(playlist.id);

    if (!playlist.cover.startsWith("/music/playlists/") || !/\.(jpg|png|svg)$/.test(playlist.cover)) {
      context.addIssue({
        code: "custom",
        message: `Spotify playlist ${playlist.id} must use a local cover asset`,
        path: ["playlists", playlist.id, "cover"],
      });
    }

    for (const id of playlist.trackIds) {
      if (!trackIds.has(id)) {
        context.addIssue({
          code: "custom",
          message: `Playlist ${playlist.id} references missing track ${id}`,
          path: ["playlists", playlist.id, "trackIds"],
        });
      }
    }
  }

  for (const requiredId of ["focus-flow", "night-shift"]) {
    if (!playlistIds.has(requiredId)) {
      context.addIssue({
        code: "custom",
        message: `Missing required Spotify playlist: ${requiredId}`,
        path: ["playlists"],
      });
    }
  }
});

export const calendarContentSchema = z.object({
  calendars: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        color: z.string(),
      }),
    )
    .min(1),
  events: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      calendarId: z.string(),
      date: z.string(),
      time: z.string(),
      notes: z.string(),
    }),
  ),
});

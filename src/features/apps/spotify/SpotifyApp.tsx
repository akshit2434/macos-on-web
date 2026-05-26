"use client";

import {
  Clock3,
  Heart,
  ListMusic,
  Loader2,
  LockKeyhole,
  Maximize2,
  Pause,
  Play,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  X,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";

import { spotifyContent, type TrackRecord } from "@/content/apps/spotify";
import { useWindowStore } from "@/features/shell/windowing/use-window-store";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import {
  TIMED_PLAYLIST_UNLOCK_TOAST,
  buildLrclibUrls,
  buildPlaylistViews,
  getPlaylistArtwork,
  isPlaylistLocked,
  parseLrc,
  parsePlainLyrics,
  resolveTracks,
  searchTracks,
  type LyricLine,
} from "./spotify-library";
import { syncSpotifyMusicEvent } from "./spotify-music-events";

const END_CROSSFADE_SECONDS = 6;
const MANUAL_CROSSFADE_SECONDS = 0.9;
const LIKED_STORAGE_KEY = "macos-web.spotify.likedTrackIds";
const LYRIC_THEMES = [
  { background: "#1db954", foreground: "#082615", muted: "rgba(8, 38, 21, 0.62)" },
  { background: "#d2a647", foreground: "#2b1d05", muted: "rgba(43, 29, 5, 0.58)" },
  { background: "#c7585a", foreground: "#2b090b", muted: "rgba(43, 9, 11, 0.58)" },
  { background: "#5b8f7a", foreground: "#071f18", muted: "rgba(7, 31, 24, 0.58)" },
  { background: "#b66b35", foreground: "#251104", muted: "rgba(37, 17, 4, 0.58)" },
  { background: "#6f75bd", foreground: "#0e1230", muted: "rgba(14, 18, 48, 0.58)" },
  { background: "#c7879a", foreground: "#2c0915", muted: "rgba(44, 9, 21, 0.58)" },
  { background: "#4aa6a8", foreground: "#041f20", muted: "rgba(4, 31, 32, 0.58)" },
] as const;

function formatTime(value: number) {
  if (!Number.isFinite(value)) {
    return "0:00";
  }

  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function readStoredLikes() {
  if (typeof window === "undefined") {
    return new Set<string>();
  }

  try {
    const stored = window.localStorage.getItem(LIKED_STORAGE_KEY);
    return new Set<string>(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set<string>();
  }
}

function lyricThemeForTrack(trackRecord: TrackRecord) {
  const hash = [...`${trackRecord.id}:${trackRecord.title}:${trackRecord.artist}`].reduce((sum, character) => {
    return ((sum << 5) - sum + character.charCodeAt(0)) >>> 0;
  }, 0);
  return LYRIC_THEMES[hash % LYRIC_THEMES.length]!;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
}

async function warmBrowserCache(urls: string[]) {
  if (typeof window === "undefined") {
    return;
  }

  const uniqueUrls = [...new Set(urls)];
  if ("caches" in window) {
    const cache = await window.caches.open("spotify-assets-v1");
    await Promise.allSettled(
      uniqueUrls.map(async (url) => {
        const cached = await cache.match(url);
        if (!cached) {
          await cache.add(url);
        }
      }),
    );
    return;
  }

  await Promise.allSettled(uniqueUrls.map((url) => fetch(url, { cache: "force-cache" })));
}

export function SpotifyApp() {
  const [playlistId, setPlaylistId] = useState(spotifyContent.playlists[0]!.id);
  const [playbackPlaylistId, setPlaybackPlaylistId] = useState(spotifyContent.playlists[0]!.id);
  const [queueTrackIds, setQueueTrackIds] = useState<string[]>(spotifyContent.playlists[0]!.trackIds);
  const [trackId, setTrackId] = useState(spotifyContent.tracks[0]!.id);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(spotifyContent.tracks[0]!.durationMs / 1000);
  const [likedTrackIds, setLikedTrackIds] = useState(readStoredLikes);
  const [recentlyPlayed, setRecentlyPlayed] = useState<string[]>([]);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeatOn, setRepeatOn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchScope, setSearchScope] = useState<"playlist" | "global">("playlist");
  const [lyrics, setLyrics] = useState<LyricLine[]>(currentTrackInitialLyrics());
  const [lyricsStatus, setLyricsStatus] = useState<"loading" | "ready" | "unavailable">("loading");
  const [lyricsExpanded, setLyricsExpanded] = useState(false);
  const [loadingTrackId, setLoadingTrackId] = useState<string | null>(null);
  const [activeDeck, setActiveDeck] = useState<"a" | "b">("a");
  const [deckTrackIds, setDeckTrackIds] = useState<{ a: string; b: string | null }>({ a: spotifyContent.tracks[0]!.id, b: null });
  const [now, setNow] = useState(() => new Date());
  const audioARef = useRef<HTMLAudioElement | null>(null);
  const audioBRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const crossfadeStartedRef = useRef(false);
  const fadeTokenRef = useRef(0);
  const transitionTokenRef = useRef(0);
  const preloadedAudioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const { track, sessionId } = useAnalytics();
  const notify = useWindowStore((state) => state.notify);

  const playlists = useMemo(() => buildPlaylistViews(likedTrackIds), [likedTrackIds]);
  const playlist = playlists.find((item) => item.id === playlistId) ?? playlists[0]!;
  const playlistLocked = isPlaylistLocked(playlist, now);
  const playlistArtwork = getPlaylistArtwork(playlist, now);
  const playlistTracks = useMemo(() => resolveTracks(playlist.trackIds), [playlist.trackIds]);
  const visibleTracks = useMemo(() => {
    const sourceTracks = searchScope === "global" ? spotifyContent.tracks : playlistTracks;
    return searchTracks(sourceTracks, searchQuery);
  }, [playlistTracks, searchQuery, searchScope]);
  const currentTrack = useMemo(
    () => spotifyContent.tracks.find((item) => item.id === trackId) ?? spotifyContent.tracks[0]!,
    [trackId],
  );
  const queueTracks = useMemo(() => resolveTracks(queueTrackIds), [queueTrackIds]);
  const currentIndex = Math.max(0, queueTracks.findIndex((item) => item.id === currentTrack.id));
  const upNext = [...queueTracks.slice(currentIndex + 1), ...queueTracks.slice(0, currentIndex)].filter((item) => item.id !== currentTrack.id);
  const recentTracks = recentlyPlayed
    .map((id) => spotifyContent.tracks.find((item) => item.id === id))
    .filter((item): item is TrackRecord => Boolean(item));
  const activeTimedLyricIndex = lyrics.reduce((activeIndex, lyric, index) => (lyric.time !== null && progress >= lyric.time ? index : activeIndex), -1);
  const hasTimedLyrics = lyrics.some((line) => line.time !== null);
  const lyricTheme = lyricThemeForTrack(currentTrack);

  const getAudio = useCallback((deck: "a" | "b") => (deck === "a" ? audioARef.current : audioBRef.current), []);
  const getInactiveDeck = useCallback(() => (activeDeck === "a" ? "b" : "a"), [activeDeck]);

  const triggerCrossfadeTransition = useEffectEvent((nextTrackId: string) => {
    void transitionToTrack(nextTrackId, {
      source: "crossfade",
      autoplay: true,
      crossfadeMs: END_CROSSFADE_SECONDS * 1000,
    });
  });

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    window.localStorage.setItem(LIKED_STORAGE_KEY, JSON.stringify([...likedTrackIds]));
  }, [likedTrackIds]);

  useEffect(() => {
    if (!lyricsExpanded) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setLyricsExpanded(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lyricsExpanded]);

  useEffect(() => {
    void warmBrowserCache([
      ...spotifyContent.playlists.flatMap((item) => [item.cover, item.lockedCover].filter((url): url is string => Boolean(url))),
      ...spotifyContent.tracks.map((item) => item.cover),
    ]);
  }, []);

  useEffect(() => {
    const preloadTargets = [currentTrack, ...upNext.slice(0, 3)];
    for (const trackRecord of preloadTargets) {
      if (!preloadedAudioRef.current.has(trackRecord.id)) {
        const audio = new Audio(trackRecord.audioUrl);
        audio.preload = "auto";
        audio.load();
        preloadedAudioRef.current.set(trackRecord.id, audio);
      }
    }

    for (const [id] of preloadedAudioRef.current) {
      if (!preloadTargets.some((trackRecord) => trackRecord.id === id)) {
        preloadedAudioRef.current.delete(id);
      }
    }
  }, [currentTrack, upNext]);

  useEffect(() => {
    const firstAudio = audioARef.current;
    if (firstAudio && !firstAudio.src) {
      firstAudio.src = currentTrack.audioUrl;
      firstAudio.load();
    }
  }, [currentTrack.audioUrl]);

  useEffect(() => {
    let cancelled = false;

    async function loadLyrics() {
      setLyricsStatus("loading");
      const response = await fetch(currentTrack.lyricsUrl, { cache: "force-cache" });
      if (response.ok) {
        const parsed = parseLrc(await response.text());
        if (!cancelled) {
          setLyrics(parsed.map((line) => ({ ...line, time: line.time })));
          setLyricsStatus(parsed.length ? "ready" : "unavailable");
        }
        return;
      }

      const parsed = await fetchRuntimeLyrics(currentTrack);
      if (!cancelled) {
        setLyrics(parsed);
        setLyricsStatus(parsed.length ? "ready" : "unavailable");
      }
    }

    void loadLyrics();
    return () => {
      cancelled = true;
    };
  }, [currentTrack]);

  async function fetchRuntimeLyrics(trackRecord: TrackRecord) {
    for (const url of buildLrclibUrls(trackRecord)) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 3500);
      const response = await fetch(url, { cache: "force-cache", signal: controller.signal }).catch(() => null);
      window.clearTimeout(timeout);
      if (!response?.ok) {
        continue;
      }

      const data: unknown = await response.json().catch(() => null);
      const syncedLyrics = Array.isArray(data)
        ? (data.find((item): item is { syncedLyrics: string } => typeof item?.syncedLyrics === "string")?.syncedLyrics ?? "")
        : typeof (data as { syncedLyrics?: unknown } | null)?.syncedLyrics === "string"
          ? ((data as { syncedLyrics: string }).syncedLyrics)
          : "";
      const parsed = parseLrc(syncedLyrics);
      if (parsed.length) {
        return parsed.map((line) => ({ ...line, time: line.time }));
      }

      const plainLyrics = Array.isArray(data)
        ? (data.find((item): item is { plainLyrics: string } => typeof item?.plainLyrics === "string")?.plainLyrics ?? "")
        : typeof (data as { plainLyrics?: unknown } | null)?.plainLyrics === "string"
          ? ((data as { plainLyrics: string }).plainLyrics)
          : "";
      const plain = parsePlainLyrics(plainLyrics);
      if (plain.length) {
        return plain;
      }
    }

    return trackRecord.timedLyrics?.map((line) => ({ ...line, time: line.time })) ?? [];
  }

  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const tick = () => {
      const audio = getAudio(activeDeck);
      if (audio) {
        setProgress(audio.currentTime);
        setDuration(Number.isFinite(audio.duration) ? audio.duration : currentTrack.durationMs / 1000);
        if (!repeatOn && !crossfadeStartedRef.current && audio.duration && audio.duration - audio.currentTime <= END_CROSSFADE_SECONDS && upNext[0]) {
          crossfadeStartedRef.current = true;
          triggerCrossfadeTransition(upNext[0].id);
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [activeDeck, currentTrack.durationMs, getAudio, isPlaying, repeatOn, upNext]);

  function currentTrackInitialLyrics() {
    return spotifyContent.tracks[0]!.timedLyrics?.map((line) => ({ ...line, time: line.time })) ?? [];
  }

  function rememberTrack(id: string) {
    setRecentlyPlayed((current) => [id, ...current.filter((item) => item !== id)].slice(0, 5));
  }

  function fadeAudio(from: HTMLAudioElement, to: HTMLAudioElement, milliseconds: number) {
    const token = fadeTokenRef.current + 1;
    fadeTokenRef.current = token;
    const startedAt = performance.now();
    const step = (now: number) => {
      if (fadeTokenRef.current !== token) {
        return;
      }

      const progressRatio = Math.min(Math.max((now - startedAt) / milliseconds, 0), 1);
      from.volume = 1 - progressRatio;
      to.volume = progressRatio;
      if (progressRatio < 1) {
        requestAnimationFrame(step);
      } else {
        from.pause();
        from.currentTime = 0;
        from.volume = 1;
        to.volume = 1;
      }
    };
    requestAnimationFrame(step);
  }

  function waitForPlayable(audio: HTMLAudioElement) {
    if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      const cleanup = () => {
        window.clearTimeout(timeout);
        audio.removeEventListener("canplay", cleanup);
        audio.removeEventListener("canplaythrough", cleanup);
        resolve();
      };
      const timeout = window.setTimeout(cleanup, 1200);
      audio.addEventListener("canplay", cleanup, { once: true });
      audio.addEventListener("canplaythrough", cleanup, { once: true });
    });
  }

  async function transitionToTrack(id: string, options: { autoplay?: boolean; source: string; crossfadeMs?: number; playlistContextId?: string }) {
    const nextTrack = spotifyContent.tracks.find((item) => item.id === id);
    if (!nextTrack) {
      return;
    }
    const transitionToken = transitionTokenRef.current + 1;
    transitionTokenRef.current = transitionToken;
    fadeTokenRef.current += 1;

    const fromDeck = activeDeck;
    const toDeck = options.crossfadeMs ? getInactiveDeck() : activeDeck;
    const fromAudio = getAudio(fromDeck);
    const toAudio = getAudio(toDeck);

    crossfadeStartedRef.current = options.source === "crossfade";
    setLoadingTrackId(id);
    setTrackId(id);
    setProgress(0);
    setDuration(nextTrack.durationMs / 1000);
    rememberTrack(id);
    setDeckTrackIds((current) => ({ ...current, [toDeck]: id }));

    for (const deck of ["a", "b"] as const) {
      const deckAudio = getAudio(deck);
      if (deckAudio && deckAudio !== fromAudio && deckAudio !== toAudio) {
        deckAudio.pause();
        deckAudio.currentTime = 0;
        deckAudio.volume = 1;
      }
    }

    if (toAudio) {
      if (toAudio.src !== new URL(nextTrack.audioUrl, window.location.href).href) {
        toAudio.src = nextTrack.audioUrl;
      }
      toAudio.currentTime = 0;
      toAudio.preload = "auto";
      toAudio.volume = options.crossfadeMs ? 0 : 1;
      toAudio.load();
    }

    if (options.autoplay && toAudio) {
      await waitForPlayable(toAudio);
      if (transitionTokenRef.current !== transitionToken) {
        return;
      }
      const started = await toAudio
        .play()
        .then(() => true)
        .catch(() => false);
      if (transitionTokenRef.current !== transitionToken) {
        return;
      }
      setIsPlaying(started);
      if (!started) {
        setLoadingTrackId(null);
        return;
      }
      if (options.crossfadeMs && fromAudio && fromAudio !== toAudio) {
        setActiveDeck(toDeck);
        fadeAudio(fromAudio, toAudio, options.crossfadeMs);
      } else {
        setActiveDeck(toDeck);
      }
    } else {
      setIsPlaying(false);
      fromAudio?.pause();
      if (toAudio) {
        toAudio.volume = 1;
      }
    }

    if (transitionTokenRef.current === transitionToken) {
      crossfadeStartedRef.current = false;
      setLoadingTrackId(null);
    }
    track({ eventType: options.autoplay ? "TRACK_STARTED" : "TRACK_SELECTED", appId: "spotify", metadata: { trackId: id, source: options.source } });
    void logMusicEvent(options.autoplay ? "started" : "selected", id, 0, options.playlistContextId);
  }

  function playTrack(id: string, options: { autoplay?: boolean; source: string; queueIds?: string[]; playlistContextId?: string }) {
    if (options.queueIds?.length) {
      setQueueTrackIds(options.queueIds);
    }
    if (options.playlistContextId) {
      setPlaybackPlaylistId(options.playlistContextId);
    }
    void transitionToTrack(id, { ...options, crossfadeMs: isPlaying ? MANUAL_CROSSFADE_SECONDS * 1000 : undefined });
  }

  function togglePlay() {
    const audio = getAudio(activeDeck);
    if (!audio) {
      return;
    }

    if (isPlaying) {
      setIsPlaying(false);
      audio.pause();
      track({ eventType: "TRACK_PAUSED", appId: "spotify", metadata: { trackId } });
      void logMusicEvent("paused", trackId, progress);
      return;
    }

    rememberTrack(trackId);
    setIsPlaying(true);
    void audio.play().catch(() => setIsPlaying(false));
    track({ eventType: "TRACK_STARTED", appId: "spotify", metadata: { trackId, source: "footer" } });
    void logMusicEvent("started", trackId, progress);
  }

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code !== "Space" || event.repeat || isTypingTarget(event.target)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      togglePlay();
    };

    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  });

  function skipTrack(direction: "previous" | "next") {
    if (!queueTracks.length) {
      return;
    }

    const audio = getAudio(activeDeck);
    if (direction === "previous" && progress > 3 && audio) {
      audio.currentTime = 0;
      setProgress(0);
      track({ eventType: "TRACK_SEEKED", appId: "spotify", metadata: { trackId, to: 0, source: "previous-button" } });
      return;
    }

    const index = queueTracks.findIndex((item) => item.id === trackId);
    const safeIndex = index >= 0 ? index : 0;
    const nextIndex = direction === "next" ? (safeIndex + 1) % queueTracks.length : (safeIndex - 1 + queueTracks.length) % queueTracks.length;
    const nextTrack = shuffleOn ? queueTracks[Math.floor(Math.random() * queueTracks.length)] : queueTracks[nextIndex];
    if (nextTrack) {
      void transitionToTrack(nextTrack.id, {
        autoplay: isPlaying,
        source: direction,
        crossfadeMs: isPlaying && direction === "next" ? MANUAL_CROSSFADE_SECONDS * 1000 : undefined,
      });
    }
  }

  function toggleLike(id: string) {
    setLikedTrackIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
    track({ eventType: "TRACK_LIKE_TOGGLED", appId: "spotify", metadata: { trackId: id } });
  }

  function seekTo(value: number) {
    const nextValue = Math.min(Math.max(value, 0), Math.max(duration, 1));
    const audio = getAudio(activeDeck);
    if (audio) {
      audio.currentTime = nextValue;
    }
    setProgress(nextValue);
    track({ eventType: "TRACK_SEEKED", appId: "spotify", metadata: { trackId, to: Math.round(nextValue) } });
    void logMusicEvent("seeked", trackId, nextValue);
  }

  function toggleShuffle() {
    setShuffleOn((value) => !value);
    track({ eventType: "SPOTIFY_SHUFFLE_TOGGLED", appId: "spotify", metadata: { playlistId, enabled: !shuffleOn } });
    void logMusicEvent(shuffleOn ? "shuffle_off" : "shuffle_on", trackId, progress);
  }

  function toggleRepeat() {
    setRepeatOn((value) => !value);
    track({ eventType: "SPOTIFY_REPEAT_TOGGLED", appId: "spotify", metadata: { playlistId, enabled: !repeatOn } });
    void logMusicEvent(repeatOn ? "repeat_off" : "repeat_on", trackId, progress);
  }

  function logMusicEvent(eventType: string, nextTrackId = trackId, nextProgress = progress, nextPlaylistId = playbackPlaylistId) {
    return syncSpotifyMusicEvent({
      sessionId,
      trackId: nextTrackId,
      playlistId: nextPlaylistId,
      eventType,
      progress: nextProgress,
      duration,
    });
  }

  function seekToLyric(line: LyricLine) {
    if (line.time === null) {
      return;
    }
    seekTo(line.time);
  }

  function openPlaylist(id: string) {
    const nextPlaylist = playlists.find((item) => item.id === id);
    if (nextPlaylist && isPlaylistLocked(nextPlaylist, now)) {
      notify({ appId: "spotify", title: nextPlaylist.title, body: TIMED_PLAYLIST_UNLOCK_TOAST });
      track({ eventType: "LOCKED_PLAYLIST_OPEN_ATTEMPTED", appId: "spotify", metadata: { playlistId: id } });
      return;
    }

    setPlaylistId(id);
    setSearchScope("playlist");
    track({ eventType: "PLAYLIST_OPENED", appId: "spotify", metadata: { playlistId: id } });
  }

  function playPlaylist() {
    if (playlistLocked) {
      notify({ appId: "spotify", title: playlist.title, body: TIMED_PLAYLIST_UNLOCK_TOAST });
      track({ eventType: "LOCKED_PLAYLIST_OPEN_ATTEMPTED", appId: "spotify", metadata: { playlistId: playlist.id, source: "playlist-play" } });
      return;
    }

    const nextTrackIds = playlist.trackIds;
    const firstTrack = shuffleOn ? nextTrackIds[Math.floor(Math.random() * nextTrackIds.length)] : nextTrackIds[0];
    if (!firstTrack) {
      return;
    }

    setQueueTrackIds(nextTrackIds);
    setPlaybackPlaylistId(playlist.id);
    void transitionToTrack(firstTrack, {
      autoplay: true,
      source: "playlist-play",
      crossfadeMs: isPlaying ? MANUAL_CROSSFADE_SECONDS * 1000 : undefined,
      playlistContextId: playlist.id,
    });
  }

  function renderLyricsLines(expanded = false) {
    if (lyricsStatus === "loading") {
      return (
        <div className={`flex items-center gap-2 font-bold opacity-70 ${expanded ? "text-2xl" : "text-base"}`}>
          <Loader2 className="size-5 animate-spin" />
          Loading lyrics
        </div>
      );
    }

    if (lyricsStatus === "unavailable" || !lyrics.length) {
      return <p className={expanded ? "text-4xl font-black opacity-70" : "text-lg font-bold opacity-70"}>Lyrics unavailable for this song.</p>;
    }

    return lyrics.map((line, index) => {
      const isInactive = hasTimedLyrics && index !== activeTimedLyricIndex;
      const lineClassName = `${expanded ? "text-6xl leading-[1.18]" : "text-2xl leading-8"} font-black transition-opacity duration-200 ${
        isInactive ? "opacity-35" : "opacity-100"
      }`;
      const expandedTextStyle = expanded ? { fontSize: "3.75rem", lineHeight: 1.18 } : undefined;
      if (!expanded || line.time === null) {
        return (
          <p key={`${line.time}-${line.line}-${expanded ? "expanded" : "compact"}`} className={lineClassName} style={expandedTextStyle}>
            {line.line}
          </p>
        );
      }

      return (
        <button
          type="button"
          key={`${line.time}-${line.line}-${expanded ? "expanded" : "compact"}`}
          onClick={(event) => {
            event.stopPropagation();
            seekToLyric(line);
          }}
          onMouseDown={(event) => event.preventDefault()}
          className={`block w-full cursor-pointer rounded text-left hover:opacity-80 focus:outline-none ${lineClassName}`}
          aria-label={`Seek to lyric ${line.line}`}
          style={expandedTextStyle}
        >
          {line.line}
        </button>
      );
    });
  }

  return (
    <div className="relative grid h-full min-h-0 grid-cols-[240px_1fr] overflow-hidden bg-[#121212] text-white">
      <aside className="flex min-h-0 flex-col border-r border-white/10 bg-black p-4">
        <h1 className="text-2xl font-bold">Jukebox</h1>
        <div className="mt-6 space-y-2">
          {playlists.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => openPlaylist(item.id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm ${playlistId === item.id ? "bg-white/15 font-semibold" : "hover:bg-white/10"}`}
            >
              <span className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded bg-white/10">
                {item.kind === "liked" ? (
                  <Heart className="size-5 fill-emerald-400 text-emerald-400" />
                ) : isPlaylistLocked(item, now) ? (
                  <>
                    <Image src={getPlaylistArtwork(item, now)} alt="" fill className="object-cover" sizes="36px" />
                    <LockKeyhole className="relative size-4 text-white drop-shadow" />
                  </>
                ) : (
                  <Image src={getPlaylistArtwork(item, now)} alt="" fill className="object-cover" sizes="36px" />
                )}
              </span>
              <span className="min-w-0 truncate">{item.title}</span>
            </button>
          ))}
        </div>
        <div className="mt-auto rounded-lg bg-white/10 p-3 text-xs leading-relaxed text-white/60">
          <p className="font-semibold text-white">Bundled demo music stack</p>
          <p className="mt-1">Uses generated artwork, local audio, and synced lyrics fallbacks to show the player interactions safely.</p>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="grid grid-cols-[148px_1fr] gap-6 bg-gradient-to-b from-emerald-700 to-[#121212] p-8">
          <div className="relative aspect-square overflow-hidden rounded shadow-2xl">
            <Image src={playlistArtwork} alt={playlist.title} fill className="object-cover" sizes="148px" priority />
            {playlistLocked ? (
              <div className="absolute inset-0 grid place-items-center bg-black/18">
                <LockKeyhole className="size-10 text-white drop-shadow" />
              </div>
            ) : null}
          </div>
          <div className="min-w-0 self-end">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/75">Playlist</p>
            <h2 className="mt-2 truncate text-5xl font-black tracking-normal">{playlist.title}</h2>
            <p className="mt-3 max-w-xl text-sm text-white/70">{playlist.description}</p>
            <p className="mt-2 text-sm font-semibold text-white/80">Made by {playlist.madeBy}</p>
          </div>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-[minmax(360px,1fr)_340px] overflow-hidden">
          <div className="min-h-0 overflow-auto px-6 py-4">
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={playPlaylist}
                className="grid size-12 shrink-0 place-items-center rounded-full bg-emerald-500 text-black shadow-lg transition hover:scale-105 hover:bg-emerald-400"
                aria-label={`Play ${playlist.title} playlist`}
              >
                <Play className="ml-0.5 size-6 fill-current" />
              </button>
              <label className="grid h-10 min-w-0 flex-1 grid-cols-[32px_1fr] items-center rounded bg-white/10 px-2 text-sm">
                <Search className="size-4 text-white/50" />
                <input
                  aria-label="Search songs"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="min-w-0 bg-transparent text-white outline-none placeholder:text-white/35"
                  placeholder="Search songs, artists, albums"
                />
              </label>
              <div className="grid h-10 grid-cols-2 rounded bg-white/10 p-1 text-xs font-semibold">
                {(["playlist", "global"] as const).map((scope) => (
                  <button
                    key={scope}
                    type="button"
                    onClick={() => setSearchScope(scope)}
                    className={`rounded px-3 ${searchScope === scope ? "bg-white text-black" : "text-white/60 hover:text-white"}`}
                  >
                    {scope === "playlist" ? "Playlist" : "All"}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-2 grid grid-cols-[36px_44px_1fr_100px_88px_42px] gap-3 border-b border-white/10 px-3 pb-2 text-xs uppercase tracking-[0.16em] text-white/35">
              <span>#</span>
              <span />
              <span>Title</span>
              <span>Album</span>
              <span>Duration</span>
              <span />
            </div>
            {visibleTracks.map((item, index) => (
              <div
                key={item.id}
                className={`grid w-full grid-cols-[minmax(0,1fr)_42px] items-center rounded-lg text-sm ${
                  trackId === item.id ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() =>
                    playTrack(item.id, {
                      autoplay: true,
                      source: searchScope === "global" ? "global-search" : "track-list",
                      queueIds: visibleTracks.map((trackRecord) => trackRecord.id),
                      playlistContextId: searchScope === "global" ? playbackPlaylistId : playlist.id,
                    })
                  }
                  className="grid min-w-0 grid-cols-[36px_44px_1fr_100px_88px] items-center gap-3 px-3 py-2 text-left"
                >
                  <span className="text-white/50">
                    {loadingTrackId === item.id ? (
                      <Loader2 className="size-4 animate-spin text-emerald-300" />
                    ) : trackId === item.id && isPlaying ? (
                      <Volume2 className="size-4 text-emerald-400" />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <span className="relative size-11 overflow-hidden rounded">
                    <Image src={item.cover} alt="" fill className="object-cover" sizes="44px" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{item.title}</span>
                    <span className="block truncate text-xs text-white/55">{item.artist}</span>
                  </span>
                  <span className="truncate text-xs text-white/45">{item.album}</span>
                  <span className="text-white/55">{item.duration}</span>
                </button>
                <button
                  type="button"
                  onClick={() => toggleLike(item.id)}
                  className="grid size-8 place-items-center rounded-full hover:bg-white/10"
                  aria-pressed={likedTrackIds.has(item.id)}
                  aria-label={`${likedTrackIds.has(item.id) ? "Unlike" : "Like"} ${item.title}`}
                >
                  <Heart className={`size-4 ${likedTrackIds.has(item.id) ? "fill-emerald-400 text-emerald-400" : "text-white/45"}`} />
                </button>
              </div>
            ))}
          </div>

          <aside className="min-h-0 overflow-auto border-l border-white/10 bg-black/25 p-5">
            <div className="flex items-center gap-3">
              <div className="relative size-20 shrink-0 overflow-hidden rounded shadow-xl">
                <Image src={currentTrack.cover} alt={currentTrack.title} fill className="object-cover" sizes="80px" priority />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-xl font-bold">{currentTrack.title}</h3>
                <p className="truncate text-sm text-white/60">{currentTrack.artist}</p>
              </div>
              <button type="button" onClick={() => toggleLike(currentTrack.id)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 hover:bg-white/15" aria-label={`${likedTrackIds.has(currentTrack.id) ? "Unlike" : "Like"} current track`}>
                <Heart className={`size-5 ${likedTrackIds.has(currentTrack.id) ? "fill-emerald-400 text-emerald-400" : "text-white/55"}`} />
              </button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => setLyricsExpanded(true)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setLyricsExpanded(true);
                }
              }}
              aria-label="Open full screen lyrics"
              className="mt-5 cursor-pointer rounded-lg p-4 shadow-inner transition hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/70"
              style={{ backgroundColor: lyricTheme.background, color: lyricTheme.foreground }}
            >
              <div className="mb-3 flex items-center justify-between gap-3 text-sm font-bold">
                <span className="flex items-center gap-2">
                  <ListMusic className="size-4" />
                  Lyrics
                </span>
                <span className="flex items-center gap-2">
                  {lyricsStatus === "ready" ? <span className="text-xs font-semibold opacity-70">{hasTimedLyrics ? "Synced" : "Plain"}</span> : null}
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      setLyricsExpanded(true);
                    }}
                    className="grid size-8 place-items-center rounded-full bg-black/10 transition hover:bg-black/20"
                    aria-label="Maximize lyrics"
                  >
                    <Maximize2 className="size-4" />
                  </button>
                </span>
              </div>
              <div className="max-h-64 space-y-3 overflow-auto pr-1 text-2xl font-black leading-8">
                {renderLyricsLines()}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white/10 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <ListMusic className="size-4" />
                Up Next
              </p>
              <div className="space-y-2">
                {upNext.slice(0, 4).map((item) => (
                  <button key={item.id} type="button" onClick={() => playTrack(item.id, { autoplay: true, source: "queue" })} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-white/10">
                    <Image src={item.cover} alt="" width={34} height={34} className="rounded object-cover" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{item.title}</span>
                      <span className="text-xs text-white/50">{item.artist}</span>
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-white/10 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <Clock3 className="size-4" />
                Recently Played
              </p>
              {recentTracks.length ? (
                <div className="space-y-2">
                  {recentTracks.map((item) => (
                    <button key={item.id} type="button" onClick={() => playTrack(item.id, { autoplay: true, source: "recently-played" })} className="block w-full truncate rounded-lg px-2 py-1.5 text-left text-sm text-white/75 hover:bg-white/10">
                      {item.title}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-white/45">Played tracks will appear here.</p>
              )}
            </div>
          </aside>
        </div>

        <footer
          className={`grid h-24 grid-cols-[1fr_minmax(320px,460px)_1fr] items-center border-t border-white/10 bg-[#181818] px-5 ${
            lyricsExpanded ? "absolute inset-x-0 bottom-0 z-30" : "shrink-0"
          }`}
        >
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{currentTrack.title}</p>
            <p className="truncate text-xs text-white/55">{currentTrack.artist}</p>
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-center gap-4">
              <button type="button" onClick={toggleShuffle} className={shuffleOn ? "text-emerald-400" : "text-white/45 hover:text-white"} aria-label="Shuffle" aria-pressed={shuffleOn}>
                <Shuffle className="size-4" />
              </button>
              <button type="button" onClick={() => skipTrack("previous")} className="text-white/65 hover:text-white" aria-label="Previous track">
                <SkipBack className="size-5" />
              </button>
              <button type="button" onClick={togglePlay} className="grid size-11 place-items-center rounded-full bg-white text-slate-950" aria-label={isPlaying ? "Pause" : "Play"}>
                {loadingTrackId ? <Loader2 className="size-5 animate-spin" /> : isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
              </button>
              <button type="button" onClick={() => skipTrack("next")} className="text-white/65 hover:text-white" aria-label="Next track">
                <SkipForward className="size-5" />
              </button>
              <button type="button" onClick={toggleRepeat} className={repeatOn ? "text-emerald-400" : "text-white/45 hover:text-white"} aria-label="Repeat" aria-pressed={repeatOn}>
                <Repeat className="size-4" />
              </button>
            </div>
            <div className="mt-2 grid grid-cols-[42px_1fr_42px] items-center gap-2 text-[11px] text-white/45">
              <span className="text-right">{formatTime(progress)}</span>
              <input
                aria-label="Seek track"
                type="range"
                min={0}
                max={Math.max(duration, 1)}
                step={1}
                value={Math.min(progress, Math.max(duration, 1))}
                onChange={(event) => seekTo(Number(event.target.value))}
                className="h-1 accent-emerald-400"
              />
              <span>{duration ? formatTime(duration) : currentTrack.duration}</span>
            </div>
          </div>
          <div className="justify-self-end text-xs text-white/45">{upNext.length} in queue</div>
        </footer>
      </section>
      {lyricsExpanded ? (
        <>
          <div
            className="absolute inset-x-0 top-0 bottom-24 z-20 grid grid-rows-[auto_1fr] overflow-hidden"
            style={{ backgroundColor: lyricTheme.background, color: lyricTheme.foreground }}
          >
            <div className="flex items-center justify-between gap-4 px-8 py-5">
              <div className="flex min-w-0 items-center gap-4">
                <Image src={currentTrack.cover} alt="" width={54} height={54} className="rounded object-cover shadow-lg" />
                <div className="min-w-0">
                  <p className="truncate text-lg font-black">{currentTrack.title}</p>
                  <p className="truncate text-sm font-bold opacity-65">{currentTrack.artist}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {lyricsStatus === "ready" ? <span className="text-sm font-black opacity-65">{hasTimedLyrics ? "Synced lyrics" : "Lyrics"}</span> : null}
                <button
                  type="button"
                  onClick={() => setLyricsExpanded(false)}
                  className="grid size-11 place-items-center rounded-full bg-black/12 transition hover:bg-black/22"
                  aria-label="Close lyrics"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>
            <div className="overflow-auto px-20 pb-12 pt-10">
              <div className="mx-auto max-w-5xl space-y-10">{renderLyricsLines(true)}</div>
            </div>
          </div>
        </>
      ) : null}
      <audio
        ref={audioARef}
        preload="auto"
        data-track-id={deckTrackIds.a}
        onLoadedMetadata={(event) => activeDeck === "a" && setDuration(event.currentTarget.duration)}
        onEnded={() => {
          if (activeDeck !== "a") return;
          if (repeatOn && audioARef.current) {
            audioARef.current.currentTime = 0;
            void audioARef.current.play().catch(() => setIsPlaying(false));
            return;
          }
          skipTrack("next");
        }}
      />
      <audio
        ref={audioBRef}
        preload="auto"
        data-track-id={deckTrackIds.b ?? ""}
        onLoadedMetadata={(event) => activeDeck === "b" && setDuration(event.currentTarget.duration)}
        onEnded={() => {
          if (activeDeck !== "b") return;
          if (repeatOn && audioBRef.current) {
            audioBRef.current.currentTime = 0;
            void audioBRef.current.play().catch(() => setIsPlaying(false));
            return;
          }
          skipTrack("next");
        }}
      />
    </div>
  );
}

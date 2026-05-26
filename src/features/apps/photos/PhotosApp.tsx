"use client";

import { ChevronLeft, ChevronRight, FastForward, Heart, Images, Library, Pause, Play, Rewind, Search, Star, Trash2, Volume2, VolumeX, X, ZoomIn, ZoomOut } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { photosContent, type PhotoAlbum, type PhotoRecord } from "@/content/apps/photos";
import { resolveUnlockedPhotos } from "@/features/content-unlocks/time-locked-content";
import { useAnalytics } from "@/lib/analytics/use-analytics";
import { cn } from "@/lib/utils";
import { AlbumsStage } from "./AlbumsStage";
import { countPhotosForAlbum, formatPhotoDate, photoMatchesAlbum } from "./photo-helpers";
import { type PhotoEngagementState, syncPhotosStateToCloud } from "./photos-sync";

const minPhotoZoom = 0.8;
const maxPhotoZoom = 1.4;
const baseThumbnailSize = 150;
const favouritesAlbumId = "favorites";
const macEase = [0.22, 1, 0.36, 1] as const;
type PhotosSection = "gallery" | "albums" | "favourites";

export function PhotosApp() {
  const [section, setSection] = useState<PhotosSection>("gallery");
  const [albumId, setAlbumId] = useState(photosContent.albums[0].id);
  const [selected, setSelected] = useState<PhotoRecord | null>(null);
  const [notice, setNotice] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [viewerZoom, setViewerZoom] = useState(1);
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [unlockNow, setUnlockNow] = useState(() => new Date());
  const [favoriteIds, setFavoriteIds] = useState(() => new Set(photosContent.photos.filter((photo) => photo.favorite).map((photo) => photo.id)));
  const [capturedPhotos, setCapturedPhotos] = useState<PhotoRecord[]>([]);
  const [photoEngagement, setPhotoEngagement] = useState<PhotoEngagementState>({});
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const { track } = useAnalytics();
  const allPhotos = useMemo(
    () => resolveUnlockedPhotos([...capturedPhotos, ...photosContent.photos], unlockNow).map((photo) => ({ ...photo, favorite: favoriteIds.has(photo.id) })),
    [capturedPhotos, favoriteIds, unlockNow],
  );
  const visibleAlbumId = section === "favourites" ? favouritesAlbumId : albumId;
  const activeAlbum = photosContent.albums.find((album) => album.id === visibleAlbumId) ?? photosContent.albums[0];
  const photos = useMemo(
    () =>
      allPhotos.filter((photo) => {
        const inAlbum = photoMatchesAlbum(photo, visibleAlbumId);
        const query = searchQuery.trim().toLowerCase();
        const matchesQuery = query.length === 0 || `${photo.title} ${photo.caption} ${formatPhotoDate(photo.date)}`.toLowerCase().includes(query);
        return inAlbum && matchesQuery;
      }),
    [allPhotos, searchQuery, visibleAlbumId],
  );
  const albumCards = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return photosContent.albums
      .filter((album) => album.id !== "recents")
      .filter((album) => query.length === 0 || `${album.title} ${album.description}`.toLowerCase().includes(query));
  }, [searchQuery]);
  const activeAlbumPhotos = useMemo(() => allPhotos.filter((photo) => photoMatchesAlbum(photo, visibleAlbumId)).slice(0, 4), [allPhotos, visibleAlbumId]);
  const selectedPhoto = selected ? (allPhotos.find((photo) => photo.id === selected.id) ?? selected) : null;
  const selectedPhotoIndex = selectedPhoto ? photos.findIndex((photo) => photo.id === selectedPhoto.id) : -1;
  const thumbnailSize = Math.round(baseThumbnailSize * zoom);

  const openPhoto = useCallback(
    (photo: PhotoRecord) => {
      setSelected(photo);
      setViewerZoom(1);
      setMediaLoaded(false);
      setVideoMuted(true);
      setVideoPlaying(false);
      setVideoCurrentTime(0);
      setVideoDuration(0);
      setPhotoEngagement((current) => {
        const existing = current[photo.id];
        return {
          ...current,
          [photo.id]: {
            viewedAt: new Date().toISOString(),
            viewCount: (existing?.viewCount ?? 0) + 1,
          },
        };
      });
      track({ eventType: "PHOTO_OPENED", appId: "photos", metadata: { photoId: photo.id } });
    },
    [track],
  );

  const navigateSelectedPhoto = useCallback(
    (direction: "previous" | "next") => {
      if (photos.length === 0 || selectedPhotoIndex < 0) {
        return;
      }

      const offset = direction === "next" ? 1 : -1;
      const nextIndex = (selectedPhotoIndex + offset + photos.length) % photos.length;
      openPhoto(photos[nextIndex]);
    },
    [openPhoto, photos, selectedPhotoIndex],
  );

  useEffect(() => {
    const loadCaptured = () => {
      try {
        const parsed = JSON.parse(window.localStorage.getItem("macos-web-captured-photos") ?? "[]") as PhotoRecord[];
        setCapturedPhotos(parsed);
      } catch {
        setCapturedPhotos([]);
      }
    };
    loadCaptured();
    window.addEventListener("macos-web-photo-captured", loadCaptured);
    return () => window.removeEventListener("macos-web-photo-captured", loadCaptured);
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => setUnlockNow(new Date()), 60_000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!toast) {
      return;
    }

    const timeout = window.setTimeout(() => setToast(null), 1800);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  useEffect(() => {
    void syncPhotosStateToCloud(allPhotos, photoEngagement);
  }, [allPhotos, photoEngagement]);

  useEffect(() => {
    if (!selectedPhoto) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setSelected(null);
      }
      if (event.key === "ArrowLeft") {
        navigateSelectedPhoto("previous");
      }
      if (event.key === "ArrowRight") {
        navigateSelectedPhoto("next");
      }
      if (event.key === "+" || event.key === "=") {
        setViewerZoom((value) => Math.min(2.4, Number((value + 0.2).toFixed(1))));
      }
      if (event.key === "-") {
        setViewerZoom((value) => Math.max(0.8, Number((value - 0.2).toFixed(1))));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigateSelectedPhoto, selectedPhoto]);

  function toggleFavorite(photo: PhotoRecord) {
    const nextFavorite = !favoriteIds.has(photo.id);
    setFavoriteIds((current) => {
      const next = new Set(current);
      if (nextFavorite) {
        next.add(photo.id);
      } else {
        next.delete(photo.id);
      }
      return next;
    });
    setToast(nextFavorite ? "Added to Favourites" : "Removed from Favourites");
    track({ eventType: "PHOTO_FAVORITE_TOGGLED", appId: "photos", metadata: { photoId: photo.id, favorite: nextFavorite } });
  }

  function openAlbum(album: PhotoAlbum) {
    setAlbumId(album.id);
    setSection(album.id === favouritesAlbumId ? "favourites" : "gallery");
    track({ eventType: "ALBUM_OPENED", appId: "photos", metadata: { albumId: album.id, source: "albums-stage" } });
  }

  function imageForPhoto(photo: PhotoRecord) {
    return photo.posterSrc ?? photo.src;
  }

  function labelForPhoto(photo: PhotoRecord) {
    if (photo.title) {
      return photo.title;
    }
    if (photo.caption) {
      return `${photo.caption} ${photo.id}`;
    }
    return `${photo.mediaType === "video" ? "video" : "photo"} ${photo.id}`;
  }

  function videoOrientationClass(photo: PhotoRecord) {
    if ((photo.videoHeight ?? 0) > (photo.videoWidth ?? 0)) {
      return "h-full w-auto max-w-full";
    }
    return "h-auto w-full max-h-full";
  }

  function videoAspectRatio(photo: PhotoRecord) {
    if (!photo.videoWidth || !photo.videoHeight) {
      return undefined;
    }
    return `${photo.videoWidth} / ${photo.videoHeight}`;
  }

  function seekVideo(seconds: number) {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    const nextTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + seconds));
    video.currentTime = nextTime;
    setVideoCurrentTime(nextTime);
  }

  function setVideoProgress(value: string) {
    const video = videoRef.current;
    const nextTime = Number(value);
    if (!video || Number.isNaN(nextTime)) {
      return;
    }

    video.currentTime = nextTime;
    setVideoCurrentTime(nextTime);
  }

  async function toggleVideoPlayback() {
    const video = videoRef.current;
    if (!video) {
      return;
    }

    if (video.paused) {
      await video.play().catch(() => undefined);
      setVideoPlaying(!video.paused);
      return;
    }

    video.pause();
    setVideoPlaying(false);
  }

  return (
    <div className="relative grid h-full grid-cols-[200px_1fr] overflow-hidden bg-white text-slate-950">
      <aside className="flex min-h-0 flex-col overflow-hidden border-r border-black/10 bg-[#f4f4f5] p-2.5">
        <div className="mb-2 grid gap-1 rounded-lg bg-black/5 p-1">
          <button
            type="button"
            onClick={() => {
              setAlbumId(photosContent.albums[0].id);
              setSection("gallery");
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition",
              section === "gallery" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white/60",
            )}
          >
            <Images className="size-3.5" />
            Gallery
          </button>
          <button
            type="button"
            onClick={() => setSection("albums")}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition",
              section === "albums" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white/60",
            )}
          >
            <Library className="size-3.5" />
            Albums
          </button>
          <button
            type="button"
            onClick={() => {
              setAlbumId(favouritesAlbumId);
              setSection("favourites");
            }}
            className={cn(
              "flex items-center gap-2 rounded-md px-2 py-1 text-xs font-semibold transition",
              section === "favourites" ? "bg-white text-slate-950 shadow-sm" : "text-slate-600 hover:bg-white/60",
            )}
          >
            <Heart className="size-3.5" />
            Favourites
          </button>
        </div>
        <div className="mb-2 flex items-center gap-2 rounded-lg bg-white px-2 py-1.5 text-sm shadow-sm">
          <Search className="size-4 text-slate-500" />
          <input
            aria-label="Search Photos"
            placeholder="Search Photos"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="min-w-0 flex-1 bg-transparent outline-none"
          />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
          <p className="mb-1 px-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
            {section === "albums" ? "Browse" : "Library"}
          </p>
          {photosContent.albums.map((album) => (
            <button
              key={album.id}
              type="button"
              onClick={() => {
                setAlbumId(album.id);
                setSection(album.id === favouritesAlbumId ? "favourites" : "gallery");
                track({ eventType: "ALBUM_OPENED", appId: "photos", metadata: { albumId: album.id, source: "sidebar" } });
              }}
              className={cn(
                "mb-0.5 flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition",
                section !== "albums" && visibleAlbumId === album.id ? "bg-white font-semibold shadow-sm" : "hover:bg-white/60",
              )}
            >
              <span className="min-w-0 truncate">{album.title}</span>
              <span className="shrink-0 text-[11px] text-slate-500">{countPhotosForAlbum(allPhotos, album.id)}</span>
            </button>
          ))}
        </div>
      </aside>

      <section className="relative flex h-full flex-col overflow-hidden">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-black/10 px-5 py-2">
          <div className="min-w-0">
            {section !== "albums" && activeAlbumPhotos.length > 0 ? <AlbumHeaderCover photos={activeAlbumPhotos} /> : null}
            <h1 className="text-lg font-semibold">{section === "albums" ? "Albums" : activeAlbum.title}</h1>
            <p className="text-xs text-slate-500">{section === "albums" ? "Demo photos grouped into albums for browsing, filters, and viewer coverage." : activeAlbum.description}</p>
          </div>
          {section !== "albums" ? (
            <div className="flex gap-2">
              <button
                type="button"
                aria-label="Decrease thumbnail size"
                disabled={zoom <= minPhotoZoom}
                onClick={() => setZoom((value) => Math.max(minPhotoZoom, Number((value - 0.1).toFixed(1))))}
                className="grid size-8 place-items-center rounded-full hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ZoomOut className="size-4" />
              </button>
              <button
                type="button"
                aria-label="Increase thumbnail size"
                disabled={zoom >= maxPhotoZoom}
                onClick={() => setZoom((value) => Math.min(maxPhotoZoom, Number((value + 0.1).toFixed(1))))}
                className="grid size-8 place-items-center rounded-full hover:bg-black/10 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ZoomIn className="size-4" />
              </button>
            </div>
          ) : null}
        </header>

        {section === "albums" ? (
          <AlbumsStage albums={albumCards} photos={allPhotos} onOpenAlbum={openAlbum} />
        ) : (
          <div
            data-testid="photos-grid"
            className="grid flex-1 auto-rows-max gap-3 overflow-auto p-5 transition-[grid-template-columns] duration-200"
            style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${thumbnailSize}px, 1fr))` }}
          >
            {photos.map((photo) => (
              <div key={photo.id} className="group relative">
                <button
                  type="button"
                  aria-label={`Open ${labelForPhoto(photo)}`}
                  onClick={() => openPhoto(photo)}
                  className="group w-full overflow-hidden rounded-xl bg-slate-100 text-left shadow-sm ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="relative aspect-[4/3]">
                    <Image src={imageForPhoto(photo)} alt={photo.title || "Imported demo media"} fill className="object-cover transition duration-500 group-hover:scale-105" sizes="240px" />
                    {photo.special ? (
                      <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-amber-400 text-white shadow-lg" aria-label="Special unlocked photo">
                        <Star className="size-4 fill-white" />
                      </span>
                    ) : null}
                    {photo.mediaType === "video" ? (
                      <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full bg-black/45 text-white shadow-lg backdrop-blur-md" aria-label="Video">
                        <Play className="ml-0.5 size-4 fill-white" />
                      </span>
                    ) : null}
                    {photo.date ? (
                      <span className="absolute bottom-2 left-2 rounded-full bg-black/45 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                        {formatPhotoDate(photo.date)}
                      </span>
                    ) : null}
                  </div>
                  {photo.title || photo.caption ? (
                    <div className="p-2">
                      {photo.title ? <p className="truncate text-sm font-semibold">{photo.title}</p> : null}
                      {photo.caption ? <p className="truncate text-xs text-slate-500">{photo.caption}</p> : null}
                    </div>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => toggleFavorite(photo)}
                  aria-label={`${photo.favorite ? "Remove" : "Add"} ${labelForPhoto(photo)} ${photo.favorite ? "from" : "to"} Favourites`}
                  aria-pressed={Boolean(photo.favorite)}
                  className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-black/35 text-white opacity-0 backdrop-blur transition hover:bg-black/55 group-hover:opacity-100 focus:opacity-100"
                >
                  <Heart className={`size-4 ${photo.favorite ? "fill-red-500 text-red-500" : ""}`} />
                </button>
              </div>
            ))}
            {photos.length === 0 ? <div className="col-span-full grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 text-sm text-slate-500">No photos match this search.</div> : null}
          </div>
        )}

      </section>

      <AnimatePresence>
        {selectedPhoto ? (
          <motion.div
            key="photos-viewer"
            data-testid="photos-viewer-overlay"
            className="absolute inset-0 z-40 flex origin-center flex-col bg-[#070707] text-white"
            initial={{ opacity: 0, scale: 0.965, y: 12, filter: "blur(10px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.985, y: 8, filter: "blur(8px)" }}
            transition={{ duration: 0.34, ease: macEase }}
          >
            <motion.div
              className="flex h-16 items-center justify-between border-b border-white/10 bg-black/65 px-5 backdrop-blur-xl"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.26, ease: macEase }}
            >
              <div className="min-w-0">
                {selectedPhoto.title ? <h2 className="truncate text-sm font-semibold">{selectedPhoto.title}</h2> : null}
                {selectedPhoto.caption ? <p className="truncate text-xs text-white/60">{selectedPhoto.caption}</p> : null}
              </div>
              <div className="flex shrink-0 gap-2">
                {selectedPhoto.mediaType !== "video" ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setViewerZoom((value) => Math.max(0.8, Number((value - 0.2).toFixed(1))))}
                      aria-label="Zoom out"
                      className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
                    >
                      <ZoomOut className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewerZoom((value) => Math.min(2.4, Number((value + 0.2).toFixed(1))))}
                      aria-label="Zoom in"
                      className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
                    >
                      <ZoomIn className="size-4" />
                    </button>
                  </>
                ) : null}
                {selectedPhoto.mediaType === "video" ? (
                  <button
                    type="button"
                    onClick={() => setVideoMuted((value) => !value)}
                    aria-label={videoMuted ? "Unmute video" : "Mute video"}
                    className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
                  >
                    {videoMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleFavorite(selectedPhoto)}
                  aria-label={`${selectedPhoto.favorite ? "Remove current photo from" : "Add current photo to"} Favourites`}
                  aria-pressed={Boolean(selectedPhoto.favorite)}
                  className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
                >
                  <Heart className={`size-4 ${selectedPhoto.favorite ? "fill-red-500 text-red-500" : ""}`} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNotice(true);
                    track({ eventType: "PROTECTED_PHOTO_DELETE_BLOCKED", appId: "photos", metadata: { photoId: selectedPhoto.id } });
                  }}
                  aria-label="Delete photo"
                  className="grid size-9 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95"
                >
                  <Trash2 className="size-4" />
                </button>
                <button type="button" aria-label="Close photo viewer" onClick={() => setSelected(null)} className="grid size-9 place-items-center rounded-full bg-white text-slate-950 transition hover:bg-white/90 active:scale-95">
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
            <div className="relative min-h-0 flex-1 overflow-hidden bg-black">
              <AnimatePresence>
                {!mediaLoaded ? (
                  <motion.div
                    key="photos-loading"
                    className="absolute inset-0 z-10 grid place-items-center bg-black"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.22, ease: macEase }}
                  >
                    <div className="size-9 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  </motion.div>
                ) : null}
              </AnimatePresence>
              <button
                type="button"
                aria-label="Previous photo"
                onClick={() => navigateSelectedPhoto("previous")}
                className="absolute left-4 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white opacity-90 backdrop-blur transition duration-200 hover:scale-105 hover:bg-white/25 active:scale-95"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                type="button"
                aria-label="Next photo"
                onClick={() => navigateSelectedPhoto("next")}
                className="absolute right-4 top-1/2 z-20 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/12 text-white opacity-90 backdrop-blur transition duration-200 hover:scale-105 hover:bg-white/25 active:scale-95"
              >
                <ChevronRight className="size-6" />
              </button>
              <AnimatePresence mode="wait">
                {selectedPhoto.mediaType === "video" ? (
                  <motion.div
                    key={selectedPhoto.id}
                    className="flex h-full min-h-0 w-full flex-col items-center justify-center gap-3 p-4 sm:p-6"
                    initial={{ opacity: 0, scale: 0.985, x: 24 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.985, x: -24 }}
                    transition={{ duration: 0.28, ease: macEase }}
                  >
                    <div className="grid min-h-0 w-full flex-1 place-items-center overflow-hidden">
                      <motion.video
                        ref={videoRef}
                        data-testid="photos-viewer-media"
                        src={selectedPhoto.src}
                        poster={selectedPhoto.posterSrc}
                        muted={videoMuted}
                        playsInline
                        onLoadedData={() => setMediaLoaded(true)}
                        onLoadedMetadata={(event) => setVideoDuration(event.currentTarget.duration || 0)}
                        onTimeUpdate={(event) => setVideoCurrentTime(event.currentTarget.currentTime)}
                        onPlay={() => setVideoPlaying(true)}
                        onPause={() => setVideoPlaying(false)}
                        onEnded={() => setVideoPlaying(false)}
                        className={cn("block max-h-full max-w-full rounded-xl bg-black object-contain shadow-2xl", videoOrientationClass(selectedPhoto))}
                        style={{ aspectRatio: videoAspectRatio(selectedPhoto) }}
                        transition={{ duration: 0.24, ease: macEase }}
                      />
                    </div>
                    <div data-testid="photos-video-controls" className="flex w-full max-w-3xl shrink-0 items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 text-white shadow-2xl backdrop-blur-xl">
                      <button type="button" aria-label={videoPlaying ? "Pause video" : "Play video"} onClick={toggleVideoPlayback} className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-slate-950 transition active:scale-95">
                        {videoPlaying ? <Pause className="size-4 fill-slate-950" /> : <Play className="ml-0.5 size-4 fill-slate-950" />}
                      </button>
                      <button type="button" aria-label="Rewind video" onClick={() => seekVideo(-10)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95">
                        <Rewind className="size-4" />
                      </button>
                      <button type="button" aria-label="Forward video" onClick={() => seekVideo(10)} className="grid size-9 shrink-0 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-95">
                        <FastForward className="size-4" />
                      </button>
                      <span className="w-10 shrink-0 text-right text-[11px] font-semibold tabular-nums text-white/70">{formatVideoTime(videoCurrentTime)}</span>
                      <input
                        aria-label="Video timeline"
                        type="range"
                        min={0}
                        max={Math.max(0, Math.floor(videoDuration))}
                        step={0.1}
                        value={Math.min(videoCurrentTime, videoDuration || 0)}
                        onChange={(event) => setVideoProgress(event.target.value)}
                        className="min-w-0 flex-1 accent-white"
                      />
                      <span className="w-10 shrink-0 text-[11px] font-semibold tabular-nums text-white/70">{formatVideoTime(videoDuration)}</span>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedPhoto.id}
                    className="relative h-full w-full"
                    initial={{ opacity: 0, scale: 0.985, x: 24 }}
                    animate={{ opacity: 1, scale: viewerZoom, x: 0 }}
                    exit={{ opacity: 0, scale: 0.985, x: -24 }}
                    transition={{ duration: 0.28, ease: macEase }}
                  >
                    <Image
                      data-testid="photos-viewer-media"
                      src={selectedPhoto.src}
                      alt={selectedPhoto.title || "Imported demo media"}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      onLoad={() => setMediaLoaded(true)}
                      priority
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="absolute inset-0 z-50 grid place-items-center bg-black/35"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: macEase }}
          >
            <motion.div
              className="w-[320px] rounded-2xl bg-white p-5 text-center text-slate-950 shadow-2xl"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: macEase }}
            >
              <h2 className="font-semibold">{photosContent.deleteModal.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{photosContent.deleteModal.body}</p>
              <button type="button" onClick={() => setNotice(false)} className="mt-5 rounded-full bg-slate-950 px-5 py-2 text-sm font-semibold text-white transition active:scale-95">
                OK
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {toast ? (
          <motion.div
            className="absolute bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-xl"
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.22, ease: macEase }}
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function AlbumHeaderCover({ photos }: { photos: PhotoRecord[] }) {
  return (
    <div className="mb-1 flex h-9 items-center">
      {photos.map((photo, index) => (
        <div key={photo.id} className="relative size-9 overflow-hidden rounded-xl border-2 border-white bg-slate-200 shadow-sm" style={{ marginLeft: index === 0 ? 0 : -10, zIndex: photos.length - index }}>
          <Image src={photo.posterSrc ?? photo.src} alt="" fill className="object-cover" sizes="44px" />
          {photo.mediaType === "video" ? (
            <span className="absolute inset-0 grid place-items-center bg-black/20 text-white">
              <Play className="ml-0.5 size-3 fill-white" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function formatVideoTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

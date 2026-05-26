import { BookOpen, CalendarDays, Heart, Images, Play, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Image from "next/image";

import type { PhotoAlbum, PhotoRecord } from "@/content/apps/photos";
import { cn } from "@/lib/utils";
import { latestPhotoDate, photoMatchesAlbum } from "./photo-helpers";

export function AlbumsStage({ albums, photos, onOpenAlbum }: { albums: PhotoAlbum[]; photos: PhotoRecord[]; onOpenAlbum: (album: PhotoAlbum) => void }) {
  return (
    <div data-testid="photos-albums-stage" className="min-h-0 flex-1 overflow-auto bg-[#fbfbfd] p-5">
      <div className="mb-5 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
        <div className="grid min-h-[170px] grid-cols-[1.15fr_0.85fr]">
          <div className="flex flex-col justify-end p-6">
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-[#007aff]/10 text-[#007aff]">
              <Sparkles className="size-5" />
            </div>
            <p className="text-2xl font-bold tracking-tight">Albums</p>
            <p className="mt-1 max-w-[420px] text-sm leading-5 text-slate-500">
              Bundled demo photos grouped into small collections so the gallery flows feel real.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-100 p-2">
            {photos.slice(0, 6).map((photo, index) => (
              <div key={photo.id} className={cn("relative aspect-square overflow-hidden rounded-xl", index === 0 ? "row-span-2" : "")}>
                <Image src={imageForPhoto(photo)} alt="" fill className="object-cover" sizes="180px" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-4">
        {albums.map((album) => {
          const albumPhotos = photos.filter((photo) => photoMatchesAlbum(photo, album.id));
          const coverPhotos = resolveAlbumCoverPhotos(album, photos);
          const Icon = iconForAlbum(album);
          return (
            <button
              key={album.id}
              type="button"
              aria-label={`Open ${album.title} album`}
              onClick={() => onOpenAlbum(album)}
              className="group overflow-hidden rounded-2xl bg-white text-left shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={cn("relative aspect-[4/3] overflow-hidden bg-gradient-to-br", album.accent)}>
                <AlbumCoverCollage photos={coverPhotos} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-white/5" />
                <div className="absolute left-3 top-3 flex size-9 items-center justify-center rounded-2xl bg-white/85 text-slate-900 shadow-sm backdrop-blur">
                  <Icon className="size-4" />
                </div>
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-lg font-bold text-white drop-shadow">{album.title}</p>
                  <p className="text-xs font-semibold text-white/85">
                    {albumPhotos.length} {albumPhotos.length === 1 ? "item" : "items"}
                  </p>
                </div>
              </div>
              <div className="p-3">
                <p className="line-clamp-2 min-h-10 text-sm text-slate-600">{album.description}</p>
                <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-slate-400">
                  <CalendarDays className="size-3.5" />
                  {latestPhotoDate(albumPhotos)}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {albums.length === 0 ? <div className="grid min-h-[220px] place-items-center rounded-2xl border border-dashed border-slate-300 bg-white text-sm text-slate-500">No albums match this search.</div> : null}
    </div>
  );
}

function AlbumCoverCollage({ photos }: { photos: PhotoRecord[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="absolute inset-0 overflow-hidden">
      {photos.slice(0, 4).map((photo, index) => (
        <div
          key={photo.id}
          className={cn(
            "absolute overflow-hidden rounded-2xl bg-white/15 shadow-xl ring-2 ring-white/75 transition duration-500 group-hover:scale-[1.03]",
            index === 0 && "left-[10%] top-[11%] h-[70%] w-[54%] rotate-[-7deg]",
            index === 1 && "right-[8%] top-[8%] h-[48%] w-[44%] rotate-[8deg]",
            index === 2 && "bottom-[7%] right-[13%] h-[47%] w-[42%] rotate-[-3deg]",
            index === 3 && "bottom-[11%] left-[4%] h-[36%] w-[34%] rotate-[5deg]",
          )}
        >
          <Image src={imageForPhoto(photo)} alt="" fill className="object-cover" sizes="180px" />
          {photo.mediaType === "video" ? (
            <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur">
              <Play className="ml-0.5 size-3 fill-white" />
            </span>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function resolveAlbumCoverPhotos(album: PhotoAlbum, photos: PhotoRecord[]) {
  const albumPhotos = photos.filter((photo) => photoMatchesAlbum(photo, album.id));
  const cover = photos.find((photo) => photo.id === album.coverPhotoId);
  const seen = new Set<string>();
  return [cover, ...albumPhotos]
    .filter((photo): photo is PhotoRecord => {
      if (!photo || seen.has(photo.id)) {
        return false;
      }
      seen.add(photo.id);
      return true;
    })
    .slice(0, 4);
}

function imageForPhoto(photo: PhotoRecord) {
  return photo.posterSrc ?? photo.src;
}

function iconForAlbum(album: PhotoAlbum): LucideIcon {
  if (album.kind === "book") return BookOpen;
  if (album.kind === "featured") return Sparkles;
  if (album.kind === "smart") return Heart;
  return Images;
}

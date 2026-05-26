import type { PhotoRecord } from "@/content/apps/photos";

export function photoMatchesAlbum(photo: PhotoRecord, albumId: string) {
  if (albumId === "recents") return true;
  if (albumId === "favorites") return Boolean(photo.favorite);
  return photo.albumId === albumId;
}

export function countPhotosForAlbum(photos: PhotoRecord[], albumId: string) {
  return photos.filter((photo) => photoMatchesAlbum(photo, albumId)).length;
}

export function formatPhotoDate(date?: string) {
  if (!date) return "Recently";
  const [year, month, day] = date.split("-").map(Number);
  if (!year || !month || !day) return date;
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(new Date(year, month - 1, day));
}

export function latestPhotoDate(photos: PhotoRecord[]) {
  if (photos.length === 0) return "Ready for first photo";
  const latest = photos.map((photo) => photo.date).filter(Boolean).sort().at(-1);
  return latest ? formatPhotoDate(latest) : "Recently updated";
}

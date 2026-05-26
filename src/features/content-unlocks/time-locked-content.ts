import { notesContent, type NoteRecord } from "@/content/apps/notes";
import { photosContent, type PhotoRecord } from "@/content/apps/photos";
import { spotifyContent } from "@/content/apps/spotify";

export type UnlockableContent = {
  id: string;
  unlockAt?: string;
  hiddenUntilUnlocked?: boolean;
};

export type UnlockNotification = {
  appId: "notes" | "photos" | "spotify";
  title: string;
  body: string;
};

export function resolveUnlockedNotes(notes: NoteRecord[], now = new Date()) {
  return notes
    .filter((note) => isContentVisible(note, now))
    .map((note) => {
      if (!isTimedUnlock(note)) {
        return note;
      }

      const unlockAt = note.unlockAt ?? now.toISOString();
      return {
        ...note,
        special: true,
        updatedAt: formatUnlockedNoteDate(unlockAt, now),
        updatedAtIso: unlockAt,
      } satisfies NoteRecord;
    })
    .sort((first, second) => getNoteSortTime(second) - getNoteSortTime(first));
}

export function resolveUnlockedPhotos(photos: PhotoRecord[], now = new Date()) {
  return photos
    .filter((photo) => isContentVisible(photo, now))
    .map((photo) => {
      if (!isTimedUnlock(photo)) {
        return photo;
      }

      const unlockAt = photo.unlockAt ?? now.toISOString();
      return {
        ...photo,
        special: true,
        date: toLocalDateId(new Date(unlockAt)),
      } satisfies PhotoRecord;
    })
    .sort((first, second) => getPhotoSortTime(second) - getPhotoSortTime(first));
}

export function getTodaysUnlockNotifications(now = new Date()): UnlockNotification[] {
  const today = toLocalDateId(now);
  const noteCount = notesContent.notes.filter((note) => unlocksOnDate(note, today, now)).length;
  const photoCount = photosContent.photos.filter((photo) => unlocksOnDate(photo, today, now)).length;
  const spotifyPlaylistCount = spotifyContent.playlists.filter((playlist) => unlocksOnDate(playlist, today, now)).length;
  const notifications: UnlockNotification[] = [];

  if (photoCount > 0) {
    notifications.push({
      appId: "photos",
      title: "New in Photos",
      body: photoCount === 1 ? "Something new is waiting in the gallery." : `${photoCount} new photos are waiting in the gallery.`,
    });
  }

  if (noteCount > 0) {
    notifications.push({
      appId: "notes",
      title: "New in Notes",
      body: noteCount === 1 ? "A new note unlocked today." : `${noteCount} new notes unlocked today.`,
    });
  }

  if (spotifyPlaylistCount > 0) {
    notifications.push({
      appId: "spotify",
      title: "New in Jukebox",
      body: spotifyPlaylistCount === 1 ? "A new playlist unlocked in Jukebox." : `${spotifyPlaylistCount} playlists unlocked in Jukebox.`,
    });
  }

  return notifications;
}

export function toLocalDateId(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isTimedUnlock(content: UnlockableContent) {
  return Boolean(content.hiddenUntilUnlocked && content.unlockAt);
}

function isContentVisible(content: UnlockableContent, now: Date) {
  if (!content.hiddenUntilUnlocked) {
    return true;
  }

  if (!content.unlockAt) {
    return false;
  }

  return new Date(content.unlockAt).getTime() <= now.getTime();
}

function unlocksOnDate(content: UnlockableContent, dateId: string, now: Date) {
  if (!isTimedUnlock(content) || !isContentVisible(content, now) || !content.unlockAt) {
    return false;
  }

  return toLocalDateId(new Date(content.unlockAt)) === dateId;
}

function formatUnlockedNoteDate(unlockAt: string, now: Date) {
  const date = new Date(unlockAt);
  const time = new Intl.DateTimeFormat("en", { hour: "numeric", minute: "2-digit" }).format(date);
  if (toLocalDateId(date) === toLocalDateId(now)) {
    return `Today ${time}`;
  }

  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function getNoteSortTime(note: NoteRecord) {
  const parsed = Date.parse(note.updatedAtIso ?? note.unlockAt ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPhotoSortTime(photo: PhotoRecord) {
  const parsed = Date.parse(photo.date ?? photo.unlockAt ?? "");
  return Number.isFinite(parsed) ? parsed : 0;
}

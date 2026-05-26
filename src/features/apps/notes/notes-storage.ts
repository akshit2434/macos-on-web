import { notesContent, type NoteRecord } from "@/content/apps/notes";
import { isTestSessionActive, testSessionHeaders } from "@/features/session/session-mode";

export type StoredNotesState = {
  notes: NoteRecord[];
  doodles: Record<string, string | null>;
};

const notesStorageKey = "macos-web.notes.v1";

export function loadStoredNotesState(): StoredNotesState {
  if (typeof window === "undefined") {
    return { notes: notesContent.notes, doodles: {} };
  }

  try {
    const stored = window.localStorage.getItem(notesStorageKey);
    if (!stored) {
      return { notes: notesContent.notes, doodles: {} };
    }

    const parsed = JSON.parse(stored) as Partial<StoredNotesState>;
    const notes = Array.isArray(parsed.notes) ? parsed.notes : notesContent.notes;
    const protectedNotes = notesContent.notes.filter((note) => note.readonly || note.protected || note.locked);
    const editableStored = notes.filter(
      (note) => !protectedNotes.some((protectedNote) => protectedNote.id === note.id),
    );

    return {
      notes: [...editableStored, ...protectedNotes],
      doodles: parsed.doodles && typeof parsed.doodles === "object" ? parsed.doodles : {},
    };
  } catch {
    return { notes: notesContent.notes, doodles: {} };
  }
}

export function saveStoredNotesState(state: StoredNotesState) {
  try {
    window.localStorage.setItem(notesStorageKey, JSON.stringify(state));
  } catch {
    // The note still works locally if storage is unavailable.
  }
}

export async function syncNotesStateToCloud(state: StoredNotesState) {
  if (isTestSessionActive()) {
    return;
  }

  await fetch("/api/notes/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...testSessionHeaders() },
    body: JSON.stringify(state),
    keepalive: true,
  }).catch(() => undefined);
}

import { type NoteRecord } from "@/content/apps/notes";

export type IncomingNotesSync = {
  notes?: NoteRecord[];
  doodles?: Record<string, string | null>;
};

export type NoteContentStateRow = {
  content_type: "note";
  content_id: string;
  state: "available" | "locked";
  metadata: {
    title: string;
    folder: string;
    body: string;
    updatedAt: string;
    author: string | null;
    readonly: boolean;
    protected: boolean;
    locked: boolean;
    tags: string[];
    hasDoodle: boolean;
    doodleStored: boolean;
    doodlePreviewUrl?: string;
  };
};

const maxDoodlePreviewLength = 1_500_000;
const pngDataUrlPattern = /^data:image\/png;base64,[a-zA-Z0-9+/=]+$/;

export function buildNoteContentStateRows(payload: IncomingNotesSync): NoteContentStateRow[] {
  const notes = Array.isArray(payload.notes) ? payload.notes : [];

  return notes.map((note) => {
    const rawDoodle = payload.doodles?.[note.id] ?? null;
    const doodlePreviewUrl = sanitizeDoodlePreview(rawDoodle);
    const hasDoodle = typeof rawDoodle === "string" && rawDoodle.length > 0;

    return {
      content_type: "note",
      content_id: note.id,
      state: note.locked ? "locked" : "available",
      metadata: {
        title: note.title,
        folder: note.folder,
        body: note.body,
        updatedAt: note.updatedAt,
        author: note.author ?? null,
        readonly: Boolean(note.readonly),
        protected: Boolean(note.protected),
        locked: Boolean(note.locked),
        tags: note.tags ?? [],
        hasDoodle,
        doodleStored: Boolean(doodlePreviewUrl),
        ...(doodlePreviewUrl ? { doodlePreviewUrl } : {}),
      },
    };
  });
}

function sanitizeDoodlePreview(value: string | null | undefined) {
  if (!value || value.length > maxDoodlePreviewLength || !pngDataUrlPattern.test(value)) {
    return null;
  }

  return value;
}

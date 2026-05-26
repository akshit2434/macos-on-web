export type NoteRecord = {
  id: string;
  folder: string;
  title: string;
  body: string;
  updatedAt: string;
  updatedAtIso?: string;
  author?: "owner" | "collaborator";
  readonly?: boolean;
  pinned?: boolean;
  locked?: boolean;
  protected?: boolean;
  special?: boolean;
  hiddenUntilUnlocked?: boolean;
  unlockAt?: string;
  tags?: string[];
};

export const notesContent = {
  folders: ["Today", "Ideas", "Product", "Locked", "Sketches"],
  deleteModal: {
    title: "This note is protected",
    body: "Some notes are kept exactly where they are so the demo state stays consistent.",
  },
  daily: {
    noteId: "daily-note",
    quoteId: "quote-of-day",
    featuredNoteId: "build-note",
  },
  notes: [
    {
      id: "daily-note",
      folder: "Today",
      title: "Note of the Day",
      body: "Ship the simulator story, not just the UI. Every app should explain a capability without needing private context.",
      updatedAt: "Today 9:10 AM",
      updatedAtIso: "2026-06-10T09:10:00+05:30",
      author: "owner",
      readonly: true,
      pinned: true,
      protected: true,
      tags: ["daily"],
    },
    {
      id: "quote-of-day",
      folder: "Today",
      title: "Quote of the Day",
      body: "Interesting products feel specific because the content is specific, not because the chrome is loud.",
      updatedAt: "Today 9:12 AM",
      updatedAtIso: "2026-06-10T09:12:00+05:30",
      author: "owner",
      readonly: true,
      pinned: true,
      tags: ["quote"],
    },
    {
      id: "build-note",
      folder: "Product",
      title: "Build Note",
      body: "The public version keeps the local-first architecture, generated media, and analytics hooks while swapping in neutral demo content.",
      updatedAt: "Yesterday",
      updatedAtIso: "2026-06-09T18:30:00+05:30",
      author: "owner",
      readonly: true,
      protected: true,
      tags: ["build"],
    },
    {
      id: "locked-letter",
      folder: "Locked",
      title: "Locked Note",
      body: "This note unlocks through the same Face ID-style flow used elsewhere in the simulator.",
      updatedAt: "Monday",
      updatedAtIso: "2026-06-08T10:00:00+05:30",
      author: "owner",
      readonly: true,
      locked: true,
      protected: true,
    },
    {
      id: "sketch-pad",
      folder: "Sketches",
      title: "Sketch Pad",
      body: "Open the drawing panel to add handwriting or a quick sketch.",
      updatedAt: "Today",
      updatedAtIso: "2026-06-10T08:30:00+05:30",
      author: "collaborator",
      tags: ["drawing"],
    },
    {
      id: "unlock-note-demo",
      folder: "Today",
      title: "Timed Demo Note",
      body: "This note exists to prove hidden content can unlock on a schedule without shipping any real personal copy.",
      updatedAt: "Locked",
      updatedAtIso: "2026-06-12T08:00:00+05:30",
      author: "owner",
      readonly: true,
      protected: true,
      hiddenUntilUnlocked: true,
      unlockAt: "2026-06-12T08:00:00+05:30",
      tags: ["unlock"],
    },
    {
      id: "unlock-note-future-template",
      folder: "Today",
      title: "Future Locked Note",
      body: "This future note exists to prove hidden notes stay out of the UI before their unlock day.",
      updatedAt: "Locked",
      updatedAtIso: "2030-01-15T08:00:00+05:30",
      author: "owner",
      readonly: true,
      protected: true,
      hiddenUntilUnlocked: true,
      unlockAt: "2030-01-15T08:00:00+05:30",
      tags: ["unlock"],
    },
  ] satisfies NoteRecord[],
};

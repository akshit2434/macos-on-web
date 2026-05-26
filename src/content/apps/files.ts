export type FinderFileKind = "PDF" | "Audio" | "Image" | "Note";

export type FinderFileRecord = {
  id: string;
  name: string;
  kind: FinderFileKind;
  size: string;
  modifiedAt: string;
  createdAt: string;
  protected?: boolean;
  preview: string;
  previewImage?: string;
  duration?: string;
  tags?: string[];
};

export type FinderFolderRecord = {
  id: string;
  name: string;
  icon: "clock" | "heart" | "hidden";
  locked?: boolean;
  files: FinderFileRecord[];
};

export const filesContent: { folders: FinderFolderRecord[] } = {
  folders: [
    {
      id: "recents",
      name: "Recents",
      icon: "clock",
      files: [
        {
          id: "brief-1",
          name: "Product Brief.pdf",
          kind: "PDF",
          size: "1.2 MB",
          modifiedAt: "Today, 9:41 AM",
          createdAt: "June 1, 2026",
          protected: true,
          tags: ["Planning", "Read only"],
          preview:
            "Product Brief\n\nGoal: make the desktop simulator understandable to strangers.\nScope: notes, gallery, music player, puzzles, and local-first analytics hooks.",
        },
        {
          id: "audio-1",
          name: "Ambient Loop.wav",
          kind: "Audio",
          size: "420 KB",
          modifiedAt: "Yesterday, 10:08 PM",
          createdAt: "May 31, 2026",
          duration: "00:42",
          protected: true,
          tags: ["Audio", "Read only"],
          preview: "Ambient loop\n00:42\n\nA tiny generated track used to prove local audio playback in the demo music app.",
        },
      ],
    },
    {
      id: "moodboard",
      name: "Moodboard",
      icon: "heart",
      files: [
        {
          id: "img-1",
          name: "Interface Direction.svg",
          kind: "Image",
          size: "280 KB",
          modifiedAt: "Today, 7:12 PM",
          createdAt: "June 1, 2026",
          previewImage: "/photos/demo/photo-3.svg",
          protected: true,
          tags: ["Reference", "Visual"],
          preview: "Interface direction\n\nA self-contained placeholder asset that keeps Finder previews working without private photos.",
        },
      ],
    },
    {
      id: "locked",
      name: "Locked",
      icon: "hidden",
      locked: true,
      files: [
        {
          id: "locked-1",
          name: "Open Later.note",
          kind: "Note",
          size: "8 KB",
          modifiedAt: "Locked",
          createdAt: "June 2, 2026",
          protected: true,
          tags: ["Locked", "Read only"],
          preview: "This note is intentionally hidden until the matching content rule unlocks it.",
        },
      ],
    },
  ],
};

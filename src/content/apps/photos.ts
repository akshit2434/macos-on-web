export type PhotoRecord = {
  id: string;
  albumId: string;
  title: string;
  caption: string;
  src: string;
  mediaType?: "image" | "video";
  posterSrc?: string;
  videoWidth?: number;
  videoHeight?: number;
  date?: string;
  favorite?: boolean;
  protected?: boolean;
  special?: boolean;
  hiddenUntilUnlocked?: boolean;
  unlockAt?: string;
};

export type PhotoAlbum = {
  id: string;
  title: string;
  description: string;
  kind: "library" | "album" | "book" | "featured" | "smart";
  accent: string;
  coverPhotoId?: string;
  protected?: boolean;
};

export type PhotosContent = {
  deleteModal: {
    title: string;
    body: string;
  };
  albums: PhotoAlbum[];
  photos: PhotoRecord[];
};

export const photosContent: PhotosContent = {
  deleteModal: {
    title: "Cannot Delete Photo",
    body: "This album is protected, so the photo stays here.",
  },
  albums: [
    {
      id: "recents",
      title: "Recents",
      description: "Bundled demo shots plus anything captured locally during a session.",
      kind: "library",
      accent: "from-sky-500 to-rose-400",
      coverPhotoId: "demo-photo-1",
      protected: true,
    },
    {
      id: "camera-roll",
      title: "Camera Roll",
      description: "Photos captured inside the web simulator appear here.",
      kind: "album",
      accent: "from-neutral-800 to-neutral-500",
      protected: true,
    },
    {
      id: "design-sprint",
      title: "Design Sprint",
      description: "Safe demo images that show the gallery layout and album affordances.",
      kind: "album",
      accent: "from-fuchsia-500 to-rose-400",
      coverPhotoId: "demo-photo-3",
      protected: true,
    },
    {
      id: "night-ops",
      title: "Night Ops",
      description: "A second album for testing filters, favourites, and future unlocks.",
      kind: "album",
      accent: "from-slate-700 to-sky-500",
      coverPhotoId: "demo-photo-5",
      protected: true,
    },
    {
      id: "favorites",
      title: "Favourites",
      description: "Favourited photos gathered automatically.",
      kind: "smart",
      accent: "from-rose-500 to-pink-400",
      protected: true,
    },
  ] satisfies PhotoAlbum[],
  photos: [
    {
      id: "demo-photo-1",
      albumId: "design-sprint",
      title: "Sprint Board",
      caption: "Placeholder gallery art used to verify responsive thumbnails.",
      src: "/photos/demo/photo-1.svg",
      mediaType: "image",
      date: "2026-06-01",
      protected: true,
    },
    {
      id: "demo-photo-2",
      albumId: "design-sprint",
      title: "Desk Setup",
      caption: "A safe local asset that stands in for the original private imagery.",
      src: "/photos/demo/photo-2.svg",
      mediaType: "image",
      date: "2026-06-01",
      favorite: true,
      protected: true,
    },
    {
      id: "demo-photo-3",
      albumId: "design-sprint",
      title: "Wireframe Review",
      caption: "Used to test captions, album cards, and the detail viewer.",
      src: "/photos/demo/photo-3.svg",
      mediaType: "image",
      date: "2026-06-02",
      protected: true,
    },
    {
      id: "demo-photo-4",
      albumId: "night-ops",
      title: "Prototype Notes",
      caption: "A second album helps exercise album navigation and recent-photo logic.",
      src: "/photos/demo/photo-4.svg",
      mediaType: "image",
      date: "2026-06-02",
      favorite: true,
      protected: true,
    },
    {
      id: "demo-photo-5",
      albumId: "night-ops",
      title: "Release Checklist",
      caption: "A protected demo image for delete-modal coverage and favourites.",
      src: "/photos/demo/photo-5.svg",
      mediaType: "image",
      date: "2026-06-03",
      protected: true,
    },
    {
      id: "demo-photo-6",
      albumId: "night-ops",
      title: "Quiet Mode",
      caption: "This one stays hidden until a future unlock date in the demo dataset.",
      src: "/photos/demo/photo-6.svg",
      mediaType: "image",
      date: "2030-01-15",
      protected: true,
      hiddenUntilUnlocked: true,
      unlockAt: "2030-01-15T09:00:00+05:30",
    },
  ],
};

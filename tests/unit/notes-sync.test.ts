import { describe, expect, it } from "vitest";

import { buildNoteContentStateRows } from "@/features/apps/notes/notes-sync";

describe("notes sync", () => {
  const pngDoodle = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB";

  it("stores note doodle previews in content state metadata for the admin dashboard", () => {
    const [row] = buildNoteContentStateRows({
      notes: [
        {
          id: "note-1",
          title: "Sketch",
          folder: "Personal",
          body: "<p>hello</p>",
          updatedAt: "Just now",
          author: "owner",
        },
      ],
      doodles: { "note-1": pngDoodle },
    });

    expect(row.metadata).toMatchObject({
      title: "Sketch",
      hasDoodle: true,
      doodleStored: true,
      doodlePreviewUrl: pngDoodle,
    });
  });

  it("keeps doodle presence without storing unsafe data urls", () => {
    const [row] = buildNoteContentStateRows({
      notes: [
        {
          id: "note-1",
          title: "Sketch",
          folder: "Personal",
          body: "",
          updatedAt: "Just now",
          author: "owner",
        },
      ],
      doodles: { "note-1": "data:image/svg+xml;base64,PHN2Zy8+" },
    });

    expect(row.metadata).toMatchObject({
      hasDoodle: true,
      doodleStored: false,
    });
    expect(row.metadata).not.toHaveProperty("doodlePreviewUrl");
  });
});

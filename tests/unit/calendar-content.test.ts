import { describe, expect, it } from "vitest";

import { calendarContent } from "@/content/apps/calendar";

describe("calendar content", () => {
  it("contains the public demo events", () => {
    expect(calendarContent.events.map((event) => ({ title: event.title, date: event.date }))).toEqual([
      { title: "Narrative Pass Review", date: "2026-06-03" },
      { title: "Gallery Polish", date: "2026-06-06" },
      { title: "Capture README Screenshots", date: "2026-06-11" },
      { title: "Final QA Sweep", date: "2026-06-13" },
    ]);
  });
});

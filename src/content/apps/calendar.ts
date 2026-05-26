export const calendarContent = {
  calendars: [
    { id: "product", name: "Product", color: "#ef4444" },
    { id: "build", name: "Build", color: "#0ea5e9" },
    { id: "demo", name: "Demo", color: "#f59e0b" },
  ],
  events: [
    {
      id: "story-pass",
      title: "Narrative Pass Review",
      calendarId: "product",
      date: "2026-06-03",
      time: "10:00 AM",
      notes: "Review whether the desktop apps still feel cohesive after the sanitization pass.",
    },
    {
      id: "gallery-polish",
      title: "Gallery Polish",
      calendarId: "build",
      date: "2026-06-06",
      time: "2:30 PM",
      notes: "Tune album grouping, favourites flow, and empty-state copy.",
    },
    {
      id: "demo-capture",
      title: "Capture README Screenshots",
      calendarId: "demo",
      date: "2026-06-11",
      time: "4:00 PM",
      notes: "Record a short walkthrough GIF and grab still screenshots for the public repo.",
    },
    {
      id: "qa-sweep",
      title: "Final QA Sweep",
      calendarId: "demo",
      date: "2026-06-13",
      time: "6:00 PM",
      notes: "Run lint, typecheck, unit tests, and a local smoke test before publishing.",
    },
  ],
};

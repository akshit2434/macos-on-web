import { calendarContent } from "@/content/apps/calendar";
import { notesContent } from "@/content/apps/notes";
import { photosContent } from "@/content/apps/photos";
import { spotifyContent } from "@/content/apps/spotify";
import { puzzleLevels } from "@/content/puzzles";

export function resolveDailyContent(date = new Date()) {
  const key = date.toISOString().slice(0, 10);

  return {
    date: key,
    note: notesContent.notes.find((note) => note.id === notesContent.daily.noteId),
    quote: notesContent.notes.find((note) => note.id === notesContent.daily.quoteId),
    featuredNote: notesContent.notes.find((note) => note.id === notesContent.daily.featuredNoteId),
    featuredPhoto: photosContent.photos.find((photo) => photo.albumId === "design-sprint") ?? photosContent.photos[0],
    song: spotifyContent.tracks[0],
    calendarEvents: calendarContent.events.filter((event) => event.date === key),
    puzzleLevels: Object.fromEntries(
      Object.entries(puzzleLevels).map(([kind, levels]) => [
        kind,
        levels.find((level) => level.metadata.date === key) ?? levels[0],
      ]),
    ),
  };
}

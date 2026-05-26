import { Code2, Gamepad2, Hammer, Joystick, MonitorDown, Palette, Sparkles } from "lucide-react";

import type { AppCategory } from "@/features/shell/types";

export type StoreSectionId = "discover" | "arcade" | "create" | "work" | "play" | "develop" | "updates";

export type StoreSection = {
  id: StoreSectionId;
  label: string;
  subtitle: string;
  categories: AppCategory[] | "all";
  icon: typeof Sparkles;
};

export const storeSections: StoreSection[] = [
  { id: "discover", label: "Discover", subtitle: "Editor picks for this Mac", categories: "all", icon: Sparkles },
  { id: "arcade", label: "Arcade", subtitle: "Games made for daily play", categories: ["game"], icon: Joystick },
  { id: "create", label: "Create", subtitle: "Notes, photos, media, and making", categories: ["personal", "media"], icon: Palette },
  { id: "work", label: "Work", subtitle: "Utilities and system tools", categories: ["system", "utility", "personal"], icon: Hammer },
  { id: "play", label: "Play", subtitle: "Puzzles and light games", categories: ["game", "media"], icon: Gamepad2 },
  { id: "develop", label: "Develop", subtitle: "System and simulator tooling", categories: ["system", "utility"], icon: Code2 },
  { id: "updates", label: "Updates", subtitle: "Installed apps and local builds", categories: "all", icon: MonitorDown },
];

export const editorialCards = [
  {
    id: "today-macos-web",
    kicker: "APP OF THE DAY",
    title: "Notes, gallery, and shell interactions",
    body: "A bundled set of demo apps tuned for the simulator's local-first desktop UI.",
    appId: "notes",
  },
  {
    id: "today-puzzles",
    kicker: "PLAY",
    title: "Daily puzzle rituals",
    body: "Wordle, Zip, and Arrow Escape now track attempts without breaking your play session.",
    appId: "wordle",
  },
];

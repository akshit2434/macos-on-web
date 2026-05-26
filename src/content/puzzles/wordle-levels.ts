import type { WordleLevel } from "@/features/puzzles/types";
import { englishFiveLetterWords } from "./wordle-allowed-words";

type RawWordleLevel = readonly [
  id: string,
  title: string,
  difficulty: "easy" | "medium" | "hard",
  daily: 0 | 1,
  date: string,
  answer: string,
];

const allowedWords = [
  "adieu",
  "amber",
  "beach",
  "berry",
  "bloom",
  "blush",
  "brave",
  "bread",
  "brush",
  "cabin",
  "chair",
  "charm",
  "chord",
  "cider",
  "cloud",
  "coast",
  "cocoa",
  "coral",
  "couch",
  "crane",
  "cream",
  "crisp",
  "crown",
  "dance",
  "dream",
  "drift",
  "fauna",
  "field",
  "flame",
  "flint",
  "flora",
  "focus",
  "frame",
  "fresh",
  "frost",
  "fuzzy",
  "glass",
  "glide",
  "glory",
  "grace",
  "grape",
  "grove",
  "happy",
  "heart",
  "honey",
  "jazzy",
  "laser",
  "laugh",
  "lemon",
  "light",
  "linen",
  "lunar",
  "magic",
  "mango",
  "maple",
  "melon",
  "merry",
  "mount",
  "movie",
  "music",
  "night",
  "noble",
  "novel",
  "ocean",
  "olive",
  "orbit",
  "paper",
  "peace",
  "peach",
  "pearl",
  "piano",
  "pixel",
  "plane",
  "plant",
  "porch",
  "prism",
  "quiet",
  "quilt",
  "rainy",
  "raise",
  "rapid",
  "river",
  "roast",
  "route",
  "royal",
  "scale",
  "scent",
  "shine",
  "slate",
  "smart",
  "smile",
  "snack",
  "solid",
  "sound",
  "spark",
  "spice",
  "stare",
  "stone",
  "story",
  "sugar",
  "sunny",
  "sweet",
  "table",
  "tempo",
  "toast",
  "trace",
  "trail",
  "trust",
  "verse",
  "vivid",
  "voice",
  "windy",
  "witty",
  "zesty"
];

const allowedWordBank = [...new Set([...englishFiveLetterWords, ...allowedWords])];

const rawWordleLevels: RawWordleLevel[] = [
  [
    "wordle-daily-001",
    "Daily Word",
    "hard",
    1,
    "2026-05-22",
    "cocoa"
  ],
  [
    "wordle-daily-002",
    "Daily Word",
    "hard",
    1,
    "2026-05-23",
    "crane"
  ],
  [
    "wordle-daily-003",
    "Daily Word",
    "hard",
    1,
    "2026-05-24",
    "trace"
  ],
  [
    "wordle-daily-004",
    "Daily Word",
    "hard",
    1,
    "2026-05-25",
    "cider"
  ],
  [
    "wordle-daily-005",
    "Daily Word",
    "hard",
    1,
    "2026-05-26",
    "laser"
  ],
  [
    "wordle-daily-006",
    "Daily Word",
    "hard",
    1,
    "2026-05-27",
    "cabin"
  ],
  [
    "wordle-daily-007",
    "Daily Word",
    "hard",
    1,
    "2026-05-28",
    "orbit"
  ],
  [
    "wordle-level-001",
    "Word 1",
    "easy",
    0,
    "",
    "flame"
  ],
  [
    "wordle-level-002",
    "Word 2",
    "easy",
    0,
    "",
    "glide"
  ],
  [
    "wordle-level-003",
    "Word 3",
    "medium",
    0,
    "",
    "prism"
  ],
  [
    "wordle-level-004",
    "Word 4",
    "hard",
    0,
    "",
    "river"
  ],
  [
    "wordle-level-005",
    "Word 5",
    "easy",
    0,
    "",
    "mango"
  ],
  [
    "wordle-level-006",
    "Word 6",
    "medium",
    0,
    "",
    "lunar"
  ],
  [
    "wordle-level-007",
    "Word 7",
    "easy",
    0,
    "",
    "piano"
  ],
  [
    "wordle-level-008",
    "Word 8",
    "easy",
    0,
    "",
    "toast"
  ],
  [
    "wordle-level-009",
    "Word 9",
    "hard",
    0,
    "",
    "brush"
  ],
  [
    "wordle-level-010",
    "Word 10",
    "easy",
    0,
    "",
    "quilt"
  ],
  [
    "wordle-level-011",
    "Word 11",
    "easy",
    0,
    "",
    "honey"
  ],
  [
    "wordle-level-012",
    "Word 12",
    "medium",
    0,
    "",
    "sugar"
  ],
  [
    "wordle-level-013",
    "Word 13",
    "easy",
    0,
    "",
    "olive"
  ],
  [
    "wordle-level-014",
    "Word 14",
    "hard",
    0,
    "",
    "maple"
  ],
  [
    "wordle-level-015",
    "Word 15",
    "medium",
    0,
    "",
    "pearl"
  ],
  [
    "wordle-level-016",
    "Word 16",
    "easy",
    0,
    "",
    "coral"
  ],
  [
    "wordle-level-017",
    "Word 17",
    "easy",
    0,
    "",
    "amber"
  ],
  [
    "wordle-level-018",
    "Word 18",
    "medium",
    0,
    "",
    "vivid"
  ],
  [
    "wordle-level-019",
    "Word 19",
    "hard",
    0,
    "",
    "spark"
  ],
  [
    "wordle-level-020",
    "Word 20",
    "easy",
    0,
    "",
    "cloud"
  ],
  [
    "wordle-level-021",
    "Word 21",
    "medium",
    0,
    "",
    "field"
  ],
  [
    "wordle-level-022",
    "Word 22",
    "easy",
    0,
    "",
    "bloom"
  ],
  [
    "wordle-level-023",
    "Word 23",
    "easy",
    0,
    "",
    "stone"
  ],
  [
    "wordle-level-024",
    "Word 24",
    "hard",
    0,
    "",
    "chair"
  ],
  [
    "wordle-level-025",
    "Word 25",
    "easy",
    0,
    "",
    "table"
  ],
  [
    "wordle-level-026",
    "Word 26",
    "easy",
    0,
    "",
    "plant"
  ],
  [
    "wordle-level-027",
    "Word 27",
    "medium",
    0,
    "",
    "dream"
  ],
  [
    "wordle-level-028",
    "Word 28",
    "easy",
    0,
    "",
    "smile"
  ],
  [
    "wordle-level-029",
    "Word 29",
    "hard",
    0,
    "",
    "heart"
  ],
  [
    "wordle-level-030",
    "Word 30",
    "medium",
    0,
    "",
    "light"
  ],
  [
    "wordle-level-031",
    "Word 31",
    "easy",
    0,
    "",
    "night"
  ],
  [
    "wordle-level-032",
    "Word 32",
    "easy",
    0,
    "",
    "sweet"
  ],
  [
    "wordle-level-033",
    "Word 33",
    "medium",
    0,
    "",
    "quiet"
  ],
  [
    "wordle-level-034",
    "Word 34",
    "hard",
    0,
    "",
    "brave"
  ],
  [
    "wordle-level-035",
    "Word 35",
    "easy",
    0,
    "",
    "fresh"
  ],
  [
    "wordle-level-036",
    "Word 36",
    "medium",
    0,
    "",
    "grape"
  ],
  [
    "wordle-level-037",
    "Word 37",
    "easy",
    0,
    "",
    "lemon"
  ],
  [
    "wordle-level-038",
    "Word 38",
    "easy",
    0,
    "",
    "peach"
  ],
  [
    "wordle-level-039",
    "Word 39",
    "hard",
    0,
    "",
    "berry"
  ],
  [
    "wordle-level-040",
    "Word 40",
    "easy",
    0,
    "",
    "melon"
  ],
  [
    "wordle-level-041",
    "Word 41",
    "easy",
    0,
    "",
    "spice"
  ],
  [
    "wordle-level-042",
    "Word 42",
    "medium",
    0,
    "",
    "bread"
  ],
  [
    "wordle-level-043",
    "Word 43",
    "easy",
    0,
    "",
    "cream"
  ],
  [
    "wordle-level-044",
    "Word 44",
    "hard",
    0,
    "",
    "glass"
  ],
  [
    "wordle-level-045",
    "Word 45",
    "medium",
    0,
    "",
    "paper"
  ],
  [
    "wordle-level-046",
    "Word 46",
    "easy",
    0,
    "",
    "music"
  ],
  [
    "wordle-level-047",
    "Word 47",
    "easy",
    0,
    "",
    "dance"
  ],
  [
    "wordle-level-048",
    "Word 48",
    "medium",
    0,
    "",
    "movie"
  ],
  [
    "wordle-level-049",
    "Word 49",
    "hard",
    0,
    "",
    "magic"
  ],
  [
    "wordle-level-050",
    "Word 50",
    "easy",
    0,
    "",
    "sunny"
  ],
  [
    "wordle-level-051",
    "Word 51",
    "medium",
    0,
    "",
    "rainy"
  ],
  [
    "wordle-level-052",
    "Word 52",
    "easy",
    0,
    "",
    "windy"
  ],
  [
    "wordle-level-053",
    "Word 53",
    "easy",
    0,
    "",
    "ocean"
  ],
  [
    "wordle-level-054",
    "Word 54",
    "hard",
    0,
    "",
    "beach"
  ],
  [
    "wordle-level-055",
    "Word 55",
    "easy",
    0,
    "",
    "trail"
  ],
  [
    "wordle-level-056",
    "Word 56",
    "easy",
    0,
    "",
    "mount"
  ],
  [
    "wordle-level-057",
    "Word 57",
    "medium",
    0,
    "",
    "grove"
  ],
  [
    "wordle-level-058",
    "Word 58",
    "easy",
    0,
    "",
    "flora"
  ],
  [
    "wordle-level-059",
    "Word 59",
    "hard",
    0,
    "",
    "fauna"
  ],
  [
    "wordle-level-060",
    "Word 60",
    "medium",
    0,
    "",
    "pixel"
  ],
  [
    "wordle-level-061",
    "Word 61",
    "easy",
    0,
    "",
    "frame"
  ],
  [
    "wordle-level-062",
    "Word 62",
    "easy",
    0,
    "",
    "focus"
  ],
  [
    "wordle-level-063",
    "Word 63",
    "medium",
    0,
    "",
    "sound"
  ],
  [
    "wordle-level-064",
    "Word 64",
    "hard",
    0,
    "",
    "voice"
  ],
  [
    "wordle-level-065",
    "Word 65",
    "easy",
    0,
    "",
    "laugh"
  ],
  [
    "wordle-level-066",
    "Word 66",
    "medium",
    0,
    "",
    "charm"
  ],
  [
    "wordle-level-067",
    "Word 67",
    "easy",
    0,
    "",
    "grace"
  ],
  [
    "wordle-level-068",
    "Word 68",
    "easy",
    0,
    "",
    "trust"
  ],
  [
    "wordle-level-069",
    "Word 69",
    "hard",
    0,
    "",
    "peace"
  ],
  [
    "wordle-level-070",
    "Word 70",
    "easy",
    0,
    "",
    "shine"
  ],
  [
    "wordle-level-071",
    "Word 71",
    "easy",
    0,
    "",
    "glory"
  ],
  [
    "wordle-level-072",
    "Word 72",
    "medium",
    0,
    "",
    "royal"
  ],
  [
    "wordle-level-073",
    "Word 73",
    "easy",
    0,
    "",
    "noble"
  ],
  [
    "wordle-level-074",
    "Word 74",
    "hard",
    0,
    "",
    "smart"
  ],
  [
    "wordle-level-075",
    "Word 75",
    "medium",
    0,
    "",
    "witty"
  ],
  [
    "wordle-level-076",
    "Word 76",
    "easy",
    0,
    "",
    "rapid"
  ],
  [
    "wordle-level-077",
    "Word 77",
    "easy",
    0,
    "",
    "solid"
  ],
  [
    "wordle-level-078",
    "Word 78",
    "medium",
    0,
    "",
    "zesty"
  ],
  [
    "wordle-level-079",
    "Word 79",
    "hard",
    0,
    "",
    "jazzy"
  ],
  [
    "wordle-level-080",
    "Word 80",
    "easy",
    0,
    "",
    "fuzzy"
  ],
  [
    "wordle-level-081",
    "Word 81",
    "medium",
    0,
    "",
    "happy"
  ],
  [
    "wordle-level-082",
    "Word 82",
    "easy",
    0,
    "",
    "merry"
  ],
  [
    "wordle-level-083",
    "Word 83",
    "easy",
    0,
    "",
    "coast"
  ],
  [
    "wordle-level-084",
    "Word 84",
    "hard",
    0,
    "",
    "snack"
  ],
  [
    "wordle-level-085",
    "Word 85",
    "easy",
    0,
    "",
    "scent"
  ],
  [
    "wordle-level-086",
    "Word 86",
    "easy",
    0,
    "",
    "linen"
  ],
  [
    "wordle-level-087",
    "Word 87",
    "medium",
    0,
    "",
    "porch"
  ],
  [
    "wordle-level-088",
    "Word 88",
    "easy",
    0,
    "",
    "couch"
  ],
  [
    "wordle-level-089",
    "Word 89",
    "hard",
    0,
    "",
    "route"
  ],
  [
    "wordle-level-090",
    "Word 90",
    "medium",
    0,
    "",
    "scale"
  ],
  [
    "wordle-level-091",
    "Word 91",
    "easy",
    0,
    "",
    "tempo"
  ],
  [
    "wordle-level-092",
    "Word 92",
    "easy",
    0,
    "",
    "novel"
  ],
  [
    "wordle-level-093",
    "Word 93",
    "medium",
    0,
    "",
    "story"
  ]
];

export const wordleLevels: WordleLevel[] = rawWordleLevels.map(([id, title, difficulty, daily, date, answer]) => ({
  metadata: {
    id,
    kind: "wordle",
    title,
    difficulty,
    daily: Boolean(daily),
    date: date || undefined,
    estimatedMinutes: daily ? 4 : difficulty === "hard" ? 5 : 3,
    tags: daily ? ["word", "daily"] : ["word"],
  },
  answer,
  maxGuesses: 6,
  allowedWords: allowedWordBank,
}));

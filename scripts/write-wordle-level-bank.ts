import { writeFileSync } from "node:fs";

const answers = [
  "cocoa",
  "crane",
  "trace",
  "cider",
  "laser",
  "cabin",
  "orbit",
  "flame",
  "glide",
  "prism",
  "river",
  "mango",
  "lunar",
  "piano",
  "toast",
  "brush",
  "quilt",
  "honey",
  "sugar",
  "olive",
  "maple",
  "pearl",
  "coral",
  "amber",
  "vivid",
  "spark",
  "cloud",
  "field",
  "bloom",
  "stone",
  "chair",
  "table",
  "plant",
  "dream",
  "smile",
  "heart",
  "light",
  "night",
  "sweet",
  "quiet",
  "brave",
  "fresh",
  "grape",
  "lemon",
  "peach",
  "berry",
  "melon",
  "spice",
  "bread",
  "cream",
  "glass",
  "paper",
  "music",
  "dance",
  "movie",
  "magic",
  "sunny",
  "rainy",
  "windy",
  "ocean",
  "beach",
  "trail",
  "mount",
  "valley",
  "grove",
  "flora",
  "fauna",
  "pixel",
  "frame",
  "focus",
  "sound",
  "voice",
  "laugh",
  "charm",
  "grace",
  "trust",
  "peace",
  "shine",
  "glory",
  "royal",
  "noble",
  "smart",
  "clever",
  "witty",
  "rapid",
  "steady",
  "solid",
  "zesty",
  "jazzy",
  "fuzzy",
  "happy",
  "merry",
  "coast",
  "snack",
  "scent",
  "linen",
  "porch",
  "couch",
  "route",
  "scale",
  "tempo",
  "novel",
  "story",
  "verse",
  "spark",
  "blush",
  "crown",
  "drift",
  "frost",
];

const allowedWords = [...new Set([...answers, "adieu", "raise", "stare", "slate", "roast", "plane", "crisp", "flint", "chord"])]
  .filter((word) => /^[a-z]{5}$/.test(word))
  .sort();
const uniqueAnswers = [...new Set(answers)].filter((word) => /^[a-z]{5}$/.test(word)).slice(0, 100);

const rawLevels = uniqueAnswers.map((answer, index) => {
  const daily = index < 7;
  const levelNumber = index - 6;
  const difficulty = index < 7 ? "hard" : index % 5 === 0 ? "hard" : index % 3 === 0 ? "medium" : "easy";
  return [
    daily ? `wordle-daily-${String(index + 1).padStart(3, "0")}` : `wordle-level-${String(levelNumber).padStart(3, "0")}`,
    daily ? "Daily Word" : `Word ${levelNumber}`,
    difficulty,
    daily ? 1 : 0,
    daily ? `2026-05-${String(22 + index).padStart(2, "0")}` : "",
    answer,
  ];
});

const output = `import type { WordleLevel } from "@/features/puzzles/types";

type RawWordleLevel = readonly [
  id: string,
  title: string,
  difficulty: "easy" | "medium" | "hard",
  daily: 0 | 1,
  date: string,
  answer: string,
];

const allowedWords = ${JSON.stringify(allowedWords, null, 2)};

const rawWordleLevels: RawWordleLevel[] = ${JSON.stringify(rawLevels, null, 2)};

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
  allowedWords,
}));
`;

writeFileSync("src/content/puzzles/wordle-levels.ts", output);
console.log(`Wrote ${rawLevels.length} Wordle levels (${output.length} bytes).`);

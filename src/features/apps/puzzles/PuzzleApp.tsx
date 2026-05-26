import { ArrowGame } from "./ArrowGame";
import { WordleGame } from "./WordleGame";
import { ZipGame } from "./ZipGame";

export function PuzzleApp({ kind }: { kind: string }) {
  if (kind === "zip") {
    return <ZipGame />;
  }
  if (kind === "arrow") {
    return <ArrowGame />;
  }
  if (kind === "wordle") {
    return <WordleGame />;
  }

  return <div className="grid h-full place-items-center bg-slate-950 text-white">{kind}</div>;
}

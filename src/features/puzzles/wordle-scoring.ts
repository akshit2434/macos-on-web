export type WordleLetterScore = "correct" | "present" | "absent";

export function scoreWordleGuess(answer: string, guess: string): WordleLetterScore[] {
  const answerLetters = answer.toLowerCase().split("");
  const guessLetters = guess.toLowerCase().split("");
  const scores: WordleLetterScore[] = Array.from({ length: guessLetters.length }, () => "absent");
  const remaining = new Map<string, number>();

  for (let index = 0; index < guessLetters.length; index += 1) {
    if (guessLetters[index] === answerLetters[index]) {
      scores[index] = "correct";
      continue;
    }

    const answerLetter = answerLetters[index];
    if (answerLetter) {
      remaining.set(answerLetter, (remaining.get(answerLetter) ?? 0) + 1);
    }
  }

  for (let index = 0; index < guessLetters.length; index += 1) {
    if (scores[index] === "correct") continue;

    const guessLetter = guessLetters[index];
    const count = remaining.get(guessLetter) ?? 0;
    if (count > 0) {
      scores[index] = "present";
      remaining.set(guessLetter, count - 1);
    }
  }

  return scores;
}

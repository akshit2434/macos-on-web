import { zipLevels } from "./zip-levels";
import { arrowEscapeLevels } from "./arrow-levels";
import { wordleLevels } from "./wordle-levels";

export { arrowEscapeLevels, wordleLevels, zipLevels };

export const puzzleLevels = {
  zip: zipLevels,
  arrowEscape: arrowEscapeLevels,
  wordle: wordleLevels,
};

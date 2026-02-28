import { generateCrossword, CrosswordData, CrosswordCell } from './crossword';

export interface FitWordsData {
  grid: CrosswordCell[][];
  words: string[]; // All words to fit
  width: number;
  height: number;
  revealedWord: string; // The starting word provided to the user
}

export function generateFitWords(): FitWordsData {
  // Reuse the crossword generator to get a valid intersecting grid
  const crossword = generateCrossword();
  
  // Extract all words from clues
  const words = crossword.clues.map(c => c.answer).sort();
  
  // Select a "revealed" word (e.g., the longest one or random)
  // The user said "brinda al usuario una de ellas"
  // Let's pick a long one to be helpful, or the central spine if available
  // The crossword generator already puts a spine. Let's try to find it or just pick the longest.
  const sortedByLength = [...words].sort((a, b) => b.length - a.length);
  const revealedWord = sortedByLength[0];

  return {
    grid: crossword.grid,
    words: words,
    width: crossword.width,
    height: crossword.height,
    revealedWord
  };
}

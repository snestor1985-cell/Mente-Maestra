import { Word, SPANISH_WORDS } from './words';

export interface CrosswordCell {
  char: string | null; // The correct character
  userChar: string | null; // The user's input
  isBlack: boolean;
  number: number | null; // Clue number if this is the start of a word
  id: string; // unique cell id "row-col"
}

export interface Clue {
  number: number;
  direction: 'across' | 'down';
  text: string;
  row: number;
  col: number;
  length: number;
  answer: string;
}

export interface CrosswordData {
  grid: CrosswordCell[][];
  clues: Clue[];
  width: number;
  height: number;
}

const SIZE = 15; // Increased Grid size to 15x15

export function generateCrossword(): CrosswordData {
  // Initialize grid
  const grid: CrosswordCell[][] = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => ({
      char: null,
      userChar: null,
      isBlack: true, // Start all black, carve out words
      number: null,
      id: `${r}-${c}`
    }))
  );

  const placedWords: { word: string; row: number; col: number; dir: 'across' | 'down' }[] = [];
  
  // Sort words by length descending to place longest words first (better for central spine)
  const wordsToPlace = [...SPANISH_WORDS].sort((a, b) => b.word.length - a.word.length);
  
  // Helper to check if a word fits
  const canPlace = (word: string, row: number, col: number, dir: 'across' | 'down'): boolean => {
    if (dir === 'across') {
      if (col + word.length > SIZE) return false;
      // Check boundaries and intersections
      for (let i = 0; i < word.length; i++) {
        const cell = grid[row][col + i];
        // If cell is not black and char doesn't match, fail
        if (!cell.isBlack && cell.char !== word[i]) return false;
        
        // Check immediate neighbors (to prevent adjacent words sticking together incorrectly)
        // Only check neighbors if this cell is currently black (placing a new letter)
        // If it's an intersection (already has char), neighbors are fine (assuming valid previous placement)
        if (cell.isBlack) {
           // Check Up/Down neighbors
           if (row > 0 && !grid[row-1][col+i].isBlack) return false;
           if (row < SIZE-1 && !grid[row+1][col+i].isBlack) return false;
        }
      }
      // Check ends
      if (col > 0 && !grid[row][col-1].isBlack) return false;
      if (col + word.length < SIZE && !grid[row][col+word.length].isBlack) return false;

    } else { // Down
      if (row + word.length > SIZE) return false;
      for (let i = 0; i < word.length; i++) {
        const cell = grid[row + i][col];
        if (!cell.isBlack && cell.char !== word[i]) return false;
        
        if (cell.isBlack) {
           // Check Left/Right neighbors
           if (col > 0 && !grid[row+i][col-1].isBlack) return false;
           if (col < SIZE-1 && !grid[row+i][col+1].isBlack) return false;
        }
      }
      // Check ends
      if (row > 0 && !grid[row-1][col].isBlack) return false;
      if (row + word.length < SIZE && !grid[row+word.length][col].isBlack) return false;
    }
    return true;
  };

  // 1. Place CENTRAL SPINE (Trunk)
  // Find a very long word for the vertical spine
  const spineWordIndex = wordsToPlace.findIndex(w => w.word.length >= 8 && w.word.length <= SIZE - 2);
  const spineWordObj = spineWordIndex >= 0 ? wordsToPlace.splice(spineWordIndex, 1)[0] : wordsToPlace.shift();

  if (spineWordObj) {
    const startRow = Math.floor((SIZE - spineWordObj.word.length) / 2);
    const startCol = Math.floor(SIZE / 2);
    const dir = 'down'; // Vertical spine
    
    // Place Spine
    for (let i = 0; i < spineWordObj.word.length; i++) {
      const r = startRow + i;
      const c = startCol;
      grid[r][c].char = spineWordObj.word[i];
      grid[r][c].isBlack = false;
    }
    placedWords.push({ word: spineWordObj.word, row: startRow, col: startCol, dir });

    // 2. Branch off the spine
    // For each letter of the spine, try to place a horizontal word
    for (let i = 0; i < spineWordObj.word.length; i++) {
      const spineChar = spineWordObj.word[i];
      const r = startRow + i;
      const c = startCol;

      // Find a word that contains this char
      // We want to place it horizontally, crossing at 'c'
      // So word[k] == spineChar. Start col would be c - k.
      
      // Shuffle words to place to ensure variety
      wordsToPlace.sort(() => Math.random() - 0.5);
      
      for (let wIdx = 0; wIdx < wordsToPlace.length; wIdx++) {
        const candidate = wordsToPlace[wIdx];
        const charIndices = [];
        for(let k=0; k<candidate.word.length; k++) if(candidate.word[k] === spineChar) charIndices.push(k);
        
        let placed = false;
        for (const k of charIndices) {
          const startColA = c - k;
          if (startColA >= 0 && canPlace(candidate.word, r, startColA, 'across')) {
             // Place it
             for (let l = 0; l < candidate.word.length; l++) {
               grid[r][startColA + l].char = candidate.word[l];
               grid[r][startColA + l].isBlack = false;
             }
             placedWords.push({ word: candidate.word, row: r, col: startColA, dir: 'across' });
             wordsToPlace.splice(wIdx, 1);
             placed = true;
             break;
          }
        }
        if (placed) break; // Move to next spine letter
      }
    }
  }

  // 3. Try to fill remaining gaps randomly (optional, to make it denser)
  let attempts = 0;
  while (wordsToPlace.length > 0 && attempts < 500) {
    const wordObj = wordsToPlace[wordsToPlace.length - 1];
    const word = wordObj.word;
    let placed = false;

    // Try to intersect with existing placed words
    // Iterate through all cells in grid that have a char
    // Randomize iteration order to avoid bunching
    const cellsWithChar = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (!grid[r][c].isBlack && grid[r][c].char) {
          cellsWithChar.push({r, c});
        }
      }
    }
    cellsWithChar.sort(() => Math.random() - 0.5);

    for (const {r, c} of cellsWithChar) {
      // This cell has a char. Does the new word have this char?
      const char = grid[r][c].char!;
      const indices = [];
      for(let i=0; i<word.length; i++) if(word[i] === char) indices.push(i);

      for (const idx of indices) {
        // Try placing word such that word[idx] overlaps grid[r][c]
        
        // Try Across
        const startColA = c - idx;
        if (startColA >= 0 && canPlace(word, r, startColA, 'across')) {
            for (let i = 0; i < word.length; i++) {
              grid[r][startColA + i].char = word[i];
              grid[r][startColA + i].isBlack = false;
            }
            placedWords.push({ word, row: r, col: startColA, dir: 'across' });
            placed = true;
            break;
        }
        // Try Down
        const startRowD = r - idx;
        if (startRowD >= 0 && canPlace(word, startRowD, c, 'down')) {
            for (let i = 0; i < word.length; i++) {
              grid[startRowD + i][c].char = word[i];
              grid[startRowD + i][c].isBlack = false;
            }
            placedWords.push({ word, row: startRowD, col: c, dir: 'down' });
            placed = true;
            break;
        }
      }
      if (placed) break;
    }

    if (placed) {
      wordsToPlace.pop();
    } else {
      // Move to back of line to try later? Or just discard?
      // Discarding prevents infinite loops if word just doesn't fit
      // But for better density, maybe try a few times? 
      // Let's just shuffle it back in if attempts are low, else pop
      if (Math.random() > 0.5) {
         wordsToPlace.unshift(wordsToPlace.pop()!);
      } else {
         wordsToPlace.pop();
      }
    }
    attempts++;
  }

  // Generate Clues and Numbers
  const clues: Clue[] = [];
  let currentNumber = 1;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c].isBlack) continue;

      let startsAcross = false;
      let startsDown = false;

      // Check if starts Across
      // Must be start of a sequence of 2+ chars, and previous cell is boundary or black
      if ((c === 0 || grid[r][c-1].isBlack) && (c+1 < SIZE && !grid[r][c+1].isBlack)) {
        startsAcross = true;
      }

      // Check if starts Down
      if ((r === 0 || grid[r-1][c].isBlack) && (r+1 < SIZE && !grid[r+1][c].isBlack)) {
        startsDown = true;
      }

      if (startsAcross || startsDown) {
        grid[r][c].number = currentNumber;

        if (startsAcross) {
          // Find the word
          let len = 0;
          let w = "";
          while (c + len < SIZE && !grid[r][c+len].isBlack) {
            w += grid[r][c+len].char;
            len++;
          }
          // Find clue text
          const wordData = SPANISH_WORDS.find(sw => sw.word === w);
          clues.push({
            number: currentNumber,
            direction: 'across',
            text: wordData ? wordData.clue : "???",
            row: r,
            col: c,
            length: len,
            answer: w
          });
        }

        if (startsDown) {
           let len = 0;
           let w = "";
           while (r + len < SIZE && !grid[r+len][c].isBlack) {
             w += grid[r+len][c].char;
             len++;
           }
           const wordData = SPANISH_WORDS.find(sw => sw.word === w);
           clues.push({
             number: currentNumber,
             direction: 'down',
             text: wordData ? wordData.clue : "???",
             row: r,
             col: c,
             length: len,
             answer: w
           });
        }

        currentNumber++;
      }
    }
  }

  return { grid, clues, width: SIZE, height: SIZE };
}

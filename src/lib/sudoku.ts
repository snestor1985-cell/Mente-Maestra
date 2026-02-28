export type Difficulty = 'Easy' | 'Medium' | 'Hard' | 'Expert';

export interface SudokuBoard {
  grid: number[][];
  solution: number[][];
  difficulty: Difficulty;
  size: 9 | 4;
}

const BLANK = 0;

// Simple Linear Congruential Generator for seeded randomness
class Random {
  private seed: number;
  
  constructor(seed: number | string) {
    if (typeof seed === 'string') {
      // Simple hash for string seed
      let h = 0x811c9dc5;
      for (let i = 0; i < seed.length; i++) {
        h ^= seed.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
      }
      this.seed = h >>> 0;
    } else {
      this.seed = seed;
    }
  }

  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

function isValid(grid: number[][], row: number, col: number, num: number, size: 9 | 4): boolean {
  // Check row and col
  for (let x = 0; x < size; x++) {
    if (grid[row][x] === num || grid[x][col] === num) return false;
  }

  // Check box
  const boxSize = size === 9 ? 3 : 2;
  const startRow = row - (row % boxSize);
  const startCol = col - (col % boxSize);

  for (let i = 0; i < boxSize; i++) {
    for (let j = 0; j < boxSize; j++) {
      if (grid[i + startRow][j + startCol] === num) return false;
    }
  }

  return true;
}

function solveSudoku(grid: number[][], size: 9 | 4, rng?: Random): boolean {
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === BLANK) {
        // Try numbers 1-size
        const nums = Array.from({length: size}, (_, i) => i + 1);
        
        // Shuffle
        for (let i = nums.length - 1; i > 0; i--) {
            const r = rng ? rng.next() : Math.random();
            const j = Math.floor(r * (i + 1));
            [nums[i], nums[j]] = [nums[j], nums[i]];
        }

        for (const num of nums) {
          if (isValid(grid, row, col, num, size)) {
            grid[row][col] = num;
            if (solveSudoku(grid, size, rng)) return true;
            grid[row][col] = BLANK;
          }
        }
        return false;
      }
    }
  }
  return true;
}

function fillBox(grid: number[][], row: number, col: number, size: 9 | 4, rng?: Random) {
  const boxSize = size === 9 ? 3 : 2;
  const nums = Array.from({length: size}, (_, i) => i + 1);
  
  // Fisher-Yates shuffle
  for (let i = nums.length - 1; i > 0; i--) {
    const r = rng ? rng.next() : Math.random();
    const j = Math.floor(r * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }

  let idx = 0;
  for (let i = 0; i < boxSize; i++) {
    for (let j = 0; j < boxSize; j++) {
      grid[row + i][col + j] = nums[idx++];
    }
  }
}

function generateSolvedGrid(size: 9 | 4, rng?: Random): number[][] {
  let grid: number[][];
  let success = false;
  
  // Retry until a valid grid is generated
  while (!success) {
    grid = Array.from({ length: size }, () => Array(size).fill(BLANK));
    const boxSize = size === 9 ? 3 : 2;

    // 1. Fill diagonal boxes first (independent)
    for (let i = 0; i < size; i = i + boxSize) {
      fillBox(grid, i, i, size, rng);
    }
    
    // 2. Solve the rest
    if (solveSudoku(grid, size, rng)) {
      success = true;
    }
  }
  
  return grid!;
}

function removeNumbers(grid: number[][], difficulty: Difficulty, size: 9 | 4, rng?: Random): number[][] {
  // Deep copy
  const puzzle = grid.map(row => [...row]);
  
  let attempts;
  if (size === 9) {
    attempts = difficulty === 'Easy' ? 40 : difficulty === 'Medium' ? 50 : difficulty === 'Hard' ? 56 : 62;
  } else {
    // 4x4 has 16 cells. 
    // Easy: remove 6 (10 clues)
    // Medium: remove 8 (8 clues)
    // Hard: remove 10 (6 clues)
    attempts = difficulty === 'Easy' ? 6 : difficulty === 'Medium' ? 8 : 10;
  }
  
  // Create list of all coordinates
  const coords = [];
  for(let r=0; r<size; r++) {
    for(let c=0; c<size; c++) {
      coords.push([r, c]);
    }
  }
  
  // Shuffle coordinates
  for (let i = coords.length - 1; i > 0; i--) {
    const r = rng ? rng.next() : Math.random();
    const j = Math.floor(r * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
  
  // Remove numbers
  for (let i = 0; i < attempts; i++) {
    if (i < coords.length) {
      const [r, c] = coords[i];
      puzzle[r][c] = BLANK;
    }
  }
  
  return puzzle;
}

export function generateSudoku(difficulty: Difficulty, seed?: string, size: 9 | 4 = 9): SudokuBoard {
  const rng = seed ? new Random(seed) : undefined;
  const solution = generateSolvedGrid(size, rng);
  // Create a deep copy of solution for the puzzle generation to avoid reference issues
  const solutionCopy = solution.map(row => [...row]);
  const grid = removeNumbers(solutionCopy, difficulty, size, rng);
  return { grid, solution, difficulty, size };
}

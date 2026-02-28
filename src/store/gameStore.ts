import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Difficulty, SudokuBoard } from '../lib/sudoku';
import { CrosswordData } from '../lib/crossword';
import { FitWordsData } from '../lib/fitwords';

interface GameState {
  userName: string | null;
  xp: number;
  level: number;
  streak: number;
  lastPlayedDate: string | null;
  
  // Sudoku Game
  currentSudoku: SudokuBoard | null;
  userGrid: number[][];
  notes: Record<string, number[]>; // key: "row-col", value: [1, 2, 3]
  timer: number;
  isGameActive: boolean;
  mistakes: number;
  lives: number;
  hints: number;
  isGameOver: boolean;
  isDailyChallenge: boolean;
  isRushMode: boolean;
  rushLevel: number;
  dailyChallengeState: {
    lastCompletedDate: string | null;
  };

  // Crossword Game
  currentCrossword: CrosswordData | null;
  crosswordUserGrid: string[][]; // Store user chars
  isCrosswordActive: boolean;

  // FitWords Game
  currentFitWords: FitWordsData | null;
  fitWordsUserGrid: string[][];
  isFitWordsActive: boolean;

  stats: {
    gamesWon: number;
    perfectGames: number;
    fastestWin: number | null;
    maxRushLevel: number;
  };
  profiles: Record<string, {
    xp: number;
    level: number;
    streak: number;
    lastPlayedDate: string | null;
    dailyChallengeState: { lastCompletedDate: string | null };
    stats: { gamesWon: number; perfectGames: number; fastestWin: number | null; maxRushLevel: number };
  }>;
  
  // Actions
  setUserName: (name: string) => void;
  addXP: (amount: number) => void;
  
  // Sudoku Actions
  startGame: (board: SudokuBoard, mode?: 'classic' | 'daily' | 'rush', rushLevel?: number, timeLimit?: number) => void;
  updateCell: (row: number, col: number, value: number) => void;
  toggleNote: (row: number, col: number, value: number) => void;
  endGame: () => void;
  incrementTimer: () => void;
  registerMistake: () => void;
  useHint: () => void;
  completeDailyChallenge: () => void;
  recordWin: (time: number, mistakes: number) => void;

  // Crossword Actions
  startCrossword: (data: CrosswordData) => void;
  updateCrosswordCell: (row: number, col: number, char: string) => void;
  checkCrosswordWin: () => boolean;

  // FitWords Actions
  startFitWords: (data: FitWordsData) => void;
  updateFitWordsCell: (row: number, col: number, char: string) => void;
  placeFitWord: (row: number, col: number, direction: 'across' | 'down', word: string) => void;
  checkFitWordsWin: () => boolean;
}

const LEVEL_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500]; // Simple progression

const getLocalDate = () => {
  const d = new Date();
  const offset = d.getTimezoneOffset() * 60000;
  const localDate = new Date(d.getTime() - offset);
  return localDate.toISOString().split('T')[0];
};

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      userName: null,
      xp: 0,
      level: 1,
      streak: 0,
      lastPlayedDate: null,
      
      currentSudoku: null,
      userGrid: [],
      notes: {},
      timer: 0,
      isGameActive: false,
      mistakes: 0,
      lives: 3,
      hints: 3,
      isGameOver: false,
      isDailyChallenge: false,
      isRushMode: false,
      rushLevel: 1,
      dailyChallengeState: {
        lastCompletedDate: null
      },
      
      currentCrossword: null,
      crosswordUserGrid: [],
      isCrosswordActive: false,

      currentFitWords: null,
      fitWordsUserGrid: [],
      isFitWordsActive: false,

      stats: {
        gamesWon: 0,
        perfectGames: 0,
        fastestWin: null,
        maxRushLevel: 1,
      },
      profiles: {},

      setUserName: (name) => {
        const { userName, xp, level, streak, lastPlayedDate, dailyChallengeState, stats, profiles } = get();
        
        // 1. Save current user progress to profiles
        const newProfiles = { ...profiles };
        if (userName) {
          newProfiles[userName] = {
            xp,
            level,
            streak,
            lastPlayedDate,
            dailyChallengeState,
            stats
          };
        }

        // 2. Load new user progress or defaults
        const existingProfile = newProfiles[name];
        const nextState = existingProfile || {
          xp: 0,
          level: 1,
          streak: 0,
          lastPlayedDate: null,
          dailyChallengeState: { lastCompletedDate: null },
          stats: { gamesWon: 0, perfectGames: 0, fastestWin: null, maxRushLevel: 1 }
        };

        set({ 
          userName: name,
          profiles: newProfiles,
          ...nextState,
          // Reset active game state
          currentSudoku: null,
          userGrid: [],
          notes: {},
          timer: 0,
          isGameActive: false,
          mistakes: 0,
          lives: 3,
          hints: 3,
          isGameOver: false,
          isDailyChallenge: false,
          isRushMode: false,
          rushLevel: 1,
          currentCrossword: null,
          crosswordUserGrid: [],
          isCrosswordActive: false,
          currentFitWords: null,
          fitWordsUserGrid: [],
          isFitWordsActive: false
        });
      },

      addXP: (amount) => {
        const { xp, level, userName, profiles } = get();
        const newXP = xp + amount;
        let newLevel = level;
        
        // Check level up
        while (newLevel < LEVEL_THRESHOLDS.length && newXP >= LEVEL_THRESHOLDS[newLevel]) {
          newLevel++;
        }
        
        // Sync to profile immediately
        const newProfiles = { ...profiles };
        if (userName) {
          newProfiles[userName] = {
            ...newProfiles[userName],
            xp: newXP,
            level: newLevel
          };
        }
        
        set({ xp: newXP, level: newLevel, profiles: newProfiles });
      },

      startGame: (board, mode = 'classic', rushLevel = 1, timeLimit = 0) => {
        set({
          currentSudoku: board,
          userGrid: board.grid.map(row => [...row]),
          notes: {},
          timer: timeLimit > 0 ? timeLimit : 0,
          isGameActive: true,
          mistakes: 0,
          lives: 3,
          hints: 3,
          isGameOver: false,
          isDailyChallenge: mode === 'daily',
          isRushMode: mode === 'rush',
          rushLevel: mode === 'rush' ? rushLevel : 1,
          isCrosswordActive: false
        });
      },

      updateCell: (row, col, value) => {
        const { userGrid, isGameOver } = get();
        if (isGameOver) return;
        
        const newGrid = userGrid.map(r => [...r]);
        newGrid[row][col] = value;
        set({ userGrid: newGrid });
      },

      toggleNote: (row, col, value) => {
        const { notes, isGameOver } = get();
        if (isGameOver) return;

        const key = `${row}-${col}`;
        const currentNotes = notes[key] || [];
        
        let newNotes;
        if (currentNotes.includes(value)) {
          newNotes = currentNotes.filter(n => n !== value);
        } else {
          newNotes = [...currentNotes, value].sort();
        }
        
        set({ notes: { ...notes, [key]: newNotes } });
      },

      endGame: () => {
        set({ isGameActive: false, currentSudoku: null, isDailyChallenge: false, isRushMode: false, isCrosswordActive: false });
      },

      incrementTimer: () => {
        const { isGameActive, isGameOver, isRushMode, timer, isCrosswordActive } = get();
        
        if (isCrosswordActive) {
           // Simple count up for crossword
           set(state => ({ timer: state.timer + 1 }));
           return;
        }

        if (isGameActive && !isGameOver) {
          if (isRushMode) {
            // Countdown for Rush Mode
            const newTime = timer - 1;
            if (newTime <= 0) {
              set({ timer: 0, isGameOver: true, isGameActive: false });
            } else {
              set({ timer: newTime });
            }
          } else {
            // Count up for Classic/Daily
            set({ timer: timer + 1 });
          }
        }
      },

      registerMistake: () => {
        const { mistakes, lives, userGrid, currentSudoku } = get();
        const newMistakes = mistakes + 1;

        if (newMistakes >= 3) {
          const newLives = lives - 1;
          
          if (newLives <= 0) {
            set({ mistakes: 3, lives: 0, isGameOver: true, isGameActive: false });
          } else {
            // Apply Penalty: Clear a random box with user inputs
            const newUserGrid = userGrid.map(row => [...row]);
            const size = currentSudoku?.size || 9;
            const boxSize = size === 9 ? 3 : 2;
            
            // Boxes are 0 to size-1
            const boxes = Array.from({length: size}, (_, i) => i).sort(() => Math.random() - 0.5);
            
            for (const boxIdx of boxes) {
              const startRow = Math.floor(boxIdx / boxSize) * boxSize;
              const startCol = (boxIdx % boxSize) * boxSize;
              let hasUserInputs = false;

              // Check if box has user inputs (non-initial cells)
              for (let r = 0; r < boxSize; r++) {
                for (let c = 0; c < boxSize; c++) {
                  const row = startRow + r;
                  const col = startCol + c;
                  // If cell is not empty AND it's not an initial clue
                  if (newUserGrid[row]?.[col] !== 0 && currentSudoku?.grid[row]?.[col] === 0) {
                    hasUserInputs = true;
                    break;
                  }
                }
                if (hasUserInputs) break;
              }

              if (hasUserInputs) {
                // Clear this box
                for (let r = 0; r < boxSize; r++) {
                  for (let c = 0; c < boxSize; c++) {
                    const row = startRow + r;
                    const col = startCol + c;
                    // Only clear user inputs
                    if (currentSudoku?.grid[row]?.[col] === 0 && newUserGrid[row]) {
                      newUserGrid[row][col] = 0;
                    }
                  }
                }
                break; // Only clear one box
              }
            }

            set({ 
              mistakes: 0, 
              lives: newLives, 
              userGrid: newUserGrid 
            });
          }
        } else {
          set({ mistakes: newMistakes });
        }
      },

      useHint: () => {
        const { hints } = get();
        if (hints > 0) {
          set({ hints: hints - 1 });
        }
      },

      completeDailyChallenge: () => {
        const today = getLocalDate();
        const { streak, lastPlayedDate, dailyChallengeState, userName, profiles } = get();
        
        const newDailyState = { ...dailyChallengeState, lastCompletedDate: today };
        
        // Update streak logic
        let newStreak = streak;
        if (lastPlayedDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          // Handle timezone offset for yesterday too
          const offset = yesterday.getTimezoneOffset() * 60000;
          const localYesterday = new Date(yesterday.getTime() - offset);
          const yesterdayStr = localYesterday.toISOString().split('T')[0];
          
          if (lastPlayedDate === yesterdayStr) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
        }

        // Sync to profile
        const newProfiles = { ...profiles };
        if (userName) {
          newProfiles[userName] = {
            ...newProfiles[userName],
            streak: newStreak,
            lastPlayedDate: today,
            dailyChallengeState: newDailyState
          };
        }

        set({ 
          dailyChallengeState: newDailyState,
          streak: newStreak,
          lastPlayedDate: today,
          profiles: newProfiles
        });
      },

      recordWin: (time, mistakes) => {
        const { stats, userName, profiles, isRushMode, rushLevel } = get();
        const newStats = { ...stats };
        
        newStats.gamesWon += 1;
        if (mistakes === 0) {
          newStats.perfectGames += 1;
        }
        
        if (newStats.fastestWin === null || time < newStats.fastestWin) {
          newStats.fastestWin = time;
        }

        if (isRushMode) {
           if (rushLevel > (newStats.maxRushLevel || 1)) {
             newStats.maxRushLevel = rushLevel;
           }
        }

        // Sync to profile
        const newProfiles = { ...profiles };
        if (userName) {
          newProfiles[userName] = {
            ...newProfiles[userName],
            stats: newStats
          };
        }

        set({ stats: newStats, isGameOver: true, isGameActive: false, profiles: newProfiles, isCrosswordActive: false });
      },

      // Crossword Actions
      startCrossword: (data) => {
        // Initialize empty user grid with explicit new arrays for each row to prevent aliasing
        const userGrid: string[][] = Array.from({ length: data.height }).map(() => 
          Array(data.width).fill("")
        );

        // Reveal the longest word as a hint (Spine)
        if (data.clues.length > 0) {
          const longestClue = [...data.clues].sort((a, b) => b.length - a.length)[0];
          if (longestClue) {
            const { row, col, direction, answer } = longestClue;
            for (let i = 0; i < answer.length; i++) {
              if (direction === 'across') {
                userGrid[row][col + i] = answer[i];
              } else {
                userGrid[row + i][col] = answer[i];
              }
            }
          }
        }
        
        set({
          currentCrossword: data,
          crosswordUserGrid: userGrid,
          isCrosswordActive: true,
          timer: 0,
          isGameActive: false, // Sudoku inactive
          isGameOver: false
        });
      },

      updateCrosswordCell: (row, col, char) => {
        const { crosswordUserGrid } = get();
        const newGrid = crosswordUserGrid.map(r => [...r]);
        newGrid[row][col] = char.toUpperCase();
        set({ crosswordUserGrid: newGrid });
      },

      checkCrosswordWin: () => {
        const { currentCrossword, crosswordUserGrid } = get();
        if (!currentCrossword) return false;

        for (let r = 0; r < currentCrossword.height; r++) {
          for (let c = 0; c < currentCrossword.width; c++) {
            if (!currentCrossword.grid[r][c].isBlack) {
               if (crosswordUserGrid[r][c] !== currentCrossword.grid[r][c].char) {
                 return false;
               }
            }
          }
        }
        return true;
      },

      // FitWords Actions
      startFitWords: (data) => {
        // Initialize empty user grid with explicit new arrays
        const userGrid: string[][] = Array.from({ length: data.height }).map(() => 
          Array(data.width).fill("")
        );

        // Pre-fill the revealed word
        // We need to find where the revealed word is in the grid
        // Since we don't have the clues with coordinates directly in FitWordsData (we stripped them),
        // we can either pass clues or search the grid. 
        // Actually, generateFitWords uses generateCrossword which returns clues.
        // Let's modify generateFitWords to pass the clues or coordinates of the revealed word.
        // OR, simpler: Just search the grid in the generator and pass the starting pos.
        // BUT, since we are inside the store, let's just assume the component handles the visual reveal?
        // No, the state should reflect the revealed word.
        
        // Let's iterate the grid to find the revealed word? No, that's hard.
        // Let's update FitWordsData to include the revealed word's location.
        // Wait, I can't change the interface in the store file easily without changing the lib file first.
        // Let's just rely on the fact that we can find the word in the grid because we have the full grid in `data.grid` (which has the solution chars).
        
        // Actually, `data.grid` has `char` which is the solution.
        // So we can just fill the userGrid where the solution matches the revealed word?
        // Be careful about overlapping words. If we just fill all cells that match the revealed word, we might fill cells of other words.
        // We need the specific instance.
        
        // Let's look at `generateFitWords` again. I can't see it here.
        // I will implement a simple search for the revealed word in the grid.
        
        // For now, let's just initialize empty and let the component or a helper fill it?
        // No, state should be correct.
        
        // Let's just fill the userGrid with the revealed word by matching the sequence.
        const { revealedWord, grid } = data;
        
        // Find horizontal match
        for (let r = 0; r < data.height; r++) {
          for (let c = 0; c <= data.width - revealedWord.length; c++) {
             let match = true;
             for (let i = 0; i < revealedWord.length; i++) {
               if (grid[r][c+i].char !== revealedWord[i]) {
                 match = false;
                 break;
               }
             }
             if (match) {
               // Check if it's a standalone word (bounded by black or edge)
               const leftOk = c === 0 || grid[r][c-1].isBlack;
               const rightOk = c + revealedWord.length === data.width || grid[r][c+revealedWord.length].isBlack;
               if (leftOk && rightOk) {
                 for (let i = 0; i < revealedWord.length; i++) {
                   userGrid[r][c+i] = revealedWord[i];
                 }
               }
             }
          }
        }
        
        // Find vertical match
        for (let c = 0; c < data.width; c++) {
          for (let r = 0; r <= data.height - revealedWord.length; r++) {
             let match = true;
             for (let i = 0; i < revealedWord.length; i++) {
               if (grid[r+i][c].char !== revealedWord[i]) {
                 match = false;
                 break;
               }
             }
             if (match) {
               const topOk = r === 0 || grid[r-1][c].isBlack;
               const bottomOk = r + revealedWord.length === data.height || grid[r+revealedWord.length][c].isBlack;
               if (topOk && bottomOk) {
                 for (let i = 0; i < revealedWord.length; i++) {
                   userGrid[r+i][c] = revealedWord[i];
                 }
               }
             }
          }
        }

        set({
          currentFitWords: data,
          fitWordsUserGrid: userGrid,
          isFitWordsActive: true,
          timer: 0,
          isGameActive: false,
          isCrosswordActive: false,
          isGameOver: false
        });
      },

      updateFitWordsCell: (row, col, char) => {
        const { fitWordsUserGrid } = get();
        const newGrid = fitWordsUserGrid.map(r => [...r]);
        newGrid[row][col] = char.toUpperCase();
        set({ fitWordsUserGrid: newGrid });
      },

      placeFitWord: (row: number, col: number, direction: 'across' | 'down', word: string) => {
        const { fitWordsUserGrid } = get();
        const newGrid = fitWordsUserGrid.map(r => [...r]);
        
        for (let i = 0; i < word.length; i++) {
          if (direction === 'across') {
            newGrid[row][col + i] = word[i];
          } else {
            newGrid[row + i][col] = word[i];
          }
        }
        
        set({ fitWordsUserGrid: newGrid });
      },

      checkFitWordsWin: () => {
        const { currentFitWords, fitWordsUserGrid } = get();
        if (!currentFitWords) return false;

        for (let r = 0; r < currentFitWords.height; r++) {
          for (let c = 0; c < currentFitWords.width; c++) {
            if (!currentFitWords.grid[r][c].isBlack) {
               if (fitWordsUserGrid[r][c] !== currentFitWords.grid[r][c].char) {
                 return false;
               }
            }
          }
        }
        return true;
      }

    }),
    {
      name: 'mente-maestra-storage',
      partialize: (state) => ({ 
        userName: state.userName,
        xp: state.xp, 
        level: state.level, 
        streak: state.streak, 
        lastPlayedDate: state.lastPlayedDate,
        dailyChallengeState: state.dailyChallengeState,
        stats: state.stats,
        profiles: state.profiles
      }), 
    }
  )
);

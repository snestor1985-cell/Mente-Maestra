import { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateSudoku, Difficulty } from '../lib/sudoku';
import { ArrowLeft, Eraser, Lightbulb, RotateCcw, Settings, Heart, AlertTriangle, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

export default function SudokuGame() {
  const { 
    currentSudoku, 
    userGrid, 
    notes, 
    timer, 
    mistakes,
    lives,
    hints,
    isGameOver,
    startGame, 
    updateCell, 
    toggleNote, 
    incrementTimer,
    addXP,
    registerMistake,
    useHint,
    isDailyChallenge,
    isRushMode,
    rushLevel,
    completeDailyChallenge,
    recordWin
  } = useGameStore();

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [difficulty, setDifficulty] = useState<Difficulty>('Easy');
  const [showPenaltyToast, setShowPenaltyToast] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(incrementTimer, 1000);
    return () => clearInterval(interval);
  }, [incrementTimer]);

  // Show penalty toast when lives decrease (but not game over)
  useEffect(() => {
    if (mistakes === 0 && lives < 3 && !isGameOver) {
      setShowPenaltyToast(true);
      const timer = setTimeout(() => setShowPenaltyToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [lives, mistakes, isGameOver]);

  // Initial game load
  useEffect(() => {
    if (!currentSudoku) {
      startNewGame('Easy');
    }
  }, []);

  const startNewGame = (diff: Difficulty) => {
    const newGame = generateSudoku(diff);
    startGame(newGame);
    setDifficulty(diff);
    setSelectedCell(null);
    setShowPenaltyToast(false);
    setShowWinModal(false);
  };

  const handleNextRushLevel = () => {
    // Increase difficulty and time based on level
    const nextLevel = rushLevel + 1;
    let nextSize: 9 | 4 = 4;
    let nextDiff: Difficulty = 'Easy';
    let nextTime = 30; // Base time

    // Progression Logic
    if (nextLevel <= 3) {
      nextSize = 4;
      nextDiff = 'Easy';
      nextTime = 45 - (nextLevel * 5); // 40, 35, 30
    } else if (nextLevel <= 6) {
      nextSize = 4;
      nextDiff = 'Medium';
      nextTime = 40 - ((nextLevel - 3) * 5); // 35, 30, 25
    } else if (nextLevel <= 9) {
      nextSize = 4;
      nextDiff = 'Hard';
      nextTime = 35 - ((nextLevel - 6) * 5); // 30, 25, 20
    } else {
      // Level 10+ -> 9x9 Grid!
      nextSize = 9;
      nextDiff = 'Easy';
      nextTime = 300; // 5 minutes for 9x9
    }

    const newGame = generateSudoku(nextDiff, undefined, nextSize);
    startGame(newGame, 'rush', nextLevel, nextTime);
    setSelectedCell(null);
    setShowWinModal(false);
  };

  const handleNumberInput = (num: number) => {
    if (!selectedCell || !currentSudoku || isGameOver || showWinModal) return;
    const [r, c] = selectedCell;

    // Validate input against grid size
    if (num > currentSudoku.size) return;

    // Prevent editing initial cells
    if (currentSudoku.grid[r][c] !== 0) return;

    if (isNoteMode) {
      toggleNote(r, c, num);
    } else {
      const isCorrect = num === currentSudoku.solution[r][c];
      
      if (!isCorrect) {
        // Update cell to show the error temporarily (or permanently until fixed)
        updateCell(r, c, num);
        registerMistake();
      } else {
        // Correct move
        updateCell(r, c, num);
        
        // Create a temporary grid to check win condition immediately
        const nextGrid = userGrid.map(row => [...row]);
        nextGrid[r][c] = num;

        // Check for win
        const isComplete = nextGrid.every((row, rIdx) => 
          row.every((cell, cIdx) => 
            (rIdx === r && cIdx === c ? num : cell) !== 0
          )
        );
        
        if (isComplete) {
           const isAllCorrect = nextGrid.every((row, rIdx) => 
            row.every((cell, cIdx) => 
              (rIdx === r && cIdx === c ? num : cell) === currentSudoku.solution[rIdx][cIdx]
            )
          );

          if (isAllCorrect) {
            confetti();
            recordWin(timer, mistakes);
            setShowWinModal(true);
            
            if (isDailyChallenge) {
              addXP(500); // Bonus for daily
              completeDailyChallenge();
            } else if (isRushMode) {
              addXP(50 * rushLevel); // XP scales with rush level
            } else {
              addXP(100);
            }
          }
        }
      }
    }
  };

  const handleErase = () => {
    if (!selectedCell || !currentSudoku || isGameOver || showWinModal) return;
    const [r, c] = selectedCell;
    if (currentSudoku.grid[r][c] !== 0) return; 

    updateCell(r, c, 0);
  };

  const handleHint = () => {
    if (!selectedCell || !currentSudoku || isGameOver || showWinModal) return;
    if (hints <= 0) return;

    const [r, c] = selectedCell;
    if (userGrid[r][c] === currentSudoku.solution[r][c]) return;

    const correctNum = currentSudoku.solution[r][c];
    updateCell(r, c, correctNum);
    useHint();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentSudoku) return <div className="p-8 text-center">Cargando...</div>;

  return (
    <div className="flex flex-col h-screen bg-white md:bg-slate-50 relative overflow-hidden">
      {/* Penalty Toast */}
      {showPenaltyToast && (
        <div 
          className="absolute top-20 left-0 right-0 z-50 flex justify-center px-4 animate-in slide-in-from-top-4 fade-in duration-300"
        >
          <div className="bg-red-500 text-white px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 max-w-sm">
            <AlertTriangle className="w-6 h-6 shrink-0" />
            <div>
              <p className="font-bold">¡Cuidado!</p>
              <p className="text-sm text-red-100">3 errores cometidos. Has perdido una vida y se ha borrado un sector.</p>
            </div>
          </div>
        </div>
      )}

      {/* Win Modal */}
      {showWinModal && (
        <div className="absolute inset-0 z-50 bg-indigo-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div 
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 fade-in duration-300"
          >
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-yellow-500 fill-current" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Victoria!</h2>
            <p className="text-slate-500 mb-6">
              Has completado el puzzle en <span className="font-bold text-slate-900">{formatTime(timer)}</span>
            </p>
            
            <div className="bg-indigo-50 rounded-xl p-4 mb-8">
              <div className="text-sm text-indigo-600 font-bold uppercase tracking-wider mb-1">Recompensa</div>
              <div className="text-3xl font-bold text-indigo-700">+{isDailyChallenge ? 500 : 100} XP</div>
            </div>
            
            <div className="space-y-3">
              {isRushMode ? (
                <button 
                  onClick={handleNextRushLevel}
                  className="block w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg shadow-purple-200 transition-all active:scale-[0.98]"
                >
                  Siguiente Nivel (Nvl {rushLevel + 1})
                </button>
              ) : (
                <button 
                  onClick={() => startNewGame(difficulty)}
                  className="block w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Jugar Otro
                </button>
              )}
              <Link 
                to="/"
                className={clsx(
                  "block w-full py-3 rounded-xl font-bold transition-all active:scale-[0.98]",
                  isRushMode ? "bg-white border border-slate-200 text-slate-700" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
                )}
              >
                Volver al Inicio
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Game Over Overlay */}
      {isGameOver && !showWinModal && (
        <div className="absolute inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div 
            className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 fade-in duration-300"
          >
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-red-500 fill-current" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Juego Terminado!</h2>
            <p className="text-slate-500 mb-8">
              {isRushMode && timer === 0 ? "¡Se acabó el tiempo!" : "Te has quedado sin vidas."}
            </p>
            
            <button 
              onClick={() => isRushMode ? handleNextRushLevel() : startNewGame(difficulty)} // For rush, maybe restart level 1? Or retry same level? Let's say retry same level logic is complex, so just restart rush or go home. Actually user asked to "Try again or Go Home".
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
            >
              {isRushMode ? "Intentar de Nuevo (Nvl 1)" : "Nuevo Juego"}
            </button>
            <Link to="/" className="block mt-4 text-slate-500 text-sm hover:text-slate-700">
              Volver al Inicio
            </Link>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between bg-white border-b border-slate-100 md:hidden">
        <Link to="/" className="p-2 -ml-2 text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        
        <div className="flex items-center gap-4">
          {isRushMode && (
            <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-md text-purple-700 font-bold text-xs">
              Nvl {rushLevel}
            </div>
          )}
          <div className="flex items-center gap-1">
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span className="font-bold text-slate-900">{lives}</span>
          </div>
          <div className={clsx("font-mono font-bold", isRushMode && timer < 10 ? "text-red-500 animate-pulse" : "text-slate-900")}>
            {formatTime(timer)}
          </div>
        </div>
      </header>

      {/* Desktop Header */}
      <header className="hidden md:flex px-8 py-6 items-center justify-between max-w-4xl mx-auto w-full">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Sudoku</h1>
          {isRushMode && (
            <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-bold">
              Rush Nivel {rushLevel}
            </span>
          )}
        </div>
        <div className="flex gap-6 items-center">
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
            <Heart className="w-5 h-5 text-red-500 fill-current" />
            <span className="font-bold text-slate-900">{lives} Vidas</span>
          </div>
          <span className={clsx("font-mono text-xl font-bold", isRushMode && timer < 10 ? "text-red-500 animate-pulse" : "text-slate-500")}>
            {formatTime(timer)}
          </span>
          <div className="px-3 py-1 bg-slate-200 rounded-full text-sm font-bold text-slate-700">
            Errores: {mistakes}/3
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center p-4 max-w-md mx-auto w-full">
        {/* Game Grid */}
        <div className="w-full aspect-square bg-slate-900 p-1 rounded-lg shadow-xl mb-6">
          <div 
            className={clsx(
              "grid gap-[1px] h-full bg-slate-300 border-2 border-slate-900",
              currentSudoku.size === 9 ? "grid-cols-9 grid-rows-[repeat(9,1fr)]" : "grid-cols-4 grid-rows-[repeat(4,1fr)]"
            )}
          >
            {userGrid.map((row, r) => (
              row.map((cell, c) => {
                const isInitial = currentSudoku.grid[r][c] !== 0;
                const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
                const isRelated = selectedCell && (selectedCell[0] === r || selectedCell[1] === c);
                const cellNotes = notes[`${r}-${c}`];
                const isError = !isInitial && cell !== 0 && cell !== currentSudoku.solution[r][c];

                // Border logic
                const boxSize = currentSudoku.size === 9 ? 3 : 2;
                const borderRight = (c + 1) % boxSize === 0 && c !== currentSudoku.size - 1 ? 'border-r-2 border-slate-900' : '';
                const borderBottom = (r + 1) % boxSize === 0 && r !== currentSudoku.size - 1 ? 'border-b-2 border-slate-900' : '';

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => setSelectedCell([r, c])}
                    className={clsx(
                      "relative flex items-center justify-center font-medium cursor-pointer transition-colors select-none bg-white",
                      currentSudoku.size === 9 ? "text-2xl" : "text-4xl",
                      borderRight,
                      borderBottom,
                      isInitial ? "text-slate-900 font-bold" : "text-indigo-600",
                      isError && !isInitial && "text-red-500 bg-red-50",
                      isSelected && "bg-indigo-100 ring-2 ring-inset ring-indigo-500 z-10",
                      !isSelected && isRelated && "bg-slate-50",
                      selectedCell && userGrid[selectedCell[0]][selectedCell[1]] === cell && cell !== 0 && "bg-indigo-200"
                    )}
                  >
                    {cell !== 0 ? cell : (
                      <div className={clsx("grid gap-0.5 w-full h-full p-0.5 pointer-events-none", currentSudoku.size === 9 ? "grid-cols-3" : "grid-cols-2")}>
                        {cellNotes?.map(n => (
                          <div key={n} className="flex items-center justify-center text-[8px] text-slate-500 leading-none">
                            {n}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="w-full space-y-6">
          {/* Tools */}
          <div className="flex justify-between px-4">
            <button 
              onClick={() => setIsNoteMode(!isNoteMode)}
              className={clsx(
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                isNoteMode ? "text-indigo-600" : "text-slate-500"
              )}
            >
              <div className={clsx("p-3 rounded-full transition-colors", isNoteMode ? "bg-indigo-100 ring-2 ring-indigo-500" : "bg-slate-100")}>
                <div className="relative">
                  <span className={clsx("absolute -top-1 -right-1 text-[8px] font-bold px-1 rounded-full transition-colors", isNoteMode ? "bg-indigo-600 text-white" : "bg-slate-300 text-slate-500")}>
                    {isNoteMode ? 'ON' : 'OFF'}
                  </span>
                  <Settings className="w-5 h-5" /> 
                </div>
              </div>
              Notas
            </button>
            <button 
              onClick={handleErase}
              className="flex flex-col items-center gap-1 text-xs font-medium text-slate-500 active:text-slate-700"
            >
              <div className="p-3 rounded-full bg-slate-100 active:bg-slate-200">
                <Eraser className="w-5 h-5" />
              </div>
              Borrar
            </button>
            <button 
              onClick={handleHint}
              disabled={hints <= 0}
              className={clsx(
                "flex flex-col items-center gap-1 text-xs font-medium transition-colors",
                hints > 0 ? "text-slate-500 active:text-slate-700" : "text-slate-300 cursor-not-allowed"
              )}
            >
              <div className={clsx("p-3 rounded-full relative", hints > 0 ? "bg-slate-100 active:bg-slate-200" : "bg-slate-50")}>
                <Lightbulb className="w-5 h-5" />
                {hints > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-600 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {hints}
                  </span>
                )}
              </div>
              Pista
            </button>
            <button 
              onClick={() => startNewGame(difficulty)}
              className="flex flex-col items-center gap-1 text-xs font-medium text-slate-500 active:text-slate-700"
            >
              <div className="p-3 rounded-full bg-slate-100 active:bg-slate-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              Reiniciar
            </button>
          </div>

          {/* Number Pad */}
          <div className={clsx("grid gap-2", currentSudoku.size === 9 ? "grid-cols-9" : "grid-cols-4 max-w-xs mx-auto")}>
            {Array.from({length: currentSudoku.size}, (_, i) => i + 1).map(num => (
              <button
                key={num}
                onClick={() => handleNumberInput(num)}
                className="aspect-[4/5] bg-white border-b-4 border-slate-200 active:border-b-0 active:translate-y-[4px] rounded-lg text-2xl font-medium text-indigo-600 shadow-sm transition-all flex items-center justify-center hover:bg-indigo-50"
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

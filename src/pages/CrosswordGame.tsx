import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateCrossword, CrosswordData, Clue } from '../lib/crossword';
import { ArrowLeft, RotateCcw, Trophy, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import confetti from 'canvas-confetti';

export default function CrosswordGame() {
  const { 
    currentCrossword, 
    crosswordUserGrid, 
    isCrosswordActive,
    timer,
    startCrossword,
    updateCrosswordCell,
    checkCrosswordWin,
    incrementTimer,
    addXP,
    recordWin
  } = useGameStore();

  const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');
  const [showWinModal, setShowWinModal] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(incrementTimer, 1000);
    return () => clearInterval(interval);
  }, [incrementTimer]);

  // Initial load
  useEffect(() => {
    if (!currentCrossword || !isCrosswordActive) {
      startNewGame();
    }
  }, []);

  // Focus input when cell selected
  useEffect(() => {
    if (selectedCell && inputRef.current) {
      inputRef.current.focus();
    }
  }, [selectedCell]);

  const startNewGame = () => {
    const newCrossword = generateCrossword();
    startCrossword(newCrossword);
    setShowWinModal(false);
    setSelectedCell(null);
  };

  const handleCellClick = (r: number, c: number) => {
    if (currentCrossword?.grid[r][c].isBlack) return;

    if (selectedCell && selectedCell[0] === r && selectedCell[1] === c) {
      // Toggle direction if clicking same cell
      setDirection(prev => prev === 'across' ? 'down' : 'across');
    } else {
      setSelectedCell([r, c]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!selectedCell || !currentCrossword) return;
    const [r, c] = selectedCell;

    if (e.key === 'Backspace') {
      updateCrosswordCell(r, c, "");
      // Move back
      moveSelection(-1);
    } else if (e.key === 'ArrowRight') {
      if (direction === 'across') moveSelection(1);
    } else if (e.key === 'ArrowLeft') {
      if (direction === 'across') moveSelection(-1);
    } else if (e.key === 'ArrowDown') {
      if (direction === 'down') moveSelection(1);
    } else if (e.key === 'ArrowUp') {
      if (direction === 'down') moveSelection(-1);
    }
    // Note: Character input is handled by onChange to support all devices and avoid double-firing
  };

  const moveSelection = (step: number) => {
    if (!selectedCell || !currentCrossword) return;
    let [r, c] = selectedCell;
    
    let attempts = 0;
    while (attempts < currentCrossword.width * currentCrossword.height) {
      if (direction === 'across') {
        c += step;
      } else {
        r += step;
      }

      // Wrap around? Or stop at edges? Stop at edges is better for crossword
      if (r < 0 || r >= currentCrossword.height || c < 0 || c >= currentCrossword.width) {
        break; 
      }

      if (!currentCrossword.grid[r][c].isBlack) {
        setSelectedCell([r, c]);
        return;
      }
      attempts++;
    }
  };

  const handleCheck = () => {
    if (checkCrosswordWin()) {
      confetti();
      addXP(200);
      recordWin(timer, 0); // 0 mistakes for now as we don't track them in crossword yet
      setShowWinModal(true);
    } else {
      // Maybe shake animation or toast?
      alert("Aún hay errores o casillas vacías.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentCrossword) return <div className="p-8 text-center">Generando...</div>;

  // Highlight logic
  const getHighlightClass = (r: number, c: number) => {
    if (currentCrossword.grid[r][c].isBlack) return "bg-slate-900";
    
    const isSelected = selectedCell?.[0] === r && selectedCell?.[1] === c;
    if (isSelected) return "bg-yellow-200";

    // Highlight active word
    if (selectedCell) {
      const [sr, sc] = selectedCell;
      // Find the word belonging to selected cell in current direction
      // This is complex to do perfectly without storing word ranges.
      // Simple approximation: highlight row or col if direction matches
      if (direction === 'across' && r === sr) {
         // Check if connected by non-black cells
         // This is a bit heavy for render loop, but let's try simple row/col highlight for now
         // Better: Pre-calculate word ranges or just highlight row/col
         return "bg-yellow-50"; 
      }
      if (direction === 'down' && c === sc) {
         return "bg-yellow-50";
      }
    }
    return "bg-white";
  };

  // Find active clue
  const activeClue = selectedCell ? currentCrossword.clues.find(clue => {
    if (clue.direction !== direction) return false;
    if (direction === 'across') {
      return clue.row === selectedCell[0] && selectedCell[1] >= clue.col && selectedCell[1] < clue.col + clue.length;
    } else {
      return clue.col === selectedCell[1] && selectedCell[0] >= clue.row && selectedCell[0] < clue.row + clue.length;
    }
  }) : null;

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Hidden Input for Mobile Keyboard */}
      <input 
        ref={inputRef}
        type="text" 
        className="opacity-0 absolute top-0 left-0 h-0 w-0" 
        onKeyDown={handleKeyDown}
        onChange={(e) => {
           // Handle mobile input where keydown might not fire for all keys
           const val = e.target.value;
           if (val.length > 0 && selectedCell) {
             const char = val[val.length - 1];
             if (char.match(/[a-zA-Z]/)) {
                updateCrosswordCell(selectedCell[0], selectedCell[1], char);
                // Removed auto-advance per user request
             }
             e.target.value = "";
           }
        }}
      />

      {/* Win Modal */}
      {showWinModal && (
        <div className="absolute inset-0 z-50 bg-indigo-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-yellow-500 fill-current" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Crucigrama Resuelto!</h2>
            <p className="text-slate-500 mb-6">
              Tiempo: <span className="font-bold text-slate-900">{formatTime(timer)}</span>
            </p>
            <div className="space-y-3">
              <Link to="/" className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
                Volver al Inicio
              </Link>
              <button 
                onClick={startNewGame}
                className="block w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold"
              >
                Nuevo Crucigrama
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between bg-white border-b border-slate-100">
        <Link to="/" className="p-2 -ml-2 text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <h1 className="font-bold text-slate-900">Crucigrama</h1>
        <div className="font-mono text-slate-600">{formatTime(timer)}</div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Grid Area */}
        <div className="flex-1 p-4 flex flex-col items-center justify-start md:justify-center overflow-auto w-full">
          <div 
            className="grid gap-[1px] bg-slate-900 border-2 border-slate-900 shadow-xl shrink-0 p-5"
            style={{ 
              gridTemplateColumns: `repeat(${currentCrossword.width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${currentCrossword.height}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '750px',
              aspectRatio: '1/1'
            }}
          >
            {currentCrossword.grid.map((row, r) => (
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={clsx(
                    "relative flex items-center justify-center font-bold uppercase cursor-pointer select-none",
                    // Dynamic font size
                    currentCrossword.width > 12 ? "text-base md:text-xl" : "text-xl md:text-2xl",
                    getHighlightClass(r, c)
                  )}
                >
                  {!cell.isBlack && (
                    <>
                      {cell.number && (
                        <span className="absolute top-0 left-0.5 text-[8px] md:text-[10px] leading-none text-slate-500 font-normal">
                          {cell.number}
                        </span>
                      )}
                      <span className={clsx(
                        "z-10 mt-1",
                        crosswordUserGrid[r][c] ? "text-slate-900" : "text-transparent"
                      )}>
                        {crosswordUserGrid[r][c]}
                      </span>
                    </>
                  )}
                </div>
              ))
            ))}
          </div>

          {/* Active Clue Display (Mobile) */}
          <div className="mt-6 w-full max-w-[700px] bg-indigo-50 p-4 rounded-xl border border-indigo-100 text-center md:hidden min-h-[80px] flex items-center justify-center shadow-sm">
            {activeClue ? (
              <div>
                <span className="font-bold text-indigo-700 mr-2 block text-lg">{activeClue.number} {activeClue.direction === 'across' ? 'Horizontal' : 'Vertical'}</span>
                <span className="text-indigo-900 text-lg leading-tight">{activeClue.text}</span>
              </div>
            ) : (
              <span className="text-indigo-400">Selecciona una casilla para ver la pista</span>
            )}
          </div>
          
          <div className="mt-6 flex gap-4">
             <button 
                onClick={handleCheck}
                className="flex items-center gap-2 px-8 py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all active:scale-[0.98] text-lg"
              >
                <Check className="w-6 h-6" />
                Comprobar
              </button>
              <button 
                onClick={startNewGame}
                className="p-4 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
              >
                <RotateCcw className="w-6 h-6" />
              </button>
          </div>
        </div>

        {/* Clues Sidebar (Desktop) */}
        <div className="hidden md:flex w-80 bg-white border-l border-slate-200 flex-col h-full">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900">Pistas</div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            <div>
              <h3 className="font-bold text-indigo-600 mb-2 uppercase text-xs tracking-wider">Horizontales</h3>
              <div className="space-y-2">
                {currentCrossword.clues.filter(c => c.direction === 'across').map(clue => (
                  <div 
                    key={`a-${clue.number}`}
                    className={clsx(
                      "text-sm p-2 rounded cursor-pointer hover:bg-slate-50",
                      activeClue === clue && "bg-yellow-50 ring-1 ring-yellow-200"
                    )}
                    onClick={() => {
                      setSelectedCell([clue.row, clue.col]);
                      setDirection('across');
                    }}
                  >
                    <span className="font-bold mr-1">{clue.number}.</span>
                    {clue.text}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-indigo-600 mb-2 uppercase text-xs tracking-wider">Verticales</h3>
              <div className="space-y-2">
                {currentCrossword.clues.filter(c => c.direction === 'down').map(clue => (
                  <div 
                    key={`d-${clue.number}`}
                    className={clsx(
                      "text-sm p-2 rounded cursor-pointer hover:bg-slate-50",
                      activeClue === clue && "bg-yellow-50 ring-1 ring-yellow-200"
                    )}
                    onClick={() => {
                      setSelectedCell([clue.row, clue.col]);
                      setDirection('down');
                    }}
                  >
                    <span className="font-bold mr-1">{clue.number}.</span>
                    {clue.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

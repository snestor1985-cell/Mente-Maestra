import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateFitWords } from '../lib/fitwords';
import { ArrowLeft, RotateCcw, Trophy, Check, MousePointer2, Hand } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import confetti from 'canvas-confetti';
import { socketService } from '../services/socket';

interface FitWordsGameProps {
  isMultiplayer?: boolean;
  roomId?: string;
}

export default function FitWordsGame({ isMultiplayer, roomId }: FitWordsGameProps) {
  const { 
    currentFitWords, 
    fitWordsUserGrid, 
    isFitWordsActive,
    timer,
    startFitWords,
    updateFitWordsCell,
    placeFitWord,
    checkFitWordsWin,
    incrementTimer,
    addXP,
    recordWin
  } = useGameStore();

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<{r: number, c: number, dir: 'across' | 'down'} | null>(null);
  const [showWinModal, setShowWinModal] = useState(false);
  const [reservedSlots, setReservedSlots] = useState<Record<string, string>>({}); // slotId -> userId
  const [players, setPlayers] = useState<any[]>([]);

  // Multiplayer Effects
  useEffect(() => {
    if (isMultiplayer && roomId) {
      const socket = socketService.connect();

      socket.on("game_action", (data) => {
        if (data.action === 'place_word') {
          const { r, c, dir, word } = data.payload;
          placeFitWord(r, c, dir, word);
        }
      });

      socket.on("slot_reserved", (data) => {
        setReservedSlots(prev => ({ ...prev, [data.slotId]: data.userId }));
      });

      socket.on("slot_released", (data) => {
        setReservedSlots(prev => {
          const next = { ...prev };
          delete next[data.slotId];
          return next;
        });
      });

      socket.on("room_update", (room) => {
        setPlayers(room.players);
      });

      return () => {
        socket.off("game_action");
        socket.off("slot_reserved");
        socket.off("slot_released");
        socket.off("room_update");
      };
    }
  }, [isMultiplayer, roomId]);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(incrementTimer, 1000);
    return () => clearInterval(interval);
  }, [incrementTimer]);

  // Initial load
  useEffect(() => {
    if (!currentFitWords || !isFitWordsActive) {
      if (!isMultiplayer) {
         startNewGame();
      }
    }
  }, []);

  const startNewGame = () => {
    const newGame = generateFitWords();
    startFitWords(newGame);
    setShowWinModal(false);
    setSelectedWord(null);
  };

  // Calculate valid slots
  const slots = useMemo(() => {
    if (!currentFitWords) return [];
    const s: {r: number, c: number, len: number, dir: 'across' | 'down', id: string}[] = [];
    const { width, height, grid } = currentFitWords;

    // Horizontal slots
    for (let r = 0; r < height; r++) {
      let c = 0;
      while (c < width) {
        if (grid[r] && grid[r][c] && grid[r][c].isBlack) {
          c++;
          continue;
        }
        let len = 0;
        while (c + len < width && grid[r] && grid[r][c+len] && !grid[r][c+len].isBlack) {
          len++;
        }
        if (len > 1) {
          s.push({ r, c, len, dir: 'across', id: `across-${r}-${c}` });
        }
        c += len;
      }
    }

    // Vertical slots
    for (let c = 0; c < width; c++) {
      let r = 0;
      while (r < height) {
        if (grid[r] && grid[r][c] && grid[r][c].isBlack) {
          r++;
          continue;
        }
        let len = 0;
        while (r + len < height && grid[r+len] && grid[r+len][c] && !grid[r+len][c].isBlack) {
          len++;
        }
        if (len > 1) {
          s.push({ r, c, len, dir: 'down', id: `down-${r}-${c}` });
        }
        r += len;
      }
    }
    return s;
  }, [currentFitWords]);

  // Calculate placed words
  const placedWords = useMemo(() => {
    const placed = new Set<string>();
    if (!currentFitWords || !fitWordsUserGrid.length) return placed;

    // Initialize with revealed word
    placed.add(currentFitWords.revealedWord);

    for (const slot of slots) {
      let word = "";
      let isComplete = true;
      for (let i = 0; i < slot.len; i++) {
        const r = slot.dir === 'across' ? slot.r : slot.r + i;
        const c = slot.dir === 'across' ? slot.c + i : slot.c;
        // Check bounds
        if (r >= fitWordsUserGrid.length || c >= fitWordsUserGrid[0].length) {
            isComplete = false; 
            break;
        }
        const char = fitWordsUserGrid[r][c];
        if (!char) {
          isComplete = false;
          break;
        }
        word += char;
      }
      
      if (isComplete) {
        placed.add(word);
      }
    }
    return placed;
  }, [fitWordsUserGrid, slots, currentFitWords]);

  const handleWordSelect = (word: string) => {
    if (selectedWord === word) {
      setSelectedWord(null);
    } else {
      setSelectedWord(word);
    }
  };

  const handleSlotClick = (r: number, c: number) => {
    if (!selectedWord) return;
    
    // Find matching slot starting at r,c
    const slot = slots.find(s => s.r === r && s.c === c && s.len === selectedWord.length);
    
    if (slot) {
      // Check reservation
      if (isMultiplayer && roomId) {
         if (reservedSlots[slot.id] && reservedSlots[slot.id] !== socketService.socket?.id) {
           alert("Slot ocupado por otro jugador");
           return;
         }
         socketService.sendGameAction(roomId, 'place_word', { r: slot.r, c: slot.c, dir: slot.dir, word: selectedWord });
      }

      placeFitWord(slot.r, slot.c, slot.dir, selectedWord);
      setSelectedWord(null);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, word: string) => {
    e.dataTransfer.setData('text/plain', word);
    setSelectedWord(word); // Also select it visually
  };

  const handleDragOver = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault(); // Allow drop
    if (!selectedWord) return;
    
    // Highlight potential slot
    const slot = slots.find(s => s.r === r && s.c === c && s.len === selectedWord.length);
    if (slot) {
      // Check reservation
      if (isMultiplayer && reservedSlots[slot.id] && reservedSlots[slot.id] !== socketService.socket?.id) {
         // Don't highlight if reserved
         setHoveredSlot(null);
         return;
      }
      setHoveredSlot({ r, c, dir: slot.dir });
      
      // Reserve on hover (debounce this in real app, but for now direct)
      if (isMultiplayer && roomId && !reservedSlots[slot.id]) {
         socketService.reserveSlot(roomId, slot.id);
      }

    } else {
      setHoveredSlot(null);
    }
  };

  const handleDrop = (e: React.DragEvent, r: number, c: number) => {
    e.preventDefault();
    const word = e.dataTransfer.getData('text/plain');
    if (!word) return;

    const slot = slots.find(s => s.r === r && s.c === c && s.len === word.length);
    if (slot) {
      if (isMultiplayer && roomId) {
         if (reservedSlots[slot.id] && reservedSlots[slot.id] !== socketService.socket?.id) {
           alert("Slot ocupado");
           return;
         }
         socketService.sendGameAction(roomId, 'place_word', { r: slot.r, c: slot.c, dir: slot.dir, word });
      }

      placeFitWord(slot.r, slot.c, slot.dir, word);
      setSelectedWord(null);
      setHoveredSlot(null);
    }
  };

  const handleCheck = () => {
    if (checkFitWordsWin()) {
      confetti();
      addXP(300);
      recordWin(timer, 0);
      setShowWinModal(true);
    } else {
      alert("Aún hay errores o casillas vacías.");
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentFitWords) return <div className="p-8 text-center">Generando...</div>;

  // Group words by length
  const wordsByLength = currentFitWords?.words?.reduce((acc, word) => {
    const len = word.length;
    if (!acc[len]) acc[len] = [];
    acc[len].push(word);
    return acc;
  }, {} as Record<number, string[]>) || {};

  const getHighlightClass = (r: number, c: number) => {
    if (currentFitWords.grid[r][c].isBlack) return "bg-slate-900";
    
    // Check if cell is part of a reserved slot
    if (isMultiplayer) {
      const reservedSlotId = Object.keys(reservedSlots).find(id => {
         const [dir, sr, sc] = id.split('-');
         const slot = slots.find(s => s.id === id);
         if (!slot) return false;
         
         if (slot.dir === 'across') {
           return r === slot.r && c >= slot.c && c < slot.c + slot.len;
         } else {
           return c === slot.c && r >= slot.r && r < slot.r + slot.len;
         }
      });

      if (reservedSlotId) {
         const userId = reservedSlots[reservedSlotId];
         if (userId !== socketService.socket?.id) {
           return "bg-red-100 ring-2 ring-red-400 opacity-80 cursor-not-allowed";
         } else {
           return "bg-green-50 ring-2 ring-green-400"; // My reservation
         }
      }
    }

    // Highlight valid slots for selected word
    if (selectedWord) {
      // Check if this cell is part of a valid slot for the selected word
      const validSlot = slots.find(s => s.len === selectedWord.length);
      if (validSlot) {
        // Is this cell the START of a valid slot?
        const isStart = slots.some(s => s.r === r && s.c === c && s.len === selectedWord.length);
        if (isStart) return "bg-green-100 ring-2 ring-green-400 z-10 cursor-pointer";
      }
    }

    // Hover effect during drag
    if (hoveredSlot) {
      const { r: hr, c: hc, dir } = hoveredSlot;
      if (dir === 'across' && r === hr && c >= hc && c < hc + selectedWord!.length) return "bg-blue-200";
      if (dir === 'down' && c === hc && r >= hr && r < hr + selectedWord!.length) return "bg-blue-200";
    }

    return "bg-white";
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50">
      {/* Win Modal */}
      {showWinModal && (
        <div className="absolute inset-0 z-50 bg-indigo-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-yellow-500 fill-current" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-2">¡Completado!</h2>
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
                Nuevo Juego
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="px-4 py-3 flex items-center justify-between bg-white border-b border-slate-100">
        <Link to={isMultiplayer ? "/multiplayer" : "/"} className="p-2 -ml-2 text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex flex-col items-center">
          <h1 className="font-bold text-slate-900 flex items-center gap-2">
            Palabras Encajadas
            {isMultiplayer && <span className="text-xs bg-red-100 text-red-600 px-2 rounded-full">VERSUS</span>}
          </h1>
          {isMultiplayer && (
            <div className="flex gap-4 text-xs">
               {players.map(p => (
                 <span key={p.id} className="font-bold text-slate-600">
                   {p.name}: {p.score} pts
                 </span>
               ))}
            </div>
          )}
        </div>
        <div className="font-mono text-slate-600">{formatTime(timer)}</div>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Grid Area */}
        <div className="flex-1 p-4 flex flex-col items-center justify-start lg:justify-center overflow-auto w-full">
          <div 
            className="grid gap-[1px] bg-slate-900 border-2 border-slate-900 shadow-xl shrink-0 p-5"
            style={{ 
              gridTemplateColumns: `repeat(${currentFitWords.width}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${currentFitWords.height}, minmax(0, 1fr))`,
              width: '100%',
              maxWidth: '750px',
              aspectRatio: '1/1'
            }}
          >
            {currentFitWords.grid.map((row, r) => (
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleSlotClick(r, c)}
                  onDragOver={(e) => handleDragOver(e, r, c)}
                  onDrop={(e) => handleDrop(e, r, c)}
                  className={clsx(
                    "relative flex items-center justify-center font-bold uppercase select-none transition-colors",
                    currentFitWords.width > 12 ? "text-base md:text-xl" : "text-xl md:text-2xl",
                    getHighlightClass(r, c)
                  )}
                >
                  {!cell.isBlack && (
                    <span className={clsx(
                      "z-10 pointer-events-none", // Pointer events none to allow drop on div
                      fitWordsUserGrid[r][c] ? "text-slate-900" : "text-transparent"
                    )}>
                      {fitWordsUserGrid[r][c]}
                    </span>
                  )}
                </div>
              ))
            ))}
          </div>

          <div className="mt-6 flex gap-4 lg:hidden">
             <button onClick={handleCheck} className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl font-bold">
                <Check className="w-5 h-5" /> Comprobar
             </button>
             {!isMultiplayer && (
               <button onClick={startNewGame} className="p-3 bg-slate-100 text-slate-600 rounded-xl">
                  <RotateCcw className="w-5 h-5" />
               </button>
             )}
          </div>
        </div>

        {/* Word List Sidebar */}
        <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 flex flex-col h-[40vh] lg:h-full">
          <div className="p-4 border-b border-slate-100 font-bold text-slate-900 flex justify-between items-center">
            <span>Palabras Disponibles</span>
            <div className="hidden lg:flex gap-2">
               <button onClick={handleCheck} className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"><Check className="w-4 h-4"/></button>
               {!isMultiplayer && <button onClick={startNewGame} className="p-2 bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200"><RotateCcw className="w-4 h-4"/></button>}
            </div>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-6">
            {Object.entries(wordsByLength).sort((a, b) => Number(a[0]) - Number(b[0])).map(([len, words]) => (
              <div key={len}>
                <h3 className="font-bold text-indigo-600 mb-2 uppercase text-xs tracking-wider border-b border-indigo-100 pb-1">
                  {len} Letras
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                  {words.map(word => {
                    const isRevealed = word === currentFitWords.revealedWord;
                    const isPlaced = placedWords.has(word);
                    const isSelected = selectedWord === word;
                    
                    // Combined state
                    const isUsed = isRevealed || isPlaced;

                    return (
                      <div 
                        key={word} 
                        draggable={!isUsed}
                        onDragStart={(e) => !isUsed && handleDragStart(e, word)}
                        onClick={() => !isUsed && handleWordSelect(word)}
                        className={clsx(
                          "text-sm p-2 rounded border text-center lg:text-left cursor-grab active:cursor-grabbing transition-all",
                          isUsed 
                            ? "line-through text-slate-400 bg-slate-50 border-slate-100 cursor-default decoration-slate-400/50" 
                            : isSelected
                              ? "bg-indigo-600 text-white border-indigo-600 shadow-md transform scale-105"
                              : "bg-slate-50 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700"
                        )}
                      >
                        {word}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

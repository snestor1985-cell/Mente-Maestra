import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { generateSudoku } from '../lib/sudoku';
import { Zap, ArrowLeft, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function RushChallenge() {
  const navigate = useNavigate();
  const { startGame } = useGameStore();

  const handleStartRush = () => {
    // Level 1: 4x4, Easy, 60 seconds
    const rushPuzzle = generateSudoku('Easy', undefined, 4);
    startGame(rushPuzzle, 'rush', 1, 60);
    navigate('/sudoku');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-purple-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Desafío Rush</h1>
        <p className="text-slate-500 mb-8">
          Sudoku 4x4 rápido. Ideal para partidas cortas.
        </p>

        <div className="space-y-6">
          <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 text-left">
            <h3 className="font-bold text-purple-800 mb-2">Características:</h3>
            <ul className="text-sm text-purple-700 space-y-2">
              <li className="flex items-center gap-2">⚡ Tablero 4x4 (Mini Sudoku)</li>
              <li className="flex items-center gap-2">⏱️ Partidas de &lt; 1 minuto</li>
              <li className="flex items-center gap-2">🧠 Perfecto para principiantes</li>
            </ul>
          </div>

          <button
            onClick={handleStartRush}
            className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-purple-200 transition-all active:scale-[0.98]"
          >
            Jugar Rush
          </button>
        </div>

        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 mt-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}

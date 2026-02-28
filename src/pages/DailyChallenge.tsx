import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import { generateSudoku } from '../lib/sudoku';
import { Calendar, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DailyChallenge() {
  const navigate = useNavigate();
  const { 
    startGame, 
    dailyChallengeState, 
    isGameActive, 
    isDailyChallenge 
  } = useGameStore();

  const today = new Date();
  const offset = today.getTimezoneOffset() * 60000;
  const localDate = new Date(today.getTime() - offset).toISOString().split('T')[0];
  
  const isCompleted = dailyChallengeState.lastCompletedDate === localDate;

  const handleStartDaily = () => {
    if (isCompleted) return;
    
    // Generate puzzle seeded with today's date
    const dailyPuzzle = generateSudoku('Medium', localDate);
    startGame(dailyPuzzle, 'daily');
    navigate('/sudoku');
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Calendar className="w-10 h-10 text-orange-600" />
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Desafío Diario</h1>
        <p className="text-slate-500 mb-8">
          {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        {isCompleted ? (
          <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8">
            <div className="flex flex-col items-center gap-3">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <h3 className="text-xl font-bold text-green-700">¡Completado!</h3>
              <p className="text-green-600 text-sm">
                Has ganado tus XP de hoy. Vuelve mañana para un nuevo desafío.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left">
              <h3 className="font-bold text-orange-800 mb-2">Recompensas:</h3>
              <ul className="text-sm text-orange-700 space-y-2">
                <li className="flex items-center gap-2">✨ 500 XP (5x normal)</li>
                <li className="flex items-center gap-2">🔥 Mantiene tu racha</li>
                <li className="flex items-center gap-2">🏆 Puzzle único global</li>
              </ul>
            </div>

            <button
              onClick={handleStartDaily}
              className="w-full py-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-orange-200 transition-all active:scale-[0.98]"
            >
              Jugar Desafío
            </button>
          </div>
        )}

        <Link to="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 mt-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Play, Calendar, Printer, Trophy, Star, User, Edit2, Check, X, Plus, Users, Crown, Zap, LayoutGrid, Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export default function Home() {
  const { level, xp, streak, userName, setUserName, profiles } = useGameStore();
  const [nameInput, setNameInput] = useState('');
  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const [showUserSelect, setShowUserSelect] = useState(!userName);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const startEditing = () => {
    // Instead of inline edit, show user selection modal to switch users
    setShowUserSelect(true);
    setIsCreatingNew(false);
  };

  const handleUserSelect = (name: string) => {
    setUserName(name);
    setShowUserSelect(false);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (nameInput.trim()) {
      setUserName(nameInput.trim());
      setShowUserSelect(false);
      setIsCreatingNew(false);
      setNameInput('');
    }
  };

  // Sort profiles by XP (Ranking)
  const sortedProfiles = Object.entries(profiles || {})
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => b.xp - a.xp);

  if (showUserSelect) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-indigo-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          {isCreatingNew ? 'Nuevo Jugador' : 'Selecciona Jugador'}
        </h1>
        <p className="text-slate-500 mb-8 max-w-xs">
          {isCreatingNew 
            ? 'Ingresa tu nombre para comenzar tu aventura.' 
            : 'Elige tu perfil o crea uno nuevo.'}
        </p>
        
        {isCreatingNew ? (
          <form onSubmit={handleCreateUser} className="w-full space-y-4">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-center text-lg font-medium"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!nameInput.trim()}
                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98]"
              >
                Crear
              </button>
            </div>
          </form>
        ) : (
          <div className="w-full space-y-4">
            {sortedProfiles.length > 0 && (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-6">
                <div className="bg-slate-50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider text-left flex justify-between">
                  <span>Ranking</span>
                  <span>Nivel / XP</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {sortedProfiles.map((profile, index) => (
                    <button
                      key={profile.name}
                      onClick={() => handleUserSelect(profile.name)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-indigo-50 transition-colors group text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className={clsx(
                          "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm",
                          index === 0 ? "bg-yellow-100 text-yellow-600" :
                          index === 1 ? "bg-slate-200 text-slate-600" :
                          index === 2 ? "bg-orange-100 text-orange-600" :
                          "bg-slate-100 text-slate-400"
                        )}>
                          {index < 3 ? <Crown className="w-4 h-4 fill-current" /> : index + 1}
                        </div>
                        <span className="font-bold text-slate-900 group-hover:text-indigo-700">
                          {profile.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-slate-900">Nvl {profile.level}</div>
                        <div className="text-[10px] text-slate-500">{profile.xp} XP</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Nuevo Usuario
            </button>
            
            {userName && (
               <button
                onClick={() => setShowUserSelect(false)}
                className="w-full py-3 text-slate-500 hover:text-slate-700 font-medium text-sm"
              >
                Volver
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">
      {/* Header / Stats */}
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2 group">
            Hola, {userName}
            <button 
              onClick={startEditing}
              className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-100 rounded-full hover:bg-indigo-50 transition-colors"
              title="Cambiar usuario"
            >
              <Users className="w-4 h-4" />
            </button>
          </h1>
          <p className="text-slate-500">¿Listo para entrenar tu mente?</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
            {level}
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-900">Nivel {level}</span>
            <span className="text-[10px] text-slate-500">{xp} XP</span>
          </div>
        </div>
      </header>

      {/* Hero Action */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link 
          to="/sudoku" 
          className="group relative overflow-hidden bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 transition-transform hover:scale-[1.02] active:scale-[0.98]"
        >
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4 backdrop-blur-sm">
              <Play className="w-6 h-6 fill-current" />
            </div>
            <h2 className="text-xl font-bold mb-1">Jugar Sudoku</h2>
            <p className="text-indigo-100 text-sm">Partida rápida 9x9</p>
          </div>
        </Link>

        <div className="grid grid-rows-2 gap-4">
          <Link 
            to="/daily" 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-orange-200 transition-colors"
          >
            <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Desafío Diario</h3>
              <p className="text-xs text-slate-500">Gana doble XP</p>
            </div>
          </Link>

          <Link 
            to="/rush" 
            className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-purple-200 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900">Desafío Rush</h3>
              <p className="text-xs text-slate-500">Mini Sudoku 4x4</p>
            </div>
          </Link>
        </div>
      </section>

      {/* Streak Section */}
      <section className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Tu Progreso
          </h3>
          <span className="text-sm font-medium text-slate-500">{streak} días racha</span>
        </div>
        
        <div className="flex justify-between items-center gap-2">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span className="text-xs text-slate-400">{day}</span>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                {i < 3 ? <Star className="w-3 h-3 fill-current" /> : null}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-4">Multijugador</h3>
        <Link 
          to="/multiplayer"
          className="group relative overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all flex items-center gap-4 text-white"
        >
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-sm">
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold mb-1">Jugar con Amigos</h4>
            <p className="text-indigo-100 text-sm">Crea una sala y compite en tiempo real.</p>
          </div>
          <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
            <Play className="w-8 h-8 text-white" />
          </div>
        </Link>
      </section>

      <section>
        <h3 className="font-bold text-slate-900 mb-4">Más Juegos</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <Link 
            to="/crossword"
            className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-teal-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Crucigrama</h4>
              <p className="text-slate-500 text-sm">Encuentra las palabras ocultas con pistas.</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
              <Play className="w-6 h-6 text-teal-500" />
            </div>
          </Link>

          <Link 
            to="/fitwords"
            className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all flex items-center gap-4"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <LayoutGrid className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">Palabras Encajadas</h4>
              <p className="text-slate-500 text-sm">Ubica las palabras en el lugar correcto.</p>
            </div>
            <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0">
              <Play className="w-6 h-6 text-purple-500" />
            </div>
          </Link>
        </div>
      </section>
      <footer className="mt-12 text-center text-slate-400 text-sm pb-8">
        <p className="mb-4">© 2024 Mente Maestra. Todos los derechos reservados.</p>
        <a 
          href="/download-source" 
          target="_blank"
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors text-xs font-medium"
        >
          <Download className="w-4 h-4" />
          Descargar Código Fuente
        </a>
      </footer>
    </div>
  );
}

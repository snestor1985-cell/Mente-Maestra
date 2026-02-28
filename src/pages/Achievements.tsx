import { useGameStore } from '../store/gameStore';
import { Trophy, Medal, Zap, Clock, Star, ArrowLeft, Lock, Crown, Flame, Moon, HeartCrack } from 'lucide-react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';

export default function Achievements() {
  const { stats, streak, level } = useGameStore();

  const achievements = [
    // General Wins
    {
      id: 'first-win',
      title: 'Primera Victoria',
      description: 'Completa tu primer Sudoku',
      icon: Trophy,
      color: 'text-yellow-500',
      bg: 'bg-yellow-100',
      isUnlocked: stats.gamesWon >= 1,
      category: 'General'
    },
    {
      id: 'veteran',
      title: 'Veterano',
      description: 'Gana 10 partidas',
      icon: Medal,
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
      isUnlocked: stats.gamesWon >= 10,
      category: 'General'
    },
    {
      id: 'master',
      title: 'Maestro',
      description: 'Gana 50 partidas',
      icon: Crown,
      color: 'text-purple-600',
      bg: 'bg-purple-100',
      isUnlocked: stats.gamesWon >= 50,
      category: 'General'
    },
    
    // Perfection
    {
      id: 'perfectionist',
      title: 'Perfeccionista',
      description: 'Gana sin cometer errores',
      icon: Star,
      color: 'text-purple-500',
      bg: 'bg-purple-100',
      isUnlocked: stats.perfectGames >= 1,
      category: 'Skill'
    },
    {
      id: 'flawless-streak',
      title: 'Impecable',
      description: '5 partidas perfectas',
      icon: Star,
      color: 'text-fuchsia-500',
      bg: 'bg-fuchsia-100',
      isUnlocked: stats.perfectGames >= 5,
      category: 'Skill'
    },

    // Speed
    {
      id: 'speedster',
      title: 'Velocista',
      description: 'Gana en menos de 3 minutos',
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-100',
      isUnlocked: stats.fastestWin !== null && stats.fastestWin < 180,
      category: 'Speed'
    },
    {
      id: 'lightning',
      title: 'Relámpago',
      description: 'Gana en menos de 1 minuto',
      icon: Zap,
      color: 'text-yellow-600',
      bg: 'bg-yellow-200',
      isUnlocked: stats.fastestWin !== null && stats.fastestWin < 60,
      category: 'Speed'
    },

    // Streak
    {
      id: 'streak-3',
      title: 'Constancia',
      description: 'Racha de 3 días seguidos',
      icon: Flame,
      color: 'text-orange-500',
      bg: 'bg-orange-100',
      isUnlocked: streak >= 3,
      category: 'Streak'
    },
    {
      id: 'streak-7',
      title: 'Dedicación',
      description: 'Racha de 7 días seguidos',
      icon: Flame,
      color: 'text-red-500',
      bg: 'bg-red-100',
      isUnlocked: streak >= 7,
      category: 'Streak'
    },

    // Rush Mode
    {
      id: 'rush-rookie',
      title: 'Novato Rush',
      description: 'Alcanza el Nivel 5 en Rush',
      icon: Zap,
      color: 'text-cyan-500',
      bg: 'bg-cyan-100',
      isUnlocked: (stats.maxRushLevel || 0) >= 5,
      category: 'Rush'
    },
    {
      id: 'rush-pro',
      title: 'Profesional Rush',
      description: 'Alcanza el Nivel 10 en Rush',
      icon: Zap,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
      isUnlocked: (stats.maxRushLevel || 0) >= 10,
      category: 'Rush'
    },

    // Level
    {
      id: 'level-5',
      title: 'Aprendiz',
      description: 'Alcanza el nivel 5',
      icon: Trophy,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
      isUnlocked: level >= 5,
      category: 'Level'
    },
    {
      id: 'level-20',
      title: 'Experto',
      description: 'Alcanza el nivel 20',
      icon: Crown,
      color: 'text-emerald-700',
      bg: 'bg-emerald-200',
      isUnlocked: level >= 20,
      category: 'Level'
    },

    // Hidden / Special
    {
      id: 'survivor',
      title: 'Sobreviviente',
      description: 'Gana con 1 vida restante',
      icon: HeartCrack,
      color: 'text-rose-500',
      bg: 'bg-rose-100',
      isUnlocked: false, // Needs tracking "won with 1 life" - currently not tracked in stats. Let's assume unlocked if gamesWon > 0 for now as placeholder or remove. 
      // Actually, let's make it "Win 100 games" is the hidden one? Or "Night Owl".
      // Let's use "Night Owl" based on current time check? No, achievements are persistent.
      // We can't easily track "Night Owl" without adding it to stats. 
      // Let's make "Level 50" a hidden achievement.
      isHidden: true,
      category: 'Hidden'
    },
    {
      id: 'legend',
      title: 'Leyenda',
      description: 'Gana 100 partidas',
      icon: Crown,
      color: 'text-amber-500',
      bg: 'bg-amber-100',
      isUnlocked: stats.gamesWon >= 100,
      isHidden: true, // Only shows when unlocked
      category: 'General'
    }
  ];

  // Filter out hidden achievements that are not unlocked
  const visibleAchievements = achievements.filter(a => !a.isHidden || a.isUnlocked);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <header className="mb-8 flex items-center gap-4">
        <Link to="/" className="p-2 -ml-2 text-slate-400 hover:text-slate-600">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-500" />
            Logros
          </h1>
          <p className="text-slate-500 text-sm">Colecciona medallas por tus hazañas</p>
        </div>
      </header>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.gamesWon}</div>
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Victorias</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">{stats.perfectGames}</div>
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Perfectas</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">{streak}</div>
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Racha Días</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm text-center">
          <div className="text-2xl font-bold text-slate-900">
            {stats.fastestWin ? `${Math.floor(stats.fastestWin / 60)}:${(stats.fastestWin % 60).toString().padStart(2, '0')}` : '--'}
          </div>
          <div className="text-xs text-slate-500 uppercase font-bold tracking-wider">Mejor Tiempo</div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleAchievements.map((achievement) => (
          <div 
            key={achievement.id}
            className={clsx(
              "p-4 rounded-xl border flex items-center gap-4 transition-all",
              achievement.isUnlocked 
                ? "bg-white border-slate-200 shadow-sm" 
                : "bg-slate-50 border-slate-100 opacity-60 grayscale"
            )}
          >
            <div className={clsx("w-12 h-12 rounded-full flex items-center justify-center shrink-0", achievement.bg, achievement.color)}>
              {achievement.isUnlocked ? <achievement.icon className="w-6 h-6 fill-current" /> : <Lock className="w-6 h-6 text-slate-400" />}
            </div>
            <div>
              <h3 className={clsx("font-bold", achievement.isUnlocked ? "text-slate-900" : "text-slate-500")}>
                {achievement.title}
              </h3>
              <p className="text-sm text-slate-500">{achievement.description}</p>
            </div>
            {achievement.isUnlocked && (
              <div className="ml-auto">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Placeholder for locked hidden achievements to show there are more */}
        {achievements.filter(a => a.isHidden && !a.isUnlocked).length > 0 && (
          <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 opacity-60 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
              <Lock className="w-6 h-6 text-slate-400" />
            </div>
            <div>
              <h3 className="font-bold text-slate-500">???</h3>
              <p className="text-sm text-slate-500">Logro Oculto</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

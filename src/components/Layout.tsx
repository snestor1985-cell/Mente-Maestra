import { Link, Outlet, useLocation } from 'react-router-dom';
import { Home, Grid3X3, Printer, User, Trophy } from 'lucide-react';
import { clsx } from 'clsx';

export default function Layout() {
  const location = useLocation();

  const navItems = [
    { icon: Home, label: 'Inicio', path: '/' },
    { icon: Grid3X3, label: 'Jugar', path: '/sudoku' },
    { icon: Printer, label: 'Imprimir', path: '/print' },
    { icon: Trophy, label: 'Logros', path: '/achievements' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 md:pb-0 md:pl-20">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 safe-area-bottom">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              className={clsx(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-indigo-600" : "text-slate-400 hover:text-slate-600"
              )}
            >
              <item.icon className={clsx("w-6 h-6", isActive && "fill-current")} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Desktop Side Navigation */}
      <nav className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 bg-white border-r border-slate-200 flex-col items-center py-8 z-50">
        <div className="mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
            M
          </div>
        </div>
        
        <div className="flex flex-col gap-8 w-full">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link 
                key={item.path} 
                to={item.path}
                className={clsx(
                  "flex flex-col items-center gap-1 w-full py-2 border-l-4 transition-all",
                  isActive 
                    ? "border-indigo-600 text-indigo-600 bg-indigo-50" 
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                )}
              >
                <item.icon className={clsx("w-6 h-6", isActive && "fill-current")} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

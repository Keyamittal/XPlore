import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import logoImg from '../assets/new-logo.png';

export default function Sidebar() {
  const { user: currentUser, gold } = useGame();
  const xpPercent = Math.round((currentUser.xp / currentUser.xpToNext) * 100);

  return (
    <aside className="panel-border-pink w-full lg:w-[280px] flex flex-col p-5 shrink-0 lg:h-full">
      {/* Logo/Title */}
      <div className="text-center mb-6 flex justify-center">
        <img src={logoImg} alt="XPLore Game Logo" className="w-32 h-auto rounded-lg shadow-sm border-2 border-pastel-pink object-contain" />
      </div>

      {/* User Info Snippet */}
      <div className="panel-border-purple p-3 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-white border-2 border-pastel-purple rounded flex items-center justify-center font-pixel text-pastel-purple text-xl shadow-sm">
            {currentUser.initials}
          </div>
          <div>
            <div className="text-slate-800 font-bold tracking-wide">{currentUser.username} - LV {currentUser.level}</div>
            <div className="text-xs text-slate-500 font-pixel mt-1 text-[8px]">{currentUser?.title?.toUpperCase() || 'NOVICE'}</div>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="relative w-full h-4 bg-slate-100 rounded border-2 border-slate-200 overflow-hidden mb-1">
          <div className="absolute top-0 left-0 h-full bg-exp-gradient" style={{ width: `${xpPercent}%` }}></div>
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-800 z-10">
            EXP {currentUser.xp}/{currentUser.xpToNext}
          </div>
        </div>

        {/* Streak & Gold */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-2 text-sm font-bold text-orange-400">
            <img alt="Streak Fire" className="w-5 h-5" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCVlNEOVMOYrIweKDrbW6yQXs--k4gwYYxT8yaYaouJ0THYQtCC0HhihTrM2HF-kXSW-c1_EEYTurWeQYfA90j3SSyLs31LYokNay_34o9hMYPaXZSkKmpo9xntQvlaN9_cCGwKdheOiK9xTKF4RVYpVqHWp9lw7HacYRWPGNsQUm_hLpjKm74jRlS9C_T4AoJAabBLS0TupIGOKTQzQS3BPIk6NkoIkhaiyiVKGMKRK6_Xs50sFVIXRcD_tNh9JyW0_uz59E8DIl0" />
            <span>{currentUser.streak} DAYS</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shadow-sm text-amber-600 font-pixel text-[9px] font-bold">
            <span className="text-xs select-none">🪙</span>
            <span>{gold}G</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-pastel-pink border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🏠</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">HOME</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/quests" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-pastel-pink border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">📋</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">QUESTS</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/backpack" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-pastel-pink border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🎒</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">BACKPACK</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/skill-exchange" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-pastel-pink border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🪄</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">SKILLS</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/leaderboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-pastel-pink border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🏆</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">RANKS</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-pastel-pink border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">👤</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">PROFILE</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import logoImg from '../assets/new-logo.png';

export default function Sidebar() {
  const { user: currentUser, gold, activeTitle } = useGame();
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
            <div className="text-xs text-slate-500 font-pixel mt-1 text-[8px]">{activeTitle?.toUpperCase() || 'NOVICE'}</div>
          </div>
        </div>

        {/* EXP Bar */}
        <div className="relative w-full h-4 bg-slate-100 rounded border-2 border-slate-800 overflow-hidden mb-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.1)]">
          <div className="absolute top-0 left-0 h-full bg-exp-gradient min-w-[4px]" style={{ width: `${xpPercent}%` }}></div>
          <div className="absolute inset-0 flex items-center justify-center text-[7.5px] font-black text-slate-800 z-10 font-pixel select-none tracking-wider leading-none">
            EXP {currentUser.xp}/{currentUser.xpToNext}
          </div>
        </div>

        {/* Streak & Gold */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded shadow-sm text-orange-600 font-pixel text-[9px] font-bold transition-transform hover:scale-105 select-none">
            <span className="text-xs select-none">🔥</span>
            <span>{currentUser.streak} DAYS</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shadow-sm text-amber-600 font-pixel text-[9px] font-bold transition-transform hover:scale-105 select-none">
            <span className="text-xs select-none">🪙</span>
            <span>{gold}G</span>
          </div>
        </div>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1">
        <ul className="space-y-2">
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🏠</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">HOME</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/quests" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">📋</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">QUESTS</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/backpack" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🎒</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">BACKPACK</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/skill-exchange" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🪄</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">SKILLS</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/leaderboard" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🏆</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">RANKS</span>
            </NavLink>
          </li>
          <li>
            <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/profile" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
              <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">👤</span>
              <span className="font-semibold tracking-wider font-pixel text-[10px]">PROFILE</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
}

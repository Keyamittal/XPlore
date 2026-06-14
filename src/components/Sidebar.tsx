import { NavLink } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import logoImg from '../assets/new-logo.png';

export default function Sidebar() {
  const { user: currentUser, gold, activeTitle } = useGame();
  const xpPercent = Math.round((currentUser.xp / currentUser.xpToNext) * 100);

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="lg:hidden w-full bg-white border-4 border-slate-800 p-3 flex justify-between items-center z-30 shadow-[4px_4px_0px_rgba(0,0,0,0.1)] mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoImg} alt="XPLore Logo" className="h-8 w-auto object-contain" />
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded shadow-sm text-orange-600 font-pixel text-[8px] font-bold">
            <span>🔥</span>
            <span>{currentUser.streak}D</span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shadow-sm text-amber-600 font-pixel text-[8px] font-bold animate-[pulse_3s_infinite_ease-in-out]">
            <svg className="w-3.5 h-3.5 text-amber-500 fill-current select-none shrink-0" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="1.5" fill="#fbbf24" />
              <circle cx="12" cy="12" r="7" stroke="#d97706" strokeWidth="1" fill="#f59e0b" />
              <circle cx="12" cy="12" r="3" fill="#fef08a" />
            </svg>
            <span>{gold}G</span>
          </div>
          <div className="w-8 h-8 rounded-full border-2 border-slate-800 flex items-center justify-center bg-white shadow-[1px_1px_0px_rgba(0,0,0,0.15)] font-bold text-xs select-none">
            {currentUser.level}
          </div>
        </div>
      </header>

      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden lg:flex panel-border-pink w-[280px] flex-col p-5 shrink-0 lg:h-full">
        {/* Logo/Title */}
        <div className="text-center mb-6 flex justify-center">
          <img src={logoImg} alt="XPLore Game Logo" className="w-48 h-auto object-contain" />
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
            <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded shadow-sm text-amber-600 font-pixel text-[9px] font-bold transition-transform hover:scale-105 select-none animate-[pulse_3s_infinite_ease-in-out]">
              <svg className="w-3.5 h-3.5 text-amber-500 fill-current select-none shrink-0" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="1.5" fill="#fbbf24" />
                <circle cx="12" cy="12" r="7" stroke="#d97706" strokeWidth="1" fill="#f59e0b" />
                <circle cx="12" cy="12" r="3" fill="#fef08a" />
              </svg>
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
              <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/sanctuary" className={({ isActive }) => `flex items-center gap-3 px-3 py-2 transition-all transform hover:-translate-y-1 ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[4px_4px_0px_theme(colors.pastel-pink)]' : 'bg-white border-2 border-slate-800 text-slate-600 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]'}`}>
                <span className="w-5 h-5 flex items-center justify-center border-2 border-current rounded-sm opacity-70">🏕️</span>
                <span className="font-semibold tracking-wider font-pixel text-[10px]">SANCTUARY</span>
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

      {/* Mobile Sticky Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-4 border-slate-800 z-40 shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">🏠</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">HOME</span>
          </NavLink>
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/quests" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">📋</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">QUESTS</span>
          </NavLink>
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/backpack" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">🎒</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">ITEMS</span>
          </NavLink>
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/sanctuary" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">🏕️</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">ROOM</span>
          </NavLink>
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/skill-exchange" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">🪄</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">SKILLS</span>
          </NavLink>
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/leaderboard" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">🏆</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">RANKS</span>
          </NavLink>
          <NavLink onMouseEnter={() => playSound('hover')} onClick={() => playSound('click')} to="/profile" className={({ isActive }) => `flex flex-col items-center justify-center w-12 h-12 rounded transition-all ${isActive ? 'bg-[#FCE4EC] border-2 border-slate-800 text-slate-800 shadow-[2px_2px_0px_theme(colors.pastel-pink)]' : 'text-slate-600'}`}>
            <span className="text-lg">👤</span>
            <span className="text-[7px] font-pixel font-bold mt-0.5">PROFILE</span>
          </NavLink>
        </div>
      </nav>
    </>
  );
}


import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Quests from './pages/Quests';
import Backpack from './pages/Backpack';
import SkillExchange from './pages/SkillExchange';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Sanctuary from './pages/Sanctuary';
import { GameProvider, useGame } from './context/GameContext';
import AnimatedBackground from './components/AnimatedBackground';

function AppLayout() {
  const { 
    user, 
    showStreakMissed, 
    setShowStreakMissed, 
    streakMissedOldValue,
    showLevelUpModal,
    setShowLevelUpModal,
    levelUpNewValue
  } = useGame();

  if (!user) {
    return (
      <>
        <AnimatedBackground />
        <div className="min-h-screen w-full flex items-center justify-center relative z-10">
          <Routes>
            <Route path="*" element={<Login />} />
          </Routes>
        </div>
      </>
    );
  }

  // Logged in: show the cozy pastel app shell with sidebar
  return (
    <>
      <AnimatedBackground />

      {/* App Shell */}
      <div className="w-full min-h-screen max-w-[1400px] flex flex-col lg:flex-row gap-6 p-4 md:p-6 relative z-10 m-auto">
        <Sidebar />
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto lg:pr-2 pb-24 lg:pb-10 relative w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/backpack" element={<Backpack />} />
            <Route path="/sanctuary" element={<Sanctuary />} />
            <Route path="/skill-exchange" element={<SkillExchange />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* Redirect /login to / if already logged in */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Streak Missed Warning Modal (Stress Cat) */}
      {showStreakMissed && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-[fade-in_0.25s_ease-out]">
          <div className="p-8 bg-white border-4 border-slate-800 max-w-md w-full relative text-center shadow-[8px_8px_0px_rgba(0,0,0,0.15)] select-none">

            
            <h2 className="text-xl md:text-2xl font-pixel text-slate-800 tracking-wide mb-4 uppercase">
              OH NO, MEOWWW!
            </h2>
            
            {/* Stressed-out cat image */}
            <div className="my-6 flex justify-center border-4 border-slate-800 bg-slate-50 p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <img 
                src="/src/assets/stressed-cat.jpg" 
                alt="Stressed Out Cat" 
                className="w-48 h-auto max-h-48 object-contain"
              />
            </div>

            <p className="text-slate-600 font-medium text-xs leading-relaxed mb-6">
              You missed completing your daily quests yesterday! Our poor kitty is super stressed and meowing in despair. As a meow-nalty, she has deducted **100 XP points** from your progress and broken your **{streakMissedOldValue}-day streak**!
              <br />
              <span className="text-rose-500 font-bold font-pixel text-[9px] mt-4 block leading-normal bg-rose-50 border border-rose-200 py-1.5 px-3 rounded inline-block">
                STREAK RESET TO 1 & -100 XP PENALTY APPLIED!
              </span>
            </p>

            <button
              onClick={() => {
                setShowStreakMissed(false);
              }}
              className="w-full py-3 bg-[#cc6d78] hover:bg-[#b05d67] text-white border-4 border-slate-800 font-pixel text-[9px] font-bold uppercase tracking-wider shadow-[4px_4px_0px_#334155] active:translate-y-0.5 active:shadow-[2px_2px_0px_#334155] transition-all cursor-pointer text-center"
            >
              I promise to stay on track!
            </button>
          </div>
        </div>
      )}

      {/* Level Up Success Modal (Happy happy happy cat!) */}
      {showLevelUpModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-[fade-in_0.25s_ease-out]">
          <div className="p-8 bg-white border-4 border-slate-800 max-w-md w-full relative text-center shadow-[8px_8px_0px_rgba(0,0,0,0.15)] select-none">
            {/* Retro styled title */}
            <div className="text-emerald-500 font-pixel text-[10px] font-bold tracking-widest mb-3 uppercase animate-bounce">
              LEVEL UP!
            </div>
            
            <h2 className="text-xl md:text-2xl font-pixel text-slate-800 tracking-wide mb-4 uppercase">
              HAPPY HAPPY HAPPY!
            </h2>
            
            {/* Happy cat image */}
            <div className="my-6 flex justify-center border-4 border-slate-800 bg-slate-50 p-3 shadow-[4px_4px_0px_rgba(0,0,0,0.05)]">
              <img 
                src="/src/assets/happy-cat.jpg" 
                alt="Happy Happy Happy Cat" 
                className="w-48 h-auto max-h-48 object-contain"
              />
            </div>

            <p className="text-slate-600 font-medium text-xs leading-relaxed mb-6">
              Incredible job, meowww! You successfully completed your tasks and leveled up!
              <br />
              <span className="text-emerald-600 font-bold font-pixel text-[11px] mt-3 block leading-normal bg-emerald-50 border border-emerald-200 py-1.5 px-3 rounded inline-block">
                WELCOME TO LEVEL {levelUpNewValue}!
              </span>
            </p>

            <button
              onClick={() => {
                setShowLevelUpModal(false);
              }}
              className="w-full py-3 bg-[#81C784] hover:bg-[#6ab36e] text-slate-800 border-4 border-slate-800 font-pixel text-[9px] font-bold uppercase tracking-wider shadow-[4px_4px_0px_#334155] active:translate-y-0.5 active:shadow-[2px_2px_0px_#334155] transition-all cursor-pointer text-center"
            >
              Keep it up!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <GameProvider>
      <Router>
        <AppLayout />
      </Router>
    </GameProvider>
  );
}

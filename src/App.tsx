
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Quests from './pages/Quests';
import Backpack from './pages/Backpack';
import SkillExchange from './pages/SkillExchange';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { GameProvider, useGame } from './context/GameContext';
import AnimatedBackground from './components/AnimatedBackground';

function AppLayout() {
  const { user } = useGame();

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
        <main className="flex-1 flex flex-col gap-4 overflow-y-auto lg:pr-2 pb-10 relative w-full">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/quests" element={<Quests />} />
            <Route path="/backpack" element={<Backpack />} />
            <Route path="/skill-exchange" element={<SkillExchange />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/profile" element={<Profile />} />
            {/* Redirect /login to / if already logged in */}
            <Route path="/login" element={<Navigate to="/" replace />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
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

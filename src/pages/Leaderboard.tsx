import { useState } from 'react';
import { Zap, Flame, Shield } from 'lucide-react';
import { leaderboardUsers } from '../data/users';
import { useGame } from '../context/GameContext';

type TabType = 'weekly' | 'alltime';

export default function Leaderboard() {
  const { user: currentUser } = useGame();
  const [tab, setTab] = useState<TabType>('weekly');

  const actualLeaderboard = leaderboardUsers.map(u => u.id === currentUser.id ? { ...u, ...currentUser } : u);

  const sorted = [...actualLeaderboard].sort((a, b) => b.totalXP - a.totalXP);
  const myRank = sorted.findIndex(u => u.id === currentUser.id) + 1;
  const top3 = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  const podiumRanks = [2, 1, 3];

  // Tailwind heights for the podium blocks: 1st=tallest, 2nd=mid, 3rd=shortest.
  const podiumHeights = ['h-24', 'h-32', 'h-16'];
  const podiumColors = ['border-gray-400 text-slate-500', 'border-yellow-400 text-yellow-400', 'border-orange-500 text-orange-500'];
  const podiumBg = ['bg-gray-400', 'bg-yellow-400', 'bg-orange-500'];

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="text-pastel-cyan font-bold text-2xl font-pixel mb-3 drop-shadow-[0_0_8px_rgba(14,116,144,0.6)]">LEADERBOARD</h1>
          <p className="text-slate-500 text-sm">Rise through the ranks. Compete. Conquer.</p>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0 p-1 bg-white border border-slate-200 rounded-md">
          <button 
            className={`font-pixel text-[8px] px-6 py-2 transition-all rounded ${tab === 'weekly' ? 'bg-pastel-cyan text-slate-800 font-bold shadow-[0_0_10px_rgba(14,116,144,0.4)]' : 'text-slate-500 hover:text-slate-800'}`} 
            onClick={() => setTab('weekly')}
          >
            WEEKLY
          </button>
          <button 
            className={`font-pixel text-[8px] px-6 py-2 transition-all rounded ${tab === 'alltime' ? 'bg-pastel-cyan text-slate-800 font-bold shadow-[0_0_10px_rgba(14,116,144,0.4)]' : 'text-slate-500 hover:text-slate-800'}`} 
            onClick={() => setTab('alltime')}
          >
            ALL-TIME
          </button>
        </div>
      </div>

      {/* Podium */}
      <div className="panel-border-cyan pt-8 pb-0 px-6 shadow-[0_0_20px_rgba(14,116,144,0.2)_inset] flex flex-col items-center justify-end min-h-[350px] bg-white/40 relative overflow-hidden">
        <div className="absolute top-6">
          <p className="text-slate-500 font-pixel text-[10px] drop-shadow-md">— TOP PLAYERS —</p>
        </div>
        
        <div className="flex items-end justify-center w-full max-w-2xl mt-auto">
          {podiumOrder.map((user, i) => {
            const isFirst = podiumRanks[i] === 1;
            return (
              <div key={user.id} className="flex flex-col items-center flex-1 relative group">
                <div className={`flex flex-col items-center transition-transform duration-500 drop-shadow-2xl ${isFirst ? 'z-10 -translate-y-4' : 'z-0'}`}>
                  {isFirst && <span className="text-3xl animate-[bounce_2s_infinite] drop-shadow-[0_0_8px_yellow] mb-2 z-20 absolute -top-12">👑</span>}
                  
                  <div className={`relative flex items-center justify-center font-pixel font-bold bg-white z-10 border-4 ${podiumColors[i]} ${isFirst ? 'w-20 h-20 text-lg shadow-[0_0_15px_yellow]' : 'w-16 h-16 text-sm mb-2 shadow-lg'}`}>
                    {user.initials}
                  </div>
                  
                  <p className={`font-bold mt-3 text-slate-800 truncate max-w-[100px] ${isFirst ? 'text-lg drop-shadow-[0_0_5px_currentColor] ' + podiumColors[i] : 'text-sm'}`}>{user.username}</p>
                  <p className="text-pastel-cyan font-pixel text-[8px] my-2 flex items-center gap-1 drop-shadow-md"><Zap size={10} /> {user.totalXP.toLocaleString()}</p>
                </div>
                
                <div className={`w-full ${podiumHeights[i]} border-t-4 border-l-4 border-r-4 ${podiumColors[i]} bg-white/80 flex items-start justify-center pt-4 relative overflow-hidden group-hover:bg-pastel-yellow transition-colors`}>
                  <div className={`absolute top-0 left-0 w-full h-1 ${podiumBg[i]} opacity-20`} />
                  <span className={`font-pixel text-xl drop-shadow-md ${podiumColors[i]}`}>{podiumRanks[i]}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="flex flex-col gap-2 mt-4">
        <div className="flex items-center px-4 py-2 font-pixel text-[8px] text-slate-500 border-b border-slate-200/50">
          <span className="w-12 text-center">RANK</span>
          <span className="flex-1 ml-4">PLAYER</span>
          <span className="w-24 text-center hidden md:block">LEVEL</span>
          <span className="w-24 text-center hidden md:block">STREAK</span>
          <span className="w-24 text-right">XP</span>
        </div>
        
        {rest.map((user, idx) => {
          const rank = idx + 4;
          const isMe = user.id === currentUser.id;
          return (
            <div
              key={user.id}
              className={`flex items-center px-4 py-3 border transition-all duration-200 rounded ${
                isMe 
                  ? 'bg-pastel-pink/10 border-pastel-pink shadow-[0_0_10px_rgba(255,0,255,0.2)_inset]' 
                  : 'bg-white border-slate-200 hover:bg-pastel-yellow hover:border-slate-300 hover:-translate-y-0.5'
              }`}
            >
              <span className={`w-12 text-center font-pixel text-[10px] ${isMe ? 'text-pastel-pink drop-shadow-[0_0_5px_#ff00ff]' : 'text-slate-500'}`}>
                {isMe && <span className="mr-1">▶</span>}
                {rank}
              </span>
              
              <div className="flex-1 ml-4 flex items-center gap-3 md:gap-4">
                <div className={`w-10 h-10 border-2 rounded flex items-center justify-center font-pixel text-[8px] ${isMe ? 'border-pastel-pink text-slate-800 shadow-[0_0_5px_#ff00ff]' : 'border-slate-300 text-slate-500 bg-white'}`}>
                  {user.initials}
                </div>
                <div className="flex flex-col">
                  <p className={`font-bold text-sm md:text-base ${isMe ? 'text-slate-800 drop-shadow-[0_0_2px_#ff00ff]' : 'text-slate-800'}`}>
                    {user.username}
                    {isMe && <span className="ml-2 bg-pastel-pink text-slate-800 font-pixel text-[6px] px-1.5 py-0.5 rounded align-middle">YOU</span>}
                  </p>
                  <p className="text-pastel-cyan text-xs font-pixel text-[7px] mt-1">{user.title}</p>
                </div>
              </div>
              
              <span className="w-24 text-center text-slate-500 text-sm hidden md:flex items-center justify-center gap-1"><Shield size={12} className="text-slate-500" /> Lv.{user.level}</span>
              <span className="w-24 text-center text-slate-500 text-sm hidden md:flex items-center justify-center gap-1"><Flame size={12} className="text-orange-500" /> {user.streak}d</span>
              <span className="w-24 text-right font-bold text-slate-800 flex items-center justify-end gap-1"><Zap size={12} className="text-yellow-400" /> {user.totalXP.toLocaleString()}</span>
            </div>
          );
        })}
      </div>

      {/* Your Rank Bar */}
      <div className="panel-border-pink p-5 mt-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-[0_0_20px_#ff00ff_inset] bg-white border-2">
        <div className="flex items-center gap-3">
          <span className="font-pixel text-[8px] text-pastel-pink bg-black/50 px-2 py-1 rounded border border-pastel-pink shadow-[0_0_5px_#ff00ff]">YOUR RANK</span>
          <span className="font-bold text-2xl text-slate-800 drop-shadow-[0_0_8px_#ff00ff]">#{myRank}</span>
        </div>
        
        <div className="flex items-center gap-6 border border-slate-200 bg-white px-6 py-2 rounded-lg">
          <span className="flex items-center gap-1.5 text-slate-600 font-bold text-sm"><Shield size={14} className="text-pastel-cyan" /> Lv.{currentUser.level}</span>
          <span className="w-px h-4 bg-gray-700" />
          <span className="flex items-center gap-1.5 text-slate-600 font-bold text-sm"><Flame size={14} className="text-orange-500" /> {currentUser.streak}d</span>
          <span className="w-px h-4 bg-gray-700" />
          <span className="flex items-center gap-1.5 text-pastel-pink font-bold text-sm"><Zap size={14} className="text-yellow-400" /> {currentUser.totalXP.toLocaleString()} XP</span>
        </div>
        
        <span className="font-pixel text-[10px] text-pastel-cyan drop-shadow-[0_0_5px_rgba(14,116,144,0.6)] hidden md:block">» {currentUser.title.toUpperCase()} «</span>
      </div>
    </div>
  );
}

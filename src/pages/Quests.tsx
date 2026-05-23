import { useState, useEffect } from 'react';
import { Zap, Clock, CheckCircle } from 'lucide-react';
import type { QuestCategory } from '../data/quests';
import { useGame } from '../context/GameContext';

const categories: QuestCategory[] = ['Academic', 'Wellness', 'Productivity'];
const categoryIcons: Record<QuestCategory, string> = {
  Academic: '🎓',
  Wellness: '💚',
  Productivity: '⚡',
};
const difficultyStars = ['', '★☆☆', '★★☆', '★★★'];
const difficultyColors = ['', '#4ade80', '#fbbf24', '#ff00ff']; // green, gold, pastel-pink

export default function Quests() {
  const { quests, completeQuest } = useGame();
  const [popups, setPopups] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<QuestCategory | 'ALL'>('ALL');
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [timePercent, setTimePercent] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();
      
      const hours = Math.floor(diff / (1000 * 60 * 60)).toString().padStart(2, '0');
      const minutes = Math.floor((diff / (1000 * 60)) % 60).toString().padStart(2, '0');
      const seconds = Math.floor((diff / 1000) % 60).toString().padStart(2, '0');
      
      setTimeLeft(`${hours}:${minutes}:${seconds}`);
      setTimePercent((diff / (24 * 60 * 60 * 1000)) * 100);
    };
    
    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const completed = quests.filter(q => q.completed).length;
  const totalXP = quests.filter(q => q.completed).reduce((s, q) => s + q.xpReward, 0);

  const handleComplete = async (id: string) => {
    await completeQuest(id);
    setPopups(p => ({ ...p, [id]: true }));
    setTimeout(() => setPopups(p => ({ ...p, [id]: false })), 1500);
  };

  const filtered = filter === 'ALL' ? quests : quests.filter(q => q.category === filter);

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="text-pastel-cyan font-bold text-2xl font-pixel mb-3 drop-shadow-[0_0_8px_rgba(14,116,144,0.6)]">QUEST BOARD</h1>
          <p className="text-slate-500 text-sm">Complete daily missions to earn XP and power up.</p>
        </div>
        <div className="flex bg-slate-50 border border-pastel-cyan px-6 py-3 rounded-lg gap-6 shadow-sm">
          <div className="flex flex-col items-center">
            <span className="text-slate-500 font-pixel text-[10px] block mb-1">DONE</span>
            <span className="text-slate-800 font-bold text-xl">{completed}/{quests.length}</span>
          </div>
          <div className="w-px bg-gray-700" />
          <div className="flex flex-col items-center">
            <span className="text-pastel-pink font-pixel text-[10px] block mb-1">XP EARNED</span>
            <span className={`${
              totalXP === 0 
                ? 'text-pastel-purple' 
                : 'text-pastel-pink drop-shadow-[0_0_5px_#ff00ff]'
            } font-bold text-xl`}>
              +{totalXP}
            </span>
          </div>
        </div>
      </div>

      {/* Reset Timer */}
      <div className="panel-border-purple p-4 flex flex-col md:flex-row justify-center items-center gap-4 font-bold tracking-wider rounded-lg shadow-[0_0_15px_rgba(176,38,255,0.4)_inset]">
        <div className="flex items-center gap-3">
          <span className="text-pastel-purple animate-pulse text-xl">⏱</span>
          <span className="text-slate-600 font-pixel text-[10px]">DAILY RESET IN:</span>
          <span className="text-pastel-cyan font-bold font-pixel text-sm">{timeLeft}</span>
        </div>
        <div className="flex-1 w-full max-w-md flex items-center ml-0 md:ml-4">
          <div className="w-full h-3 bg-slate-50 border border-slate-300 rounded-full overflow-hidden">
            <div className="h-full bg-pastel-purple shadow-[0_0_10px_#B07EEC] transition-all duration-1000" style={{ width: `${timePercent}%` }} />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 mb-2">
        {(['ALL', ...categories] as const).map(cat => (
          <button
            key={cat}
            className={`font-pixel text-[10px] px-4 py-2 rounded-md border transition-all duration-200 ${
              filter === cat 
                ? 'bg-pastel-cyan/20 border-pastel-cyan text-pastel-cyan shadow-[0_0_8px_rgba(14,116,144,0.35)_inset] -translate-y-0.5' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-gray-500'
            }`}
            onClick={() => setFilter(cat)}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Categories */}
      <div className="flex flex-col gap-8">
        {categories.filter(c => filter === 'ALL' || filter === c).map(category => {
          const catQuests = filtered.filter(q => q.category === category);
          if (!catQuests.length) return null;
          const done = catQuests.filter(q => q.completed).length;

          return (
            <div key={category} className="flex flex-col gap-4">
              <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
                <span className="text-xl">{categoryIcons[category]}</span>
                <span className="font-pixel text-sm text-slate-800 tracking-widest">{category.toUpperCase()}</span>
                <div className="ml-auto flex items-center gap-3">
                  <div className="w-24 border border-slate-200 h-2.5 bg-slate-50 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full bg-pastel-cyan transition-all duration-500" style={{ width: `${(done / catQuests.length) * 100}%` }} />
                  </div>
                  <span className="font-pixel text-[10px] text-slate-500">{done}/{catQuests.length}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {catQuests.map(quest => (
                  <div
                    key={quest.id}
                    className={`panel-border-cyan p-5 flex flex-col gap-3 transition-all duration-300 ${
                      quest.completed 
                        ? 'opacity-50 grayscale border-slate-300 shadow-none bg-slate-50/50' 
                        : 'hover:-translate-y-1 hover:border-pastel-pink hover:shadow-[0_0_20px_rgba(255,0,255,0.4)_inset] cursor-pointer'
                    }`}
                    style={{ position: 'relative' }}
                  >
                    {popups[quest.id] && (
                      <div className="absolute -top-4 -right-4 font-pixel text-[10px] bg-pastel-pink text-slate-800 px-3 py-1 rounded shadow-[0_0_10px_#ff00ff] animate-[bounce_0.5s_ease-out] z-10">
                        +{quest.xpReward} XP!
                      </div>
                    )}

                    <div className="flex justify-between items-start mb-1">
                      <span className="text-3xl drop-shadow-md">{quest.icon}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs tracking-wider" style={{ color: difficultyColors[quest.difficulty] }}>
                          {difficultyStars[quest.difficulty]}
                        </span>
                        <span className="bg-pastel-cyan/10 border border-pastel-cyan text-pastel-cyan font-pixel text-[8px] px-2 py-1 rounded-sm flex items-center gap-1">
                          <Zap size={8} className="text-pastel-cyan" /> {quest.xpReward}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">{quest.title}</h3>
                    <p className="text-sm text-slate-500 flex-1 leading-snug">{quest.description}</p>

                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-slate-200/50">
                      <span className="flex items-center gap-1 font-pixel text-[8px] text-pastel-purple"><Clock size={11} /> DAILY</span>
                      {quest.completed
                        ? <span className="flex items-center gap-1 font-pixel text-[8px] text-green-400 bg-green-400/10 border border-green-400 px-2 py-1 rounded shadow-[0_0_5px_#4ade80]"><CheckCircle size={10} /> CLEAR!</span>
                        : <button 
                            className="bg-white hover:bg-pastel-pink text-slate-600 hover:text-slate-800 border border-gray-500 hover:border-pastel-pink font-pixel text-[8px] px-3 py-1.5 rounded transition-colors shadow-[0_0_5px_rgba(255,0,255,0)] hover:shadow-[0_0_10px_#ff00ff]"
                            onClick={() => handleComplete(quest.id)}
                          >
                            COMPLETE
                          </button>
                      }
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

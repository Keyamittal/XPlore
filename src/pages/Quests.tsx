import { useState, useEffect, useRef } from 'react';
import { Zap, Clock, CheckCircle } from 'lucide-react';
import type { QuestCategory } from '../data/quests';
import { useGame } from '../context/GameContext';

const categories: QuestCategory[] = ['Academic', 'Wellness', 'Productivity'];
const difficultyStars = ['', '★☆☆', '★★☆', '★★★'];
const difficultyColors = ['', '#4ade80', '#fbbf24', '#ff00ff']; // green, gold, pastel-pink

export default function Quests() {
  const { quests, completeQuest } = useGame();
  const [popups, setPopups] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<QuestCategory | 'ALL'>('ALL');
  const [timeLeft, setTimeLeft] = useState<string>('00:00:00');
  const [timePercent, setTimePercent] = useState<number>(0);

  const [verifyingQuest, setVerifyingQuest] = useState<any | null>(null);
  const [proofText, setProofText] = useState<string>('');
  const [proofImageName, setProofImageName] = useState<string>('');
  const [viewingProofQuest, setViewingProofQuest] = useState<any | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  const handleStartComplete = (quest: any) => {
    setVerifyingQuest(quest);
    setProofText('');
    setProofImageName('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImageName(reader.result as string); // Save Base64 string directly
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmComplete = async () => {
    if (!verifyingQuest) return;
    const id = verifyingQuest.id;
    await completeQuest(id, proofText || 'Quest marked completed by adventurer.', proofImageName || undefined);
    setPopups(p => ({ ...p, [id]: true }));
    setVerifyingQuest(null);
    setTimeout(() => setPopups(p => ({ ...p, [id]: false })), 1500);
  };

  const filtered = filter === 'ALL' ? quests : quests.filter(q => q.category === filter);

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="text-pastel-cyan font-bold text-2xl font-pixel mb-3 drop-shadow-[0_0_6px_rgba(14,116,144,0.25)]">QUEST BOARD</h1>
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
                : 'text-pastel-pink'
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
                        ? <div className="flex gap-2 items-center">
                            <span className="flex items-center gap-1 font-pixel text-[8px] text-green-400 bg-green-400/10 border border-green-400 px-2 py-1 rounded shadow-[0_0_5px_#4ade80]"><CheckCircle size={10} /> CLEAR!</span>
                            <button
                              onClick={() => setViewingProofQuest(quest)}
                              className="font-pixel text-[8px] text-slate-400 hover:text-slate-200 bg-slate-800 border border-slate-700 px-2 py-1 rounded transition-colors"
                            >
                              📄 PROOF
                            </button>
                          </div>
                        : <button 
                            className="bg-white hover:bg-pastel-pink text-slate-600 hover:text-slate-800 border border-gray-500 hover:border-pastel-pink font-pixel text-[8px] px-3 py-1.5 rounded transition-colors shadow-[0_0_5px_rgba(255,0,255,0)] hover:shadow-[0_0_10px_#ff00ff]"
                            onClick={() => handleStartComplete(quest)}
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

      {/* Verification Proof Modal */}
      {verifyingQuest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-[fade-in_0.2s_ease-out]">
          <div className="bg-[#faf7f2] border-4 border-slate-800 p-6 max-w-md w-full shadow-[8px_8px_0px_rgba(0,0,0,0.3)] relative">
            <h3 className="font-pixel text-[10px] font-bold uppercase mb-2 text-[#cc6d78] tracking-widest">
              Quest Evidence Submission
            </h3>
            <h2 className="text-xl font-extrabold text-slate-800 mb-2 leading-tight tracking-tight font-sans">
              {verifyingQuest.title}
            </h2>
            <p className="text-slate-500 text-xs leading-relaxed mb-4 font-sans font-medium">
              {verifyingQuest.description}
            </p>

            <div className="h-[2px] bg-slate-200 w-full mb-4" />

            <label className="block text-slate-700 font-pixel text-[8px] uppercase tracking-wider mb-2">
              Provide reflection / learnings proof:
            </label>
            <textarea
              required
              rows={3}
              value={proofText}
              onChange={(e) => setProofText(e.target.value)}
              placeholder="Describe what you did to complete this quest..."
              className="w-full p-3 bg-white border-2 border-slate-800 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-pastel-pink/55 rounded-lg mb-4 font-sans font-medium leading-relaxed"
            />

            <label className="block text-slate-700 font-pixel text-[8px] uppercase tracking-wider mb-2">
              Attach image / document evidence (optional):
            </label>
            <input 
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed p-4 text-center cursor-pointer transition-all rounded-lg ${
                proofImageName 
                  ? 'bg-emerald-50/70 border-emerald-500 text-emerald-800' 
                  : 'bg-slate-50 border-slate-300 text-slate-500 hover:bg-slate-100/80 hover:border-slate-850'
              }`}
            >
              {proofImageName ? (
                <>
                  <span className="text-2xl block mb-1">✔️</span>
                  <span className="text-xs font-bold font-sans block text-emerald-700">
                    Evidence Image Selected!
                  </span>
                  <span className="text-[9px] font-sans font-semibold text-emerald-600 mt-1 block">
                    (Click again to replace file)
                  </span>
                </>
              ) : (
                <>
                  <span className="text-2xl block mb-1">📷</span>
                  <span className="text-xs font-bold font-sans block text-slate-600">
                    Upload Photo or Screenshot Proof
                  </span>
                  <span className="text-[9px] font-sans font-semibold text-slate-400 mt-1 block">
                    (Supports PNG, JPG, or GIF up to 2MB)
                  </span>
                </>
              )}
            </div>

            <div className="h-[2px] bg-slate-200 w-full my-4" />

            <div className="flex gap-4">
              <button
                onClick={() => setVerifyingQuest(null)}
                className="flex-1 py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold bg-white text-slate-700 hover:bg-slate-100 shadow-[2px_2px_0px_#1e293b] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1e293b] transition-all cursor-pointer text-center"
              >
                CANCEL
              </button>
              <button
                disabled={proofText.trim().length < 10}
                onClick={handleConfirmComplete}
                className={`flex-1 py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold shadow-[2px_2px_0px_#1e293b] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1e293b] transition-all cursor-pointer text-center ${
                  proofText.trim().length < 10
                    ? 'bg-slate-100 text-slate-400 border-slate-300 shadow-none cursor-not-allowed'
                    : 'bg-[#cc6d78] text-white hover:bg-[#f0dccf] hover:text-slate-800'
                }`}
              >
                SUBMIT EVIDENCE
              </button>
            </div>
            {proofText.trim().length < 10 && (
              <span className="text-[9px] text-rose-500 font-pixel tracking-wider text-center mt-3 block animate-pulse">
                * Proof text must be at least 10 characters long.
              </span>
            )}
          </div>
        </div>
      )}

      {/* View Quest Evidence Modal */}
      {viewingProofQuest && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans animate-[fade-in_0.2s_ease-out]">
          <div className="bg-[#faf7f2] border-4 border-slate-800 p-6 max-w-md w-full shadow-[8px_8px_0px_rgba(0,0,0,0.3)] relative">
            <h3 className="font-pixel text-[10px] font-bold uppercase mb-2 text-[#cc6d78] tracking-widest">
              Quest Evidence Log
            </h3>
            <h2 className="text-xl font-extrabold text-slate-800 mb-1 leading-tight tracking-tight font-sans">
              {viewingProofQuest.title}
            </h2>
            <div className="flex items-center gap-1.5 mb-4">
              <span className="bg-emerald-50 border border-emerald-400 text-emerald-800 font-pixel text-[8px] px-2 py-0.5 rounded shadow-[0_0_5px_#4ade80]">
                ✔️ CLEAR
              </span>
              <span className="text-slate-400 text-xs font-pixel text-[8px]">
                ({viewingProofQuest.category})
              </span>
            </div>

            <div className="h-[2px] bg-slate-200 w-full mb-4" />

            <div className="bg-white border-2 border-slate-800 p-4 mb-4 rounded-lg shadow-inner">
              <span className="block text-slate-400 font-pixel text-[8px] uppercase tracking-wider mb-1">
                Reflection & Learnings Description:
              </span>
              <p className="text-slate-700 text-xs leading-relaxed italic select-text font-sans font-medium">
                "{viewingProofQuest.proofText || 'Quest marked completed by adventurer.'}"
              </p>
            </div>

            {viewingProofQuest.proofImage && (
              <div className="bg-emerald-50/50 border-2 border-emerald-500 p-3 mb-4 flex flex-col items-center rounded-lg gap-2.5">
                <div className="flex items-center gap-2 w-full">
                  <span className="text-xl">📷</span>
                  <div>
                    <span className="block text-emerald-850 text-xs font-pixel text-[8.5px] font-bold">
                      IMAGE EVIDENCE ATTACHED
                    </span>
                  </div>
                </div>
                <img 
                  src={viewingProofQuest.proofImage} 
                  alt="Evidence Attachment" 
                  className="w-full max-h-48 object-contain border border-slate-300 rounded shadow-sm bg-white"
                />
              </div>
            )}

            <div className="h-[2px] bg-slate-200 w-full my-4" />

            <button
              onClick={() => setViewingProofQuest(null)}
              className="w-full py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold bg-[#cc6d78] text-white hover:bg-[#f0dccf] hover:text-slate-800 shadow-[2px_2px_0px_#1e293b] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1e293b] transition-all cursor-pointer text-center"
            >
              CLOSE EVIDENCE LOG
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

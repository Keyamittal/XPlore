import { useState } from 'react';
import { Zap, Clock, Plus, X } from 'lucide-react';
import { useGame } from '../context/GameContext';

export type SkillOfferType = 'offer' | 'request';

export interface SkillOffer {
  id: string;
  type: SkillOfferType;
  skill: string;
  description: string;
  tags: string[];
  postedBy: string;
  initials: string;
  duration: string;
  bonusXp: number;
  accepted: boolean;
}

const initialSkills: SkillOffer[] = [
  { id: 'sk1', type: 'offer', skill: 'Python Basics', description: 'I can teach you Python fundamentals.', tags: ['Code', 'Beginner'], postedBy: 'Sana T.', initials: 'ST', duration: '1 hr', bonusXp: 10, accepted: false },
  { id: 'sk2', type: 'request', skill: 'React Hook Mastery', description: 'Need help understanding complex Hooks.', tags: ['React', 'Frontend'], postedBy: 'Karan B.', initials: 'KB', duration: '30 min', bonusXp: 10, accepted: false },
  { id: 'sk3', type: 'offer', skill: 'Vector Math Tutors', description: 'Explaining matrices and dot products.', tags: ['Math', 'Advanced'], postedBy: 'Dev P.', initials: 'DP', duration: '45 min', bonusXp: 10, accepted: false },
];

export default function SkillExchange() {
  const { addXpDirectly } = useGame();
  const [quests, setQuests] = useState<SkillOffer[]>(initialSkills);
  const [filter, setFilter] = useState<SkillOfferType | 'all'>('all');
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  const handleAccept = async (id: string, bonusXp: number) => {
    await addXpDirectly(bonusXp);
    setQuests(p => p.map(q => q.id === id ? { ...q, accepted: true } : q));
    setAccepted(p => ({ ...p, [id]: true }));
    setTimeout(() => setAccepted(p => ({ ...p, [id]: false })), 2000);
  };

  const filtered = filter === 'all' ? quests : quests.filter(q => q.type === filter);
  const offers = quests.filter(q => q.type === 'offer').length;
  const requests = quests.filter(q => q.type === 'request').length;

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="text-pastel-cyan font-bold text-2xl font-pixel mb-3 drop-shadow-[0_0_8px_rgba(14,116,144,0.6)]">SKILL EXCHANGE</h1>
          <p className="text-slate-500 text-sm">Teach what you know. Learn what you don't. Earn bonus XP.</p>
        </div>
        <button 
          className="mt-4 md:mt-0 font-pixel text-[10px] px-5 py-3 bg-pastel-cyan text-slate-800 border border-pastel-cyan hover:bg-transparent hover:text-pastel-cyan font-bold rounded shadow-[0_0_15px_rgba(14,116,144,0.4)] hover:shadow-[0_0_20px_rgba(14,116,144,0.25)_inset] transition-all flex items-center gap-2"
          onClick={() => setShowModal(true)}
        >
          <Plus size={14} /> POST SKILL
        </button>
      </div>

      {/* Stats Panel */}
      <div className="panel-border-cyan p-6 flex flex-col md:flex-row justify-around items-center gap-6 bg-white/40">
        <div className="flex flex-col items-center">
          <span className="font-pixel text-2xl text-slate-800 drop-shadow-md mb-1">{offers}</span>
          <span className="font-pixel text-[8px] text-slate-500">SKILLS OFFERED</span>
        </div>
        <div className="hidden md:block w-px h-12 bg-gray-700" />
        <div className="flex flex-col items-center">
          <span className="font-pixel text-2xl text-slate-800 drop-shadow-md mb-1">{requests}</span>
          <span className="font-pixel text-[8px] text-slate-500">SKILLS WANTED</span>
        </div>
        <div className="hidden md:block w-px h-12 bg-gray-700" />
        <div className="flex flex-col items-center">
          <span className="font-pixel text-2xl text-pastel-pink drop-shadow-[0_0_8px_#ff00ff] mb-1">+220</span>
          <span className="font-pixel text-[8px] text-slate-500">MAX BONUS XP</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        {(['all', 'offer', 'request'] as const).map(f => (
          <button
            key={f}
            className={`font-pixel text-[10px] px-5 py-2.5 rounded border transition-all duration-200 ${
              filter === f 
                ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink shadow-[0_0_8px_#ff00ff_inset] -translate-y-0.5' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-gray-500'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'ALL' : f === 'offer' ? 'OFFERS' : 'REQUESTS'}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(q => (
          <div
            key={q.id}
            className={`p-5 flex flex-col gap-3 transition-all duration-300 relative ${
              q.type === 'offer' ? 'panel-border-cyan' : 'panel-border-pink'
            } ${q.accepted ? 'opacity-50 grayscale bg-white/80 shadow-none' : 'hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)_inset]'}`}
          >
            {accepted[q.id] && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 z-10 rounded-lg">
                <div className="font-pixel text-xs bg-pastel-cyan text-slate-800 px-4 py-2 rounded shadow-[0_0_15px_rgba(14,116,144,0.5)] animate-[bounce_0.5s_ease-out]">
                  +{q.bonusXp} XP! MATCHED!
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-2 border-b border-slate-200/50 pb-3">
              <span className={`font-pixel text-[8px] px-2 py-1 rounded bg-black/50 border ${q.type === 'offer' ? 'text-pastel-cyan border-pastel-cyan' : 'text-pastel-pink border-pastel-pink'}`}>
                {q.type === 'offer' ? '▲ OFFER' : '▼ REQUEST'}
              </span>
              <span className="bg-yellow-400/20 border border-yellow-400 text-yellow-500 font-pixel text-[8px] px-2 py-1 rounded flex items-center gap-1 shadow-[0_0_5px_rgba(250,204,21,0.5)]">
                <Zap size={8} /> +{q.bonusXp} XP
              </span>
            </div>

            <h3 className="font-bold text-lg text-slate-800 mb-1 leading-tight">{q.skill}</h3>
            <p className="text-sm text-slate-500 flex-1 leading-relaxed">{q.description}</p>

            <div className="flex flex-wrap gap-2 mt-2">
              {q.tags.map(t => (
                <span key={t} className="bg-white border border-slate-300 text-slate-600 font-pixel text-[7px] px-2 py-1 rounded-sm">
                  {t.toUpperCase()}
                </span>
              ))}
            </div>

            <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-white border border-slate-300 flex items-center justify-center font-pixel text-[8px] text-slate-800">
                  {q.initials}
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-bold leading-tight">{q.postedBy}</p>
                  <p className="text-pastel-cyan font-pixel text-[7px] flex items-center gap-1 mt-1"><Clock size={8} /> {q.duration}</p>
                </div>
              </div>
              
              {q.accepted
                ? <span className="font-pixel text-[8px] text-slate-500 border border-slate-300 px-2 py-1 rounded">✓ MATCHED</span>
                : <button
                    className={`font-pixel text-[8px] px-3 py-2 rounded transition-all border ${
                      q.type === 'offer' 
                        ? 'bg-pastel-cyan/10 border-pastel-cyan text-pastel-cyan hover:bg-pastel-cyan hover:text-slate-800 hover:shadow-[0_0_10px_rgba(14,116,144,0.4)]' 
                        : 'bg-pastel-pink/10 border-pastel-pink text-pastel-pink hover:bg-pastel-pink hover:text-slate-800 hover:shadow-[0_0_10px_#ff00ff]'
                    }`}
                    onClick={() => handleAccept(q.id, q.bonusXp)}
                  >
                    ACCEPT →
                  </button>
              }
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]" onClick={() => setShowModal(false)}>
          <div 
            className="panel-border-cyan bg-white p-8 w-full max-w-md shadow-[0_0_30px_rgba(14,116,144,0.2)_inset] rounded-xl relative" 
            onClick={e => e.stopPropagation()}
            role="dialog" 
            aria-modal="true"
          >
            <div className="flex justify-between items-center mb-6 border-b border-pastel-cyan/50 pb-4">
              <h2 className="font-pixel text-sm text-pastel-cyan">POST A SKILL</h2>
              <button 
                className="text-slate-500 hover:text-slate-800 hover:bg-pastel-yellow p-1 rounded transition-colors" 
                onClick={() => setShowModal(false)} 
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>
            
            <form className="flex flex-col gap-4" onSubmit={e => { e.preventDefault(); setShowModal(false); }}>
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-type">I WANT TO...</label>
                <select id="skill-type" className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" required>
                  <option value="offer">Offer a skill (Teach)</option>
                  <option value="request">Request a skill (Learn)</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-name-input">SKILL NAME</label>
                <input id="skill-name-input" className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" type="text" placeholder="e.g., Python Basics..." required />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-desc-input">DESCRIPTION</label>
                <textarea id="skill-desc-input" className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" rows={3} placeholder="What will you teach or learn?" required />
              </div>
              
              <div className="flex gap-4 w-full">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-dur">DURATION</label>
                  <input id="skill-dur" className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" type="text" placeholder="e.g., 1 hr" />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-tags-input">TAGS</label>
                  <input id="skill-tags-input" className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" type="text" placeholder="Coding, Beginner..." />
                </div>
              </div>
              
              <button id="submit-skill-btn" type="submit" className="mt-6 font-pixel text-[10px] w-full flex items-center justify-center gap-2 bg-pastel-cyan text-slate-800 p-3 rounded font-bold hover:bg-pastel-yellow hover:shadow-[0_0_20px_rgba(14,116,144,0.5)] transition-all">
                <Zap size={14} /> POST SIDE QUEST
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

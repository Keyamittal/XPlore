import { useState, useEffect } from 'react';
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
  email?: string;
  phone?: string;
  userId?: string;
  acceptedBy?: string;
  acceptedByUsername?: string;
  acceptedByEmail?: string;
  acceptedByPhone?: string;
}

export interface ScheduledSession {
  id: string;
  skillId: string;
  skillName: string;
  partnerName: string;
  date: string;
  time: string;
  venue: string;
}



export default function SkillExchange() {
  const { addXpDirectly, user: currentUser } = useGame();
  
  const [dailySkills, setDailySkills] = useState<SkillOffer[]>([]);
  const [userSkills, setUserSkills] = useState<SkillOffer[]>([]);
  const [filter, setFilter] = useState<SkillOfferType | 'all' | 'matched'>('all');
  const [showModal, setShowModal] = useState(false);
  const [accepted, setAccepted] = useState<Record<string, boolean>>({});

  // Matching accept prompt states
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [questToAccept, setQuestToAccept] = useState<SkillOffer | null>(null);
  const [acceptorEmail, setAcceptorEmail] = useState('');
  const [acceptorPhone, setAcceptorPhone] = useState('');
  
  // Form states
  const [skillType, setSkillType] = useState<SkillOfferType>('offer');
  const [skillName, setSkillName] = useState('');
  const [skillDesc, setSkillDesc] = useState('');
  const [skillDur, setSkillDur] = useState('1 hr');
  const [skillTags, setSkillTags] = useState('');
  const [skillEmail, setSkillEmail] = useState('');
  const [skillPhone, setSkillPhone] = useState('');

  // Scheduling states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedQuestForSchedule, setSelectedQuestForSchedule] = useState<SkillOffer | null>(null);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [scheduleVenue, setScheduleVenue] = useState('Virtual Discord Server');
  const [scheduledSessions, setScheduledSessions] = useState<ScheduledSession[]>([]);
  const [allSessions, setAllSessions] = useState<ScheduledSession[]>([]);
  const [scheduleSuccess, setScheduleSuccess] = useState<string | null>(null);

  // Core Sync Function connecting directly to the SQLite shared backend
  const fetchSkillsAndSessions = async () => {
    if (!currentUser?.id) return;
    try {
      // 1. Fetch skills from database
      const skillsRes = await fetch('http://localhost:3000/api/skills');
      const skillsData = await skillsRes.json();
      if (!skillsRes.ok) throw new Error(skillsData.error || 'Failed to load skills');

      const allSkills: SkillOffer[] = skillsData.skills;

      // 2. Separate system presets (user_id IS NULL) and user-posted skills (user_id IS NOT NULL)
      const systemPresets = allSkills.filter(s => !(s as any).user_id);
      const userPosted = allSkills.filter(s => (s as any).user_id);

      // Apply the daily deterministic rotation to system presets on the client so it changes every 24h
      const day = new Date().getDate();
      const index1 = (day * 3) % systemPresets.length;
      const index2 = (day * 7 + 1) % systemPresets.length;
      const index3 = (day * 11 + 2) % systemPresets.length;

      const selectedIndices = Array.from(new Set([index1, index2, index3]));
      while (selectedIndices.length < 3 && systemPresets.length > 0) {
        const nextIdx = (selectedIndices[selectedIndices.length - 1] + 1) % systemPresets.length;
        selectedIndices.push(nextIdx);
      }

      const selectedDailySystem = selectedIndices
        .filter(idx => systemPresets[idx])
        .map(idx => ({ ...systemPresets[idx] }));

      // 3. Set active skills (system presets slice + all user posted skills)
      setDailySkills(selectedDailySystem);
      setUserSkills(userPosted);

      // 4. Fetch scheduled sessions from database
      const sessionsRes = await fetch(`http://localhost:3000/api/sessions/${currentUser.id}`);
      const sessionsData = await sessionsRes.json();
      if (sessionsRes.ok) {
        setAllSessions(sessionsData.sessions || []);
        // Automatically hide sessions that have already completed in real-time
        const now = new Date();
        const activeSessions = sessionsData.sessions.filter((sess: any) => {
          if (!sess.date) return true;
          const sessTime = new Date(`${sess.date}T${sess.time || '00:00'}`);
          // Only show sessions scheduled in the future
          return sessTime.getTime() > now.getTime();
        });
        setScheduledSessions(activeSessions);
      }
    } catch (err: any) {
      console.error("DB Load Error:", err);
    }
  };

  useEffect(() => {
    fetchSkillsAndSessions();
  }, [currentUser]);

  const handleAcceptClick = (q: SkillOffer) => {
    if (!currentUser?.id) return;
    if (q.userId === currentUser.id || (q as any).user_id === currentUser.id || q.postedBy === currentUser.username) {
      alert("You cannot accept your own post!");
      return;
    }
    setQuestToAccept(q);
    setAcceptorEmail(`${currentUser.username.toLowerCase()}@xplore.edu`);
    setAcceptorPhone('');
    setShowAcceptModal(true);
  };

  const handlePostSkillClick = () => {
    setSkillEmail(`${currentUser?.username?.toLowerCase() || 'adventurer'}@xplore.edu`);
    setSkillPhone('');
    setShowModal(true);
  };

  const handleScheduleClick = (q: SkillOffer) => {
    setSelectedQuestForSchedule(q);
    setShowScheduleModal(true);
  };

  const handleConfirmSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id || !selectedQuestForSchedule) return;

    const payload = {
      id: `sess_${Date.now()}`,
      skillId: selectedQuestForSchedule.id,
      skillName: selectedQuestForSchedule.skill,
      partnerName: selectedQuestForSchedule.postedBy,
      date: scheduleDate,
      time: scheduleTime,
      venue: scheduleVenue,
      userId: currentUser.id
    };

    try {
      const res = await fetch('http://localhost:3000/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to lock session in database");

      // Success visual feedback
      setScheduleSuccess(`✓ SESSION LOCKED! Invite dispatched to ${selectedQuestForSchedule.email || 'partner'}!`);
      setTimeout(() => setScheduleSuccess(null), 4000);

      // Re-fetch sessions from DB
      await fetchSkillsAndSessions();

      // Reset inputs
      setScheduleDate('');
      setScheduleTime('');
      setScheduleVenue('Virtual Discord Server');
      setShowScheduleModal(false);
      setSelectedQuestForSchedule(null);
    } catch (err: any) {
      console.error("Schedule Error:", err);
      alert(err.message || 'Failed to schedule study session.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    const parsedTags = skillTags
      ? skillTags.split(',').map(t => t.trim()).filter(Boolean)
      : ['Custom'];

    const newSkillId = `sk_user_${Date.now()}`;
    const payload = {
      id: newSkillId,
      type: skillType,
      skill: skillName,
      description: skillDesc,
      tags: parsedTags,
      postedBy: currentUser.username || 'You',
      initials: currentUser.username ? currentUser.username.substring(0, 2).toUpperCase() : 'YO',
      duration: skillDur || '1 hr',
      bonusXp: 15,
      email: skillEmail || `${currentUser.username || 'user'}@xplore.edu`,
      phone: skillPhone || '+1 (555) 000-0000',
      userId: currentUser.id
    };

    try {
      const res = await fetch('http://localhost:3000/api/skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to post skill');

      // Refresh board skills
      await fetchSkillsAndSessions();

      // Reset Form Fields
      setSkillType('offer');
      setSkillName('');
      setSkillDesc('');
      setSkillDur('1 hr');
      setSkillTags('');
      setSkillEmail('');
      setSkillPhone('');
      setShowModal(false);
    } catch (err: any) {
      console.error("Submit Skill Error:", err);
      alert(err.message || 'Failed to submit skill exchange.');
    }
  };

  const quests = [...userSkills, ...dailySkills].filter(
    q => !allSessions.some(sess => sess.skillId === q.id)
  );
  const filtered = filter === 'all'
    ? quests.filter(q => !q.accepted)
    : filter === 'matched'
      ? quests.filter(q => q.accepted)
      : quests.filter(q => q.type === filter && !q.accepted);

  const offers = quests.filter(q => q.type === 'offer').length;
  const requests = quests.filter(q => q.type === 'request').length;

  return (
    <div className="flex flex-col gap-6 animate-[fade-in_0.3s_ease-out]">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="text-pastel-cyan font-bold text-2xl font-pixel mb-3 drop-shadow-[0_0_6px_rgba(14,116,144,0.25)]">SKILL EXCHANGE</h1>
          <p className="text-slate-500 text-sm">Teach what you know. Learn what you don't. Earn bonus XP.</p>
        </div>
        <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
          <button 
            className="font-pixel text-[10px] px-5 py-3 bg-pastel-cyan text-slate-800 border border-pastel-cyan hover:bg-transparent hover:text-pastel-cyan font-bold rounded shadow-[0_0_15px_rgba(14,116,144,0.4)] hover:shadow-[0_0_20px_rgba(14,116,144,0.25)_inset] transition-all flex items-center gap-2 cursor-pointer"
            onClick={handlePostSkillClick}
          >
            <Plus size={14} /> POST SKILL
          </button>
        </div>
      </div>

      {scheduleSuccess && (
        <div className="font-pixel text-[9px] text-[#006064] bg-cyan-100 border border-cyan-300 px-4 py-2.5 rounded shadow-[0_0_10px_rgba(34,211,238,0.2)] animate-pulse flex items-center justify-center">
          {scheduleSuccess}
        </div>
      )}

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
          <span className="font-pixel text-2xl text-pastel-purple mb-1">+220</span>
          <span className="font-pixel text-[8px] text-slate-500">MAX BONUS XP</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-2">
        {(['all', 'offer', 'request', 'matched'] as const).map(f => (
          <button
            key={f}
            className={`font-pixel text-[10px] px-5 py-2.5 rounded border transition-all duration-200 ${
              filter === f 
                ? 'bg-pastel-pink/20 border-pastel-pink text-pastel-pink shadow-[0_0_8px_#ff00ff_inset] -translate-y-0.5' 
                : 'bg-white border-slate-200 text-slate-500 hover:text-slate-800 hover:border-gray-500'
            }`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'ALL' : f === 'offer' ? 'OFFERS' : f === 'request' ? 'REQUESTS' : '🤝 MY MATCHES'}
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
            } ${q.accepted ? 'opacity-90 bg-white/80 shadow-none' : 'hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(255,255,255,0.1)_inset]'}`}
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

            {(() => {
              const isOwnSkill = q.userId === currentUser?.id || (q as any).user_id === currentUser?.id || q.postedBy === currentUser?.username;
              if (q.accepted && isOwnSkill) {
                const partner = (q as any).acceptedByUsername || 'Adventurer';
                return (
                  <div className="mt-2.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 p-2.5 rounded text-[8.5px] font-pixel leading-normal animate-pulse flex items-center gap-1.5 shadow-sm">
                    <span>🔔</span>
                    <span><strong>{partner.toUpperCase()}</strong> accepted your quest! Match secured!</span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="flex flex-wrap gap-2 mt-2">
              {q.tags.map(t => (
                <span key={t} className="bg-white border border-slate-300 text-slate-600 font-pixel text-[7px] px-2 py-1 rounded-sm">
                  {t.toUpperCase()}
                </span>
              ))}
            </div>

            {/* Locked Contact Block */}
            {q.accepted && (
              (() => {
                const isOwnSkill = q.userId === currentUser?.id || (q as any).user_id === currentUser?.id || q.postedBy === currentUser?.username;
                const contactEmail = isOwnSkill 
                  ? (q as any).acceptedByEmail || `${((q as any).acceptedByUsername || 'partner').toLowerCase()}@xplore.edu`
                  : q.email || 'N/A';
                const contactPhone = isOwnSkill
                  ? (q as any).acceptedByPhone || '+1 (555) 018-9321'
                  : q.phone || 'N/A';
                const contactName = isOwnSkill
                  ? (q as any).acceptedByUsername || 'Adventurer'
                  : q.postedBy;

                return (
                  <div className="mt-2 p-3 bg-slate-900 text-pastel-cyan border border-slate-700 rounded font-mono text-[9px] flex flex-col gap-1.5 animate-[fade-in_0.3s_ease-out]">
                    <div className="text-pastel-pink font-bold border-b border-slate-800 pb-1 flex justify-between items-center font-pixel">
                      <span>⚡ CONTACT INFORMATION ({contactName.toUpperCase()})</span>
                      <span className="text-[7px] font-mono text-slate-400">ID: {q.id}</span>
                    </div>
                    <div><span className="text-slate-400">EMAIL:</span> <a href={`mailto:${contactEmail}`} className="underline hover:text-pastel-pink font-sans text-[10px]">{contactEmail}</a></div>
                    <div><span className="text-slate-400">PHONE:</span> <a href={`tel:${contactPhone}`} className="underline hover:text-pastel-pink font-sans text-[10px]">{contactPhone}</a></div>
                    <button 
                      onClick={() => handleScheduleClick(q)}
                      className="mt-2 w-full py-1 bg-pastel-cyan text-slate-900 border border-pastel-cyan font-pixel text-[8px] hover:bg-transparent hover:text-pastel-cyan transition-all rounded shadow-[0_0_5px_rgba(14,116,144,0.3)]"
                    >
                      📅 SCHEDULE SESSION
                    </button>
                  </div>
                );
              })()
            )}

            <div className="flex justify-between items-center flex-wrap gap-3 mt-4 pt-4 border-t border-slate-200/50">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 rounded bg-white border border-slate-300 flex items-center justify-center font-pixel text-[8px] text-slate-800 shrink-0">
                  {q.initials}
                </div>
                <div>
                  <p className="text-slate-800 text-sm font-bold leading-tight truncate">{q.postedBy}</p>
                  <p className="text-pastel-cyan font-pixel text-[7px] flex items-center gap-1 mt-1 whitespace-nowrap"><Clock size={8} /> {q.duration}</p>
                </div>
              </div>
              
              {(() => {
                const isOwnSkill = q.userId === currentUser?.id || (q as any).user_id === currentUser?.id || q.postedBy === currentUser?.username;
                
                const deleteBtn = isOwnSkill ? (
                  <button
                    onClick={async () => {
                      if (confirm("Are you sure you want to delete this skill exchange quest?")) {
                        try {
                          const res = await fetch(`http://localhost:3000/api/skills/${q.id}`, {
                            method: 'DELETE'
                          });
                          if (!res.ok) throw new Error("Failed to delete quest");
                          await fetchSkillsAndSessions();
                        } catch (err: any) {
                          console.error("Delete Quest Error:", err);
                          alert(err.message || 'Failed to delete quest.');
                        }
                      }
                    }}
                    className="font-pixel text-[8px] px-3 py-2 bg-rose-50 border border-rose-200 text-rose-500 hover:bg-rose-500 hover:text-white transition-all rounded cursor-pointer whitespace-nowrap shrink-0"
                  >
                    DELETE
                  </button>
                ) : null;

                if (q.accepted) {
                  const partner = (q as any).acceptedByUsername || 'partner';
                  const isAcceptedByMe = q.acceptedBy === currentUser?.id;
                  return (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="font-pixel text-[8px] text-emerald-600 border border-emerald-400 bg-emerald-50 px-3 py-2 rounded whitespace-nowrap">
                        {isAcceptedByMe ? '✓ MY MATCH' : `✓ MATCHED BY ${partner.toUpperCase()}`}
                      </span>
                      {deleteBtn}
                    </div>
                  );
                }
                
                if (isOwnSkill) {
                  return (
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className="font-pixel text-[8px] text-slate-400 bg-slate-100 border border-slate-200 px-3 py-2 rounded select-none whitespace-nowrap">★ YOUR POST</span>
                      {deleteBtn}
                    </div>
                  );
                }
                
                return (
                  <button
                    className={`font-pixel text-[8px] px-3 py-2 rounded transition-all border cursor-pointer ${
                      q.type === 'offer' 
                        ? 'bg-pastel-cyan/10 border-pastel-cyan text-pastel-cyan hover:bg-pastel-cyan hover:text-slate-800 hover:shadow-[0_0_10px_rgba(14,116,144,0.4)]' 
                        : 'bg-pastel-pink/10 border-pastel-pink text-pastel-pink hover:bg-pastel-pink hover:text-slate-800 hover:shadow-[0_0_10px_#ff00ff]'
                    }`}
                    onClick={() => handleAcceptClick(q)}
                  >
                    ACCEPT →
                  </button>
                );
              })()}
            </div>
          </div>
        ))}

        {/* Dynamic "+ ADD NEW SKILL" card/button */}
        <div 
          onClick={handlePostSkillClick}
          className="p-5 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-slate-300 hover:border-pastel-cyan hover:bg-white/40 transition-all duration-300 rounded-lg cursor-pointer min-h-[250px] text-center group shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-cyan)] hover:-translate-y-1"
        >
          <div className="w-12 h-12 bg-slate-100 group-hover:bg-pastel-cyan/20 border border-dashed border-slate-400 group-hover:border-pastel-cyan rounded-full flex items-center justify-center text-slate-500 group-hover:text-pastel-cyan transition-all mb-2 shadow-sm">
            <Plus size={24} className="group-hover:scale-110 transition-transform" />
          </div>
          <span className="font-pixel text-[10px] text-slate-700 font-bold group-hover:text-pastel-cyan transition-colors">
            + ADD NEW SKILL
          </span>
          <p className="text-slate-500 text-xs max-w-[200px] leading-normal font-sans">
            Teach what you know or request help with something new!
          </p>
        </div>
      </div>

      {/* Scheduled Sessions Timeline */}
      {scheduledSessions.length > 0 && (
        <div className="panel-border-pink p-6 bg-white/40 flex flex-col gap-4 animate-[fade-in_0.3s_ease-out] mt-4">
          <div className="flex items-center justify-between border-b border-pastel-pink/50 pb-3">
            <h2 className="font-pixel text-xs text-pastel-pink flex items-center gap-2">
              📅 YOUR LOCKED TEACHING & LEARNING SESSIONS
            </h2>
            <span className="font-pixel text-[8px] bg-pastel-pink/20 text-pastel-pink px-2 py-0.5 border border-pastel-pink rounded animate-pulse">
              {scheduledSessions.length} ACTIVE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {scheduledSessions.map(sess => (
              <div 
                key={sess.id}
                className="bg-slate-900 text-slate-100 p-4 border border-slate-700 rounded-lg flex flex-col gap-2 relative shadow-md"
              >
                <button 
                  onClick={async () => {
                    try {
                      const res = await fetch(`http://localhost:3000/api/sessions/${sess.id}`, {
                        method: 'DELETE'
                      });
                      if (!res.ok) throw new Error("Failed to cancel session");
                      await fetchSkillsAndSessions();
                    } catch (err: any) {
                      console.error("Cancel Session Error:", err);
                      alert(err.message || 'Failed to cancel session.');
                    }
                  }}
                  className="absolute top-2 right-2 text-slate-500 hover:text-rose-400 p-1 transition-colors"
                  title="Cancel Session"
                >
                  <X size={14} />
                </button>

                <div className="font-pixel text-[9px] text-pastel-cyan border-b border-slate-800 pb-1 pr-6 truncate">
                  {sess.skillName.toUpperCase()}
                </div>

                <div className="text-[11px] leading-relaxed">
                  <div>
                    <span className="text-slate-400 font-bold">Partner:</span>{' '}
                    <span className="text-pastel-pink font-semibold">{sess.partnerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">Date:</span>{' '}
                    <span>{sess.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-bold">Time:</span>{' '}
                    <span>{sess.time}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 text-pastel-cyan font-pixel text-[8px] bg-slate-800/80 px-2 py-1 border border-slate-700/50 rounded">
                    📍 {sess.venue.toUpperCase()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && selectedQuestForSchedule && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]" onClick={() => setShowScheduleModal(false)}>
          <div 
            className="panel-border-pink bg-white p-8 w-full max-w-sm shadow-[0_0_30px_rgba(248,183,193,0.2)_inset] rounded-xl relative" 
            onClick={e => e.stopPropagation()}
            role="dialog" 
            aria-modal="true"
          >
            <div className="flex justify-between items-center mb-6 border-b border-pastel-pink/50 pb-4">
              <h2 className="font-pixel text-[10px] text-pastel-pink flex items-center gap-1.5">
                📅 LOCK SESSION
              </h2>
              <button 
                className="text-slate-500 hover:text-slate-800 hover:bg-pastel-yellow p-1 rounded transition-colors" 
                onClick={() => setShowScheduleModal(false)} 
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mb-4 bg-slate-900 border border-slate-700 p-3 rounded text-[10px] text-slate-300 font-sans flex flex-col gap-1">
              <div className="font-pixel text-[8px] text-pastel-cyan border-b border-slate-800 pb-1 mb-1">
                SIDE QUEST TARGET
              </div>
              <div><span className="text-slate-500">SKILL:</span> <span className="font-bold text-slate-100">{selectedQuestForSchedule.skill}</span></div>
              <div><span className="text-slate-500">PARTNER:</span> <span className="font-bold text-pastel-pink">{selectedQuestForSchedule.postedBy}</span></div>
            </div>
            
            <form className="flex flex-col gap-4" onSubmit={handleConfirmSchedule}>
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-cyan" htmlFor="sched-date">SELECT DATE</label>
                <input 
                  id="sched-date" 
                  value={scheduleDate}
                  onChange={e => setScheduleDate(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-pink focus:outline-none text-[11px]" 
                  type="date" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-cyan" htmlFor="sched-time">SELECT TIME</label>
                <input 
                  id="sched-time" 
                  value={scheduleTime}
                  onChange={e => setScheduleTime(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-pink focus:outline-none text-[11px]" 
                  type="time" 
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-cyan" htmlFor="sched-venue">VENUE / MEETING MODE</label>
                <select 
                  id="sched-venue" 
                  value={scheduleVenue}
                  onChange={e => setScheduleVenue(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-pink focus:outline-none text-[11px]" 
                  required
                >
                  <option value="Virtual Discord Server">Virtual Discord Server</option>
                  <option value="Main Library Study Room B">Main Library Study Room B</option>
                  <option value="Student Center Cyber Cafe">Student Center Cyber Cafe</option>
                  <option value="Science Hall Lounge">Science Hall Lounge</option>
                  <option value="Engineering Lab Suite">Engineering Lab Suite</option>
                </select>
              </div>
              
              <button type="submit" className="mt-6 font-pixel text-[10px] w-full flex items-center justify-center gap-2 bg-pastel-pink text-slate-800 p-3 rounded font-bold hover:bg-pastel-yellow hover:shadow-[0_0_20px_rgba(248,183,193,0.5)] transition-all">
                📅 LOCK SESSION
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Accept Quest Modal */}
      {showAcceptModal && questToAccept && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-[fade-in_0.2s_ease-out]" onClick={() => setShowAcceptModal(false)}>
          <div 
            className="panel-border-cyan bg-white p-8 w-full max-w-sm shadow-[0_0_30px_rgba(14,116,144,0.2)_inset] rounded-xl relative" 
            onClick={e => e.stopPropagation()}
            role="dialog" 
            aria-modal="true"
          >
            <div className="flex justify-between items-center mb-6 border-b border-pastel-cyan/50 pb-4">
              <h2 className="font-pixel text-[10px] text-pastel-cyan flex items-center gap-1.5">
                🤝 SECURE MATCH
              </h2>
              <button 
                className="text-slate-500 hover:text-slate-800 hover:bg-pastel-yellow p-1 rounded transition-colors" 
                onClick={() => setShowAcceptModal(false)} 
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-[10px] text-slate-500 mb-4 leading-normal font-pixel text-center">
              PROVIDE YOUR CONTACT DETAILS SO YOUR PARTNER ({questToAccept.postedBy.toUpperCase()}) CAN COORDINATE WITH YOU!
            </p>
            
            <form className="flex flex-col gap-4" onSubmit={async (e) => {
              e.preventDefault();
              if (!currentUser?.id || !questToAccept) return;
              
              try {
                // 1. Mark accepted in the shared database
                const res = await fetch('http://localhost:3000/api/skills/accept', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    id: questToAccept.id, 
                    userId: currentUser.id,
                    email: acceptorEmail,
                    phone: acceptorPhone
                  })
                });
                if (!res.ok) throw new Error("Failed to accept match in database");

                // 2. Add XP
                await addXpDirectly(questToAccept.bonusXp);

                // 3. Trigger full sync from database
                await fetchSkillsAndSessions();

                setAccepted(p => ({ ...p, [questToAccept.id]: true }));
                setTimeout(() => setAccepted(p => ({ ...p, [questToAccept.id]: false })), 2000);

                setShowAcceptModal(false);
                setQuestToAccept(null);
              } catch (err: any) {
                console.error("Match Acceptance Error:", err);
                alert(err.message || "Failed to secure match.");
              }
            }}>
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-cyan" htmlFor="acceptor-email">YOUR EMAIL</label>
                <input 
                  id="acceptor-email" 
                  value={acceptorEmail}
                  onChange={e => setAcceptorEmail(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none text-[11px]" 
                  type="email" 
                  placeholder="e.g. you@xplore.edu"
                  required 
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-cyan" htmlFor="acceptor-phone">YOUR CONTACT NUMBER</label>
                <input 
                  id="acceptor-phone" 
                  value={acceptorPhone}
                  onChange={e => setAcceptorPhone(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none text-[11px]" 
                  type="tel" 
                  placeholder="e.g. +1 (555) 012-3456" 
                  required 
                />
              </div>
              
              <button type="submit" className="mt-6 font-pixel text-[10px] w-full flex items-center justify-center gap-2 bg-pastel-cyan text-white hover:text-slate-800 p-3 rounded font-bold hover:bg-pastel-yellow hover:shadow-[0_0_20px_rgba(14,116,144,0.5)] transition-all">
                INVITE
              </button>
            </form>
          </div>
        </div>
      )}

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
            
            <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-type">I WANT TO...</label>
                <select 
                  id="skill-type" 
                  value={skillType}
                  onChange={e => setSkillType(e.target.value as SkillOfferType)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" 
                  required
                >
                  <option value="offer">Offer a skill (Teach)</option>
                  <option value="request">Request a skill (Learn)</option>
                </select>
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-name-input">SKILL NAME</label>
                <input 
                  id="skill-name-input" 
                  value={skillName}
                  onChange={e => setSkillName(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" 
                  type="text" 
                  placeholder="e.g., Python Basics..." 
                  required 
                />
              </div>
              
              <div className="flex flex-col gap-2">
                <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-desc-input">DESCRIPTION</label>
                <textarea 
                  id="skill-desc-input" 
                  value={skillDesc}
                  onChange={e => setSkillDesc(e.target.value)}
                  className="bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none" 
                  rows={3} 
                  placeholder="What will you teach or learn?" 
                  required 
                />
              </div>
              
              <div className="flex gap-4 w-full">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-dur">DURATION</label>
                  <input 
                    id="skill-dur" 
                    value={skillDur}
                    onChange={e => setSkillDur(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none text-[11px]" 
                    type="text" 
                    placeholder="e.g., 1 hr" 
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-tags-input">TAGS</label>
                  <input 
                    id="skill-tags-input" 
                    value={skillTags}
                    onChange={e => setSkillTags(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none text-[11px]" 
                    type="text" 
                    placeholder="Coding, Beginner..." 
                  />
                </div>
              </div>

              {/* Email & Contact Input fields */}
              <div className="flex gap-4 w-full">
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-email">YOUR EMAIL</label>
                  <input 
                    id="skill-email" 
                    value={skillEmail}
                    onChange={e => setSkillEmail(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none text-[11px]" 
                    type="email" 
                    placeholder="e.g. you@xplore.edu"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <label className="font-pixel text-[8px] text-pastel-pink" htmlFor="skill-phone">CONTACT NUMBER</label>
                  <input 
                    id="skill-phone" 
                    value={skillPhone}
                    onChange={e => setSkillPhone(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded p-2 focus:border-pastel-cyan focus:outline-none text-[11px]" 
                    type="tel" 
                    placeholder="e.g. +1 (555) 000-0000"
                    required
                  />
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

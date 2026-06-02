import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';
import { Lock, Plus } from 'lucide-react';
import { badges, checkBadgeUnlocked } from '../data/badges';
import AlistairRunner from '../components/AlistairRunner';

interface SkillOffer {
  id: string;
  type: 'offer' | 'request';
  skill: string;
  description: string;
  tags: string[];
  postedBy: string;
  initials: string;
  duration: string;
  bonusXp: number;
  accepted: boolean;
  userId?: string;
  acceptedBy?: string;
}

export default function Dashboard() {
  const {
    user: currentUser,
    quests,
    mysteryMission,
    mysteryMissionState,
    mysteryMissionSkips,
    acceptMysteryMission,
    completeMysteryMission,
    shuffleMysteryMission,
    skipMysteryMission,
    unlockedMysteryBadges
  } = useGame();
  const navigate = useNavigate();
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [hasShownUnlockForState, setHasShownUnlockForState] = useState<string | null>(null);
  const [skills, setSkills] = useState<SkillOffer[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [sessionsCount, setSessionsCount] = useState(0);
  const [allSessions, setAllSessions] = useState<any[]>([]);

  // Fetch actual skills and sessions in DB for dashboard
  useEffect(() => {
    let active = true;
    const fetchSkillsAndSessions = async () => {
      if (!currentUser?.id) return;
      setSkillsLoading(true);
      try {
        const skillsRes = await fetch('http://localhost:3000/api/skills');
        const skillsData = await skillsRes.json();
        if (active && skillsRes.ok && skillsData.skills) {
          setSkills(skillsData.skills);
        }

        const sessionsRes = await fetch(`http://localhost:3000/api/sessions/${currentUser.id}`);
        const sessionsData = await sessionsRes.json();
        if (active && sessionsRes.ok && sessionsData.sessions) {
          setSessionsCount(sessionsData.sessions.length);
          setAllSessions(sessionsData.sessions);
        }
      } catch (err) {
        console.error('Error fetching dashboard statistics:', err);
      } finally {
        if (active) setSkillsLoading(false);
      }
    };
    fetchSkillsAndSessions();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const activeSkills = skills.filter(
    q => !q.accepted && !allSessions.some(sess => sess.skillId === q.id)
  );

  const getSkillLogoInfo = (skillName: string) => {
    const name = skillName.toLowerCase();
    if (name.includes('python')) {
      return {
        src: "https://lh3.googleusercontent.com/aida-public/AB6AXuArfFALn5dWrwM_nbqci6htaa0RqRfRjD1-Zk848xT8DmHjgZttPtJWcFj7QNrW2RKqJzvKtKC3ssqnV1A1xj8q3lMWgR6lkWU28V3pIRD6ZkQgX3ToASsIZwRhGGALne94k6CX-0pubpVptpBSf6FdPTP49QlBwBdy-mwlv6wijKSEvEDCfPCVELO97h6FEGQKvNgba4ExvudAb6r-MOREKYL9uX2cKmIjrA5Ta-ZYKZJcTXnLfoywdoQTXIs4ko54PhuFUQ0QEvc",
        bgClass: "bg-pastel-cyan/20",
        textColor: "group-hover:text-pastel-cyan",
        borderClass: "hover:shadow-[4px_4px_0px_theme(colors.pastel-cyan)]"
      };
    }
    if (name.includes('react')) {
      return {
        src: "https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg",
        bgClass: "bg-pastel-pink/20",
        textColor: "group-hover:text-rose-500",
        borderClass: "hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]"
      };
    }
    if (name.includes('typescript') || name.includes('javascript') || name.includes(' js') || name.includes(' ts')) {
      return {
        src: "https://upload.wikimedia.org/wikipedia/commons/4/4c/Typescript_logo_2020.svg",
        bgClass: "bg-blue-100/50",
        textColor: "group-hover:text-blue-500",
        borderClass: "hover:shadow-[4px_4px_0px_rgba(59,130,246,0.5)]"
      };
    }
    if (name.includes('git') || name.includes('github')) {
      return {
        src: "https://upload.wikimedia.org/wikipedia/commons/3/3f/Git_icon.svg",
        bgClass: "bg-orange-100/50",
        textColor: "group-hover:text-orange-500",
        borderClass: "hover:shadow-[4px_4px_0px_rgba(249,115,22,0.5)]"
      };
    }
    if (name.includes('docker')) {
      return {
        src: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Docker_(container_engine)_logo.svg",
        bgClass: "bg-cyan-100/50",
        textColor: "group-hover:text-cyan-500",
        borderClass: "hover:shadow-[4px_4px_0px_rgba(6,182,212,0.5)]"
      };
    }
    if (name.includes('rust')) {
      return {
        src: "https://upload.wikimedia.org/wikipedia/commons/d/d5/Rust_programming_language_black_logo.svg",
        bgClass: "bg-amber-100/50",
        textColor: "group-hover:text-amber-600",
        borderClass: "hover:shadow-[4px_4px_0px_rgba(217,119,6,0.5)]"
      };
    }
    if (name.includes('figma')) {
      return {
        src: "https://upload.wikimedia.org/wikipedia/commons/3/33/Figma-logo.svg",
        bgClass: "bg-purple-100/50",
        textColor: "group-hover:text-purple-500",
        borderClass: "hover:shadow-[4px_4px_0px_rgba(168,85,247,0.5)]"
      };
    }
    if (name.includes('math') || name.includes('vector')) {
      return {
        src: "",
        bgClass: "bg-green-100/50",
        textColor: "group-hover:text-green-500",
        isEmoji: "📐",
        borderClass: "hover:shadow-[4px_4px_0px_rgba(34,197,94,0.5)]"
      };
    }
    return {
      src: "",
      bgClass: "bg-slate-100",
      textColor: "group-hover:text-pastel-cyan",
      isEmoji: "💡",
      borderClass: "hover:shadow-[4px_4px_0px_theme(colors.pastel-cyan)]"
    };
  };

  // Trigger Unlock Modal when transition to unlocked state happens
  useEffect(() => {
    if (mysteryMissionState === 'unlocked' && hasShownUnlockForState !== 'unlocked') {
      playSound('success');
      setShowUnlockModal(true);
      setHasShownUnlockForState('unlocked');
      // Fire confetti for unlocking
      confetti({
        particleCount: 50,
        spread: 60,
        colors: ['#CE93D8', '#B07EEC', '#ff00ff'],
        origin: { y: 0.4 }
      });
    } else if (mysteryMissionState !== 'unlocked') {
      // Reset tracker so it can trigger again next time
      setHasShownUnlockForState(null);
    }
  }, [mysteryMissionState, hasShownUnlockForState]);

  const handleCompleteMysteryMission = async () => {
    playSound('success');
    // Launch a massive confetti blast
    confetti({
      particleCount: 150,
      spread: 100,
      origin: { y: 0.5 },
      colors: ['#FFD54F', '#FFC107', '#E0A96D', '#B07EEC', '#FF85A2']
    });
    
    // Call Context's complete function
    await completeMysteryMission();
    
    // Show Rewards Modal
    setShowRewardsModal(true);
  };

  // Alistair Run Modal state
  const [isBattleActive, setIsBattleActive] = useState(false);

  const startBossBattle = () => {
    playSound('click');
    setIsBattleActive(true);
  };

  const handleRun = () => {
    playSound('click');
    setIsBattleActive(false);
  };

  const xpPercent = Math.round((currentUser.xp / currentUser.xpToNext) * 100);

  return (
    <>
      {/* Top Bar: Player Status Card */}
      <section className="panel-border-cyan p-5 flex flex-col gap-5 bg-white/50 hover:bg-white/80 transition-colors shadow-sm">

        {/* Row 1: Header - Player Status */}
        <div className="flex items-center justify-between border-b-2 border-slate-100 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="flex gap-1.5">
              <div className="pixel-heart"></div>
              <div className="pixel-star"></div>
            </div>
            <h2 className="text-pastel-cyan font-black text-xl md:text-2xl tracking-widest font-pixel">» PLAYER STATUS</h2>
          </div>
        </div>

        {/* Row 2: Content (Player details & Level Circle Badge / Progress Bar) */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch justify-between gap-6">

          {/* Left Block: Avatar, Name, and Title Details */}
          <div className="flex items-center gap-4 w-full md:w-auto">
            {/* Initials Avatar Box (Larger and highly visible!) */}
            <div className="w-16 h-16 md:w-20 md:h-20 border-2 border-slate-800 rounded bg-white flex items-center justify-center font-pixel text-pastel-cyan text-lg md:text-2xl font-black shadow-[4px_4px_0px_theme('colors.pastel-cyan')] select-none shrink-0 transition-transform hover:scale-105">
              {currentUser.initials}
            </div>
            {/* Name/Title vertical details */}
            <div className="flex flex-col gap-1.5">
              <div className="text-slate-800 font-extrabold tracking-wide font-pixel text-sm md:text-xl transition-colors hover:text-pastel-cyan">
                {currentUser.username}
              </div>
              <div className="text-slate-500 font-pixel text-[8px] md:text-xs bg-slate-100 border border-slate-200 px-2 py-0.5 rounded self-start font-bold uppercase tracking-wider">
                {currentUser.title || 'NOVICE'}
              </div>
            </div>
          </div>

          {/* Right Block: Circular Level Badge & XP bar stacked vertically on the right side */}
          <div className="flex flex-row md:flex-col items-center md:items-end gap-4 md:gap-2 shrink-0 justify-end w-full md:w-auto border-t md:border-t-0 pt-4 md:pt-0 border-slate-100">

            {/* Circle Level Badge (Large and premium like requested) */}
            <div className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-slate-800 flex flex-col items-center justify-center shrink-0 shadow-[3px_3px_0px_theme('colors.pastel-pink')] bg-white select-none transition-transform hover:scale-105">
              <span className="text-slate-800 text-base md:text-xl font-black leading-none">{currentUser.level}</span>
              <span className="text-pastel-pink text-[8px] md:text-[9px] font-black leading-none mt-0.5 tracking-wider font-pixel">LVL</span>
            </div>

            {/* Small XP Progress Bar block underneath Level Badge */}
            <div className="w-[140px] md:w-[160px] flex flex-col gap-1">
              <div className="flex justify-between text-[7px] md:text-[8px] text-slate-500 font-pixel leading-none px-0.5">
                <span className="font-extrabold text-slate-700">{currentUser.xpToNext - currentUser.xp} TO NEXT</span>
                <span>{currentUser.xp}/{currentUser.xpToNext} XP</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full border-2 border-slate-800 p-[1px] relative overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.15)]">
                <div
                  className="h-full bg-pastel-pink rounded-full shadow-[0_0_6px_#ff00ff] relative transition-all duration-500 min-w-[2px]"
                  style={{ width: `${xpPercent}%` }}
                >
                  <div className="absolute right-0 top-0 bottom-0 w-3 bg-gradient-to-r from-transparent to-white opacity-40 blur-[1px]"></div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* Mission Tracker Section */}
      <div className="flex items-center gap-2 mt-6 mb-4">
        <span className="pixel-star scale-75 inline-block"></span>
        <h2 className="text-pastel-cyan font-bold text-lg md:text-xl tracking-wider font-pixel">» MISSION CENTER</h2>
      </div>

      {/* Grid Row 1: Quests */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <section className={`p-4 relative overflow-hidden transition-all flex flex-col justify-between bg-white hover:bg-slate-50/50 transition-colors ${
          mysteryMissionState === 'locked'
            ? 'panel-border-darkblue'
            : mysteryMissionState === 'unlocked'
            ? 'panel-border-purple'
            : mysteryMissionState === 'accepted'
            ? 'panel-border-cyan'
            : mysteryMissionState === 'completed'
            ? 'panel-border-blue'
            : 'panel-border-lightblue'
        }`}>
          {/* Header */}
          <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
            <span className="font-pixel text-[9px] font-bold tracking-wider flex items-center gap-1">
              <span className="pixel-star scale-75 inline-block mr-1"></span>
              {mysteryMissionState === 'locked' && <span className="text-[#1e3a8a] font-extrabold">MYSTERY MISSION (LOCKED)</span>}
              {mysteryMissionState === 'unlocked' && <span className="text-purple-900 font-extrabold">MYSTERY MISSION</span>}
              {mysteryMissionState === 'accepted' && <span className="text-cyan-900 font-extrabold">ACTIVE MYSTERY MISSION</span>}
              {mysteryMissionState === 'completed' && <span className="text-blue-900 font-extrabold">MYSTERY QUEST CONQUERED!</span>}
            </span>
            <button
              onClick={() => { playSound('click'); navigate('/quests'); }}
              className="text-pastel-cyan hover:text-pastel-yellow transition-colors font-pixel text-[9px] flex items-center gap-1 font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm hover:border-pastel-cyan"
            >
              GO <span className="transform font-bold">&gt;</span>
            </button>
          </div>

          {/* Body content based on state */}
          {mysteryMissionState === 'locked' && (
            <div className="flex flex-col justify-between h-full w-full flex-1">
              <div className="flex items-start gap-3 w-full">
                <div className="w-12 h-12 bg-blue-50/50 border border-blue-500/50 rounded flex items-center justify-center shrink-0 shadow-sm select-none">
                  <Lock className="text-blue-600 w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">
                    Finish <strong className="text-slate-800">all 12 daily tasks</strong> to unlock your surprise Daily Fun Quest!
                  </p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className="text-[8px] font-pixel font-bold text-slate-800 bg-slate-100 px-2 py-1 border border-slate-200 rounded whitespace-nowrap flex items-center justify-center h-6">
                      {quests.filter(q => q.completed).length}/12 COMPLETE
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center mt-3 pt-2 border-t border-slate-100/50 w-full justify-center">
                <button className="w-[80%] py-1.5 bg-emerald-50/80 pixel-border text-emerald-700 text-[9px] font-pixel font-bold cursor-not-allowed select-none uppercase text-center shadow-sm">
                  LOCKED
                </button>
              </div>
            </div>
          )}

          {mysteryMissionState === 'unlocked' && mysteryMission && (
            <div className="flex items-start gap-3 flex-1 w-full">
              <div className="w-12 h-12 bg-white border border-pastel-purple rounded flex items-center justify-center shrink-0 text-2xl shadow-sm select-none animate-[bounce_3s_infinite_ease-in-out]">
                {mysteryMission.icon}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
                <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">
                  Spontaneous quest ready! Category: <strong className="text-purple-800">{mysteryMission.category}</strong>. Complete to claim rewards!
                </p>
                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-100 w-full">
                  <div className="flex items-stretch gap-2 w-full">
                    <button
                      onClick={() => { playSound('click'); shuffleMysteryMission(); }}
                      className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all flex-1 text-center active:scale-95 shadow-sm"
                      title="Shuffle challenge (costs 10 XP)"
                    >
                      <span className="text-[8px] font-pixel text-slate-700 leading-normal">SHUFFLE</span>
                      <span className="text-[7px] font-pixel text-purple-900 mt-1.5 leading-normal font-extrabold">-10 XP</span>
                    </button>
                    <button
                      disabled={mysteryMissionSkips <= 0}
                      onClick={() => { playSound('click'); skipMysteryMission(); }}
                      className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 transition-all flex-1 text-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                      title="Skip once per day"
                    >
                      <span className="text-[8px] font-pixel text-slate-700 leading-normal">SKIP</span>
                      <span className="text-[7px] font-pixel text-cyan-900 mt-1.5 leading-normal font-extrabold">{mysteryMissionSkips}/1 left</span>
                    </button>
                  </div>
                  <button
                    onClick={() => { playSound('click'); acceptMysteryMission(); }}
                    className="w-[80%] py-1.5 mx-auto bg-pastel-pink pixel-border text-slate-800 text-[9px] font-pixel hover:bg-pastel-yellow transition-all font-bold uppercase text-center active:scale-95 shadow-sm"
                  >
                    ACCEPT
                  </button>
                </div>
              </div>
            </div>
          )}

          {mysteryMissionState === 'accepted' && mysteryMission && (
            <div className="flex items-start gap-3 flex-1 w-full">
              <div className="w-12 h-12 bg-white border border-pastel-cyan rounded flex items-center justify-center shrink-0 text-2xl shadow-sm select-none animate-pulse">
                {mysteryMission.icon}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
                <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">
                  Active: <strong className="text-cyan-800">{mysteryMission.title}</strong> - {mysteryMission.description}
                </p>
                <div className="flex flex-col gap-2 mt-auto pt-2 border-t border-slate-100 w-full">
                  <div className="flex items-stretch gap-2 w-full">
                    <button
                      onClick={() => { playSound('click'); shuffleMysteryMission(); }}
                      className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 bg-slate-50 hover:bg-purple-50 hover:border-purple-300 transition-all flex-1 text-center active:scale-95 shadow-sm"
                      title="Shuffle challenge (costs 10 XP)"
                    >
                      <span className="text-[8px] font-pixel text-slate-700 leading-normal">SHUFFLE</span>
                      <span className="text-[7px] font-pixel text-purple-900 mt-1.5 leading-normal font-extrabold">-10 XP</span>
                    </button>
                    <button
                      disabled={mysteryMissionSkips <= 0}
                      onClick={() => { playSound('click'); skipMysteryMission(); }}
                      className="flex flex-col items-center justify-center p-2 rounded border border-slate-200 bg-slate-50 hover:bg-cyan-50 hover:border-cyan-300 transition-all flex-1 text-center disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 shadow-sm"
                    >
                      <span className="text-[8px] font-pixel text-slate-700 leading-normal">SKIP</span>
                      <span className="text-[7px] font-pixel text-cyan-900 mt-1.5 leading-normal font-extrabold">{mysteryMissionSkips}/1 left</span>
                    </button>
                  </div>
                  <button
                    onClick={handleCompleteMysteryMission}
                    className="w-[80%] py-1.5 mx-auto bg-[#A5D6A7] pixel-border text-slate-800 text-[9px] font-pixel hover:bg-[#C8E6C9] transition-all font-bold uppercase animate-pulse text-center active:scale-95 shadow-sm"
                  >
                    DONE
                  </button>
                </div>
              </div>
            </div>
          )}

          {mysteryMissionState === 'completed' && mysteryMission && (
            <div className="flex items-start gap-3 flex-1 w-full">
              <div className="w-12 h-12 bg-white border border-[#A0C4FF] rounded flex items-center justify-center shrink-0 shadow-sm select-none">
                <svg className="w-8 h-8 filter drop-shadow-[0_2px_4px_rgba(59,130,246,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A0C4FF" />
                      <stop offset="50%" stopColor="#3B82F6" />
                      <stop offset="100%" stopColor="#1E3A8A" />
                    </linearGradient>
                  </defs>
                  <path d="M18 2H6v2H2v6c0 2.2 1.8 4 4 4h2.2c.8 1.6 2.2 2.8 3.8 3.2V20H9v2h6v-2h-3v-2.8c1.6-.4 3-1.6 3.8-3.2H18c2.2 0 4-1.8 4-4V4h-4V2zm-10 8V6h2v4H8zm10-2h-2V6h2v2z" fill="url(#blueGrad)" />
                </svg>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
                <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">
                  Conquered today's challenge! Claimed <strong className="text-blue-900 font-extrabold">"{mysteryMission.unlockedTitle}"</strong> and <strong className="text-blue-900 font-extrabold">"{mysteryMission.unlockedCollectible?.name || 'Trophy'}"</strong>.
                </p>
                <div className="flex items-center mt-auto pt-1 w-full justify-center">
                  <button
                    onClick={() => { playSound('click'); navigate('/profile'); }}
                    className="w-[80%] py-1.5 bg-[#A5D6A7] pixel-border text-slate-800 text-[9px] font-pixel font-bold hover:bg-[#C8E6C9] transition-all text-center uppercase active:scale-95 shadow-sm"
                  >
                    EQUIP TITLE
                  </button>
                </div>
              </div>
            </div>
          )}
        </section>
 
        <section className="panel-border-yellow p-4 relative overflow-hidden bg-white hover:bg-slate-50/50 transition-colors flex flex-col justify-between">
          <div
            onClick={() => { playSound('click'); navigate('/backpack'); }}
            className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2 cursor-pointer group/header hover:border-slate-300 transition-colors relative"
            title="Go to Backpack Options"
          >
            <span className="font-pixel text-[9px] text-[#800000] font-bold tracking-wider group-hover/header:text-[#a00000] transition-colors flex items-center gap-1">
              <span className="pixel-star scale-75 inline-block mr-1"></span>
              MY BACKPACK
            </span>
            <button
              className="text-pastel-cyan hover:text-pastel-yellow transition-colors font-pixel text-[9px] flex items-center gap-1 font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm hover:border-pastel-cyan"
            >
              GO <span className="transform group-hover/header:translate-x-0.5 transition-transform font-bold">&gt;</span>
            </button>
          </div>
          <div className="flex items-start gap-3 flex-1 w-full">
            <div
              onClick={() => { playSound('click'); navigate('/backpack'); }}
              className="w-12 h-12 bg-white border border-[#800000] rounded flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-50 transition-colors group/backpack shadow-sm"
              title="Open Backpack"
            >
              <svg className="w-8 h-8 text-[#800000] group-hover/backpack:scale-110 transition-transform" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 4h14v2H5V4zm-1 3h16v13H4V7zm4 4v4h2v-4H8zm6 0v4h2v-4h-2zm-3-7h2v3h-2V4z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
              <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">Master quest <strong className="text-[#800000] font-extrabold">Sets</strong> and manage <strong className="text-[#800000] font-extrabold">Backpack</strong> tools to secure weekly goals!</p>
              <div className="flex items-center mt-auto pt-1 w-full justify-center">
                <button
                  onClick={() => { playSound('click'); navigate('/backpack'); }}
                  className="w-[80%] py-1.5 bg-[#A0C4FF] pixel-border text-slate-800 text-[9px] font-pixel font-bold hover:bg-pastel-yellow transition-all text-center uppercase active:scale-95 shadow-sm"
                >
                  OPEN BACKPACK
                </button>
              </div>
            </div>
          </div>
        </section>
 
        <section className="panel-border-purple p-4 relative overflow-hidden bg-white hover:bg-slate-50/50 transition-colors flex flex-col justify-between">
          <div
            onClick={() => { playSound('click'); startBossBattle(); }}
            className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2 cursor-pointer group/header hover:border-slate-300 transition-colors relative"
            title="Start Alistair's Run"
          >
            <span className="font-pixel text-[9px] text-purple-900 font-bold tracking-wider group-hover/header:text-purple-700 transition-colors flex items-center gap-1">
              <span className="pixel-star scale-75 inline-block mr-1"></span>
              ALISTAIR RUN
            </span>
            <button
              className="text-pastel-cyan hover:text-pastel-yellow transition-colors font-pixel text-[9px] flex items-center gap-1 font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm hover:border-pastel-cyan"
            >
              PLAY <span className="transform group-hover/header:translate-x-0.5 transition-transform font-bold">&gt;</span>
            </button>
          </div>
          <div className="flex items-start gap-3 flex-1 w-full">
            <div className="w-12 h-12 bg-white border border-pastel-cyan rounded flex items-center justify-center shrink-0 text-3xl select-none animate-bounce shadow-sm">
              🧙‍♂️
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
              <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">Help Alistair navigate the wilderness! Jump and slide using keys to survive 1500m and earn <strong className="text-purple-700">+50 XP & +60 Gold</strong>!</p>
              <div className="flex items-center mt-auto pt-1 w-full justify-center">
                <button
                  onClick={(e) => { e.preventDefault(); startBossBattle(); }}
                  className="w-[80%] py-1.5 bg-pastel-pink pixel-border text-slate-800 text-[9px] font-pixel font-bold hover:bg-pastel-yellow transition-all text-center uppercase active:scale-95 shadow-sm"
                >
                  START RUN
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Main Lower Area - Horizontal Dashboard Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1">

        {/* Expanded Badges Region */}
        <section className="panel-border-pink p-6 flex flex-col bg-white/50">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
            <span className="font-pixel text-[10px] text-slate-800 font-bold tracking-wider flex items-center gap-2">
              <span className="pixel-star scale-75 inline-block"></span>
              BADGES VAULT
            </span>
            <button
              onClick={() => { playSound('click'); navigate('/profile'); }}
              className="text-pastel-cyan hover:text-pastel-yellow transition-colors font-pixel text-[9px] flex items-center gap-1 font-bold bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded shadow-sm hover:border-pastel-cyan cursor-pointer"
            >
              VIEW VAULT <span className="font-bold">&gt;</span>
            </button>
          </div>
          <div className="flex flex-wrap justify-around items-start gap-4 flex-1 py-4">
            {(() => {
              const completedQuestsCount = quests.filter(q => q.completed).length;
              const skillsCount = skills.filter(s => s.userId === currentUser?.id || s.postedBy === currentUser?.username || s.acceptedBy === currentUser?.id).length;

              const dynamicBadges = badges.map(b => ({
                ...b,
                unlocked: checkBadgeUnlocked(b.id, currentUser, completedQuestsCount, skillsCount, sessionsCount)
              }));

              const unlockedBadges = [...dynamicBadges.filter(b => b.unlocked), ...unlockedMysteryBadges];

              if (unlockedBadges.length === 0) {
                return (
                  <div className="flex flex-col items-center justify-center p-6 text-center w-full bg-slate-50/50 border-2 border-dashed border-slate-300 rounded-lg">
                    <span className="text-3xl mb-1 select-none animate-bounce">🏆</span>
                    <p className="font-pixel text-[9px] text-slate-700 font-bold mb-1">NO BADGES UNLOCKED YET</p>
                    <p className="text-[10px] text-slate-500 max-w-[240px] mb-3.5 leading-normal">
                      Complete daily habits and tackle Mystery Missions to fill your Badges Locker!
                    </p>
                    <button
                      onClick={() => { playSound('click'); navigate('/profile'); }}
                      className="px-3.5 py-1.5 bg-pastel-pink pixel-border text-slate-800 text-[8px] font-pixel font-bold hover:bg-pastel-yellow transition-all"
                    >
                      GO TO PROFILE
                    </button>
                  </div>
                );
              }

              return unlockedBadges.slice(0, 3).map((b) => {
                const isEpic = b.rarity === 'epic';
                const isLegendary = b.rarity === 'legendary';
                const isRare = b.rarity === 'rare';
                
                let textClass = 'text-pastel-cyan';
                if (isEpic) textClass = 'text-pastel-purple';
                else if (isLegendary) textClass = 'text-yellow-400';
                else if (isRare) textClass = 'text-cyan-400';

                let borderClass = 'border-pastel-cyan';
                if (isEpic) borderClass = 'border-pastel-purple';
                else if (isLegendary) borderClass = 'border-yellow-500 shadow-[0_0_8px_#eab308]';
                else if (isRare) borderClass = 'border-cyan-400';

                let nameClass = 'text-cyan-900';
                if (isEpic) nameClass = 'text-purple-900';
                else if (isLegendary) nameClass = 'text-amber-900';
                else if (isRare) nameClass = 'text-teal-900';

                return (
                  <div key={b.id} className="flex flex-col items-center w-24 relative group cursor-pointer">
                    {/* Tooltip */}
                    <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center w-48 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white rounded-lg shadow-2xl text-center z-50 pointer-events-none transition-all">
                      <span className={`font-pixel text-[8px] ${textClass} mb-1 font-bold tracking-wider`}>
                        {b.name.toUpperCase()}
                      </span>
                      <span className="text-[7px] font-pixel text-slate-400 mb-2 uppercase tracking-wide">
                        {b.rarity} Achievement
                      </span>
                      <p className="text-[10px] text-slate-200 leading-relaxed font-medium">
                        {b.description}
                      </p>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
                    </div>

                    {/* Badge Icon Box */}
                    <div className={`w-20 h-20 bg-white border-2 ${borderClass} rounded-xl flex items-center justify-center p-3 shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-105`}>
                      <span className="text-3xl select-none leading-none drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{b.icon}</span>
                    </div>
                    <span className={`font-pixel text-[10px] ${nameClass} text-center font-bold tracking-tight mt-3 break-words w-full leading-normal`}>
                      {b.name}
                    </span>
                  </div>
                );
              });
            })()}
          </div>
        </section>

        {/* Expanded Skill Exchange Region */}
        <section className="panel-border-green p-6 flex flex-col bg-white/50">
          <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-3">
            <span className="font-pixel text-[10px] text-slate-800 font-bold tracking-wider flex items-center gap-2">
              <span className="pixel-star scale-75 inline-block"></span>
              SKILLS MARKETPLACE
            </span>
            <button
              onClick={() => { playSound('click'); navigate('/skill-exchange'); }}
              className="text-pastel-cyan hover:text-pastel-yellow transition-colors font-pixel text-[9px] flex items-center gap-1 font-bold bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1 rounded shadow-sm hover:border-pastel-cyan cursor-pointer"
            >
              MARKETPLACE <span className="font-bold">&gt;</span>
            </button>
          </div>
          <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {skillsLoading ? (
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pastel-cyan"></div>
                <p className="font-pixel text-[8px] text-slate-500 mt-2">LOADING QUESTS...</p>
              </div>
            ) : activeSkills.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-slate-300 bg-slate-50/50 rounded-lg">
                <p className="font-pixel text-[9px] text-slate-700 font-bold mb-1">NO ACTIVE SIDE QUESTS</p>
                <p className="text-[10px] text-slate-500 max-w-[200px] mb-3 leading-normal">
                  All side quests are locked! Post a new skill to keep learning.
                </p>
                <button
                  onClick={() => { playSound('click'); navigate('/skill-exchange'); }}
                  className="px-3.5 py-1.5 bg-[#A0C4FF] pixel-border text-slate-800 text-[8px] font-pixel font-bold hover:bg-pastel-yellow transition-all cursor-pointer flex items-center gap-1.5 justify-center"
                >
                  <Plus size={10} /> + ADD NEW SKILL
                </button>
              </div>
            ) : (
              activeSkills.slice(0, 3).map((q) => {
                const info = getSkillLogoInfo(q.skill);
                const isOwnSkill = q.userId === currentUser?.id || q.postedBy === currentUser?.username;
                const cardBorder = q.type === 'offer' 
                  ? 'hover:shadow-[4px_4px_0px_theme(colors.pastel-cyan)]' 
                  : 'hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)]';
                
                // Define nice tag / action button
                let actionBtnText = q.type === 'offer' ? 'TEACH' : 'FIND';
                if (q.accepted) {
                  actionBtnText = 'MATCHED';
                }

                let statusText = '';
                if (isOwnSkill) {
                  statusText = q.type === 'offer' ? 'Offered by you' : 'Requested by you';
                } else {
                  statusText = q.type === 'offer' ? `Offered by ${q.postedBy}` : `Requested by ${q.postedBy}`;
                }

                return (
                  <div
                    key={q.id}
                    onClick={() => { playSound('click'); navigate('/skill-exchange'); }}
                    className={`flex items-center justify-between bg-white p-4 border-2 border-slate-800 shadow-[2px_2px_0px_#334155] ${info.borderClass || cardBorder} hover:-translate-y-1 transition-all group cursor-pointer`}
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1 mr-2">
                      <div className={`${info.bgClass} p-2 rounded relative overflow-hidden group-hover:scale-110 transition-transform shrink-0 w-12 h-12 flex items-center justify-center`}>
                        <div className="absolute inset-0 opacity-20 blur"></div>
                        {info.src ? (
                          <img alt={`${q.skill} Logo`} className="w-8 h-8 relative z-10 object-contain" src={info.src} />
                        ) : (
                          <span className="text-2xl relative z-10 select-none leading-none flex items-center justify-center">{info.isEmoji}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-slate-800 font-bold text-sm tracking-wide ${info.textColor} transition-colors truncate`}>
                          {q.skill}
                        </p>
                        <p className="text-xs text-slate-500 font-medium truncate">
                          {statusText}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); playSound('click'); navigate('/skill-exchange'); }}
                      className={`px-4 py-2 bg-transparent border-2 border-slate-300 rounded text-slate-600 font-pixel text-[8px] shrink-0 transition-colors ${
                        q.accepted
                          ? 'border-emerald-500 text-emerald-500 bg-emerald-50'
                          : q.type === 'offer'
                            ? 'group-hover:border-pastel-cyan group-hover:text-pastel-cyan'
                            : 'group-hover:border-pastel-pink group-hover:text-pastel-pink'
                      }`}
                    >
                      {actionBtnText}
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Alistair Mysterious Infinite Runner Modal */}
      {isBattleActive && (
        <AlistairRunner onClose={handleRun} />
      )}

      {/* 1. Mystery Mission Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fade-in_0.25s_ease-out]">
          <div className="p-8 bg-slate-900/95 border border-purple-500/20 max-w-md w-full rounded-2xl text-white relative text-center shadow-[0_20px_50px_rgba(168,85,247,0.25)] animate-[scale-in_0.2s_ease-out]">
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none rounded-2xl"></div>
            
            <div className="text-purple-300 font-sans text-[10px] font-bold tracking-widest mb-3 uppercase select-none">
              ✨ SYSTEM SYNC COMPLETE ✨
            </div>
            
            <h2 className="text-xl md:text-2xl font-bold font-sans tracking-wide mb-2 uppercase bg-gradient-to-r from-pastel-purple via-pastel-pink to-pastel-cyan bg-clip-text text-transparent drop-shadow-sm select-none">
              Mystery Mission Unlocked
            </h2>
            
            {/* Custom glowing minimalist vector lock container (No fake cartoon emojis!) */}
            <div className="my-8 flex justify-center select-none">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-purple-950/80 to-slate-900 border border-purple-500/30 flex items-center justify-center shadow-[0_8px_30px_rgba(168,85,247,0.15)] animate-[pulse_2.1s_infinite_ease-in-out]">
                <svg className="w-9 h-9 text-purple-300 drop-shadow-[0_0_12px_#c084fc]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="11" width="18" height="10" rx="2" />
                  <path d="M12 2a5 5 0 0 0-5 5v4h10V7a5 5 0 0 0-5-5z" />
                  <circle cx="12" cy="15" r="1.5" fill="currentColor" />
                  <path d="M12 16.5v2" />
                </svg>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed mb-8 font-medium">
              Magnificent work! You have completed all your daily habits on the Quest Board. Merchant Alistair has revealed a secret, real-world <strong className="text-purple-300 font-semibold">Mystery Mission</strong> for you. Complete it to unlock spontaneous hero rewards!
            </p>

            <button
              onClick={() => { playSound('click'); setShowUnlockModal(false); acceptMysteryMission(); }}
              className="w-full py-3.5 bg-gradient-to-r from-pastel-pink to-purple-400 hover:from-pastel-yellow hover:to-pink-300 text-slate-900 font-sans font-semibold text-xs rounded-xl tracking-wider shadow-[0_4px_20px_rgba(244,63,94,0.22)] hover:shadow-[0_6px_25px_rgba(244,63,94,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
            >
              REVEAL & ACCEPT MYSTERY MISSION
            </button>
          </div>
        </div>
      )}

      {/* 2. Rewards Success Modal */}
      {showRewardsModal && mysteryMission && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fade-in_0.25s_ease-out]">
          <div className="p-8 bg-slate-900/95 border border-yellow-500/20 max-w-md w-full rounded-2xl text-white relative text-center shadow-[0_20px_50px_rgba(234,179,8,0.18)] animate-[scale-in_0.2s_ease-out]">
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none rounded-2xl"></div>

            <div className="text-yellow-300 font-sans text-[10px] font-bold tracking-widest mb-3 uppercase select-none">
              🏆 MISSION ACCOMPLISHED 🏆
            </div>

            <h2 className="text-xl md:text-2xl font-bold font-sans tracking-wide mb-4 uppercase bg-gradient-to-r from-pastel-yellow via-pastel-pink to-pastel-cyan bg-clip-text text-transparent drop-shadow-sm select-none">
              Spontaneous Hero Reward
            </h2>

            {/* Glowing awards grid */}
            <div className="bg-slate-950/40 border border-slate-800/40 p-5 rounded-2xl my-6 flex flex-col gap-4 text-left shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800/30 pb-2">
                <span className="text-[9px] text-slate-400 font-sans font-bold uppercase tracking-wider">REWARD</span>
                <span className="text-[9px] text-emerald-400 font-sans font-bold uppercase tracking-wider">STATUS</span>
              </div>

              {/* XP */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 font-medium font-sans">Daily Fun Quest XP</span>
                <span className="text-xs text-pastel-pink font-bold font-sans">+{mysteryMission.xpReward} XP</span>
              </div>

              {/* Title */}
              {mysteryMission.unlockedTitle && (
                <div className="flex justify-between items-center border-t border-slate-800/20 pt-2.5">
                  <span className="text-xs text-slate-300 font-medium font-sans">New Equipped Title</span>
                  <span className="text-[10px] text-pastel-yellow font-semibold font-sans border border-yellow-500/20 bg-yellow-500/10 px-2.5 py-0.5 rounded-lg uppercase tracking-wider">
                    {mysteryMission.unlockedTitle}
                  </span>
                </div>
              )}

              {/* Badge */}
              {mysteryMission.unlockedBadge && (
                <div className="flex justify-between items-center border-t border-slate-800/20 pt-2.5">
                  <span className="text-xs text-slate-300 font-medium font-sans">Achievement Badge</span>
                  <span className="text-[10px] font-semibold text-slate-200 flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/20 px-2.5 py-0.5 rounded-lg font-sans">
                    <span>{mysteryMission.unlockedBadge.icon}</span>
                    <span>{mysteryMission.unlockedBadge.name}</span>
                  </span>
                </div>
              )}

              {/* Collectible */}
              {mysteryMission.unlockedCollectible && (
                <div className="flex justify-between items-center border-t border-slate-800/20 pt-2.5">
                  <span className="text-xs text-slate-300 font-medium font-sans">Collectible Item</span>
                  <span className="text-[10px] font-semibold text-slate-200 flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/20 px-2.5 py-0.5 rounded-lg font-sans">
                    <span>{mysteryMission.unlockedCollectible.icon}</span>
                    <span>{mysteryMission.unlockedCollectible.name}</span>
                  </span>
                </div>
              )}
            </div>

            <p className="text-slate-300 font-sans text-xs leading-relaxed mb-8 font-medium">
              Incredible bravery, hero! You stepped outside the digital world to complete today's spontaneous real-life challenge. You are now officially recognized as a pioneer of spontaneous adventures!
            </p>

            <button
              onClick={() => { playSound('click'); setShowRewardsModal(false); navigate('/profile'); }}
              className="w-full py-3.5 bg-gradient-to-r from-pastel-yellow to-amber-400 hover:from-pastel-pink hover:to-pink-300 text-slate-900 font-sans font-semibold text-xs rounded-xl tracking-wider shadow-[0_4px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_6px_25px_rgba(245,158,11,0.35)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-center"
            >
              SWEET! EQUIP MY REWARDS
            </button>
          </div>
        </div>
      )}

    </>
  );
}

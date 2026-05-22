import { Lock, LogOut } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { badges, titles } from '../data/badges';
import { playSound } from '../utils/audio';


const rarityColors: Record<string, string> = {
  common: 'var(--color-secondary)',
  rare: '#7EC8C8',
  epic: '#B07EEC',
  legendary: 'var(--color-gold)',
};

const rarityBorder: Record<string, string> = {
  common: 'var(--color-secondary)',
  rare: '#5AACAC',
  epic: '#8A5EC8',
  legendary: '#C4962A',
};

const generateHeatmap = () =>
  Array.from({ length: 84 }, () => Math.floor(Math.random() * 5));
const heatmapData = generateHeatmap();
const heatColors = [
  'var(--color-surface-3)',
  'rgba(74,51,96,0.5)',
  'rgba(74,51,96,0.8)',
  'rgba(196,93,106,0.55)',
  'rgba(196,93,106,0.9)',
];

const customTitles = [
  { name: 'Chaos Goblin', rarity: 'epic', description: 'Unlock this title by completing the Text "We need to talk" Mystery Mission.' },
  { name: 'Main Character', rarity: 'epic', description: 'Unlock this title by completing the Sing Bollywood Out Loud Mystery Mission.' },
  { name: 'Certified Menace', rarity: 'legendary', description: 'Unlock this title by completing the Embarrassing Photo Story Mystery Mission.' },
  { name: 'Caffeine Addict', rarity: 'rare', description: 'Unlock this title by completing the Cinematic Coffee Reel Mystery Mission.' },
  { name: 'Wholesome Hero', rarity: 'rare', description: 'Unlock this title by completing the 3 Online Compliments Mystery Mission.' },
  { name: 'Dance Machine', rarity: 'rare', description: 'Unlock this title by completing the Dance to Trending Song Mystery Mission.' },
  { name: 'Nature Guru', rarity: 'rare', description: 'Unlock this title by completing the Touch Grass Mystery Mission.' },
  { name: 'Drama King', rarity: 'epic', description: 'Unlock this title by completing the Speak in Movie Dialogues Mystery Mission.' }
];

export default function Profile() {
  const { user: currentUser, logout, unlockedTitles, activeTitle, equipTitle, unlockedMysteryBadges } = useGame();
  const xpPercent = Math.round((currentUser.xp / currentUser.xpToNext) * 100);
  const unlocked = [...badges.filter(b => b.unlocked), ...unlockedMysteryBadges];
  const locked = badges.filter(b => !b.unlocked);

  const handleLogout = () => {
    playSound('click');
    logout();
  };

  const stats = [
    { label: 'TOTAL XP', value: currentUser.totalXP.toLocaleString(), icon: '⚡', color: 'var(--color-accent)' },
    { label: 'QUESTS', value: currentUser.questsCompleted, icon: '⚔️', color: '#7EC8C8' },
    { label: 'STREAK', value: `${currentUser.streak}D`, icon: '🔥', color: 'var(--color-gold)' },
    { label: 'SKILLS', value: currentUser.skillsShared, icon: '🤝', color: '#B07EEC' },
  ];

  return (
    <div className="flex flex-col gap-8 animate-[fade-in_0.3s_ease-out]">
      {/* Hero */}
      <div className="panel-border-cyan p-6 flex flex-col md:flex-row gap-8 items-center bg-white/50 hover:bg-white/80 transition-colors relative">
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          onMouseEnter={() => playSound('hover')}
          className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 border-2 border-red-500 hover:border-red-600 text-red-600 font-pixel text-[8px] font-bold rounded shadow-[2px_2px_0px_#ef4444] active:translate-y-0.5 active:shadow-[1px_1px_0px_#ef4444] transition-all cursor-pointer"
        >
          <LogOut size={10} />
          LOG OUT
        </button>

        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-white border-2 border-pastel-pink rounded shadow-[0_0_10px_#ff00ff] flex items-center justify-center font-pixel text-3xl font-bold text-pastel-pink mb-2">
            {currentUser.initials}
          </div>
          <div className="bg-pastel-cyan/20 border border-pastel-cyan text-pastel-cyan font-pixel text-[10px] px-3 py-1 rounded">LV.{currentUser.level}</div>
        </div>
        <div className="flex-1 w-full text-center md:text-left">
          <p className="font-pixel text-[10px] text-slate-500 mb-2">» PLAYER PROFILE</p>
          <h1 className="font-pixel text-2xl md:text-3xl font-bold text-slate-800 mb-2">{currentUser.username}</h1>
          <p className="text-pastel-cyan font-semibold mb-1">◈ {currentUser.title}</p>
          <p className="text-xs text-slate-500 font-pixel text-[8px] mb-4">ADVENTURER SINCE {currentUser.joinDate.toUpperCase()}</p>
          
          {/* HP Bar equivalent */}
          <div className="w-full max-w-[420px] mx-auto md:mx-0">
            <div className="flex justify-between font-pixel text-[10px] mb-2">
              <span className="text-pastel-pink">EXP</span>
              <span className="text-slate-600">{currentUser.xp}/{currentUser.xpToNext} — {xpPercent}%</span>
            </div>
            <div className="w-full h-4 bg-white border border-slate-800 p-0.5 rounded shadow-[inset_0_0_5px_rgba(0,0,0,1)]">
              <div 
                className="h-full bg-pastel-pink bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] rounded-sm transition-all duration-1000 shadow-[0_0_10px_#ff00ff]" 
                style={{ width: `${xpPercent}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <div key={s.label} className="panel-border-purple p-4 text-center hover:scale-105 transition-transform duration-300 cursor-pointer shadow-[0_0_10px_rgba(176,38,255,0.2)_inset] hover:shadow-[0_0_20px_rgba(176,38,255,0.6)_inset]">
            <span className="block text-2xl mb-2">{s.icon}</span>
            <p className="font-bold text-xl mb-1" style={{ color: s.color }}>{s.value}</p>
            <p className="font-pixel text-[8px] text-slate-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Badges */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-end border-b border-slate-800 pb-2">
          <h3 className="font-pixel text-sm text-slate-800">ACHIEVEMENT BADGES</h3>
          <span className="bg-pastel-pink/20 text-pastel-pink font-pixel text-[8px] px-2 py-1 rounded border border-pastel-pink">
            {unlocked.length}/{badges.length} UNLOCKED
          </span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {unlocked.map(b => (
            <div
              key={b.id}
              className="panel-border-pink p-4 flex flex-col items-center gap-3 hover:-translate-y-1 transition-all duration-300 cursor-pointer text-center bg-white border-2"
              style={{ borderColor: rarityBorder[b.rarity] }}
              title={b.description}
            >
              <div className="text-3xl drop-shadow-[0_0_8px_rgba(255,255,255,0.4)]">{b.icon}</div>
              <p className="font-bold text-sm text-slate-800">{b.name}</p>
              <span className="font-pixel text-[8px] border-b-2" style={{ color: rarityColors[b.rarity], borderBottomColor: rarityBorder[b.rarity] }}>
                {b.rarity.toUpperCase()}
              </span>
            </div>
          ))}
          {locked.map(b => (
            <div key={b.id} className="panel-border-cyan p-4 flex flex-col items-center gap-3 opacity-50 grayscale bg-white" title="Locked">
              <Lock size={28} className="text-slate-500 mb-1" />
              <p className="font-bold text-sm text-slate-500">???</p>
              <span className="font-pixel text-[8px] text-slate-500 border-b-2 border-slate-800">{b.rarity.toUpperCase()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Titles */}
      <div className="flex flex-col gap-6">
        <div className="border-b border-slate-800 pb-2">
          <h3 className="font-pixel text-sm text-slate-800">PLAYER TITLES</h3>
        </div>

        {/* Level Up Titles */}
        <div>
          <h4 className="font-pixel text-[9px] text-slate-500 mb-3">◈ LEVEL ACHIEVEMENTS</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {titles.map(t => {
              const isUnlocked = currentUser.level >= t.requiredLevel;
              const isEquipped = activeTitle === t.name;
              return (
                <div
                  key={t.name}
                  onClick={() => {
                    if (isUnlocked) {
                      playSound('click');
                      equipTitle(t.name);
                    }
                  }}
                  className={`p-3 rounded border flex flex-col justify-between transition-all relative select-none ${
                    isUnlocked
                      ? isEquipped
                        ? 'border-pastel-pink bg-pastel-pink/15 text-slate-800 shadow-[0_0_10px_#ff00ff_inset] cursor-pointer'
                        : 'bg-pastel-cyan/10 border-pastel-cyan text-slate-800 hover:bg-pastel-cyan/20 cursor-pointer hover:-translate-y-0.5'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs md:text-sm tracking-wide">{isUnlocked ? t.name : '??????'}</span>
                    {!isUnlocked && <Lock size={10} className="text-slate-400" />}
                    {isUnlocked && isEquipped && (
                      <span className="bg-pastel-pink text-white font-pixel text-[6px] px-1 rounded-sm shadow-[0_0_4px_#ff00ff] animate-pulse">
                        EQUIPPED
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-slate-200/40 pt-1.5 font-pixel text-[7px] text-slate-500">
                    <span>LEVEL UP</span>
                    <span>LV.{t.requiredLevel}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Mystery Titles */}
        <div>
          <h4 className="font-pixel text-[9px] text-pastel-pink mb-3">◈ MYSTERY MISSION REWARDS</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {customTitles.map(t => {
              const isUnlocked = unlockedTitles.includes(t.name);
              const isEquipped = activeTitle === t.name;
              return (
                <div
                  key={t.name}
                  onClick={() => {
                    if (isUnlocked) {
                      playSound('click');
                      equipTitle(t.name);
                    }
                  }}
                  title={t.description}
                  className={`p-3 rounded border flex flex-col justify-between transition-all relative select-none ${
                    isUnlocked
                      ? isEquipped
                        ? 'border-pastel-purple bg-pastel-purple/15 text-slate-800 shadow-[0_0_10px_#b026ff_inset] cursor-pointer'
                        : 'bg-pastel-purple/10 border-pastel-purple text-slate-800 hover:bg-pastel-purple/20 cursor-pointer hover:-translate-y-0.5'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-xs md:text-sm tracking-wide">{isUnlocked ? t.name : '??????'}</span>
                    {!isUnlocked && <Lock size={10} className="text-slate-400" />}
                    {isUnlocked && isEquipped && (
                      <span className="bg-pastel-purple text-white font-pixel text-[6px] px-1 rounded-sm shadow-[0_0_4px_#b026ff] animate-pulse">
                        EQUIPPED
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between items-center mt-2 border-t border-slate-200/40 pt-1.5 font-pixel text-[7px] text-slate-500">
                    <span>{t.rarity.toUpperCase()}</span>
                    <span>FUN QUEST</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="flex flex-col gap-4 mt-4">
        <h3 className="font-pixel text-sm text-slate-800 border-b border-slate-800 pb-2">ACTIVITY LOG</h3>
        <div className="panel-border-purple p-6 shadow-[0_0_15px_#b026ff_inset] bg-white border-2 border-pastel-purple/50">
          <p className="font-pixel text-[8px] text-slate-500 mb-4">LAST 12 WEEKS</p>
          <div className="grid grid-rows-7 grid-flow-col gap-1 w-full overflow-x-auto pb-2">
            {heatmapData.map((v, i) => (
              <div
                key={i}
                className="w-3 h-3 md:w-4 md:h-4 rounded-sm border border-black/20 hover:scale-125 hover:border-white transition-all cursor-pointer"
                style={{ background: heatColors[v] }}
                title={`${v} quests completed`}
              />
            ))}
          </div>
          <div className="flex items-center justify-end gap-2 mt-4 font-pixel text-[8px] text-slate-500">
            <span>LESS</span>
            {heatColors.map((c, i) => (
              <div key={i} className="w-3 h-3 rounded-sm" style={{ background: c }} />
            ))}
            <span>MORE</span>
          </div>
        </div>
      </div>
    </div>
  );
}

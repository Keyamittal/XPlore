import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';

export default function Sanctuary() {
  const { 
    pets, 
    activePetId, 
    equipPet,
    hatchPet
  } = useGame();

  // Hatching state variables
  const [hatchingPet, setHatchingPet] = useState<any | null>(null);
  const [hatchTaps, setHatchTaps] = useState<number>(0);
  const [isShaking, setIsShaking] = useState<boolean>(false);
  const [showFlash, setShowFlash] = useState<boolean>(false);

  // Web Audio crack sound generator
  const playCrackSound = (intensity: number) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Noise buffer creation
      const bufferSize = ctx.sampleRate * 0.1 * intensity;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(intensity === 1 ? 1200 : 800, ctx.currentTime);
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05 * intensity);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
    } catch (e) {
      console.warn("Crack sound failed:", e);
    }
  };

  // Web Audio explosion / chime sound generator
  const playHatchExplodeSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.35); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(277.18, ctx.currentTime); // C#4
      osc2.frequency.exponentialRampToValueAtTime(1108.73, ctx.currentTime + 0.35); // C#6
      
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.4);
      osc2.stop(ctx.currentTime + 0.4);
    } catch (e) {
      console.warn("Explode sound failed:", e);
    }
  };

  const handleEggTap = () => {
    if (!hatchingPet || hatchTaps >= 3) return;

    const nextTaps = hatchTaps + 1;
    setHatchTaps(nextTaps);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 300);

    if (nextTaps < 3) {
      // Play crack sound
      playCrackSound(nextTaps);
      playSound('click');
    } else {
      // Tap 3: Explodes!
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 400);
      playHatchExplodeSound();
      playSound('success');
      
      // Trigger canvas-confetti with pet themed colors
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: hatchingPet.type === 'owl' 
          ? ['#818cf8', '#c084fc', '#ffd700'] 
          : hatchingPet.type === 'fox'
          ? ['#f97316', '#fb923c', '#ffd700']
          : hatchingPet.type === 'unicorn'
          ? ['#e9d5ff', '#f472b6', '#ffd700']
          : hatchingPet.type === 'sloth'
          ? ['#a1a1aa', '#a16207', '#ffd700']
          : hatchingPet.type === 'phoenix'
          ? ['#f87171', '#f59e0b', '#ffd700']
          : ['#34d399', '#4ade80', '#ffd700']
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-[fade-in_0.3s_ease-out] select-none">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="font-bold text-2xl font-pixel mb-3 text-[#5c4257] drop-shadow-[0_0_8px_rgba(92,66,87,0.4)]">ALISTAIR'S SANCTUARY</h1>
          <p className="text-slate-500 text-sm">Raise companion pets and unlock powerful evolution buffs!</p>
        </div>
      </div>

      {/* Pet Locker contents */}
      <div className="flex flex-col gap-6">
        <div className="bg-[#f0dccf]/20 border-2 border-[#f0dccf] p-4 rounded-lg text-slate-700 text-sm leading-relaxed">
          <span className="font-bold text-amber-700 font-pixel text-[10px] block mb-1">COMPANION EVOLUTION LOCKER</span>
          Purchase Eggs from the Merchant Shop to unlock companion pets!
        </div>

        {pets.length === 0 ? (
          <section className="bg-white border-4 border-slate-800 p-12 text-center shadow-[4px_4px_0px_#f0dccf]">
            <div className="text-5xl select-none mb-4">🥚</div>
            <h3 className="font-pixel text-[11px] font-bold text-slate-800 mb-2 uppercase">NO PETS UNLOCKED</h3>
            <p className="text-slate-500 text-xs max-w-sm m-auto leading-relaxed mb-6">
              You do not own any Alistair companion pets or eggs yet! Travel to the Merchant Shop and purchase an egg using your gold coins.
            </p>
          </section>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => {
              const isActive = activePetId === pet.id;
              
              // Buff label mapping
              let buffLabel = "";
              if (pet.type === 'fox') {
                buffLabel = "Pippin's Fortune: Doubles all coin spawns in Mysterious Run.";
              } else if (pet.type === 'owl') {
                buffLabel = "Ollie's Wisdom: Grants a passive +10% score bonus.";
              } else if (pet.type === 'frog') {
                buffLabel = "Bubu's Flight: Decreases jumping gravity by 12% for floaty heights.";
              } else if (pet.type === 'cat') {
                buffLabel = "Cookie's Charm: Grants a passive +12% score bonus.";
              } else if (pet.type === 'dragon') {
                buffLabel = "Drake's Slowdown: Slows obstacle scrolling speed by 20% during Alistair's Run.";
              } else if (pet.type === 'panda') {
                buffLabel = "Bamboo's Focus: Grants a passive +15% score bonus.";
              } else if (pet.type === 'duck') {
                buffLabel = "Ducky's Drift: Decreases jumping gravity by 8% for floatier leaps.";
              } else if (pet.type === 'unicorn') {
                buffLabel = "Sparkles's Magic: Grants a passive +25% score bonus.";
              } else if (pet.type === 'sloth') {
                buffLabel = "Sid's Slumber: Slows obstacle scrolling speed by 20% during Alistair's Run.";
              } else if (pet.type === 'phoenix') {
                buffLabel = "Phoenix's Rebirth: Doubles all coin spawns in Mysterious Run.";
              }

              return (
                <section
                  key={pet.id}
                  className={`p-5 flex flex-col justify-between bg-white border-4 border-slate-800 transition-all ${
                    isActive ? 'shadow-[6px_6px_0px_#c29476]' : 'hover:-translate-y-1'
                  }`}
                  style={{
                    borderRadius: 0,
                    position: 'relative'
                  }}
                >
                  {/* Status Badge */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    {isActive && (
                      <span className="font-pixel text-[8px] bg-[#c29476] text-white px-2 py-0.5 rounded shadow-sm font-bold uppercase animate-pulse">
                        EQUIPPED
                      </span>
                    )}
                    <span className={`font-pixel text-[8px] px-2 py-0.5 rounded shadow-sm font-bold uppercase ${
                      pet.stage === 'egg' 
                        ? 'bg-amber-100 text-amber-700' 
                        : pet.stage === 'baby' 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {pet.stage.toUpperCase()}
                    </span>
                  </div>

                  {/* Pet Icon & Name */}
                  <div className="flex items-center gap-4 mt-2 mb-4">
                    <div className="w-16 h-16 bg-slate-50 border-2 border-slate-800 rounded flex items-center justify-center text-4xl select-none shadow-sm shrink-0">
                      {pet.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm tracking-wide">{pet.name}</h3>
                      <p className="text-slate-500 text-[10px] mt-0.5 capitalize">Stage: {pet.stage} Companion</p>
                    </div>
                  </div>

                  {/* XP Progress Bar (Egg & Baby stages) */}
                  {pet.stage !== 'adult' ? (
                    <div className="mb-4">
                      <div className="flex justify-between text-[9px] font-pixel text-slate-500 mb-1">
                        <span>EXP PROGRESS</span>
                        <span>{pet.currentXp} / {pet.xpNeeded} XP</span>
                      </div>
                      <div className="relative w-full h-4 bg-slate-100 rounded border-2 border-slate-800 overflow-hidden shadow-inner">
                        <div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-emerald-400 to-emerald-500 min-w-[2px]" 
                          style={{ width: `${Math.min(100, (pet.currentXp / pet.xpNeeded) * 100)}%` }}
                        ></div>
                      </div>
                      {pet.stage === 'egg' && pet.currentXp >= pet.xpNeeded && (
                        <button
                          onClick={() => {
                            playSound('click');
                            setHatchingPet(pet);
                            setHatchTaps(0);
                          }}
                          className="w-full mt-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-pixel text-[9px] font-bold border-2 border-slate-800 shadow-[2px_2px_0px_#1e293b]"
                        >
                          🐣 HATCH EGG!
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="mb-4 bg-indigo-50 border border-indigo-200 text-indigo-700 p-2 text-center rounded text-[9.5px] font-pixel uppercase">
                      ⭐ FULLY EVOLVED ADULT COMPANION!
                    </div>
                  )}

                  {/* Buff Description */}
                  <div className="bg-slate-50 border border-slate-200 p-3 rounded mb-5 text-[11px] leading-relaxed text-slate-600 font-sans">
                    <strong className="text-slate-700 block font-pixel text-[8px] mb-1">PASSIVE ABILITY BUFF:</strong>
                    {buffLabel}
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => {
                      playSound('click');
                      if (isActive) {
                        equipPet(null);
                      } else {
                        if (pet.stage === 'egg') {
                          // Intercept to hatch the egg with custom animation first
                          setHatchingPet(pet);
                          setHatchTaps(0);
                        } else {
                          equipPet(pet.id);
                        }
                      }
                    }}
                    className={`w-full py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold shadow-[2px_2px_0px_#1e293b] active:translate-y-[1px] transition-all cursor-pointer text-center ${
                      isActive 
                        ? 'bg-rose-50 text-rose-600 hover:bg-rose-100 border-rose-800' 
                        : 'bg-[#f0dccf] text-slate-800 hover:bg-[#cc6d78] hover:text-white'
                    }`}
                  >
                    {isActive ? '❌ UNEQUIP COMPANION' : 'EQUIP AS COMPANION'}
                  </button>

                </section>
              );
            })}
          </div>
        )}
      </div>

      {/* Hatching Overlay (No boxed layout) */}
      {hatchingPet && (
        <div className="fixed inset-0 z-[9999] bg-slate-950/75 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-[fade-in_0.3s_ease-out]">
          <style>{`
            @keyframes egg-shake {
              0%, 100% { transform: rotate(0deg) scale(1); }
              25% { transform: rotate(-8deg) scale(1.05); }
              50% { transform: rotate(8deg) scale(1.05); }
              75% { transform: rotate(-8deg) scale(1.05); }
            }
            @keyframes egg-shake-heavy {
              0%, 100% { transform: rotate(0deg) scale(1); }
              15% { transform: rotate(-15deg) scale(1.1); }
              30% { transform: rotate(15deg) scale(1.1); }
              45% { transform: rotate(-15deg) scale(1.1); }
              60% { transform: rotate(15deg) scale(1.1); }
              75% { transform: rotate(-10deg) scale(1.1); }
              90% { transform: rotate(10deg) scale(1.1); }
            }
            @keyframes pet-emerge {
              0% { transform: scale(0) rotate(-180deg); opacity: 0; }
              60% { transform: scale(1.3) rotate(20deg); opacity: 0.9; }
              100% { transform: scale(1) rotate(0deg); opacity: 1; }
            }
            @keyframes flash-fade {
              0% { opacity: 0; }
              30% { opacity: 1; }
              100% { opacity: 0; }
            }
            .shake-light {
              animation: egg-shake 0.3s ease-in-out;
            }
            .shake-heavy {
              animation: egg-shake-heavy 0.3s ease-in-out;
            }
            .egg-float {
              animation: bounce 3s infinite ease-in-out;
            }
            .pet-reveal {
              animation: pet-emerge 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            }
            .flash-screen {
              animation: flash-fade 0.4s ease-out forwards;
            }
          `}</style>

          {/* Flash screen effect */}
          {showFlash && (
            <div className="fixed inset-0 z-[10000] bg-white pointer-events-none flash-screen" />
          )}

          {/* Central Interactive Animation Wrapper */}
          <div className="relative w-80 h-96 flex flex-col items-center justify-center">
            
            {/* The SVG Egg */}
            <svg 
              viewBox="0 0 200 240" 
              className={`w-64 h-72 drop-shadow-[0_15px_35px_rgba(0,0,0,0.6)] select-none cursor-pointer overflow-visible z-20 ${
                hatchTaps >= 3 ? 'pointer-events-none' : ''
              }`}
              onClick={handleEggTap}
            >
              <defs>
                <radialGradient id="egg-grad" cx="35%" cy="35%" r="65%">
                  <stop offset="0%" stop-color="#ffffff" />
                  <stop offset="30%" stop-color="#fffefa" />
                  <stop offset="75%" stop-color="#fdf4e7" />
                  <stop offset="100%" stop-color="#d6beaa" />
                </radialGradient>
              </defs>
              
              <g 
                className={isShaking ? (hatchTaps === 1 ? 'shake-light' : 'shake-heavy') : 'egg-float'} 
                style={{ transformOrigin: '100px 120px' }}
              >
                {/* Top Half */}
                <path 
                  d="M 100,30 C 60,30 30,85 30,120 L 55,110 L 85,130 L 115,110 L 145,130 L 170,120 C 170,85 140,30 100,30 Z" 
                  fill="url(#egg-grad)"
                  className="transition-all duration-700 ease-out"
                  style={{
                    transform: hatchTaps >= 3 ? 'translateY(-90px) rotate(-15deg)' : 'translateY(0) rotate(0)',
                    opacity: hatchTaps >= 3 ? 0 : 1,
                    transformOrigin: '30px 120px'
                  }}
                />

                {/* Bottom Half */}
                <path 
                  d="M 30,120 C 30,165 65,210 100,210 C 135,210 170,165 170,120 L 145,130 L 115,110 L 85,130 L 55,110 Z" 
                  fill="url(#egg-grad)"
                  className="transition-all duration-700 ease-out"
                  style={{
                    transform: hatchTaps >= 3 ? 'translateY(90px) rotate(15deg)' : 'translateY(0) rotate(0)',
                    opacity: hatchTaps >= 3 ? 0 : 1,
                    transformOrigin: '170px 120px'
                  }}
                />

                {/* Crack Zigzags */}
                {hatchTaps === 1 && (
                  <path 
                    d="M 30,120 L 55,110 L 85,130 L 115,110 L 145,130 L 170,120" 
                    stroke="#422e3e" 
                    strokeWidth="3.5" 
                    fill="none" 
                    strokeLinejoin="round" 
                    strokeLinecap="round"
                    className="opacity-70"
                  />
                )}
                {hatchTaps === 2 && (
                  <path 
                    d="M 30,120 L 55,110 L 85,130 L 115,110 L 145,130 L 170,120" 
                    stroke="#321f2d" 
                    strokeWidth="5" 
                    fill="none" 
                    strokeLinejoin="round" 
                    strokeLinecap="round"
                    className="opacity-100"
                  />
                )}
              </g>
            </svg>

            {/* Emerging Pet */}
            {hatchTaps >= 3 && (
              <div className="absolute inset-0 flex items-center justify-center z-10 select-none pointer-events-none">
                {/* Radial Glow Ring */}
                <div 
                  className={`absolute w-52 h-52 rounded-full blur-2xl animate-pulse ${
                    hatchingPet.type === 'owl'
                      ? 'bg-indigo-500/45'
                      : hatchingPet.type === 'fox'
                      ? 'bg-orange-500/45'
                      : hatchingPet.type === 'frog'
                      ? 'bg-emerald-500/45'
                      : hatchingPet.type === 'cat'
                      ? 'bg-yellow-500/45'
                      : hatchingPet.type === 'dragon'
                      ? 'bg-rose-500/45'
                      : hatchingPet.type === 'panda'
                      ? 'bg-zinc-500/45'
                      : hatchingPet.type === 'unicorn'
                      ? 'bg-fuchsia-500/45'
                      : hatchingPet.type === 'sloth'
                      ? 'bg-amber-800/45'
                      : hatchingPet.type === 'phoenix'
                      ? 'bg-red-500/45'
                      : 'bg-cyan-500/45'
                  }`}
                />
                
                {/* Bobbing Pet Emoji */}
                <div className="text-9xl pet-reveal drop-shadow-[0_0_25px_rgba(255,255,255,0.75)]">
                  {hatchingPet.type === 'owl' && "🦉"}
                  {hatchingPet.type === 'fox' && "🦊"}
                  {hatchingPet.type === 'frog' && "🐸"}
                  {hatchingPet.type === 'cat' && "🐱"}
                  {hatchingPet.type === 'dragon' && "🐉"}
                  {hatchingPet.type === 'panda' && "🐼"}
                  {hatchingPet.type === 'duck' && "🦆"}
                  {hatchingPet.type === 'unicorn' && "🦄"}
                  {hatchingPet.type === 'sloth' && "🦥"}
                  {hatchingPet.type === 'phoenix' && "🦅"}
                </div>
              </div>
            )}
            
          </div>

          {/* Info Card (Revealed only after split) - Light Color clean retro styling */}
          {hatchTaps >= 3 && (
            <div 
              className="mt-8 flex flex-col items-center gap-5 max-w-sm w-full bg-[#faf7f2] border-4 border-slate-800 p-6 rounded-2xl shadow-[8px_8px_0px_rgba(0,0,0,0.3)] animate-[fade-in_0.6s_ease-out]"
              style={{ position: 'relative', zIndex: 30 }}
            >
              <div className="text-[#c29476] font-pixel text-[9px] font-bold tracking-widest uppercase animate-pulse">
                ✨ EVOLUTION COMPLETE! ✨
              </div>
              <h2 className="text-xl font-pixel text-slate-800 tracking-wide uppercase text-center">
                {hatchingPet.type === 'owl' && "OLLIE HAS HATCHED!"}
                {hatchingPet.type === 'fox' && "PIPPIN HAS HATCHED!"}
                {hatchingPet.type === 'frog' && "BUBU HAS HATCHED!"}
                {hatchingPet.type === 'cat' && "COOKIE HAS HATCHED!"}
                {hatchingPet.type === 'dragon' && "DRAKE HAS HATCHED!"}
                {hatchingPet.type === 'panda' && "BAMBOO HAS HATCHED!"}
                {hatchingPet.type === 'duck' && "DUCKY HAS HATCHED!"}
                {hatchingPet.type === 'unicorn' && "SPARKLES HAS HATCHED!"}
                {hatchingPet.type === 'sloth' && "SID HAS HATCHED!"}
                {hatchingPet.type === 'phoenix' && "PHOENIX HAS HATCHED!"}
              </h2>
              
              <div className="h-[2px] bg-slate-200 w-full my-1" />
 
              <p className="text-slate-600 text-xs leading-relaxed text-center font-sans font-semibold px-2">
                {hatchingPet.type === 'owl' && "Ollie's Wisdom: Grants a passive +10% score bonus in Mysterious Run!"}
                {hatchingPet.type === 'fox' && "Pippin's Fortune: Doubles all coin spawns in Mysterious Run!"}
                {hatchingPet.type === 'frog' && "Bubu's Flight: Decreases jumping gravity by 12% for floaty heights!"}
                {hatchingPet.type === 'cat' && "Cookie's Charm: Grants a passive +12% score bonus in Mysterious Run!"}
                {hatchingPet.type === 'dragon' && "Drake's Slowdown: Slows obstacle scrolling speed by 20% during Alistair's Run!"}
                {hatchingPet.type === 'panda' && "Bamboo's Focus: Grants a passive +15% score bonus in Mysterious Run!"}
                {hatchingPet.type === 'duck' && "Ducky's Drift: Decreases jumping gravity by 8% for floatier leaps!"}
                {hatchingPet.type === 'unicorn' && "Sparkles's Magic: Grants a passive +25% score bonus in Mysterious Run!"}
                {hatchingPet.type === 'sloth' && "Sid's Slumber: Slows obstacle scrolling speed by 20% during Alistair's Run!"}
                {hatchingPet.type === 'phoenix' && "Phoenix's Rebirth: Doubles all coin spawns in Mysterious Run!"}
              </p>
 
              <div className="h-[2px] bg-slate-200 w-full my-1" />
 
              <button
                onClick={() => {
                  playSound('success');
                  hatchPet(hatchingPet.id);
                  equipPet(hatchingPet.id);
                  setHatchingPet(null);
                }}
                className={`w-full py-3.5 rounded-xl border-2 border-slate-800 font-pixel text-[10px] font-bold uppercase tracking-wider shadow-[3px_3px_0px_#1e293b] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1e293b] active:translate-y-[1px] active:shadow-[1px_1px_0px_#1e293b] transition-all cursor-pointer text-center text-slate-800 ${
                  hatchingPet.type === 'owl'
                    ? 'bg-indigo-200 hover:bg-indigo-300'
                    : hatchingPet.type === 'fox'
                    ? 'bg-orange-200 hover:bg-orange-300'
                    : hatchingPet.type === 'frog'
                    ? 'bg-emerald-200 hover:bg-emerald-300'
                    : hatchingPet.type === 'cat'
                    ? 'bg-yellow-200 hover:bg-yellow-300'
                    : hatchingPet.type === 'dragon'
                    ? 'bg-rose-200 hover:bg-rose-300'
                    : hatchingPet.type === 'panda'
                    ? 'bg-zinc-200 hover:bg-zinc-300'
                    : hatchingPet.type === 'unicorn'
                    ? 'bg-fuchsia-200 hover:bg-fuchsia-300'
                    : hatchingPet.type === 'sloth'
                    ? 'bg-amber-200 hover:bg-amber-300'
                    : hatchingPet.type === 'phoenix'
                    ? 'bg-red-200 hover:bg-red-300'
                    : 'bg-cyan-200 hover:bg-cyan-300'
                }`}
              >
                EQUIP COMPANION
              </button>
            </div>
          )}

          {/* Simple Tapping Guide (Only while egg is unhatched) */}
          {hatchTaps < 3 && (
            <div className="mt-6 flex flex-col items-center gap-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              <p className="text-slate-200 font-pixel text-[10px] uppercase tracking-widest font-bold">
                {hatchTaps === 0 && "CLICK THE EGG TO BEGIN HATCHING"}
                {hatchTaps === 1 && "IT IS CRACKING! TAP AGAIN"}
                {hatchTaps === 2 && "ALMOST THERE! ONE MORE TAP"}
              </p>
              
              {/* Retro tiny progress pips */}
              <div className="flex gap-2.5 mt-2">
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`w-2 h-2 rotate-45 border border-white/20 transition-all duration-300 ${
                      hatchTaps >= step 
                        ? hatchingPet.type === 'owl'
                          ? 'bg-indigo-400 shadow-[0_0_8px_#818cf8]'
                          : hatchingPet.type === 'fox'
                          ? 'bg-orange-400 shadow-[0_0_8px_#fb923c]'
                          : hatchingPet.type === 'frog'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#4ade80]'
                          : hatchingPet.type === 'cat'
                          ? 'bg-yellow-400 shadow-[0_0_8px_#facc15]'
                          : hatchingPet.type === 'dragon'
                          ? 'bg-rose-400 shadow-[0_0_8px_#f43f5e]'
                          : hatchingPet.type === 'panda'
                          ? 'bg-zinc-400 shadow-[0_0_8px_#a1a1aa]'
                          : 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
                        : 'bg-slate-900/60'
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
}


import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Lock, Smile, Book, Activity, Droplet, CheckSquare, BookOpen, Code, Sparkles, Loader2 } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import mascotLogo from '../assets/new-logo.png';
import confetti from 'canvas-confetti';

interface Obstacle {
  id: number;
  name: string;
  color: string;
  iconColor: string;
  iconName: string;
  isSliding: boolean;
  jumped: boolean;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  tx: number;
  ty: number;
  color: string;
  size: number;
}

interface CoinPopup {
  id: number;
  x: number;
  y: number;
}

interface XpPopup {
  id: number;
  text: string;
  x: number;
  y: number;
}

export default function Login() {
  // Auth Form State
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Gamification & Simulation State
  const [isJumping, setIsJumping] = useState(false);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [coinPopups, setCoinPopups] = useState<CoinPopup[]>([]);
  const [xpPopups, setXpPopups] = useState<XpPopup[]>([]);
  const [showLoginCard, setShowLoginCard] = useState(false);

  const { login } = useGame();
  const navigate = useNavigate();

  // Reference for spawning loop
  const spawnTimerRef = useRef<any>(null);

  // Auth Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const url = isSignUp
      ? 'http://localhost:3000/api/auth/register'
      : 'http://localhost:3000/api/auth/login';

    const bodyPayload = isSignUp
      ? { username, password, fullName }
      : { username, password };

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Authentication failed');

      // Success Confetti!
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#cc6d78', '#0E7490', '#f0dccf', '#81C784', '#a78bfa'],
      });

      playSound('success');
      login(data.user, data.token, data.streakMissed, data.oldStreak);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Jump Controller
  const triggerJump = () => {
    if (isJumping) return;
    setIsJumping(true);
    setTimeout(() => {
      setIsJumping(false);
    }, 800); // match jump-arc duration
  };



  // Spawns obstacle with strict mathematical timing:
  // Starts at left: 100%, slides to left: -25% over 3000ms.
  // Meets runner (at 15% left) at exactly 3000ms * (100 - 15) / 125 = 2040ms.
  const spawnObstacle = () => {
    const types = [
      { name: 'Study Session', color: 'bg-[#FCE4EC] border-pastel-pink/40 text-slate-800', iconColor: '#cc6d78', iconName: 'book' },
      { name: 'Workout', color: 'bg-pastel-pink/20 border-pastel-pink text-slate-800', iconColor: '#cc6d78', iconName: 'workout' },
      { name: 'Drink Water', color: 'bg-blue-50 border-blue-200 text-slate-800', iconColor: '#0E7490', iconName: 'water' },
      { name: 'Complete Tasks', color: 'bg-pastel-green/20 border-pastel-green text-slate-800', iconColor: '#81C784', iconName: 'tasks' },
      { name: 'Read Books', color: 'bg-purple-50 border-purple-200 text-slate-800', iconColor: '#a78bfa', iconName: 'read' },
      { name: 'Coding Practice', color: 'bg-pastel-cyan/15 border-pastel-cyan text-slate-800', iconColor: '#0E7490', iconName: 'code' },
    ];

    const randomType = types[Math.floor(Math.random() * types.length)];
    const newId = Date.now();

    const newObstacle: Obstacle = {
      id: newId,
      ...randomType,
      isSliding: false,
      jumped: false,
    };

    // Add to state
    setObstacles(prev => [...prev, newObstacle]);

    // Micro-delay to let DOM register initial left: 100% position
    setTimeout(() => {
      setObstacles(prev =>
        prev.map(obs => obs.id === newId ? { ...obs, isSliding: true } : obs)
      );
    }, 20);

    // Auto jump trigger: 2050ms after spawn (268ms before collision)
    setTimeout(() => {
      triggerJump();
    }, 2050);

    // Collision/Clearance event: 2318ms after spawn
    setTimeout(() => {
      // Trigger standard audio success chime
      playSound('success');

      // Math coordinates: where is the runner (15% + half width)
      const runnerX = window.innerWidth * 0.15 + 32;
      const runnerY = window.innerHeight - 80 - 32;

      // Burst particles
      const colors = ['#cc6d78', '#0E7490', '#5c4257', '#f0dccf', '#81C784'];
      const newParticles: Particle[] = Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 30 * Math.PI) / 180;
        const distance = 40 + Math.random() * 50;
        const tx = Math.cos(angle) * distance;
        const ty = Math.sin(angle) * distance - 20; // launch upwards slightly
        return {
          id: Date.now() + i,
          x: runnerX,
          y: runnerY,
          tx,
          ty,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: 4 + Math.random() * 6,
        };
      });

      setParticles(prev => [...prev, ...newParticles]);
      setTimeout(() => {
        setParticles(prev => prev.filter(p => !newParticles.some(np => np.id === p.id)));
      }, 1000);

      // XP Coin Pop
      const coinId = Date.now() + 20;
      setCoinPopups(prev => [...prev, { id: coinId, x: runnerX, y: runnerY - 20 }]);
      setTimeout(() => {
        setCoinPopups(prev => prev.filter(c => c.id !== coinId));
      }, 1200);

      // Floating +50 XP popup
      const xpId = Date.now() + 30;
      setXpPopups(prev => [...prev, { id: xpId, text: '+50 XP', x: runnerX, y: runnerY - 45 }]);
      setTimeout(() => {
        setXpPopups(prev => prev.filter(x => x.id !== xpId));
      }, 1200);

      // Mark as cleared
      setObstacles(prev =>
        prev.map(obs => obs.id === newId ? { ...obs, jumped: true } : obs)
      );
    }, 2318);

    // Remove from array once offscreen
    setTimeout(() => {
      setObstacles(prev => prev.filter(obs => obs.id !== newId));
    }, 3200);
  };

  // Mount game loop and initial delays
  useEffect(() => {
    // Initial Spawn
    spawnObstacle();

    // Spawning loop every 3200ms
    spawnTimerRef.current = setInterval(() => {
      spawnObstacle();
    }, 3200);

    // Login Card delayed presentation (3.5 seconds)
    const cardTimer = setTimeout(() => {
      setShowLoginCard(true);
    }, 3500);

    return () => {
      if (spawnTimerRef.current) clearInterval(spawnTimerRef.current);
      clearTimeout(cardTimer);
    };
  }, []);

  // Standard icon mapper
  const renderIcon = (name: string, color: string) => {
    switch (name) {
      case 'book':
        return <Book className="w-5 h-5" style={{ color }} />;
      case 'workout':
        return <Activity className="w-5 h-5" style={{ color }} />;
      case 'water':
        return <Droplet className="w-5 h-5" style={{ color }} />;
      case 'tasks':
        return <CheckSquare className="w-5 h-5" style={{ color }} />;
      case 'read':
        return <BookOpen className="w-5 h-5" style={{ color }} />;
      case 'code':
        return <Code className="w-5 h-5" style={{ color }} />;
      default:
        return <Sparkles className="w-5 h-5" style={{ color }} />;
    }
  };

  return (
    <div 
      className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-between items-center font-inter p-6 relative overflow-hidden select-none"
    >
      {/* Premium Keyframes Injection */}
      <style>{`
        /* Responsive height-based styles to keep card and runner beautifully balanced */
        .login-card-container {
          transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        @media (min-height: 720px) {
          .login-card-container {
            margin-top: auto;
            margin-bottom: auto;
            transform: translateY(-50px) scale(1);
          }
        }
        
        @media (max-height: 719px) {
          .login-card-container {
            margin-top: 1.5rem;
            margin-bottom: auto;
            transform: scale(0.85);
            transform-origin: top center;
          }
        }

        @media (max-height: 640px) {
          .login-card-container {
            margin-top: 0.5rem;
            margin-bottom: auto;
            transform: scale(0.78);
            transform-origin: top center;
          }
        }

        /* Smooth scaling for extreme zoom out cases */
        @media (min-width: 2000px) {
          .login-card-container {
            transform: translateY(-100px) scale(1.15); /* Scale up slightly on ultra-wide viewports */
          }
        }

        /* Premium Edge Mask to fade track nicely on extreme wide/zoom screens */
        .scrolling-ground-container {
          mask-image: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
          -webkit-mask-image: linear-gradient(90deg, transparent, white 20%, white 80%, transparent);
        }

        /* Runner Container */
        .runner-container {
          position: absolute;
          left: 15%;
          bottom: 80px;
          width: 64px;
          height: 64px;
          transform-origin: bottom center;
          z-index: 10;
        }

        /* Ground track movement */
        .scrolling-ground {
          background-image: linear-gradient(90deg, #334155 1px, transparent 1px);
          background-size: 20px 100%;
          animation: ground-scroll 0.5s linear infinite;
        }

        @keyframes ground-scroll {
          0% { background-position-x: 0px; }
          100% { background-position-x: -20px; }
        }

        /* Runner Jump trajectory physics */
        .runner-jump-physics {
          animation: jump-arc-physics 0.8s cubic-bezier(0.25, 1, 0.4, 1) forwards;
        }

        @keyframes jump-arc-physics {
          0% {
            transform: translateY(0) scaleY(1) scaleX(1) rotate(0deg);
          }
          12% {
            transform: translateY(3px) scaleY(0.82) scaleX(1.1) rotate(-3deg);
            filter: blur(0px);
          }
          32% {
            transform: translateY(-84px) scaleY(1.15) scaleX(0.9) rotate(6deg);
            filter: blur(0.3px);
          }
          50% {
            transform: translateY(-105px) scaleY(1) scaleX(1) rotate(16deg);
            filter: blur(0px);
          }
          70% {
            transform: translateY(-50px) scaleY(1.06) scaleX(0.94) rotate(6deg);
            filter: blur(0.2px);
          }
          88% {
            transform: translateY(0) scaleY(0.85) scaleX(1.1) rotate(0deg);
            filter: blur(0px);
          }
          100% {
            transform: translateY(0) scaleY(1) scaleX(1) rotate(0deg);
          }
        }

        /* Leg run animations */
        .swing-leg-left {
          animation: swing-l 0.35s infinite alternate ease-in-out;
          transform-origin: 32px 42px;
        }
        .swing-leg-right {
          animation: swing-r 0.35s infinite alternate ease-in-out;
          transform-origin: 32px 42px;
        }

        @keyframes swing-l {
          0% { transform: rotate(-35deg); }
          100% { transform: rotate(35deg); }
        }
        @keyframes swing-r {
          0% { transform: rotate(35deg); }
          100% { transform: rotate(-35deg); }
        }

        /* When Jumping, pull legs up and bend them */
        .leg-left-jump {
          transform: rotate(40deg) translateY(-2px);
          transform-origin: 32px 42px;
          transition: transform 0.15s ease-out;
        }
        .leg-right-jump {
          transform: rotate(-40deg) translateY(-2px);
          transform-origin: 32px 42px;
          transition: transform 0.15s ease-out;
        }

        /* Hat bounce cycle */
        .hat-bounce-cycle {
          animation: hat-move 0.35s infinite alternate ease-in-out;
          transform-origin: 32px 14px;
        }
        @keyframes hat-move {
          0% { transform: translateY(0) rotate(0deg); }
          100% { transform: translateY(-1.2px) rotate(1deg); }
        }

        /* Wavy Scarf scarf */
        .scarf-wave-cycle {
          animation: scarf-flutter 0.18s infinite alternate ease-in-out;
          transform-origin: 22px 22px;
        }
        @keyframes scarf-flutter {
          0% { transform: rotate(0deg) scaleY(1); }
          100% { transform: rotate(-12deg) scaleY(0.92) scaleX(1.05); }
        }

        /* Burst particles */
        .burst-particle-fly {
          animation: p-fly 0.9s cubic-bezier(0.1, 0.8, 0.3, 1) forwards;
        }
        @keyframes p-fly {
          0% {
            transform: translate(0, 0) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0) rotate(270deg);
            opacity: 0;
          }
        }

        /* Spinning coin fly */
        .coin-spin-fly {
          animation: coin-fly 1.1s cubic-bezier(0.15, 0.85, 0.3, 1) forwards;
        }
        @keyframes coin-fly {
          0% {
            transform: translateY(0) scale(0.6) rotateY(0deg);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-35px) scale(1.2) rotateY(180deg);
          }
          80% {
            opacity: 1;
            transform: translateY(-85px) scale(1) rotateY(720deg);
            filter: blur(0px);
          }
          100% {
            opacity: 0;
            transform: translateY(-115px) scale(0.5) rotateY(1080deg);
            filter: blur(0.5px);
          }
        }

        /* Floating XP Popup card */
        .xp-text-float {
          animation: text-float 1.1s cubic-bezier(0.2, 0.8, 0.4, 1) forwards;
        }
        @keyframes text-float {
          0% {
            transform: translateY(0) scale(0.8);
            opacity: 0;
            filter: blur(1.5px);
          }
          15% {
            transform: translateY(-18px) scale(1.1);
            opacity: 1;
            filter: blur(0px);
          }
          80% {
            transform: translateY(-38px) scale(1);
            opacity: 1;
            filter: blur(0px);
          }
          100% {
            transform: translateY(-58px) scale(0.85);
            opacity: 0;
            filter: blur(1px);
          }
        }

        /* Login glass card entrance */
        .login-card-enter-anim {
          animation: card-slide-fade 1s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes card-slide-fade {
          0% {
            transform: translateY(35px) scale(0.97);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        /* Ambient floating shapes */
        .ambient-shape-slow {
          animation: slow-shape 7s ease-in-out infinite;
        }
        @keyframes slow-shape {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(8deg); }
        }
      `}</style>

      {/* Ambient background blur elements and grid */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-pastel-pink/10 blur-[120px] ambient-shape-slow" />
        <div className="absolute top-[20%] -right-[10%] w-[60%] h-[60%] rounded-full bg-pastel-cyan/10 blur-[130px] ambient-shape-slow" style={{ animationDelay: '2.5s' }} />
        <div className="absolute -bottom-[10%] left-[25%] w-[50%] h-[50%] rounded-full bg-pastel-purple/10 blur-[110px] ambient-shape-slow" style={{ animationDelay: '4.5s' }} />
        
        {/* Cozy light dot grid pattern */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30"></div>
      </div>

      {/* RETAINED LOGIN CARD (Glassmorphism overlay) */}
      <div className="w-full flex-1 flex justify-center z-20 relative px-4">
        <div className="login-card-container">
          {showLoginCard ? (
            <div 
              className="w-full max-w-md bg-white/70 border border-slate-200/50 backdrop-blur-md rounded-2xl p-6 sm:p-8 shadow-[0_20px_50px_rgba(204,109,120,0.08)] login-card-enter-anim"
              onClick={(e) => e.stopPropagation()} // don't jump when clicking card
            >
              {/* Logo and Tagline Header */}
              <div className="flex flex-col items-center text-center mb-4 sm:mb-6">
                <img 
                  src={mascotLogo} 
                  alt="XPLORE Mascot Logo" 
                  className="w-44 h-44 object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.05)] transform hover:rotate-3 transition-transform duration-300 select-none pointer-events-none mb-1"
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="w-full p-3.5 mb-4 bg-red-50/80 border border-red-200 rounded-xl text-red-600 text-xs font-semibold text-center backdrop-blur-sm animate-shake">
                  {error}
                </div>
              )}

              {/* Toggle Tab bar */}
              <div className="w-full bg-slate-100/50 border border-slate-200/40 p-1 rounded-xl flex gap-1 mb-4 sm:mb-5">
                <button 
                  type="button"
                  onClick={() => { playSound('click'); setIsSignUp(false); setError(''); setUsername(''); setPassword(''); }}
                  className={`flex-1 py-2 text-xs font-bold font-inter rounded-lg transition-all ${!isSignUp ? 'bg-white text-black shadow-sm border border-slate-100' : 'text-black/60 hover:text-black'}`}
                >
                  SIGN IN
                </button>
                <button 
                  type="button"
                  onClick={() => { playSound('click'); setIsSignUp(true); setError(''); setUsername(''); setPassword(''); }}
                  className={`flex-1 py-2 text-xs font-bold font-inter rounded-lg transition-all ${isSignUp ? 'bg-white text-black shadow-sm border border-slate-100' : 'text-black/60 hover:text-black'}`}
                >
                  REGISTER
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {isSignUp && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-black uppercase tracking-wider ml-1">Full Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                        <Smile className="h-4.5 w-4.5" />
                      </div>
                      <input 
                        type="text" 
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        className="w-full bg-white/70 border border-slate-200 text-black rounded-xl pl-10 pr-4 py-3 font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm placeholder:text-black/50 placeholder:font-normal"
                        placeholder="Keya Mittal"
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider ml-1">Username / Adventurer ID</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                      <User className="h-4.5 w-4.5" />
                    </div>
                    <input 
                      type="text" 
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      className="w-full bg-white/70 border border-slate-200 text-black rounded-xl pl-10 pr-4 py-3 font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm placeholder:text-black/50 placeholder:font-normal"
                      placeholder={isSignUp ? "Create a unique tag" : "Enter username"}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-black uppercase tracking-wider ml-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-black">
                      <Lock className="h-4.5 w-4.5" />
                    </div>
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-white/70 border border-slate-200 text-black rounded-xl pl-10 pr-4 py-3 font-semibold focus:outline-none focus:border-black focus:ring-2 focus:ring-black/10 transition-all text-sm placeholder:text-black/50 placeholder:font-normal"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-pastel-pink to-[#8f526b] hover:from-[#c2626e] hover:to-[#7d445c] text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex justify-center items-center gap-2 group disabled:opacity-75 disabled:cursor-wait uppercase tracking-widest font-pixel"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>SYNCHRONIZING...</span>
                    </>
                  ) : (
                    <>
                      <span>{isSignUp ? 'CREATE ADVENTURER' : 'START EXPLORING'}</span>
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-4 sm:mt-6 text-[8px] text-black text-center font-pixel leading-relaxed uppercase tracking-wider">
                BY JOINING XPLORE, YOU AGREE TO COMPETE IN THE<br/>COZY PRODUCTIVITY GUILD.
              </p>
            </div>
          ) : (
            /* Sleek startup landing teaser before card enters */
            <div className="text-center max-w-xl p-8 z-10 select-none pointer-events-none animate-pulse">
              <h1 className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight leading-none mb-4">
                Aesthetic. Gamified.<br/>
                <span className="bg-gradient-to-r from-pastel-pink to-[#8f526b] bg-clip-text text-transparent">Productivity.</span>
              </h1>
              <p className="text-sm font-pixel text-[#cc6d78] uppercase tracking-widest mb-2 animate-bounce">
                Level Up Your Life
              </p>
              <span className="text-[10px] text-slate-400 font-medium">Initializing immersive simulator...</span>
            </div>
          )}
        </div>
      </div>

      {/* ACTIVE SIDE-SCROLLING RUNNER CONTAINER */}
      <div className="absolute bottom-0 left-0 right-0 h-[180px] z-30 select-none scrolling-ground-container">
        {/* Track Line / Scrolling ground */}
        <div className="absolute bottom-[80px] left-0 right-0 h-[3px] bg-slate-800/10"></div>
        <div className="absolute bottom-[66px] left-0 right-0 h-[14px] scrolling-ground opacity-20"></div>

        {/* 1. Custom Vector Explorer Runner character */}
        <div className={`runner-container ${isJumping ? 'runner-jump-physics' : ''}`}>
          <svg 
            width="64"
            height="64"
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.06)]"
          >
            {/* Brown Backpack */}
            <rect 
              x="12" 
              y="22" 
              width="10" 
              height="18" 
              rx="3" 
              fill="#c5a376" 
              stroke="#334155" 
              strokeWidth="2" 
              className={isJumping ? 'transition-all duration-300 translate-y-0.5' : ''}
            />
            <rect x="10" y="26" width="3" height="10" rx="1" fill="#8b5a2b" />

            {/* Torso/Coat */}
            <rect x="20" y="20" width="22" height="20" rx="4" fill="#faedcd" stroke="#334155" strokeWidth="2" />
            {/* Cute Shirt (Pastel Pink) */}
            <path d="M20 20H42V31H20V20Z" fill="#cc6d78" stroke="#334155" strokeWidth="2" />
            <line x1="31" y1="20" x2="31" y2="31" stroke="#334155" strokeWidth="2" />

            {/* Peach Head */}
            <circle cx="31" cy="14" r="9" fill="#faedcd" stroke="#334155" strokeWidth="2" />
            {/* Dotted Eyes */}
            <circle cx="34.5" cy="13.5" r="1.5" fill="#334155" />
            {/* Cozy Cheek Blush */}
            <circle cx="36" cy="16.5" r="1.5" fill="#cc6d78" opacity="0.6" />

            {/* Cozy Scarf waving (Pastel Cyan/Teal) */}
            <g className={!isJumping ? 'scarf-wave-cycle' : ''}>
              <path d="M20 22C17 23.5 13 23 11 21C9.5 19.5 8 21 8.5 23C9.5 25 13 26.5 17 24.5L20 22Z" fill="#0E7490" stroke="#334155" strokeWidth="2" />
            </g>

            {/* Custom Hat (Safari Explorer style in warm wood pastels) */}
            <g className={!isJumping ? 'hat-bounce-cycle' : ''}>
              {/* Hat brim */}
              <path d="M17 7.5C23 6 36 6 42 7.5L44 9.5H15L17 7.5Z" fill="#c5a376" stroke="#334155" strokeWidth="2" />
              {/* Hat crown */}
              <path d="M22 6.5C22 3.5 25 2.5 29.5 2.5C34 2.5 37 3.5 37 6.5H22Z" fill="#b5835a" stroke="#334155" strokeWidth="2" />
              {/* Hat ribbon */}
              <rect x="22.5" y="5.5" width="14" height="2.2" fill="#8b5a2b" />
            </g>

            {/* Left Leg (Leg 1) */}
            <g className={isJumping ? 'leg-left-jump' : 'swing-leg-left'}>
              <rect x="24" y="39" width="5.5" height="12" rx="2.5" fill="#334155" />
              {/* Boot */}
              <rect x="22" y="48" width="9.5" height="4.5" rx="1.5" fill="#b5835a" stroke="#334155" strokeWidth="1.5" />
            </g>

            {/* Right Leg (Leg 2) */}
            <g className={isJumping ? 'leg-right-jump' : 'swing-leg-right'}>
              <rect x="32.5" y="39" width="5.5" height="12" rx="2.5" fill="#334155" />
              {/* Boot */}
              <rect x="30.5" y="48" width="9.5" height="4.5" rx="1.5" fill="#b5835a" stroke="#334155" strokeWidth="1.5" />
            </g>
          </svg>
        </div>

        {/* 2. Scrolling obstacle hurdle elements */}
        {obstacles.map(obs => (
          <div
            key={obs.id}
            className={`absolute bottom-[80px] w-9 h-9 rounded-full bg-white/90 border border-slate-200/50 shadow-sm flex items-center justify-center transition-all select-none pointer-events-none ${obs.color}`}
            style={{
              left: obs.isSliding ? '-10%' : '100%',
              transition: obs.isSliding ? 'left 3s linear' : 'none',
              zIndex: 5,
            }}
          >
            {renderIcon(obs.iconName, obs.iconColor)}
          </div>
        ))}

        {/* 3. XP Coin Popups (Fly outwards and spin 3D) */}
        {coinPopups.map(coin => (
          <div
            key={coin.id}
            className="absolute z-30 pointer-events-none coin-spin-fly"
            style={{
              left: coin.x - 16,
              top: coin.y - 16,
              width: 32,
              height: 32,
            }}
          >
            <svg viewBox="0 0 24 24" className="w-full h-full filter drop-shadow-[0_2px_4px_rgba(212,163,89,0.3)]">
              <circle cx="12" cy="12" r="10" fill="#f0dccf" stroke="#8b5a2b" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="7" fill="#faedcd" stroke="#8b5a2b" strokeWidth="1" />
              <text x="12" y="15" fill="#8b5a2b" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">XP</text>
            </svg>
          </div>
        ))}

        {/* 4. Particle explosions (burst radially) */}
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute z-20 pointer-events-none burst-particle-fly rounded-full"
            style={{
              left: p.x,
              top: p.y,
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              // Inject custom variables into DOM for individual particle trajectory
              ['--tx' as any]: `${p.tx}px`,
              ['--ty' as any]: `${p.ty}px`,
            }}
          />
        ))}

        {/* 5. Floating XP Text notifications */}
        {xpPopups.map(xp => (
          <div
            key={xp.id}
            className="absolute z-40 pointer-events-none xp-text-float px-2 py-0.5 rounded bg-white border border-slate-800/10 shadow-[0_2px_8px_rgba(0,0,0,0.03)] text-[8.5px] font-pixel font-bold text-[#cc6d78] tracking-wide"
            style={{
              left: xp.x - 24,
              top: xp.y - 12,
            }}
          >
            {xp.text}
          </div>
        ))}
      </div>
    </div>
  );
}

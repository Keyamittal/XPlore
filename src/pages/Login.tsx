import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, User, Lock } from 'lucide-react';
import { useGame } from '../context/GameContext';
import mascotLogo from '../assets/new-logo.png';

export default function Login() {
  const [username, setUsername] = useState('AryanK'); 
  const [password, setPassword] = useState('hackathon2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useGame();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      login(data.user, data.token);
      navigate('/'); 
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex justify-center items-center font-inter p-6 relative overflow-hidden">

      {/* Moving Pixel Cat */}
      <div className="pixel-cat-container absolute bottom-4 left-[-100px] pointer-events-none z-20">
        <div className="text-4xl filter drop-shadow-md pixel-cat-bounce">
          <img src="https://media.giphy.com/media/Wj7lNjMNDxSmc/giphy.gif" alt="Nyan Cat" className="w-16 h-auto pixelated-img" style={{ imageRendering: 'pixelated' }} />
        </div>
      </div>

      <div className="w-full max-w-md bg-white border-4 border-slate-800 rounded-lg shadow-[8px_8px_0px_theme('colors.pastel-cyan')] overflow-hidden relative z-10 transform transition-transform hover:-translate-y-1">
        <div className="p-8 flex flex-col items-center">
          
          {/* Logo Heading */}
          <div className="w-48 h-48 mb-2 relative">
            <img 
              src={mascotLogo} 
              alt="XPLORE Mascot" 
              className="w-full h-full object-contain filter drop-shadow-[0_4px_4px_rgba(0,0,0,0.1)] rounded-lg"
            />
          </div>
          
          <div className="text-center mb-8">
            <p className="text-sm text-slate-800 font-bold bg-pastel-yellow inline-block px-3 py-1 border-2 border-slate-800 shadow-[2px_2px_0px_#334155]">Sign in to play</p>
          </div>

          {error && (
            <div className="w-full p-4 mb-6 bg-red-100 border-2 border-red-400 rounded text-red-700 text-sm font-bold text-center pixel-border">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="w-full space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 ml-1 font-pixel text-[10px]">USERNAME</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="text" 
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-800 text-slate-800 rounded-md pl-10 pr-4 py-3 font-bold focus:outline-none focus:border-pastel-purple focus:ring-4 focus:ring-pastel-purple/30 transition-all placeholder:text-slate-500"
                  placeholder="Player ID"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-800 ml-1 font-pixel text-[10px]">PASSWORD</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-500" />
                </div>
                <input 
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-800 text-slate-800 rounded-md pl-10 pr-4 py-3 font-bold focus:outline-none focus:border-pastel-purple focus:ring-4 focus:ring-pastel-purple/30 transition-all placeholder:text-slate-500"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full mt-6 py-4 bg-pastel-pink border-4 border-slate-800 text-slate-800 hover:bg-pastel-yellow font-pixel text-xs rounded shadow-[4px_4px_0px_#334155] active:translate-y-1 active:shadow-[0px_0px_0px_#334155] transition-all flex justify-center items-center gap-2 group disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? 'STARTING...' : 'PRESS START'}
              {!loading && <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>

          <p className="mt-8 text-[10px] text-slate-500 text-center font-pixel leading-relaxed">
            BY SIGNING IN, YOU AGREE<br/>TO THE LEVEL UP PROTOCOL
          </p>
        </div>
      </div>
    </div>
  );
}

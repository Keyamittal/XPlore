import { useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import { playSound, startMysteriousTheme, stopMysteriousTheme } from '../utils/audio';
import { useGame } from '../context/GameContext';

interface AlistairRunnerProps {
  onClose: () => void;
}

export default function AlistairRunner({ onClose }: AlistairRunnerProps) {
  const { inventory, useItem, addXpDirectly, addGoldDirectly } = useGame();
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [gameState, setGameState] = useState<'idle' | 'running' | 'gameover' | 'victory' | 'victory_sequence'>('idle');
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [currentLevel, setCurrentLevel] = useState<'forest' | 'sanctuary' | 'neon_grid' | 'aurora_glow' | 'cosmic_dawn' | 'arcade' | 'playground' | 'museum' | 'water' | 'volcano'>('forest');
  const [highScore, setHighScore] = useState(() => {
    return Number(localStorage.getItem('alistair_runner_highscore') || '0');
  });

  // Game loop variables stored in refs to avoid React re-renders interrupting the Canvas animation loop
  const stateRef = useRef({
    gameState: 'idle',
    score: 0,
    coins: 0,
    speed: 5,
    level: 'forest',
    transitionState: 'none' as 'none' | 'fading_out' | 'fading_in',
    transitionAlpha: 0,
    transitionTimer: 0,
    bubbles: [] as Array<{ x: number; y: number; size: number; vy: number; alpha: number; color: string }>,
    sparks: [] as Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; color: string }>,
    wizard: {
      y: 200,
      vy: 0,
      width: 30,
      height: 40,
      isJumping: false,
      isSliding: false,
      slideTimer: 0
    },
    obstacles: [] as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      type: 'low' | 'high';
      icon: string;
    }>,
    collectibles: [] as Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      collected: boolean;
      icon: string;
    }>,
    stars: [] as Array<{ x: number; y: number; speed: number; size: number }>,
    groundY: 330,
    gravity: 0.6,
    spawnTimer: 0,
    coinTimer: 0,
    hasXpBooster: false,
    hasBossKey: false,
    hasElixirMight: false,
    hasLuckyCharm: false,
    shieldQty: 0,
    potionQty: 0,
    hasUsedShieldThisRun: false,
    hasUsedPotionThisRun: false,
    invincibilityFrames: 0,
    activeItemNotice: '',
    clouds: [] as Array<{ x: number; y: number; size: number; speed: number }>,
    bgMountains: [] as Array<{ x: number; width: number; height: number; color: string }>,
    fgMountains: [] as Array<{ x: number; width: number; height: number; color: string }>,
    platforms: [] as Array<{ x: number; y: number; width: number; height: number; icon: string }>,
    platformTimer: 0,
    victoryTimer: 0,
    sanctuaryX: 800,
    wizardVictoryX: 120
  });

  // Manage mysterious synthesizer background music theme lifecycle
  useEffect(() => {
    startMysteriousTheme();
    return () => {
      stopMysteriousTheme();
    };
  }, []);

  // Handle keyboard inputs
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const state = stateRef.current;
      if (stateRef.current.gameState !== 'running') return;

      if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
        e.preventDefault();
        if (!state.wizard.isJumping && !state.wizard.isSliding) {
          state.wizard.vy = -12; // Jump force
          state.wizard.isJumping = true;
          playSound('click');
        }
      }

      if (e.code === 'ArrowDown' || e.code === 'KeyS') {
        e.preventDefault();
        if (!state.wizard.isJumping && !state.wizard.isSliding) {
          state.wizard.isSliding = true;
          state.wizard.slideTimer = 35; // Duration of slide in frames
          state.wizard.height = 20; // Hitbox shrinks
          playSound('click');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const startGame = () => {
    playSound('click');
    startMysteriousTheme(); // ensures synthesis context starts/resumes upon user interaction
    const state = stateRef.current;
    state.gameState = 'running';
    state.score = 0;
    state.coins = 0;
    state.level = 'forest';
    state.transitionState = 'none';
    state.transitionAlpha = 0;
    state.transitionTimer = 0;
    state.bubbles = [];
    state.sparks = [];
    setCurrentLevel('forest');
    
    // Read inventory items
    const xpBoosterQty = inventory.find(i => i.id === 'xp_booster')?.qty || 0;
    const bossKeyQty = inventory.find(i => i.id === 'boss_key')?.qty || 0;
    const elixirMightQty = inventory.find(i => i.id === 'elixir_might')?.qty || 0;
    const luckyCharmQty = inventory.find(i => i.id === 'lucky_charm')?.qty || 0;

    state.hasXpBooster = xpBoosterQty > 0;
    state.hasBossKey = bossKeyQty > 0;
    state.hasElixirMight = elixirMightQty > 0;
    state.hasLuckyCharm = luckyCharmQty > 0;
    state.shieldQty = inventory.find(i => i.id === 'task_shield')?.qty || 0;
    state.potionQty = inventory.find(i => i.id === 'hp_potion')?.qty || 0;
    state.hasUsedShieldThisRun = false;
    state.hasUsedPotionThisRun = false;
    state.invincibilityFrames = 0;
    state.activeItemNotice = '';

    // Apply item physics modifications
    state.gravity = state.hasElixirMight ? 0.51 : 0.6; // 15% lower gravity
    state.speed = state.hasBossKey ? 4 : 5; // Start constant speed based on Chronometer Key status

    state.wizard.y = state.groundY - state.wizard.height;
    state.wizard.vy = 0;
    state.wizard.isJumping = false;
    state.wizard.isSliding = false;
    state.wizard.height = 40;
    state.obstacles = [];
    state.collectibles = [];
    state.platforms = [];
    state.spawnTimer = 0;
    state.coinTimer = 0;
    state.platformTimer = 100;
    state.victoryTimer = 0;
    state.sanctuaryX = 800;
    state.wizardVictoryX = 120;

    // Initialize scrolling forest light sparkles (Very soft & minimal quantity to prevent eye strain!)
    state.stars = Array.from({ length: 8 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 240 + 20,
      speed: Math.random() * 0.05 + 0.02, // 8x slower scrolling!
      size: Math.random() * 2 + 1
    }));

    // Initialize scrolling fluffy vector clouds (Reduced quantity and extremely slow drift!)
    state.clouds = [
      { x: 150, y: 60, size: 45, speed: 0.03 },
      { x: 500, y: 80, size: 55, speed: 0.02 }
    ];

    // Initialize parallax distant mountains (Very soft & faint misty peaks)
    state.bgMountains = Array.from({ length: 5 }, (_, i) => ({
      x: i * 190,
      width: 280,
      height: 120 + Math.random() * 50,
      color: 'rgba(148, 163, 184, 0.16)' // ultra-soft misty slate-blue
    }));

    // Initialize closer lush hills (Ultra-soft pastel greens)
    state.fgMountains = Array.from({ length: 6 }, (_, i) => ({
      x: i * 160,
      width: 220,
      height: 50 + Math.random() * 30,
      color: 'rgba(74, 222, 128, 0.18)' // super-soft grassy green transparency
    }));

    setGameState('running');
    setScore(0);
    setCoins(0);
  };

  const selectLevelAndStart = (lvl: any, startingScore: number) => {
    playSound('success');
    startMysteriousTheme(); // ensures synthesis context starts/resumes upon user interaction
    const state = stateRef.current;
    state.gameState = 'running';
    state.score = startingScore;
    state.coins = 0;
    state.level = lvl;
    state.transitionState = 'none';
    state.transitionAlpha = 0;
    state.transitionTimer = 0;
    state.bubbles = [];
    state.sparks = [];

    // Read inventory items
    const xpBoosterQty = inventory.find(i => i.id === 'xp_booster')?.qty || 0;
    const bossKeyQty = inventory.find(i => i.id === 'boss_key')?.qty || 0;
    const elixirMightQty = inventory.find(i => i.id === 'elixir_might')?.qty || 0;
    const luckyCharmQty = inventory.find(i => i.id === 'lucky_charm')?.qty || 0;

    state.hasXpBooster = xpBoosterQty > 0;
    state.hasBossKey = bossKeyQty > 0;
    state.hasElixirMight = elixirMightQty > 0;
    state.hasLuckyCharm = luckyCharmQty > 0;
    state.shieldQty = inventory.find(i => i.id === 'task_shield')?.qty || 0;
    state.potionQty = inventory.find(i => i.id === 'hp_potion')?.qty || 0;
    state.hasUsedShieldThisRun = false;
    state.hasUsedPotionThisRun = false;
    state.invincibilityFrames = 0;
    state.activeItemNotice = '';

    // Apply item physics modifications
    state.gravity = state.hasElixirMight ? 0.51 : 0.6; // 15% lower gravity
    state.speed = state.hasBossKey ? 4 : 5;

    state.wizard.y = state.groundY - state.wizard.height;
    state.wizard.vy = 0;
    state.wizard.isJumping = false;
    state.wizard.isSliding = false;
    state.wizard.height = 40;
    state.obstacles = [];
    state.collectibles = [];
    state.platforms = [];
    state.spawnTimer = 0;
    state.coinTimer = 0;
    state.platformTimer = 100;
    state.victoryTimer = 0;
    state.sanctuaryX = 800;
    state.wizardVictoryX = 120;

    // Initialize scrolling forest light sparkles
    state.stars = Array.from({ length: 8 }, () => ({
      x: Math.random() * 800,
      y: Math.random() * 240 + 20,
      speed: Math.random() * 0.05 + 0.02,
      size: Math.random() * 2 + 1
    }));

    // Initialize scrolling fluffy vector clouds
    state.clouds = [
      { x: 150, y: 60, size: 45, speed: 0.03 },
      { x: 500, y: 80, size: 55, speed: 0.02 }
    ];

    // Initialize parallax distant mountains
    state.bgMountains = Array.from({ length: 5 }, (_, i) => ({
      x: i * 190,
      width: 280,
      height: 120 + Math.random() * 50,
      color: 'rgba(148, 163, 184, 0.16)'
    }));

    // Initialize closer lush hills
    state.fgMountains = Array.from({ length: 6 }, (_, i) => ({
      x: i * 160,
      width: 220,
      height: 50 + Math.random() * 30,
      color: 'rgba(74, 222, 128, 0.18)'
    }));

    // React sync
    setCurrentLevel(lvl);
    setScore(startingScore);
    setCoins(0);
    setGameState('running');
  };

  // Helper rounded rectangle utility to ensure safety
  const drawRoundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  };

  // Draw Alistair player character beautifully as a 2D emoji with stardust sliding particles
  const drawWizardCharacter = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    _width: number,
    height: number,
    isSliding: boolean,
    invincibilityFrames: number,
    sparks: any[],
    level: string
  ) => {
    const isFlashing = invincibilityFrames > 0 && Math.floor(invincibilityFrames / 6) % 2 === 0;
    if (isFlashing) return;

    // Slide smoke trail particles (emitted from beneath him)
    if (isSliding && Math.random() < 0.25) {
      sparks.push({
        x: x + 10,
        y: y + height - Math.random() * 6,
        vx: -2 - Math.random() * 2,
        vy: -Math.random() * 0.5,
        size: Math.random() * 3 + 1,
        alpha: 1.0,
        color: level === 'sanctuary' ? '#c084fc' : '#38bdf8'
      });
    }

    ctx.save();
    if (isSliding) {
      ctx.font = '22px serif';
      ctx.fillText('⚡', x - 20, y + 16);
      ctx.fillText('🧙‍♂️', x, y + 18);
    } else {
      ctx.font = '30px serif';
      ctx.fillText('🧙‍♂️', x, y + 32);
    }
    ctx.restore();
  };

  const drawArcadeObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- GLOWING PACMAN GHOST PIXEL ART ---
      ctx.fillStyle = '#f43f5e'; // Pink-red ghost
      ctx.strokeStyle = '#fda4af';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.arc(w / 2, h / 2 - 2, 8, Math.PI, 0, false);
      ctx.lineTo(w / 2 + 8, h - 2);
      // skirt wave
      ctx.lineTo(w / 2 + 5, h - 5);
      ctx.lineTo(w / 2, h - 2);
      ctx.lineTo(w / 2 - 5, h - 5);
      ctx.lineTo(w / 2 - 8, h - 2);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Ghost eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(w / 2 - 3, h / 2 - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(w / 2 + 3, h / 2 - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#0284c7'; // blue pupils looking forward
      ctx.beginPath();
      ctx.arc(w / 2 - 2, h / 2 - 2, 1, 0, Math.PI * 2);
      ctx.arc(w / 2 + 4, h / 2 - 2, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // --- RETRO NEON JOYSTICK ---
      ctx.fillStyle = '#1e1b4b'; // dark base
      ctx.strokeStyle = '#38bdf8'; // cyan border
      ctx.lineWidth = 2;
      ctx.fillRect(w / 2 - 8, h - 14, 16, 12);
      ctx.strokeRect(w / 2 - 8, h - 14, 16, 12);

      // Joystick stick
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(w / 2, h - 14);
      ctx.lineTo(w / 2, h - 26);
      ctx.stroke();

      // Red joystick ball knob
      ctx.fillStyle = '#ef4444'; // Red glowing ball
      ctx.beginPath();
      ctx.arc(w / 2, h - 28, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawPlaygroundObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- PLAYGROUND SOCCER NET / NET ---
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'; // translucent net
      ctx.strokeStyle = '#475569'; // steel posts
      ctx.lineWidth = 2;
      
      // Draw soccer post frame
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, 4);
      ctx.lineTo(w, 4);
      ctx.lineTo(w, h);
      ctx.stroke();

      // Net wire mesh lines
      ctx.strokeStyle = 'rgba(203, 213, 225, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 4; x < w; x += 6) {
        ctx.moveTo(x, 4);
        ctx.lineTo(x - 4, h);
      }
      for (let y = 8; y < h; y += 6) {
        ctx.moveTo(0, y);
        ctx.lineTo(w, y);
      }
      ctx.stroke();

      // Draw a small colorful soccer ball sitting next to the net!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#020617';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w - 6, h - 5, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // black patterns
      ctx.fillStyle = '#020617';
      ctx.fillRect(w - 7, h - 7, 2, 2);
      ctx.fillRect(w - 5, h - 4, 2, 2);
    } else {
      // --- FLYING BASEBALL BAT & FLYING BALL ---
      // Draw wooden baseball bat at an angle
      ctx.save();
      ctx.translate(w / 2, h / 2);
      ctx.rotate(-Math.PI / 4);
      
      ctx.fillStyle = '#d97706'; // Wood brown bat
      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 1;
      
      // Rounded bat shape
      ctx.beginPath();
      ctx.moveTo(-12, -2.5);
      ctx.lineTo(12, -4);
      ctx.quadraticCurveTo(14, -4, 14, 0);
      ctx.quadraticCurveTo(14, 4, 12, 4);
      ctx.lineTo(-12, 2.5);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Grip tape on bat handle
      ctx.fillStyle = '#020617';
      ctx.fillRect(-12, -2, 5, 4);
      ctx.restore();

      // Draw a small white baseball flying right next to the bat!
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#ef4444'; // red seams
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w - 4, 6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawWaterObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- CRABBY OCTOPUS / SEA URCHIN ---
      ctx.fillStyle = '#ea580c'; // orange sea urchin / octopus
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.arc(w / 2, h - 8, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // little spikes sticking out
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 2;
      for (let deg = 0; deg < Math.PI * 2; deg += Math.PI / 4) {
        const sx1 = w / 2 + Math.cos(deg) * 8;
        const sy1 = h - 8 + Math.sin(deg) * 8;
        const sx2 = w / 2 + Math.cos(deg) * 13;
        const sy2 = h - 8 + Math.sin(deg) * 13;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
      }
    } else {
      // --- SWIMMING TROPICAL FISH ---
      ctx.fillStyle = '#3b82f6'; // vibrant blue fish
      ctx.strokeStyle = '#bae6fd';
      ctx.lineWidth = 1;

      // Fish body oval
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 9, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Fish tail fin
      ctx.fillStyle = '#fb923c'; // orange tail
      ctx.beginPath();
      ctx.moveTo(w / 2 - 9, h / 2);
      ctx.lineTo(w / 2 - 16, h / 2 - 6);
      ctx.lineTo(w / 2 - 16, h / 2 + 6);
      ctx.closePath();
      ctx.fill();

      // Fish eye
      ctx.fillStyle = '#020617';
      ctx.beginPath();
      ctx.arc(w / 2 + 5, h / 2 - 2, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawVolcanoObstacle = (ctx: CanvasRenderingContext2D, obs: any, sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- SHARP GLOWING OBSIDIAN MAGMA SPIKE ---
      ctx.fillStyle = '#180808'; // basalt black core
      ctx.strokeStyle = '#f97316'; // glowing magma border
      ctx.lineWidth = 2.2;
      
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w / 2, 4);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // --- FLYING MAGMA FIREBALL ---
      // Glowing core
      ctx.fillStyle = '#ef4444'; // hot red core
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 8, 0, Math.PI * 2);
      ctx.fill();

      // Flaming yellow outer aura
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Spawning trailing fire sparks in state
      if (Math.random() < 0.1) {
        sparks.push({
          x: obs.x + w / 2,
          y: obs.y + h / 2,
          vx: -2 - Math.random() * 2,
          vy: (Math.random() - 0.5) * 1.5,
          size: Math.random() * 3 + 1.5,
          alpha: 1.0,
          color: '#fb923c'
        });
      }
    }
    ctx.restore();
  };

  const drawMuseumObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- Terracotta Amphora Vase on Marble Pedestal ---
      // Pedestal
      ctx.fillStyle = '#f1f5f9'; // marble white
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.5;
      ctx.fillRect(w / 2 - 6, h - 12, 12, 12);
      ctx.strokeRect(w / 2 - 6, h - 12, 12, 12);

      // Amphora Vase
      ctx.fillStyle = '#ea580c'; // rich terracotta orange
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1;
      
      // Vase body arc
      ctx.beginPath();
      ctx.arc(w / 2, h - 19, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // neck
      ctx.fillRect(w / 2 - 2.5, h - 26, 5, 4);
      ctx.strokeRect(w / 2 - 2.5, h - 26, 5, 4);
      // rim
      ctx.fillRect(w / 2 - 3.5, h - 28, 7, 2);
      // handles
      ctx.strokeStyle = '#9a3412';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(w / 2 - 5, h - 22, 2.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(w / 2 + 5, h - 22, 2.5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      // --- HANGING MEDIEVAL CHANDELIER ---
      ctx.strokeStyle = '#475569'; // steel chain
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2, 0);
      ctx.lineTo(w / 2, 12);
      ctx.stroke();

      // Brass base ring
      ctx.fillStyle = '#fbbf24'; // brass gold
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 1;
      ctx.fillRect(w / 2 - 12, 12, 24, 4);
      ctx.strokeRect(w / 2 - 12, 12, 24, 4);

      // Glowing candles (3 small orange sparks)
      ctx.fillStyle = '#f97316';
      ctx.fillRect(w / 2 - 10, 6, 2, 6);
      ctx.fillRect(w / 2 - 1, 6, 2, 6);
      ctx.fillRect(w / 2 + 8, 6, 2, 6);
    }
    ctx.restore();
  };

  const drawCyberpunkObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- HOLO BARRICADE ---
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)'; // Neon pink translucent fill
      ctx.strokeStyle = '#f43f5e'; // Bright neon pink solid border
      ctx.lineWidth = 2.5;
      drawRoundRect(ctx, 0, 0, w, h, 4);
      ctx.fill();
      ctx.stroke();
      // Horizontal holo-scanline stripes
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
      ctx.lineWidth = 1.5;
      for (let y = 6; y < h; y += 8) {
        ctx.beginPath();
        ctx.moveTo(2, y);
        ctx.lineTo(w - 2, y);
        ctx.stroke();
      }
    } else {
      // --- SECURITY DRONE ORB ---
      ctx.fillStyle = '#0f172a'; // Slate drone core
      ctx.strokeStyle = '#38bdf8'; // Glowing cyan border
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Blinking red camera lens
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(w / 2 + 2, h / 2 - 2, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  };

  const drawArcticObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- ICE CRYSTAL SPIKES ---
      ctx.fillStyle = '#e2e8f0'; // Base snowy slate
      ctx.strokeStyle = '#94a3b8'; // Ice border
      ctx.lineWidth = 1.5;
      
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(w / 4, 10);
      ctx.lineTo(w / 2, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#bae6fd'; // Cyan ice overlay spike
      ctx.beginPath();
      ctx.moveTo(w / 3, h);
      ctx.lineTo(3 * w / 4, 2);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // --- HANGING ICICLES ---
      ctx.fillStyle = '#38bdf8'; // translucent icy cyan
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 1.5;
      
      // Draw three hanging icicles
      for (let i = 0; i < 3; i++) {
        const ix = i * 10;
        const ih = 15 + (i % 2) * 10;
        ctx.beginPath();
        ctx.moveTo(ix, 0);
        ctx.lineTo(ix + 5, ih);
        ctx.lineTo(ix + 10, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  const drawCosmicObstacle = (ctx: CanvasRenderingContext2D, obs: any, _sparks: any[]) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      // --- CRAGGY ASTEROID BOULDER ---
      ctx.fillStyle = '#334155'; // Dark slate rock
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      
      ctx.beginPath();
      ctx.moveTo(6, 12);
      ctx.lineTo(w / 2, 2);
      ctx.lineTo(w - 4, 10);
      ctx.lineTo(w, h - 8);
      ctx.lineTo(w / 2, h);
      ctx.lineTo(2, h - 4);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // --- PLANETARY RING SPHERE ---
      ctx.fillStyle = '#f472b6'; // space pink planet
      ctx.strokeStyle = '#db2777';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Saturn ring
      ctx.strokeStyle = '#fbcfe8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(w / 2, h / 2, 15, 4, -Math.PI / 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  };

  // Standalone vector drawing: Sanctuary themed obstacles
  const drawSanctuaryObstacle = (
    ctx: CanvasRenderingContext2D,
    obs: any,
    _bubbles: any[],
    sparks: any[]
  ) => {
    ctx.save();
    ctx.translate(obs.x, obs.y);
    const w = obs.width;
    const h = obs.height;

    if (obs.type === 'low') {
      if (obs.icon === 'cauldron') {
        // --- BUBBLING WITCH CAULDRON ---
        ctx.fillStyle = '#1e293b'; // legs
        ctx.fillRect(4, h - 4, 4, 4);
        ctx.fillRect(w - 8, h - 4, 4, 4);

        ctx.fillStyle = '#334155'; // belly
        ctx.beginPath();
        ctx.arc(w / 2, h / 2 + 1, w / 2 - 1, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b'; // shaded belly
        ctx.beginPath();
        ctx.arc(w / 2 - 3, h / 2 + 1, w / 2 - 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.arc(w / 2 - 5, h / 2 + 1, w / 2 - 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#475569'; // handles
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(1, h / 2 + 1, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(w - 1, h / 2 + 1, 3, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#64748b'; // flared rim
        drawRoundRect(ctx, 2, 4, w - 4, 4, 2);
        ctx.fill();

        ctx.fillStyle = '#22c55e'; // green brew boiling
        ctx.beginPath();
        ctx.ellipse(w / 2, 6, w / 2 - 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // --- GLASS POTION BOTTLE RACK ---
        ctx.fillStyle = '#7c2d12'; // wood rack
        ctx.fillRect(-2, h - 6, w + 4, 6);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-2, h - 2, w + 4, 2);

        // Flask 1 (Round, red fluid)
        ctx.save();
        ctx.translate(3, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(5, 12, 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
        ctx.fillRect(4, 3, 2, 5);
        ctx.fillStyle = '#b45309'; // cork
        ctx.fillRect(3.5, 1.5, 3, 2);

        ctx.fillStyle = '#ef4444'; // fluid
        ctx.beginPath();
        ctx.arc(5, 12, 4.5, Math.PI * 0.15, Math.PI * 0.85);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // shine
        ctx.beginPath();
        ctx.arc(3.5, 10.5, 1, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Flask 2 (Triangle, blue fluid)
        ctx.save();
        ctx.translate(14, 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(5, 4);
        ctx.lineTo(9, 17);
        ctx.lineTo(1, 17);
        ctx.closePath();
        ctx.stroke();
        ctx.fill();
        ctx.fillRect(4, 1, 2, 4);
        ctx.fillStyle = '#b45309';
        ctx.fillRect(3.5, 0, 3, 2.2);

        ctx.fillStyle = '#a855f7'; // liquid blue
        ctx.beginPath();
        ctx.moveTo(5, 9);
        ctx.lineTo(8.2, 16.2);
        ctx.lineTo(1.8, 16.2);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; // glass shine
        ctx.fillRect(2.8, 13, 1.5, 1.5);
        ctx.restore();
      }
    } else {
      if (obs.icon === 'flying_witch') {
        // --- FLYING WITCH ON BROOM (TRADITIONAL "ACTUAL WITCH" DESIGN) ---
        // 1. Broom stick & straws (classic wood & straw)
        ctx.fillStyle = '#78350f'; // traditional brown wood broom stick
        ctx.fillRect(-6, h / 2 - 1.5, w + 8, 2.5);
        
        ctx.fillStyle = '#eab308'; // classic yellow straws
        ctx.beginPath();
        ctx.moveTo(-6, h / 2 - 1);
        ctx.lineTo(-16, h / 2 - 8);
        ctx.lineTo(-14, h / 2 + 7);
        ctx.closePath();
        ctx.fill();

        // 2. Witch Cloak - traditional deep purple gown
        ctx.fillStyle = '#3b0764'; // deep royal dark purple cloak
        ctx.strokeStyle = '#a78bfa'; // soft lavender outline to separate from dark walls
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(3, h / 2 + 2);
        ctx.lineTo(w - 6, h / 2 - 8);
        ctx.lineTo(w - 9, h / 2 + 8);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // 3. Face - traditional green witch skin
        ctx.fillStyle = '#16a34a'; // classic green skin
        ctx.beginPath();
        ctx.arc(w - 7, h / 2 - 6, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Pointed nose
        ctx.beginPath();
        ctx.moveTo(w - 4, h / 2 - 6);
        ctx.lineTo(w + 1, h / 2 - 4);
        ctx.lineTo(w - 5, h / 2 - 3);
        ctx.closePath();
        ctx.fill();

        // Classic black eye dot
        ctx.fillStyle = '#020617';
        ctx.fillRect(w - 7, h / 2 - 8, 1.2, 1.2);

        // 4. Pointed Hat - classic dark obsidian/black hat
        ctx.fillStyle = '#0f172a'; // traditional dark hat
        ctx.strokeStyle = '#64748b'; // soft slate-grey outline to separate from sky
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w - 12, h / 2 - 8);
        ctx.lineTo(w - 1, h / 2 - 8);
        ctx.lineTo(w - 7, h / 2 - 20);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Gold hat band
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(w - 10, h / 2 - 10, 7, 2);

      } else {
        // --- FLOATING ANCIENT SPELLBOOK ---
        ctx.fillStyle = '#78350f'; // leather cover
        drawRoundRect(ctx, 0, h / 2 - 2, w, 8, 3);
        ctx.fill();
        ctx.fillStyle = '#eab308'; // gold trim
        ctx.fillRect(0, h / 2 - 2, 2, 8);
        ctx.fillRect(w - 2, h / 2 - 2, 2, 8);

        ctx.fillStyle = '#f8fafc'; // open pages left
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2 + 1);
        ctx.quadraticCurveTo(w / 4, h / 2 - 8, 2, h / 2 - 4);
        ctx.lineTo(2, h / 2 + 2);
        ctx.quadraticCurveTo(w / 4, h / 2 - 2, w / 2, h / 2 + 4);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#f8fafc'; // open pages right
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2 + 1);
        ctx.quadraticCurveTo(3 * w / 4, h / 2 - 8, w - 2, h / 2 - 4);
        ctx.lineTo(w - 2, h / 2 + 2);
        ctx.quadraticCurveTo(3 * w / 4, h / 2 - 2, w / 2, h / 2 + 4);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1'; // center divide
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w / 2, h / 2 + 1);
        ctx.lineTo(w / 2, h / 2 + 4);
        ctx.stroke();

        ctx.strokeStyle = '#94a3b8'; // text line indicators
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(6, h / 2 - 2); ctx.lineTo(12, h / 2 - 2);
        ctx.moveTo(5, h / 2);     ctx.lineTo(11, h / 2);
        ctx.moveTo(w - 12, h / 2 - 2); ctx.lineTo(w - 6, h / 2 - 2);
        ctx.moveTo(w - 11, h / 2);     ctx.lineTo(w - 5, h / 2);
        ctx.stroke();

        if (Math.random() < 0.2) {
          sparks.push({
            x: obs.x + 5 + Math.random() * (w - 10),
            y: obs.y + h / 2 - 6,
            vx: (Math.random() - 0.5) * 0.4,
            vy: -0.4 - Math.random() * 0.6,
            size: Math.random() * 2 + 1,
            alpha: 1.0,
            color: '#facc15'
          });
        }
      }
    }

    ctx.restore();
  };

  // Standalone vector drawing: Premium 2D gold coins (understandable & recognizable!)
  const drawSanctuaryCollectible = (
    ctx: CanvasRenderingContext2D,
    coin: any,
    sparks: any[]
  ) => {
    ctx.save();
    const bobY = Math.sin(Date.now() * 0.007 + coin.x * 0.05) * 3;
    ctx.translate(coin.x, coin.y + bobY);

    const w = coin.width;
    const h = coin.height;
    const currentLevelName = stateRef.current.level;

    // --- PREMIUM GOLD COIN DRAWN EVERYWHERE ---
    ctx.fillStyle = '#fbbf24'; // rich bright gold
    ctx.strokeStyle = '#d97706'; // amber border
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 2 - 3, 0, Math.PI * 2);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(w / 2 - 2.5, h / 2 - 2.5, 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Level-themed colored sparkles trailing from the gold coin
    if (Math.random() < 0.02) {
      let sparkColor = '#fef08a'; // default warm gold
      if (currentLevelName === 'neon_grid') {
        sparkColor = '#38bdf8'; // cyberpunk cyan
      } else if (currentLevelName === 'aurora_glow') {
        sparkColor = '#bae6fd'; // arctic ice blue
      } else if (currentLevelName === 'cosmic_dawn') {
        sparkColor = '#fef08a'; // cosmic gold
      }

      sparks.push({
        x: coin.x + w / 2,
        y: coin.y + h / 2 + bobY,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        alpha: 1.0,
        color: sparkColor
      });
    }

    ctx.restore();
  };

  // Main Canvas game rendering loop
  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const gameLoop = () => {
      const state = stateRef.current;

      // Clear entire high-res backing store
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Save context state and scale from 800x400 virtual coordinate space to high-res backing store
      ctx.save();
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      ctx.scale((rect.width * dpr) / 800, (rect.height * dpr) / 400);

      // Define dynamic scroll multiplier for cinematic victory stop deceleration
      let scrollMult = 1;
      if (state.gameState === 'victory_sequence') {
        scrollMult = Math.max(0, 1 - state.victoryTimer / 60);
      } else if (state.gameState === 'victory') {
        scrollMult = 0;
      }

      if (state.gameState === 'idle') {
        // Solid clean dark slate canvas
        ctx.fillStyle = '#0f172a'; // slate-900
        ctx.fillRect(0, 0, 800, 400);

        // Draw some subtle ambient particles drifting
        ctx.fillStyle = 'rgba(253, 224, 71, 0.12)';
        for (let i = 0; i < 8; i++) {
          const time = Date.now() * 0.001 + i * 30;
          const bx = (i * 100 + Math.sin(time) * 12) % 800;
          const by = (400 - (time * 15) % 400);
          ctx.beginPath();
          ctx.arc(bx, by, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        if (state.level === 'forest') {
        // --- LEVEL 1: FOREST BACKGROUND ---
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#38bdf8'); // Sky blue
        skyGrad.addColorStop(0.6, '#bae6fd'); // Light pastel sky blue
        skyGrad.addColorStop(1, '#f0f9ff'); // Very soft light blue mist near ground
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Draw the Sun ☀️
        ctx.save();
        const sunTime = Date.now() * 0.001;
        const sunGlowRadius = 38 + Math.sin(sunTime * 1.5) * 4; // slow pulsing
        ctx.fillStyle = 'rgba(253, 224, 71, 0.22)';
        ctx.beginPath();
        ctx.arc(680, 65, sunGlowRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#facc15'; // Golden solid circle
        ctx.beginPath();
        ctx.arc(680, 65, 25, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Update and Draw Clouds
        ctx.fillStyle = 'rgba(255, 255, 255, 0.82)'; // white fluffy clouds
        state.clouds.forEach(cloud => {
          if (state.gameState === 'running' || state.gameState === 'victory_sequence') {
            cloud.x -= cloud.speed * (state.speed / 5) * scrollMult;
            if (cloud.x + cloud.size * 1.2 < 0) {
              cloud.x = 800 + Math.random() * 150;
              cloud.y = Math.random() * 80 + 15;
            }
          }
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.size * 0.4, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.3, cloud.y - cloud.size * 0.1, cloud.size * 0.45, 0, Math.PI * 2);
          ctx.arc(cloud.x + cloud.size * 0.6, cloud.y, cloud.size * 0.35, 0, Math.PI * 2);
          ctx.fill();
        });

        // Update and Draw Distant Mountains peaks
        state.bgMountains.forEach(peak => {
          if (state.gameState === 'running' || state.gameState === 'victory_sequence') {
            peak.x -= 0.35 * (state.speed / 5) * scrollMult;
            if (peak.x + peak.width < 0) {
              peak.x = 800 + Math.random() * 50;
              peak.height = 140 + Math.random() * 70;
            }
          }
          ctx.fillStyle = peak.color;
          ctx.beginPath();
          ctx.moveTo(peak.x, state.groundY);
          ctx.lineTo(peak.x + peak.width / 2, state.groundY - peak.height);
          ctx.lineTo(peak.x + peak.width, state.groundY);
          ctx.closePath();
          ctx.fill();
        });

        // Update and Draw Closer Grassy Hills
        state.fgMountains.forEach(peak => {
          if (state.gameState === 'running' || state.gameState === 'victory_sequence') {
            peak.x -= 0.8 * (state.speed / 5) * scrollMult;
            if (peak.x + peak.width < 0) {
              peak.x = 800 + Math.random() * 40;
              peak.height = 60 + Math.random() * 45;
            }
          }
          ctx.fillStyle = peak.color;
          ctx.beginPath();
          ctx.moveTo(peak.x, state.groundY);
          ctx.lineTo(peak.x + peak.width / 2, state.groundY - peak.height);
          ctx.lineTo(peak.x + peak.width, state.groundY);
          ctx.closePath();
          ctx.fill();
        });

        // Draw Parallax Sparkles (magical wind light)
        ctx.fillStyle = 'rgba(253, 224, 71, 0.35)'; // glowing yellow petals/sparkles
        state.stars.forEach(star => {
          ctx.beginPath();
          ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
          ctx.fill();
          if (state.gameState === 'running' || state.gameState === 'victory_sequence') {
            star.x -= star.speed * (state.speed / 5) * scrollMult;
            star.y += Math.sin(Date.now() * 0.002 + star.x) * 0.15; // gentle float wave
            if (star.x < 0) {
              star.x = 800;
              star.y = Math.random() * 220 + 20;
            }
          }
        });

        // Draw Ground base soil
        ctx.fillStyle = '#7c2d12'; // Rich soil brown
        ctx.fillRect(0, state.groundY, 800, 70);

        // Draw Grass top layer
        ctx.fillStyle = '#22c55e'; // Lush green grass
        ctx.fillRect(0, state.groundY, 800, 10);

        // Ground grass highlights
        ctx.fillStyle = '#4ade80';
        for (let i = 0; i < 800; i += 40) {
          ctx.fillRect(i, state.groundY, 6, 4);
        }

        // Ground neon border divider (Mario style yellow-brick edge highlight)
        ctx.strokeStyle = '#fef08a'; // Pastel Yellow edge highlight
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Soil texture strokes
        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 1.5;
        for (let i = 20; i < 800; i += 70) {
          ctx.beginPath();
          ctx.moveTo(i, state.groundY + 22);
          ctx.lineTo(i + 12, state.groundY + 34);
          ctx.stroke();
        }

        // Draw Sanctuary Castle (Victory Cutscene emerging structure)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY; // ground line (330)
          
          // Draw golden circular aura glow centered around columns temple
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 25, 5, sX + 30, gY - 25, 95);
          auraGrad.addColorStop(0, 'rgba(253, 224, 71, 0.48)'); // solid gold center
          auraGrad.addColorStop(0.5, 'rgba(236, 72, 153, 0.22)'); // pink outer aura glow
          auraGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 25, 95, 0, Math.PI * 2);
          ctx.fill();

          // Draw magic sparkles rising from ground
          ctx.fillStyle = 'rgba(253, 224, 71, 0.75)';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.font = '12px serif';
            ctx.fillText('✨', sparkX, sparkY);
          }

          // Draw custom 2D vector Sanctuary Den Gate matching retro game aesthetics
          ctx.save();
          // Draw the background towers of the den/castle
          ctx.lineWidth = 2;

          // Left Tower
          ctx.fillStyle = '#2e1065'; // deep dark purple
          ctx.strokeStyle = '#4f46e5'; // royal indigo border
          ctx.fillRect(sX - 10, gY - 70, 16, 70);
          ctx.strokeRect(sX - 10, gY - 70, 16, 70);
          // Left battlements
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(sX - 10, gY - 75, 4, 5);
          ctx.fillRect(sX - 2, gY - 75, 4, 5);
          ctx.fillRect(sX + 6, gY - 75, 4, 5);

          // Right Tower
          ctx.fillStyle = '#2e1065';
          ctx.strokeStyle = '#4f46e5';
          ctx.fillRect(sX + 54, gY - 70, 16, 70);
          ctx.strokeRect(sX + 54, gY - 70, 16, 70);
          // Right battlements
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(sX + 54, gY - 75, 4, 5);
          ctx.fillRect(sX + 62, gY - 75, 4, 5);
          ctx.fillRect(sX + 70, gY - 75, 4, 5);

          // Main Center Sanctuary Temple Building
          ctx.fillStyle = '#1e1b4b'; // deep indigo fill
          ctx.strokeStyle = '#c084fc'; // glowing lilac border
          ctx.fillRect(sX + 4, gY - 45, 52, 45);
          ctx.strokeRect(sX + 4, gY - 45, 52, 45);

          // Four vertical columns/pillars supporting the temple roof
          ctx.fillStyle = '#4f46e5';
          ctx.fillRect(sX + 8, gY - 45, 4, 45);
          ctx.fillRect(sX + 16, gY - 45, 4, 45);
          ctx.fillRect(sX + 40, gY - 45, 4, 45);
          ctx.fillRect(sX + 48, gY - 45, 4, 45);

          // Central gateway archway (Dark entry den) where Alistair enters
          ctx.fillStyle = '#020617'; // obsidian black interior
          ctx.strokeStyle = '#f472b6'; // glowing rose border
          ctx.beginPath();
          ctx.moveTo(sX + 22, gY);
          ctx.lineTo(sX + 22, gY - 26);
          ctx.quadraticCurveTo(sX + 30, gY - 34, sX + 38, gY - 26);
          ctx.lineTo(sX + 38, gY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Triangular Roof / Pediment
          ctx.fillStyle = '#4f46e5'; // roof base
          ctx.strokeStyle = '#c084fc'; // glowing edge
          ctx.beginPath();
          ctx.moveTo(sX + 2, gY - 45);
          ctx.lineTo(sX + 30, gY - 62);
          ctx.lineTo(sX + 58, gY - 45);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          ctx.restore();

          // Draw Sanctuary text banner in Press Start font above the castle spires
          ctx.textAlign = 'center';
          ctx.fillStyle = '#db2777'; // pink
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("THE SANCTUARY DEN", sX + 30, gY - 82);
          ctx.fillStyle = '#d97706'; // gold
          ctx.fillText('✨ BEWARE WITCHES ✨', sX + 30, gY - 70);

          ctx.restore();
        }
      } else if (state.level === 'sanctuary') {
        // --- LEVEL 2: SANCTUARY INTERIOR BACKGROUND (MINIMALIST & DECORATIVE!) ---
        // Sky linear gradient (deep dark blue to dark violet)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#0f172a'); // Very dark blue-grey slate
        skyGrad.addColorStop(1, '#1e1b4b'); // Deep moody indigo
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Minimalist horizontal wall stone division joints (no busy grids!)
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        for (let y = 40; y < state.groundY; y += 80) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(800, y);
          ctx.stroke();
        }

        // Draw shadow vignette depth glow
        const wallGlow = ctx.createLinearGradient(0, 0, 0, state.groundY);
        wallGlow.addColorStop(0, 'rgba(0, 0, 0, 0.4)'); // subtle shadow top
        wallGlow.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        wallGlow.addColorStop(1, 'rgba(15, 23, 42, 0.6)'); // subtle shadow bottom
        ctx.fillStyle = wallGlow;
        ctx.fillRect(0, 0, 800, state.groundY);

        // Gothic arch windows - Reduced to 2 windows spaced far apart
        const winXPositions = [200, 600];
        winXPositions.forEach((wx) => {
          ctx.save();
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.moveTo(wx - 25, state.groundY - 80);
          ctx.lineTo(wx - 25, state.groundY - 180);
          ctx.quadraticCurveTo(wx - 25, state.groundY - 230, wx, state.groundY - 230);
          ctx.quadraticCurveTo(wx + 25, state.groundY - 230, wx + 25, state.groundY - 180);
          ctx.lineTo(wx + 25, state.groundY - 80);
          ctx.closePath();
          ctx.fill();

          // Stars inside window (gentle blinking)
          ctx.fillStyle = 'rgba(253, 224, 71, ' + (0.35 + Math.sin(Date.now() * 0.003 + wx) * 0.35) + ')';
          ctx.beginPath();
          ctx.arc(wx - 8, state.groundY - 160, 1.5, 0, Math.PI * 2);
          ctx.arc(wx + 10, state.groundY - 190, 1, 0, Math.PI * 2);
          ctx.fill();

          // Giant Purple Moon in window 1 (wx=200)
          if (wx === 200) {
            ctx.fillStyle = 'rgba(168, 85, 247, 0.12)'; // moon aura glow
            ctx.beginPath();
            ctx.arc(wx + 4, state.groundY - 160, 14, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#c084fc'; // purple moon
            ctx.beginPath();
            ctx.arc(wx + 4, state.groundY - 160, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#020617';
            ctx.beginPath();
            ctx.arc(wx + 1, state.groundY - 160, 9, 0, Math.PI * 2);
            ctx.fill();
          }

          // Window stone arch frame
          ctx.strokeStyle = '#334155'; // Dark grey frame
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(wx - 25, state.groundY - 80);
          ctx.lineTo(wx - 25, state.groundY - 180);
          ctx.quadraticCurveTo(wx - 25, state.groundY - 230, wx, state.groundY - 230);
          ctx.quadraticCurveTo(wx + 25, state.groundY - 230, wx + 25, state.groundY - 180);
          ctx.lineTo(wx + 25, state.groundY - 80);
          ctx.stroke();

          // window pane lines
          ctx.strokeStyle = 'rgba(51, 65, 85, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(wx, state.groundY - 80);
          ctx.lineTo(wx, state.groundY - 230);
          ctx.moveTo(wx - 25, state.groundY - 140);
          ctx.lineTo(wx + 25, state.groundY - 140);
          ctx.stroke();
          ctx.restore();
        });

        // Flickering Wall Candles - Reduced to 2 candles spaced far apart (x=100 and x=700)
        const candleXPositions = [100, 700];
        candleXPositions.forEach((cx, idx) => {
          ctx.save();
          ctx.globalAlpha = 0.85; // slightly lower opacity to prevent overlay distraction
          ctx.fillStyle = '#334155'; // metal bracket
          ctx.fillRect(cx - 2, state.groundY - 150, 4, 18);
          ctx.fillRect(cx - 5, state.groundY - 154, 10, 4);

          ctx.fillStyle = '#f3f4f6'; // wax column
          ctx.fillRect(cx - 3, state.groundY - 174, 6, 20);

          ctx.fillStyle = '#1e293b'; // wick
          ctx.fillRect(cx - 0.5, state.groundY - 177, 1, 3);

          const flameTime = Date.now() * 0.007 + idx * 45;
          const flickerHeight = 8 + Math.sin(flameTime) * 1.5;
          const flickerWidth = 4 + Math.cos(flameTime * 1.5) * 1.0;
          
          // flame glow
          const flameGlow = ctx.createRadialGradient(cx, state.groundY - 182, 1, cx, state.groundY - 182, 12);
          flameGlow.addColorStop(0, 'rgba(249, 115, 22, 0.35)');
          flameGlow.addColorStop(0.4, 'rgba(234, 179, 8, 0.15)');
          flameGlow.addColorStop(1, 'rgba(255,255,255,0)');
          ctx.fillStyle = flameGlow;
          ctx.beginPath();
          ctx.arc(cx, state.groundY - 182, 12, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f97316'; // outer orange
          ctx.beginPath();
          ctx.moveTo(cx, state.groundY - 177 - flickerHeight);
          ctx.quadraticCurveTo(cx - flickerWidth, state.groundY - 177 - flickerHeight/2, cx - flickerWidth, state.groundY - 177);
          ctx.quadraticCurveTo(cx, state.groundY - 177 + 2, cx + flickerWidth, state.groundY - 177);
          ctx.quadraticCurveTo(cx + flickerWidth, state.groundY - 177 - flickerHeight/2, cx, state.groundY - 177 - flickerHeight);
          ctx.fill();

          ctx.fillStyle = '#facc15'; // inner yellow
          ctx.beginPath();
          ctx.moveTo(cx, state.groundY - 177 - flickerHeight * 0.7);
          ctx.quadraticCurveTo(cx - flickerWidth * 0.6, state.groundY - 177 - flickerHeight * 0.35, cx - flickerWidth * 0.6, state.groundY - 177);
          ctx.quadraticCurveTo(cx, state.groundY - 177 + 1, cx + flickerWidth * 0.6, state.groundY - 177);
          ctx.quadraticCurveTo(cx + flickerWidth * 0.6, state.groundY - 177 - flickerHeight * 0.35, cx, state.groundY - 177 - flickerHeight * 0.7);
          ctx.fill();
          ctx.restore();
        });

        // 2. Draw Sanctuary Floor (Minimal slate floor)
        ctx.fillStyle = '#1e1b4b'; // Deep slate indigo
        ctx.fillRect(0, state.groundY, 800, 70);

        ctx.strokeStyle = '#4f46e5'; // Glowing division edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // horizontal lines for depth (no perspective grid joints to keep it minimal)
        ctx.strokeStyle = '#312e81';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY + 25);
        ctx.lineTo(800, state.groundY + 25);
        ctx.moveTo(0, state.groundY + 50);
        ctx.lineTo(800, state.groundY + 50);
        ctx.stroke();

        // Draw Cyber-Neon Gateway (Level 2 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Radial aura glow (Cyberpunk Hot Pink and Electric Blue)
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(244, 63, 94, 0.45)'); // Neon pink center
          auraGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.2)'); // Cyan outer glow
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Draw magic cyber floating particles (0 and 1) rising
          ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.font = '10px monospace';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.fillText(i % 2 === 0 ? '0' : '1', sparkX, sparkY);
          }

          // Cyber-Neon Gate Archway
          ctx.lineWidth = 3;
          // Left Pillar
          ctx.strokeStyle = '#f43f5e'; // neon pink
          ctx.fillStyle = '#0f172a'; // slate core
          ctx.fillRect(sX - 8, gY - 80, 12, 80);
          ctx.strokeRect(sX - 8, gY - 80, 12, 80);
          // Right Pillar
          ctx.strokeStyle = '#f43f5e';
          ctx.fillRect(sX + 56, gY - 80, 12, 80);
          ctx.strokeRect(sX + 56, gY - 80, 12, 80);

          // Horizontal wireframe grid lines on the pillars
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
          ctx.lineWidth = 1;
          for (let y = gY - 70; y < gY; y += 15) {
            ctx.beginPath();
            ctx.moveTo(sX - 8, y);
            ctx.lineTo(sX + 4, y);
            ctx.moveTo(sX + 56, y);
            ctx.lineTo(sX + 68, y);
            ctx.stroke();
          }

          // Top Arch Header
          ctx.strokeStyle = '#38bdf8'; // neon cyan
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(sX - 12, gY - 95, 84, 15);
          ctx.strokeRect(sX - 12, gY - 95, 84, 15);

          // Glowing Center Energy Vortex
          ctx.save();
          ctx.translate(sX + 30, gY - 40);
          const rot = Date.now() * 0.003;
          ctx.rotate(rot);
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.8)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(0, 0, 24, 35, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.rotate(-rot * 2.2);
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.beginPath();
          ctx.ellipse(0, 0, 15, 25, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#f43f5e';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("CYBER-NEON GATEWAY", sX + 30, gY - 110);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText("✨ QUANTUM SHIFT ✨", sX + 30, gY - 100);

          ctx.restore();
        }
      } else if (state.level === 'neon_grid') {
        // --- LEVEL 3: CYBERPUNK DUSK BACKGROUND ---
        // Sky linear gradient (deep violet to hot magenta)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#1e1b4b'); // Deep violet
        skyGrad.addColorStop(0.6, '#4c1d95'); // Moody purple
        skyGrad.addColorStop(1, '#9d174d'); // Hot magenta near ground
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Neon digital nodes (stars) blinking in the sky
        ctx.fillStyle = 'rgba(56, 189, 248, ' + (0.4 + Math.sin(Date.now() * 0.005) * 0.4) + ')'; // Cyan stars
        ctx.fillRect(100, 80, 2, 2);
        ctx.fillRect(350, 40, 3, 3);
        ctx.fillRect(600, 120, 2, 2);
        ctx.fillStyle = 'rgba(244, 63, 94, ' + (0.4 + Math.sin(Date.now() * 0.004 + 1) * 0.4) + ')'; // Rose/Pink stars
        ctx.fillRect(200, 110, 3, 3);
        ctx.fillRect(480, 70, 2, 2);
        ctx.fillRect(720, 90, 3, 3);

        // Low-opacity futuristic wireframe skyscrapers rising in background
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.12)';
        ctx.lineWidth = 1;
        const towerXPositions = [80, 220, 400, 560, 680];
        towerXPositions.forEach((tx, idx) => {
          const tWidth = 55 + (idx % 3) * 15;
          const tHeight = 160 + (idx % 2) * 50;
          ctx.strokeRect(tx, state.groundY - tHeight, tWidth, tHeight);
          // Faint interior lines
          for (let ly = state.groundY - tHeight + 20; ly < state.groundY; ly += 25) {
            ctx.beginPath();
            ctx.moveTo(tx, ly);
            ctx.lineTo(tx + tWidth, ly);
            ctx.stroke();
          }
        });

        // 2. Draw Cyberpunk Floor (Glowing neon pink & cyan grid floor)
        ctx.fillStyle = '#090514'; // Dark carbon floor
        ctx.fillRect(0, state.groundY, 800, 70);

        ctx.strokeStyle = '#f43f5e'; // Glowing neon pink division edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Neon scrolling grid lines
        ctx.strokeStyle = '#38bdf8'; // Glowing cyan grid lines
        ctx.lineWidth = 1;
        const gridOffset = (Date.now() * 0.08) % 30; // Scroll animation
        for (let x = -gridOffset; x < 800; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, state.groundY);
          ctx.lineTo(x - 40, state.groundY + 70); // Perspective angle
          ctx.stroke();
        }
        // Horizontal grid lines
        for (let y = state.groundY + 15; y < state.groundY + 70; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(800, y);
          ctx.stroke();
        }

        // Draw Grid Matrix Portal (Level 3 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Radial aura glow (Cyan and Emerald Green)
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.45)'); // Cyan center
          auraGrad.addColorStop(0.6, 'rgba(16, 185, 129, 0.2)'); // Emerald outer glow
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Draw floating binary/data particles
          ctx.fillStyle = 'rgba(56, 189, 248, 0.8)';
          ctx.font = '8px monospace';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.fillRect(sparkX, sparkY, 4, 4); // small squares
          }

          // Matrix Portal Frame
          ctx.lineWidth = 3;
          // Left Pillar
          ctx.strokeStyle = '#38bdf8'; // Cyan
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(sX - 6, gY - 80, 10, 80);
          ctx.strokeRect(sX - 6, gY - 80, 10, 80);
          // Right Pillar
          ctx.strokeStyle = '#38bdf8';
          ctx.fillRect(sX + 56, gY - 80, 10, 80);
          ctx.strokeRect(sX + 56, gY - 80, 10, 80);

          // Top Arch Header
          ctx.strokeStyle = '#10b981'; // Emerald
          ctx.fillStyle = '#064e3b';
          ctx.fillRect(sX - 10, gY - 95, 80, 15);
          ctx.strokeRect(sX - 10, gY - 95, 80, 15);

          // Inner Vortex Grid
          ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
          ctx.lineWidth = 1.5;
          ctx.save();
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 35, 25, 0, Math.PI * 2);
          ctx.clip();
          // Draw a small grid inside
          ctx.beginPath();
          const gridOffset = (Date.now() * 0.05) % 15;
          for (let gx = sX + 5; gx < sX + 60; gx += 10) {
            ctx.moveTo(gx, gY - 70);
            ctx.lineTo(gx, gY);
          }
          for (let gy = gY - 65 + gridOffset; gy < gY; gy += 10) {
            ctx.moveTo(sX + 5, gy);
            ctx.lineTo(sX + 55, gy);
          }
          ctx.stroke();
          ctx.restore();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#38bdf8';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("GRID MATRIX PORTAL", sX + 30, gY - 110);
          ctx.fillStyle = '#10b981';
          ctx.fillText("❄️ ACCESSING ARCTIC ❄️", sX + 30, gY - 100);

          ctx.restore();
        }

      } else if (state.level === 'aurora_glow') {
        // --- LEVEL 4: ARCTIC AURORA BACKGROUND ---
        // Sky linear gradient (night navy to deep indigo)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#020617'); // Dark slate navy
        skyGrad.addColorStop(0.6, '#0f172a'); // Slate night sky
        skyGrad.addColorStop(1, '#1e1b4b'); // Deep indigo
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Drifting stars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.fillRect(150, 50, 1.5, 1.5);
        ctx.fillRect(300, 120, 2, 2);
        ctx.fillRect(550, 70, 1, 1);
        ctx.fillRect(700, 40, 2, 2);

        // Animated flowing green/teal Aurora Borealis wave!
        ctx.save();
        const timeFactor = Date.now() * 0.0006;
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.18)'; // Teal glow
        ctx.lineWidth = 16;
        ctx.beginPath();
        for (let x = 0; x < 800; x += 40) {
          const y = 80 + Math.sin(x * 0.004 + timeFactor) * 25 + Math.cos(x * 0.002 - timeFactor * 0.5) * 15;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.strokeStyle = 'rgba(34, 197, 94, 0.14)'; // Soft Emerald wave overlay
        ctx.lineWidth = 20;
        ctx.beginPath();
        for (let x = 0; x < 800; x += 40) {
          const y = 95 + Math.sin(x * 0.005 - timeFactor * 0.8) * 20;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // Parallax misty slate icebergs in the background
        ctx.fillStyle = 'rgba(148, 163, 184, 0.15)'; // Misty slate icebergs
        ctx.beginPath();
        const icebergPoints = [
          { x: 50, w: 120, h: 100 },
          { x: 250, w: 180, h: 140 },
          { x: 520, w: 150, h: 110 }
        ];
        icebergPoints.forEach(berg => {
          ctx.moveTo(berg.x, state.groundY);
          ctx.lineTo(berg.x + berg.w / 2, state.groundY - berg.h);
          ctx.lineTo(berg.x + berg.w, state.groundY);
        });
        ctx.fill();

        // Floating, drifting snow crystals falling lazily
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.35 + Math.sin(Date.now() * 0.001) * 0.15) + ')';
        const snowOffset = (Date.now() * 0.015) % 800;
        for (let i = 0; i < 10; i++) {
          const sx = (i * 120 + snowOffset) % 850 - 50;
          const sy = (i * 35 + Math.sin(Date.now() * 0.002 + i) * 15) % 250 + 20;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Draw Arctic Floor (Pure white snow floor with ice-blue details)
        ctx.fillStyle = '#f8fafc'; // Snowy white
        ctx.fillRect(0, state.groundY, 800, 70);

        ctx.strokeStyle = '#94a3b8'; // Soft grey division edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Draw soft cyan ice shadows on ground
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        for (let i = 10; i < 800; i += 60) {
          ctx.beginPath();
          ctx.moveTo(i, state.groundY + 15);
          ctx.lineTo(i + 15, state.groundY + 25);
          ctx.moveTo(i - 20, state.groundY + 40);
          ctx.lineTo(i - 5, state.groundY + 48);
          ctx.stroke();
        }

        // Draw Aurora Warp Portal (Level 4 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Radial aura glow (Teal and Cosmic Indigo/Pink)
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(20, 184, 166, 0.45)'); // Teal center
          auraGrad.addColorStop(0.6, 'rgba(236, 72, 153, 0.2)'); // Pink outer glow
          auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Floating snow / sparkles
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2, 0, Math.PI * 2);
            ctx.fill();
          }

          // Icy Glacial Crystalline Frame
          ctx.lineWidth = 2;
          ctx.fillStyle = '#bae6fd'; // Ice blue
          ctx.strokeStyle = '#0284c7';
          // Draw left crystalline pile
          ctx.beginPath();
          ctx.moveTo(sX - 15, gY);
          ctx.lineTo(sX - 5, gY - 50);
          ctx.lineTo(sX + 2, gY - 80);
          ctx.lineTo(sX + 8, gY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          // Draw right crystalline pile
          ctx.beginPath();
          ctx.moveTo(sX + 52, gY);
          ctx.lineTo(sX + 58, gY - 80);
          ctx.lineTo(sX + 65, gY - 50);
          ctx.lineTo(sX + 75, gY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Glowing Concentric Arch rings (Teal)
          ctx.strokeStyle = '#14b8a6';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 10, 30, Math.PI, 0, false);
          ctx.stroke();
          ctx.strokeStyle = '#22d3ee'; // Cyan inner arch
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 10, 24, Math.PI, 0, false);
          ctx.stroke();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#14b8a6';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("AURORA WARP PORTAL", sX + 30, gY - 110);
          ctx.fillStyle = '#ec4899';
          ctx.fillText("🌌 COSMIC ASCENSION 🌌", sX + 30, gY - 100);

          ctx.restore();
        }

      } else if (state.level === 'cosmic_dawn') {
        // --- LEVEL 5: COSMIC SPACE BACKGROUND ---
        // Sky linear gradient (deep space violet-black to indigo)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#03001e'); // Deep space black-purple
        skyGrad.addColorStop(0.5, '#7303c0'); // Nebula violet
        skyGrad.addColorStop(1, '#ec38bc'); // Space rose
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Glowing pastel rose-gold space nebula cloud
        ctx.save();
        const nebGrad = ctx.createRadialGradient(250, 150, 10, 250, 150, 160);
        nebGrad.addColorStop(0, 'rgba(253, 164, 186, 0.22)'); // pastel rose glow
        nebGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.08)'); // pastel gold blend
        nebGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = nebGrad;
        ctx.beginPath();
        ctx.arc(250, 150, 160, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Sphere silhouettes of distant cozy planets
        ctx.save();
        // Planet 1: Pastel Cyan gas giant
        ctx.fillStyle = 'rgba(56, 189, 248, 0.16)';
        ctx.beginPath();
        ctx.arc(580, 100, 35, 0, Math.PI * 2);
        ctx.fill();
        // Planet Ring
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(580, 100, 55, 12, -Math.PI / 8, 0, Math.PI * 2);
        ctx.stroke();

        // Planet 2: Cozy lavender mini-world
        ctx.fillStyle = 'rgba(167, 139, 250, 0.14)';
        ctx.beginPath();
        ctx.arc(140, 90, 18, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Parallax golden shooting stars
        ctx.strokeStyle = 'rgba(253, 224, 71, ' + (0.25 + Math.sin(Date.now() * 0.003) * 0.15) + ')';
        ctx.lineWidth = 1;
        const shootingStarOffset = (Date.now() * 0.3) % 1500;
        for (let i = 0; i < 2; i++) {
          const sx = 1000 - shootingStarOffset + i * 400;
          const sy = 30 + shootingStarOffset * 0.3 + i * 50;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 35, sy + 12);
          ctx.stroke();
        }

        // Glowing cosmic stardust
        ctx.fillStyle = 'rgba(255, 255, 255, ' + (0.4 + Math.sin(Date.now() * 0.004) * 0.4) + ')';
        ctx.fillRect(180, 140, 2, 2);
        ctx.fillRect(420, 80, 2, 2);
        ctx.fillRect(680, 160, 2, 2);

        // 2. Draw Cosmic Floor (Floating space bridge constructed of golden particles & sparkles)
        ctx.fillStyle = '#0c0a1e'; // Deep void graphite
        ctx.fillRect(0, state.groundY, 800, 70);

        ctx.strokeStyle = '#f472b6'; // Glowing space pink edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Golden floating stardust particle dots
        ctx.fillStyle = 'rgba(253, 224, 71, 0.28)'; // Glowing gold dust
        for (let i = 15; i < 800; i += 30) {
          ctx.beginPath();
          ctx.arc(i + Math.sin(Date.now() * 0.002 + i) * 6, state.groundY + 18 + (i % 3) * 12, 2, 0, Math.PI * 2);
          ctx.arc(i - Math.cos(Date.now() * 0.003 + i) * 4, state.groundY + 42 + (i % 2) * 12, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw Cosmic Space Arcade Gate (Level 5 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Glowing star aura
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(236, 56, 188, 0.45)'); // Rose space center
          auraGrad.addColorStop(0.6, 'rgba(253, 224, 71, 0.2)'); // Gold outer aura
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Rising gold stardust sparkles
          ctx.fillStyle = 'rgba(253, 224, 71, 0.8)';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.beginPath();
            ctx.arc(sparkX, sparkY, 2.5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Cosmic Gate Arch
          ctx.lineWidth = 3;
          // Left Pillar
          ctx.strokeStyle = '#ec38bc'; // Space pink
          ctx.fillStyle = '#03001e';
          ctx.fillRect(sX - 6, gY - 80, 10, 80);
          ctx.strokeRect(sX - 6, gY - 80, 10, 80);
          // Right Pillar
          ctx.strokeStyle = '#ec38bc';
          ctx.fillRect(sX + 56, gY - 80, 10, 80);
          ctx.strokeRect(sX + 56, gY - 80, 10, 80);

          // Top Header
          ctx.strokeStyle = '#fef08a'; // Golden stardust
          ctx.fillStyle = '#7303c0'; // violet
          ctx.fillRect(sX - 10, gY - 95, 80, 15);
          ctx.strokeRect(sX - 10, gY - 95, 80, 15);

          // Inner Glowing Portal Ring
          ctx.strokeStyle = '#fbbf24';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.ellipse(sX + 30, gY - 35, 20, 30, 0, 0, Math.PI * 2);
          ctx.stroke();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ec38bc';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("ARCADE WARP PORTAL", sX + 30, gY - 110);
          ctx.fillStyle = '#fef08a';
          ctx.fillText("🎮 INTO THE ARCADE 🎮", sX + 30, gY - 100);

          ctx.restore();
        }

      } else if (state.level === 'arcade') {
        // --- LEVEL 6: RETRO ARCADE BACKGROUND ---
        // Sky: Light pink sky (as requested!)
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#fce7f3'); // Very soft light pink
        skyGrad.addColorStop(1, '#fbcfe8'); // Warm pink
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Retro pixel arcade cabinets drawing in parallax background!
        ctx.fillStyle = 'rgba(219, 39, 119, 0.12)'; // faint silhouette pink-magenta cabinets
        ctx.fillRect(80, state.groundY - 140, 50, 140);
        ctx.fillRect(220, state.groundY - 120, 40, 120);
        ctx.fillRect(450, state.groundY - 150, 55, 150);
        ctx.fillRect(630, state.groundY - 130, 45, 130);

        // Blinking neon pixels/shapes in sky (retro pixel aesthetics!)
        const blinkAlpha = 0.3 + Math.sin(Date.now() * 0.005) * 0.3;
        ctx.fillStyle = `rgba(236, 72, 153, ${blinkAlpha})`; // Hot pink neon squares
        ctx.fillRect(150, 60, 8, 8);
        ctx.fillRect(520, 100, 6, 6);
        ctx.fillStyle = `rgba(56, 189, 248, ${blinkAlpha})`; // Cyan neon squares
        ctx.fillRect(320, 80, 8, 8);
        ctx.fillRect(680, 50, 6, 6);

        // 2. Draw Arcade Floor (Glowing pink/blue tile grid)
        ctx.fillStyle = '#1e1b4b'; // Deep dark violet tiles
        ctx.fillRect(0, state.groundY, 800, 70);

        ctx.strokeStyle = '#ec4899'; // Glowing hot pink division edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Neon blue tile divisions
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1;
        const gridOffset = (Date.now() * 0.06) % 40;
        for (let x = -gridOffset; x < 800; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, state.groundY);
          ctx.lineTo(x, state.groundY + 70);
          ctx.stroke();
        }
        for (let y = state.groundY + 20; y < state.groundY + 70; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(800, y);
          ctx.stroke();
        }

        // Draw Arcade Gate (Level 6 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Glowing pixel vortex aura
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(236, 72, 153, 0.4)');
          auraGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.18)');
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Floating arcade spark particles
          ctx.fillStyle = '#38bdf8';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.fillRect(sparkX, sparkY, 5, 5); // pixel stars
          }

          // Retro Arcade Gate Cabinet shape!
          ctx.lineWidth = 3;
          ctx.strokeStyle = '#38bdf8'; // Cyan neon border
          ctx.fillStyle = '#0f172a'; // dark body
          ctx.fillRect(sX - 12, gY - 95, 84, 95);
          ctx.strokeRect(sX - 12, gY - 95, 84, 95);

          // Arcade screen (pink glowing vector)
          ctx.fillStyle = '#4c1d95';
          ctx.strokeStyle = '#ec4899';
          ctx.fillRect(sX - 2, gY - 85, 64, 45);
          ctx.strokeRect(sX - 2, gY - 85, 64, 45);

          // Control panel box
          ctx.fillStyle = '#1e1b4b';
          ctx.strokeStyle = '#38bdf8';
          ctx.fillRect(sX - 16, gY - 35, 92, 12);
          ctx.strokeRect(sX - 16, gY - 35, 92, 12);

          // Joystick knob
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(sX + 15, gY - 42, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(sX + 15, gY - 35);
          ctx.lineTo(sX + 15, gY - 38);
          ctx.stroke();

          // Action buttons
          ctx.fillStyle = '#fbbf24';
          ctx.beginPath();
          ctx.arc(sX + 40, gY - 39, 2.5, 0, Math.PI * 2);
          ctx.arc(sX + 48, gY - 39, 2.5, 0, Math.PI * 2);
          ctx.fill();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ec4899';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("RETRO ARCADE PORTAL", sX + 30, gY - 110);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText("🌱 INTO PLAYGROUND 🌱", sX + 30, gY - 100);

          ctx.restore();
        }

      } else if (state.level === 'playground') {
        // --- LEVEL 7: PLAYGROUND BACKGROUND ---
        // Sky: Warm afternoon sky gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#bae6fd'); // Sky blue
        skyGrad.addColorStop(0.7, '#e0f2fe'); // Light sky blue
        skyGrad.addColorStop(1, '#f0fdf4'); // Fresh soft green-blue mist near ground
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Giant sun glowing warm yellow
        ctx.fillStyle = 'rgba(253, 224, 71, 0.15)';
        ctx.beginPath();
        ctx.arc(680, 80, 50, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(680, 80, 20, 0, Math.PI * 2);
        ctx.fill();

        // Parallax leafy trees & bushes (Greenery as requested!)
        ctx.fillStyle = '#16a34a'; // mid green trees
        ctx.beginPath();
        ctx.arc(100, state.groundY - 60, 45, 0, Math.PI * 2);
        ctx.arc(150, state.groundY - 80, 55, 0, Math.PI * 2);
        ctx.arc(200, state.groundY - 60, 45, 0, Math.PI * 2);
        ctx.fill();

        // Playground swings & slide outline silhouettes in background!
        ctx.strokeStyle = 'rgba(21, 128, 61, 0.2)';
        ctx.lineWidth = 2.5;
        // Draw swings
        ctx.beginPath();
        ctx.moveTo(300, state.groundY);
        ctx.lineTo(315, state.groundY - 90);
        ctx.lineTo(365, state.groundY - 90);
        ctx.lineTo(380, state.groundY);
        ctx.moveTo(315, state.groundY - 90);
        ctx.lineTo(330, state.groundY - 90);
        ctx.stroke();
        // swing ropes
        ctx.strokeStyle = 'rgba(21, 128, 61, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(335, state.groundY - 90); ctx.lineTo(335, state.groundY - 30);
        ctx.moveTo(345, state.groundY - 90); ctx.lineTo(345, state.groundY - 30);
        ctx.stroke();
        ctx.fillStyle = 'rgba(21, 128, 61, 0.2)';
        ctx.fillRect(330, state.groundY - 30, 18, 3); // seat

        // 2. Draw Playground Floor (Lush park grass)
        ctx.fillStyle = '#15803d'; // Soil green-brown base
        ctx.fillRect(0, state.groundY, 800, 70);

        ctx.fillStyle = '#22c55e'; // Bright fresh green grass
        ctx.fillRect(0, state.groundY, 800, 12);

        // Little blades of grass highlights
        ctx.fillStyle = '#86efac';
        for (let i = 10; i < 800; i += 30) {
          ctx.fillRect(i + Math.sin(Date.now()*0.002+i)*4, state.groundY + 12 + (i%3)*8, 2, 4);
        }

        // Draw Playground Museum Gate (Level 7 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Glowing classical aura
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(251, 191, 36, 0.45)'); // Warm gold center
          auraGrad.addColorStop(0.6, 'rgba(34, 197, 94, 0.18)'); // Green outer glow
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Rising magical sparkles
          ctx.fillStyle = '#fbbf24';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.font = '10px serif';
            ctx.fillText('🏛️', sparkX - 4, sparkY);
          }

          // Grand Museum Entry Gate (Classical Roman/Greek style arch!)
          ctx.lineWidth = 3;
          // Left Marble Column
          ctx.strokeStyle = '#cbd5e1'; // light slate marble
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(sX - 8, gY - 80, 12, 80);
          ctx.strokeRect(sX - 8, gY - 80, 12, 80);
          // Columns segments
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
          ctx.lineWidth = 1;
          for (let cy = gY - 70; cy < gY; cy += 12) {
            ctx.strokeRect(sX - 8, cy, 12, 1);
          }

          // Right Marble Column
          ctx.strokeStyle = '#cbd5e1';
          ctx.fillStyle = '#f1f5f9';
          ctx.fillRect(sX + 56, gY - 80, 12, 80);
          ctx.strokeRect(sX + 56, gY - 80, 12, 80);
          for (let cy = gY - 70; cy < gY; cy += 12) {
            ctx.strokeRect(sX + 56, cy, 12, 1);
          }

          // Triangular Pediment Roof
          ctx.fillStyle = '#e2e8f0';
          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.moveTo(sX - 14, gY - 80);
          ctx.lineTo(sX + 30, gY - 100);
          ctx.lineTo(sX + 74, gY - 80);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#d97706';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("GRAND MUSEUM ENTRY", sX + 30, gY - 110);
          ctx.fillStyle = '#16a34a';
          ctx.fillText("🏛️ TO THE EXHIBITS 🏛️", sX + 30, gY - 100);

          ctx.restore();
        }

      } else if (state.level === 'museum') {
        // --- LEVEL 8: GRAND MUSEUM INTERIOR BACKGROUND ---
        // Sky: Crimson mahogany wallpaper linear gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#450a0a'); // Dark mahogany red
        skyGrad.addColorStop(1, '#1e0101'); // Near black
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Elegant classical vertical wood wallpaper joints
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.05)';
        ctx.lineWidth = 1;
        for (let x = 60; x < 800; x += 120) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, state.groundY);
          ctx.stroke();
        }

        // Draw Gold-Framed Masterpiece Paintings on the walls!
        const paintingPositions = [150, 480];
        paintingPositions.forEach((px, idx) => {
          ctx.save();
          // Frame border (rich bright gold)
          ctx.fillStyle = '#fbbf24';
          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2.5;
          ctx.fillRect(px - 35, 80, 70, 90);
          ctx.strokeRect(px - 35, 80, 70, 90);

          // Painting canvas (deep navy/slate or green landscape representation)
          ctx.fillStyle = idx === 0 ? '#1e293b' : '#064e3b';
          ctx.fillRect(px - 28, 87, 56, 76);

          // Tiny vector drawings representing art inside the frames
          ctx.fillStyle = '#fbbf24'; // sun/moon in art
          ctx.beginPath();
          ctx.arc(px - 14, 105, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = idx === 0 ? '#7c3aed' : '#b91c1c'; // mountains/hills in art
          ctx.beginPath();
          ctx.moveTo(px - 28, 163);
          ctx.lineTo(px - 10, 135);
          ctx.lineTo(px + 10, 150);
          ctx.lineTo(px + 28, 163);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        });

        // Spotlights casting a warm golden cone of light down on the exhibits
        ctx.save();
        paintingPositions.forEach((px) => {
          const coneGrad = ctx.createLinearGradient(px, 0, px, state.groundY);
          coneGrad.addColorStop(0, 'rgba(253, 224, 71, 0.15)'); // glowing gold light
          coneGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = coneGrad;

          ctx.beginPath();
          ctx.moveTo(px - 15, 0);
          ctx.lineTo(px + 15, 0);
          ctx.lineTo(px + 90, state.groundY);
          ctx.lineTo(px - 90, state.groundY);
          ctx.closePath();
          ctx.fill();
        });
        ctx.restore();

        // 2. Draw Museum Floor (Polished checkerboard marble floor)
        ctx.fillStyle = '#cbd5e1'; // light slate grey
        ctx.fillRect(0, state.groundY, 800, 70);

        // Grid checkerboard lines
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 1.5;
        const checkOffset = (Date.now() * 0.04) % 40;
        for (let x = -checkOffset; x < 800; x += 40) {
          ctx.beginPath();
          ctx.moveTo(x, state.groundY);
          ctx.lineTo(x - 20, state.groundY + 70);
          ctx.stroke();
        }
        for (let y = state.groundY + 20; y < state.groundY + 70; y += 20) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(800, y);
          ctx.stroke();
        }

        // Draw checkered dark squares
        ctx.fillStyle = 'rgba(71, 85, 105, 0.22)'; // Slate dark checks
        for (let x = -checkOffset; x < 850; x += 80) {
          ctx.beginPath();
          ctx.moveTo(x, state.groundY);
          ctx.lineTo(x + 40, state.groundY);
          ctx.lineTo(x + 20, state.groundY + 70);
          ctx.lineTo(x - 20, state.groundY + 70);
          ctx.closePath();
          ctx.fill();
        }

        ctx.strokeStyle = '#fbbf24'; // Glowing gold edge division
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Draw Museum Ocean Gate (Level 8 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Bubbling blue aura
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(34, 211, 238, 0.45)'); // cyan/blue center
          auraGrad.addColorStop(0.6, 'rgba(59, 130, 246, 0.18)'); // blue outer glow
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Rising water bubbles
          ctx.fillStyle = '#67e8f9';
          for (let i = 0; i < 6; i++) {
            const timeFactor = (state.victoryTimer * 0.04 + i * 0.35) % 1;
            const bubbleY = gY - 10 - timeFactor * 85;
            const bubbleX = sX + 10 + i * 14 + Math.sin(state.victoryTimer * 0.08 + i) * 8;
            ctx.beginPath();
            ctx.arc(bubbleX, bubbleY, 3 + (i % 3), 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = 'rgba(34, 211, 238, 0.3)';
            ctx.fill();
          }

          // Wooden ship steering wheel frame
          ctx.strokeStyle = '#854d0e'; // rich brown
          ctx.lineWidth = 8;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 32, 0, Math.PI * 2);
          ctx.stroke();

          // Outer pegs of the wheel (spokes)
          ctx.lineWidth = 4;
          for (let deg = 0; deg < 360; deg += 45) {
            const rad = (deg * Math.PI) / 180;
            const cosVal = Math.cos(rad);
            const sinVal = Math.sin(rad);
            
            // Draw spoke
            ctx.beginPath();
            ctx.moveTo(sX + 30 + cosVal * 15, gY - 40 + sinVal * 15);
            ctx.lineTo(sX + 30 + cosVal * 45, gY - 40 + sinVal * 45);
            ctx.stroke();

            // Peg handle knobs
            ctx.fillStyle = '#b45309';
            ctx.beginPath();
            ctx.arc(sX + 30 + cosVal * 45, gY - 40 + sinVal * 45, 5, 0, Math.PI * 2);
            ctx.fill();
          }

          // Inner brass rim
          ctx.strokeStyle = '#fbbf24'; // brass gold
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 26, 0, Math.PI * 2);
          ctx.stroke();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 22, 0, Math.PI * 2);
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#06b6d4';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("DEEP OCEAN ENTRY", sX + 30, gY - 110);
          ctx.fillStyle = '#3b82f6';
          ctx.fillText("🌊 TO THE SEABED 🌊", sX + 30, gY - 100);

          ctx.restore();
        }
      } else if (state.level === 'water') {
        // --- LEVEL 9: DEEP OCEAN BACKGROUND ---
        // Deep teal-blue water linear gradient
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#0c4a6e'); // Deep blue sky/water top
        skyGrad.addColorStop(0.6, '#0f766e'); // Teal mid water
        skyGrad.addColorStop(1, '#115e59'); // Dark teal seabed zone
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Animated ocean waves sunlight reflection beams (caustics)
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#38bdf8';
        for (let i = 0; i < 4; i++) {
          const shift = (Date.now() * 0.015 + i * 180) % 800;
          ctx.beginPath();
          ctx.moveTo(shift - 100, 0);
          ctx.lineTo(shift + 50, 0);
          ctx.lineTo(shift - 200, state.groundY);
          ctx.lineTo(shift - 350, state.groundY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // Parallax seaweed / kelp swaying
        ctx.fillStyle = '#0f766e'; // dark teal kelp
        ctx.save();
        ctx.globalAlpha = 0.55;
        for (let i = 40; i < 800; i += 110) {
          const sway = Math.sin(Date.now() * 0.0015 + i) * 12;
          ctx.beginPath();
          ctx.moveTo(i, state.groundY);
          ctx.bezierCurveTo(i - 15 + sway, state.groundY - 50, i + 15 + sway, state.groundY - 100, i + sway, state.groundY - 140);
          ctx.lineTo(i + 15 + sway, state.groundY - 140);
          ctx.bezierCurveTo(i + 30 + sway, state.groundY - 100, i + 10 + sway, state.groundY - 50, i + 25, state.groundY);
          ctx.closePath();
          ctx.fill();
        }
        ctx.restore();

        // 2. Draw Sandy Seabed Floor
        ctx.fillStyle = '#cca43b'; // Golden sandy base
        ctx.fillRect(0, state.groundY, 800, 70);
        ctx.fillStyle = '#b48a1d'; // Darker sandy ridges
        ctx.fillRect(0, state.groundY, 800, 10);

        // Scattered starfish
        ctx.fillStyle = '#f43f5e'; // rose red starfish
        for (let x = 60; x < 800; x += 180) {
          const sx = x + (x % 17) * 4;
          const sy = state.groundY + 25 + (x % 5) * 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();
          // Draw little arms
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#f43f5e';
          for (let a = 0; a < 5; a++) {
            const angle = (a * 2 * Math.PI) / 5 - Math.PI / 2;
            ctx.beginPath();
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + Math.cos(angle) * 10, sy + Math.sin(angle) * 10);
            ctx.stroke();
          }
        }

        ctx.strokeStyle = '#22d3ee'; // Cyan bubble layer edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();

        // Draw Water Volcano Gate (Level 9 Exit Gate)
        if (state.gameState === 'victory_sequence' || state.gameState === 'victory') {
          ctx.save();
          const sX = state.sanctuaryX;
          const gY = state.groundY;

          // Glowing volcanic aura
          const auraGrad = ctx.createRadialGradient(sX + 30, gY - 40, 5, sX + 30, gY - 40, 95);
          auraGrad.addColorStop(0, 'rgba(249, 115, 22, 0.5)'); // Bright orange center
          auraGrad.addColorStop(0.6, 'rgba(239, 68, 68, 0.18)'); // Red outer glow
          auraGrad.addColorStop(1, 'rgba(0,0,0,0)');
          ctx.fillStyle = auraGrad;
          ctx.beginPath();
          ctx.arc(sX + 30, gY - 40, 95, 0, Math.PI * 2);
          ctx.fill();

          // Rising sparks and fire particles
          ctx.fillStyle = '#f97316';
          for (let i = 0; i < 8; i++) {
            const timeFactor = (state.victoryTimer * 0.05 + i * 0.28) % 1;
            const sparkY = gY - 10 - timeFactor * 85;
            const sparkX = sX + 10 + i * 11 + Math.sin(state.victoryTimer * 0.1 + i) * 6;
            ctx.fillRect(sparkX - 2, sparkY - 2, 4, 4);
          }

          // Volcanic Basalt Rock Frame with molten cracks
          ctx.fillStyle = '#1e1b4b'; // deep volcanic stone base
          ctx.strokeStyle = '#ef4444'; // molten red borders
          ctx.lineWidth = 4;
          
          // Draw left obsidian pillar
          ctx.fillRect(sX - 10, gY - 90, 16, 90);
          ctx.strokeRect(sX - 10, gY - 90, 16, 90);

          // Draw right obsidian pillar
          ctx.fillRect(sX + 54, gY - 90, 16, 90);
          ctx.strokeRect(sX + 54, gY - 90, 16, 90);

          // Top heavy arch stone
          ctx.fillRect(sX - 16, gY - 106, 92, 16);
          ctx.strokeRect(sX - 16, gY - 106, 92, 16);

          // Draw molten orange cracks on pillars
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          // Left pillar cracks
          ctx.moveTo(sX - 6, gY - 80);
          ctx.lineTo(sX + 2, gY - 60);
          ctx.lineTo(sX - 4, gY - 40);
          ctx.lineTo(sX + 4, gY - 10);
          // Right pillar cracks
          ctx.moveTo(sX + 58, gY - 75);
          ctx.lineTo(sX + 66, gY - 55);
          ctx.lineTo(sX + 60, gY - 30);
          ctx.lineTo(sX + 68, gY - 5);
          ctx.stroke();

          // Black center gateway where player disappears
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(sX + 30, gY, 26, Math.PI, 0, false);
          ctx.lineTo(sX + 56, gY);
          ctx.lineTo(sX + 4, gY);
          ctx.closePath();
          ctx.fill();

          // Gate labels
          ctx.textAlign = 'center';
          ctx.fillStyle = '#ea580c';
          ctx.font = '7px "Press Start 2P", monospace';
          ctx.fillText("VOLCANIC CRATER EXIT", sX + 30, gY - 120);
          ctx.fillStyle = '#f43f5e';
          ctx.fillText("🔥 FINAL DESTINATION 🔥", sX + 30, gY - 110);

          ctx.restore();
        }
      } else if (state.level === 'volcano') {
        // --- LEVEL 10: VOLCANIC CRATER BACKGROUND ---
        // Molten lava red/orange gradient sky
        const skyGrad = ctx.createLinearGradient(0, 0, 0, state.groundY);
        skyGrad.addColorStop(0, '#180202'); // Black volcanic soot
        skyGrad.addColorStop(0.5, '#450505'); // Blood crimson
        skyGrad.addColorStop(1, '#7c1c1c'); // Burning orange-red
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, 800, 400);

        // Glowing magma eruptions in background
        ctx.save();
        ctx.globalAlpha = 0.25;
        const eruptionGrad = ctx.createRadialGradient(400, state.groundY, 20, 400, state.groundY - 150, 180);
        eruptionGrad.addColorStop(0, '#f97316'); // blazing orange
        eruptionGrad.addColorStop(0.5, '#ef4444'); // hot red
        eruptionGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = eruptionGrad;
        ctx.beginPath();
        ctx.arc(400, state.groundY, 180, 0, Math.PI, true);
        ctx.fill();
        ctx.restore();

        // Basalt jagged rocks in parallax background
        ctx.fillStyle = '#0f0606'; // near black basalt
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(80, state.groundY - 90);
        ctx.lineTo(150, state.groundY - 40);
        ctx.lineTo(240, state.groundY - 110);
        ctx.lineTo(310, state.groundY - 30);
        ctx.lineTo(440, state.groundY - 120);
        ctx.lineTo(550, state.groundY - 60);
        ctx.lineTo(670, state.groundY - 100);
        ctx.lineTo(800, state.groundY);
        ctx.closePath();
        ctx.fill();

        // 2. Draw Molten Magma / Lava Floor
        ctx.fillStyle = '#f97316'; // Lava orange base
        ctx.fillRect(0, state.groundY, 800, 70);

        // Flowing cooling dark basalt chunks in lava
        ctx.fillStyle = '#1c0707'; // basalt crust
        const basaltOffset = (Date.now() * 0.05) % 160;
        for (let x = -basaltOffset; x < 850; x += 160) {
          ctx.fillRect(x, state.groundY + 15, 35, 12);
          ctx.fillRect(x + 80, state.groundY + 40, 45, 15);
        }

        // Blazing yellow hotspots/cracks in magma
        ctx.fillStyle = '#facc15'; // yellow heat
        const heatOffset = (Date.now() * 0.03) % 120;
        for (let x = -heatOffset; x < 850; x += 120) {
          ctx.fillRect(x + 20, state.groundY + 5, 20, 4);
          ctx.fillRect(x + 70, state.groundY + 30, 25, 5);
        }

        ctx.strokeStyle = '#ef4444'; // Hot red lava boundary edge
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(0, state.groundY);
        ctx.lineTo(800, state.groundY);
        ctx.stroke();
      }
    }

      // 2. Physics & State updates (if running or in victory cutscene)
      if (state.gameState === 'running' || state.gameState === 'victory_sequence') {
        // Decrement invincibility frames
        if (state.invincibilityFrames > 0) {
          state.invincibilityFrames--;
        }

        // Apply score boost if has XP Booster (only when running)
        if (state.gameState === 'running') {
          const scoreIncrement = state.hasXpBooster ? 1.25 : 1;
          state.score += scoreIncrement;
        }
        
        // Speed is constant as requested (no dynamic speed scaling with distance score!)
        state.speed = state.hasBossKey ? 4 : 5;

        // Apply gravity to player
        state.wizard.y += state.wizard.vy;
        state.wizard.vy += state.gravity;

        // Platform & Ground Collision
        let landedOnPlatform = false;
        const currentWizardHeight = state.wizard.isSliding ? 20 : 40;
        const wizardBottom = state.wizard.y + currentWizardHeight;
        const wizardLeft = 120;
        const wizardRight = 120 + state.wizard.width;

        // Land on top of platform if falling
        if (state.wizard.vy >= 0) {
          for (const plat of state.platforms) {
            const platTop = plat.y;
            const platLeft = plat.x;
            const platRight = plat.x + plat.width;

            const xOverlap = wizardRight > platLeft && wizardLeft < platRight;
            const yOverlap = (wizardBottom - state.wizard.vy <= platTop + 2) && (wizardBottom >= platTop - 4);

            if (xOverlap && yOverlap) {
              state.wizard.y = platTop - currentWizardHeight;
              state.wizard.vy = 0;
              state.wizard.isJumping = false;
              landedOnPlatform = true;
              break;
            }
          }
        }

        // Support while running on platform
        if (!landedOnPlatform) {
          for (const plat of state.platforms) {
            const platTop = plat.y;
            const platLeft = plat.x;
            const platRight = plat.x + plat.width;

            const xOverlap = wizardRight > platLeft && wizardLeft < platRight;
            const yOnPlatform = Math.abs(wizardBottom - platTop) < 3;

            if (xOverlap && yOnPlatform) {
              state.wizard.y = platTop - currentWizardHeight;
              state.wizard.vy = 0;
              state.wizard.isJumping = false;
              landedOnPlatform = true;
              break;
            }
          }
        }

        // Fallback ground collision
        if (state.wizard.y > state.groundY - currentWizardHeight) {
          state.wizard.y = state.groundY - currentWizardHeight;
          state.wizard.vy = 0;
          state.wizard.isJumping = false;
        }

        // Handle slide durations
        if (state.wizard.isSliding) {
          state.wizard.slideTimer--;
          if (state.wizard.slideTimer <= 0) {
            state.wizard.isSliding = false;
            state.wizard.height = 40;
            state.wizard.y = state.groundY - 40; // Restore regular height
          }
        }

        // Spawners only run if the game is in active running mode
        if (state.gameState === 'running') {
          // Spawn obstacles - spawn at widescreen bounds (800)
          state.spawnTimer--;
          if (state.spawnTimer <= 0) {
            const type = Math.random() > 0.5 ? 'low' : 'high';
            
            let icon = '';
            if (state.level === 'sanctuary') {
              icon = type === 'low'
                ? (Math.random() > 0.5 ? 'cauldron' : 'potion_rack')
                : (Math.random() > 0.5 ? 'flying_witch' : 'spellbook');
            } else {
              icon = type === 'low' 
                ? (Math.random() > 0.5 ? '⛰️' : '🧱') 
                : (Math.random() > 0.5 ? '⚡' : '🦇');
            }

            state.obstacles.push({
              x: 800,
              y: type === 'low' ? state.groundY - 30 : state.groundY - 75,
              width: 25,
              height: 30,
              type,
              icon
            });
            state.spawnTimer = Math.random() * 60 + 75 - (state.speed * 1.5); // Dynamic scaling spawn
          }

          // Spawn collectibles - spawn at widescreen bounds (800)
          state.coinTimer--;
          if (state.coinTimer <= 0) {
            state.collectibles.push({
              x: 800,
              y: Math.random() > 0.5 ? state.groundY - 25 : state.groundY - 60,
              width: 20,
              height: 20,
              collected: false,
              icon: '🪙'
            });
            const baseCoinTimer = Math.random() * 50 + 40;
            state.coinTimer = state.hasLuckyCharm ? baseCoinTimer / 2 : baseCoinTimer;
          }

          // Spawn platforms
          state.platformTimer--;
          if (state.platformTimer <= 0) {
            const blockCount = Math.floor(Math.random() * 5) + 4; // 4 to 8 blocks
            const blockWidth = 28;
            const width = blockCount * blockWidth;
            const y = state.groundY - 80 - Math.floor(Math.random() * 3) * 15;
            
            state.platforms.push({
              x: 800,
              y,
              width,
              height: 20,
              icon: Math.random() > 0.5 ? '🧱' : '📦'
            });
            
            // Spawn coins on top of the platform!
            for (let i = 1; i < blockCount - 1; i += 2) {
              state.collectibles.push({
                x: 800 + i * blockWidth,
                y: y - 25,
                width: 20,
                height: 20,
                collected: false,
                icon: '🪙'
              });
            }
            
            state.platformTimer = Math.random() * 120 + 160;
          }
        }

        // Update cauldron bubble particles
        state.bubbles = state.bubbles.filter(b => {
          b.y += b.vy;
          b.alpha -= 0.015;
          return b.alpha > 0 && b.y > 0;
        });

        // Update magic spark particles
        state.sparks = state.sparks.filter(s => {
          s.x += s.vx;
          s.y += s.vy;
          s.alpha -= 0.012;
          return s.alpha > 0 && s.y > 0 && s.x > 0 && s.x < 800;
        });

        // Process level transition fading sequences
        if (state.transitionState === 'fading_out') {
          state.transitionAlpha += 0.02;
          if (state.transitionAlpha >= 1) {
            state.transitionAlpha = 1;
            
            // Dynamic Level Routing Sequence
            let nextLevel: 'forest' | 'sanctuary' | 'neon_grid' | 'aurora_glow' | 'cosmic_dawn' | 'arcade' | 'playground' | 'museum' | 'water' | 'volcano' = 'sanctuary';
            let nextScore = 1500;
            if (state.level === 'forest') {
              nextLevel = 'sanctuary';
              nextScore = 1500;
            } else if (state.level === 'sanctuary') {
              nextLevel = 'neon_grid';
              nextScore = 3000;
            } else if (state.level === 'neon_grid') {
              nextLevel = 'aurora_glow';
              nextScore = 4500;
            } else if (state.level === 'aurora_glow') {
              nextLevel = 'cosmic_dawn';
              nextScore = 6000;
            } else if (state.level === 'cosmic_dawn') {
              nextLevel = 'arcade';
              nextScore = 7500;
            } else if (state.level === 'arcade') {
              nextLevel = 'playground';
              nextScore = 9000;
            } else if (state.level === 'playground') {
              nextLevel = 'museum';
              nextScore = 10500;
            } else if (state.level === 'museum') {
              nextLevel = 'water';
              nextScore = 12000;
            } else if (state.level === 'water') {
              nextLevel = 'volcano';
              nextScore = 13500;
            }

            state.level = nextLevel;
            setCurrentLevel(nextLevel);
            state.transitionState = 'fading_in';
            
            // Wipe remnants
            state.obstacles = [];
            state.collectibles = [];
            state.platforms = [];
            state.bubbles = [];
            state.sparks = [];

            // Reset Alistair run settings
            state.wizard.y = state.groundY - state.wizard.height;
            state.wizard.vy = 0;
            state.wizard.isJumping = false;
            state.wizard.isSliding = false;
            state.wizardVictoryX = 120;

            // Reset spawners
            state.spawnTimer = 60;
            state.coinTimer = 40;
            state.platformTimer = 120;

            // Shift distance starting point
            state.score = nextScore;
          }
        } else if (state.transitionState === 'fading_in') {
          state.transitionAlpha -= 0.02;
          if (state.transitionAlpha <= 0) {
            state.transitionAlpha = 0;
            state.transitionState = 'none';
          }
        }

        // Move and filter platforms (movement scales with scrollMult)
        state.platforms = state.platforms.filter(plat => {
          plat.x -= state.speed * scrollMult;
          return plat.x > -plat.width - 50;
        });

        // Move and filter obstacles (movement scales with scrollMult)
        state.obstacles = state.obstacles.filter(obs => {
          obs.x -= state.speed * scrollMult;

          // Collision detection between wizard and obstacle (wizard at X = 120)
          const wizardX = 120;
          const wizardW = state.wizard.width;
          const wizardH = state.wizard.isSliding ? 20 : 40;
          const wizardY = state.wizard.y;

          const isColliding = 
            wizardX < obs.x + obs.width &&
            wizardX + wizardW > obs.x &&
            wizardY < obs.y + obs.height &&
            wizardY + wizardH > obs.y;

          if (isColliding) {
            // Immune during invincibility or victory animation
            if (state.invincibilityFrames > 0 || state.gameState === 'victory_sequence' || state.transitionState !== 'none') {
              return obs.x > -50; 
            }

            // Check if we have Task Shield or Health Potion
            if (state.shieldQty > 0 && !state.hasUsedShieldThisRun) {
              state.shieldQty--;
              state.hasUsedShieldThisRun = true;
              useItem('task_shield');
              state.invincibilityFrames = 90; // invulnerable for 1.5 seconds (90 frames)
              state.activeItemNotice = '🛡️ Shield Consumed! Invincible!';
              playSound('success');
              
              setTimeout(() => {
                state.activeItemNotice = '';
              }, 2500);
              
              return false; // delete the obstacle we hit
            } else if (state.potionQty > 0 && !state.hasUsedPotionThisRun) {
              state.potionQty--;
              state.hasUsedPotionThisRun = true;
              useItem('hp_potion');
              state.invincibilityFrames = 90;
              state.activeItemNotice = '🧪 Potion Consumed! Defeat Blocked!';
              playSound('success');
              
              setTimeout(() => {
                state.activeItemNotice = '';
              }, 2500);
              
              return false; // delete the obstacle we hit
            } else {
              // Collision! Game over!
              state.gameState = 'gameover';
              setGameState('gameover');
              playSound('click');
              
              // Check for highscore updates
              const curHighScore = Number(localStorage.getItem('alistair_runner_highscore') || '0');
              if (Math.floor(state.score) > curHighScore) {
                localStorage.setItem('alistair_runner_highscore', String(Math.floor(state.score)));
                setHighScore(Math.floor(state.score));
              }

              // Sync XP & Gold proportionate to their score
              const xpEarned = Math.min(25, Math.floor(state.score / 150));
              const goldEarned = Math.min(30, state.coins * 3);
              if (xpEarned > 0) addXpDirectly(xpEarned);
              if (goldEarned > 0) addGoldDirectly(goldEarned);
            }
          }

          return obs.x > -50;
        });

        // Move and check collectibles (movement scales with scrollMult)
        state.collectibles = state.collectibles.filter(coin => {
          coin.x -= state.speed * scrollMult;

          const wizardX = 120; // Alistair positioned at X = 120
          const wizardW = state.wizard.width;
          const wizardH = state.wizard.isSliding ? 20 : 40;
          const wizardY = state.wizard.y;

          const isColliding = 
            wizardX < coin.x + coin.width &&
            wizardX + wizardW > coin.x &&
            wizardY < coin.y + coin.height &&
            wizardY + wizardH > coin.y;

          if (isColliding && !coin.collected) {
            coin.collected = true;
            state.coins += 1;
            playSound('success');
            return false; // Remove collected coin
          }

          return coin.x > -50;
        });

        // Check for level transitions or victory condition
        let targetDistance = 1500;
        if (state.level === 'forest') targetDistance = 1500;
        else if (state.level === 'sanctuary') targetDistance = 3000;
        else if (state.level === 'neon_grid') targetDistance = 4500;
        else if (state.level === 'aurora_glow') targetDistance = 6000;
        else if (state.level === 'cosmic_dawn') targetDistance = 7500;
        else if (state.level === 'arcade') targetDistance = 9000;
        else if (state.level === 'playground') targetDistance = 10500;
        else if (state.level === 'museum') targetDistance = 12000;
        else if (state.level === 'water') targetDistance = 13500;
        else if (state.level === 'volcano') targetDistance = 15000;

        if (state.score >= targetDistance && state.gameState === 'running' && state.transitionState === 'none') {
          if (state.level !== 'volcano') {
            state.gameState = 'victory_sequence';
            setGameState('victory_sequence');
            state.victoryTimer = 0;
            state.sanctuaryX = 520; // Fixed stationary Gate position
            state.wizardVictoryX = 120; // Alistair starts at X = 120
            playSound('success');
          } else {
            // Reached 15000m: Absolute ascended victory!
            state.gameState = 'victory';
            setGameState('victory');
            playSound('success');

            confetti({
              particleCount: 150,
              spread: 90,
              origin: { y: 0.5 },
              colors: ['#FFD54F', '#f8b7c1ff', '#22d3ee']
            });

            // Victory reward!
            addXpDirectly(50);
            addGoldDirectly(60);
          }
        }

        // Process victory sequence cutscene timeline (Forest -> Entering Sanctuary transition trigger)
        if (state.gameState === 'victory_sequence') {
          state.victoryTimer++;

          // Sanctuary Castle remains completely static as Alistair runs to it! (No more sliding to him!)
          // state.sanctuaryX remains stationary at 520.

          // Alistair continues running forward towards the Castle entrance
          if (state.wizardVictoryX < 550) {
            state.wizardVictoryX += 2.2;
          }

          // Trigger Level 2 transition sequence once Alistair enters the Castle gates
          if (state.wizardVictoryX >= 540 || state.victoryTimer >= 220) {
            state.transitionState = 'fading_out';
            state.transitionAlpha = 0;
            state.transitionTimer = 0;
            state.gameState = 'running'; // Reset game loop to active running mode inside the Sanctuary
            playSound('success');
          }
        }

        // Periodically sync react scores
        setScore(Math.floor(state.score));
        setCoins(state.coins);
      }

      if (state.gameState !== 'idle') {
        // Draw bubbles particles
      state.bubbles.forEach(b => {
        ctx.save();
        ctx.globalAlpha = b.alpha;
        ctx.fillStyle = b.color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw stardust sparks
      state.sparks.forEach(s => {
        ctx.save();
        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // 1. Draw Platforms (Benches/boxes in Level 1 & 2)
      ctx.save();
      state.platforms.forEach(plat => {
        const blockCount = Math.round(plat.width / 28);
        for (let i = 0; i < blockCount; i++) {
          const x = plat.x + i * 28;
          const y = plat.y;
          
          if (state.level === 'sanctuary') {
            // Lavender-violet glowing masonry block benches inside the Sanctuary
            ctx.fillStyle = '#2e1065'; // deep purple fill
            ctx.strokeStyle = '#c084fc'; // glowing lilac border
          } else {
            ctx.fillStyle = '#1e1b4b'; // Deep navy-indigo fill
            ctx.strokeStyle = '#c084fc'; // Glowing pastel purple border
          }
          
          ctx.lineWidth = 1.5;
          ctx.fillRect(x, y, 26, 18);
          ctx.strokeRect(x, y, 26, 18);
          
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
          ctx.beginPath();
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + 22, y + 4);
          ctx.moveTo(x + 4, y + 4);
          ctx.lineTo(x + 4, y + 14);
          ctx.stroke();
        }
      });
      ctx.restore();

      // 2. Draw Collectibles
      state.collectibles.forEach(coin => {
        if (!coin.collected) {
          drawSanctuaryCollectible(ctx, coin, state.sparks);
        }
      });

      // 3. Draw Wizard (Alistair 🧙‍♂️) positioned beautifully at X = 120 (or state.wizardVictoryX in victory sequence)
      ctx.save();
      const currentWizardX = state.gameState === 'victory_sequence' || state.gameState === 'victory'
        ? state.wizardVictoryX
        : 120;
      
      // Calculate alpha fade as he enters the sanctuary gate columns (near sX = 520)
      let alistairAlpha = 1;
      if (state.gameState === 'victory_sequence' && state.wizardVictoryX > 480) {
        alistairAlpha = Math.max(0, 1 - (state.wizardVictoryX - 480) / 60);
      } else if (state.gameState === 'victory') {
        alistairAlpha = 0; // invisible once inside
      }
      ctx.globalAlpha = alistairAlpha;

      drawWizardCharacter(
        ctx,
        currentWizardX,
        state.wizard.y,
        state.wizard.width,
        state.wizard.height,
        state.wizard.isSliding,
        state.invincibilityFrames,
        state.sparks,
        state.level
      );
      ctx.restore();

      // 4. Draw Obstacles
      state.obstacles.forEach(obs => {
        if (state.level === 'sanctuary') {
          drawSanctuaryObstacle(ctx, obs, state.bubbles, state.sparks);
        } else if (state.level === 'neon_grid') {
          drawCyberpunkObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'aurora_glow') {
          drawArcticObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'cosmic_dawn') {
          drawCosmicObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'arcade') {
          drawArcadeObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'playground') {
          drawPlaygroundObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'museum') {
          drawMuseumObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'water') {
          drawWaterObstacle(ctx, obs, state.sparks);
        } else if (state.level === 'volcano') {
          drawVolcanoObstacle(ctx, obs, state.sparks);
        } else {
          ctx.save();
          ctx.font = '24px serif';
          ctx.fillText(obs.icon, obs.x, obs.y + 24);
          ctx.restore();
        }
      });

      // Draw active item consumption notice if present
      if (state.activeItemNotice) {
        ctx.save();
        ctx.fillStyle = '#f43f5e'; // Vibrant rose red
        ctx.font = '9px "Press Start 2P", monospace, Courier';
        ctx.textAlign = 'center';
        ctx.fillText(state.activeItemNotice, 400, 150); // Centered on 800 width
        ctx.restore();
      }

      // 6. Draw HUD inside canvas
      ctx.save();
      if (state.level === 'sanctuary' || state.level === 'neon_grid' || state.level === 'aurora_glow' || state.level === 'cosmic_dawn' || state.level === 'museum' || state.level === 'water' || state.level === 'volcano') {
        ctx.fillStyle = '#f8fafc'; // Crisp bright white/silver for high contrast on dark walls
      } else {
        ctx.fillStyle = '#1e1b4b'; // Deep navy for daylight sky
      }
      ctx.font = '8px "Press Start 2P", monospace, Courier';
      ctx.textAlign = 'left';
      ctx.fillText(`SCORE: ${state.score}m`, 30, 30);

      // Draw Level Number in top-right corner of HUD
      ctx.textAlign = 'right';
      ctx.fillText(`LEVEL ${
        state.level === 'volcano' ? 10 :
        state.level === 'water' ? 9 :
        state.level === 'museum' ? 8 :
        state.level === 'playground' ? 7 :
        state.level === 'arcade' ? 6 :
        state.level === 'cosmic_dawn' ? 5 :
        state.level === 'aurora_glow' ? 4 :
        state.level === 'neon_grid' ? 3 :
        state.level === 'sanctuary' ? 2 : 1
      }`, 770, 30);
      
      // Kept gold coin tag in both levels for absolute clarity and understanding
      ctx.fillStyle = '#fbbf24'; 
      ctx.fillText('COINS:', 30, 48);
      
      // Draw a small inline custom vector gold coin on HUD instead of silver emoji on Mac
      ctx.save();
      ctx.fillStyle = '#fbbf24'; // rich bright gold
      ctx.strokeStyle = '#d97706'; // amber border
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(88, 44, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`${state.coins}`, 98, 48);
      
      if (state.level === 'forest') {
        ctx.fillStyle = '#0891b2'; // Cyan level tag
        ctx.fillText('LEVEL 1: WILDERNESS', 30, 66);
      } else if (state.level === 'sanctuary') {
        ctx.fillStyle = '#c084fc'; // Purple level tag
        ctx.fillText('LEVEL 2: SANCTUARY', 30, 66);
      } else if (state.level === 'neon_grid') {
        ctx.fillStyle = '#f43f5e'; // Pink level tag
        ctx.fillText('LEVEL 3: NEON GRID', 30, 66);
      } else if (state.level === 'aurora_glow') {
        ctx.fillStyle = '#14b8a6'; // Teal level tag
        ctx.fillText('LEVEL 4: AURORA GLOW', 30, 66);
      } else if (state.level === 'cosmic_dawn') {
        ctx.fillStyle = '#fbbf24'; // Gold level tag
        ctx.fillText('LEVEL 5: COSMIC SPACE', 30, 66);
      } else if (state.level === 'arcade') {
        ctx.fillStyle = '#ec4899'; // Pink level tag
        ctx.fillText('LEVEL 6: RETRO ARCADE', 30, 66);
      } else if (state.level === 'playground') {
        ctx.fillStyle = '#22c55e'; // Green level tag
        ctx.fillText('LEVEL 7: PLAYGROUND', 30, 66);
      } else if (state.level === 'museum') {
        ctx.fillStyle = '#cbd5e1'; // Silver level tag
        ctx.fillText('LEVEL 8: GRAND MUSEUM', 30, 66);
      } else if (state.level === 'water') {
        ctx.fillStyle = '#06b6d4'; // Cyan level tag
        ctx.fillText('LEVEL 9: DEEP OCEAN', 30, 66);
      } else if (state.level === 'volcano') {
        ctx.fillStyle = '#ef4444'; // Red level tag
        ctx.fillText('LEVEL 10: VOLCANIC CRATER', 30, 66);
      }
      ctx.restore();

      // Draw active backpack item status badges in standard retro grid font
      let buffX = 30;
      let buffY = 82;
      ctx.save();
      ctx.font = '7px "Press Start 2P", monospace';
      
      if (state.hasXpBooster) {
        ctx.fillStyle = '#7c3aed'; // High contrast violet
        ctx.fillText('⚡ XP BOOS', buffX, buffY);
        buffY += 12;
      }
      if (state.hasBossKey) {
        ctx.fillStyle = '#0891b2'; // High contrast cyan
        ctx.fillText('🔑 CHRONO', buffX, buffY);
        buffY += 12;
      }
      if (state.hasElixirMight) {
        ctx.fillStyle = '#db2777'; // High contrast pink
        ctx.fillText('🧪 FLOATY', buffX, buffY);
        buffY += 12;
      }
      if (state.hasLuckyCharm) {
        ctx.fillStyle = '#16a34a'; // High contrast green
        ctx.fillText('🍀 LUCKY ', buffX, buffY);
        buffY += 12;
      }
      ctx.restore();

      // Prompt messages based on state - Centered on widescreen (800x400)
      if (state.gameState === 'idle') {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
        ctx.fillRect(100, 80, 600, 240);
        ctx.strokeStyle = '#a855f7'; // Glowing purple border
        ctx.lineWidth = 3;
        ctx.strokeRect(100, 80, 600, 240);

        ctx.textAlign = 'center';
        ctx.fillStyle = '#f472b6'; // Vibrant Pink Title
        ctx.font = '13px "Press Start 2P", monospace';
        ctx.fillText("ALISTAIR'S MYSTERIOUS RUN", 400, 135);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px "Press Start 2P", monospace';
        ctx.fillText("W / UP Arrow / Space: JUMP OVER HURDLES & OBSTACLES", 400, 180);
        ctx.fillText("S / DOWN Arrow: SLIDE UNDER FLYING HURDLES", 400, 210);
        ctx.fillStyle = '#fbbf24'; // Warning Gold
        ctx.fillText("ENTER SANCTUARY AT 1500m & SURVIVE TO 3000m!", 400, 270);
        ctx.restore();
      }

      // Draw screen transition dark fade overlay
      if (state.transitionState !== 'none' || state.transitionAlpha > 0) {
        ctx.save();
        ctx.fillStyle = 'rgba(15, 23, 42, ' + state.transitionAlpha + ')'; // Deep dark violet slate
        ctx.fillRect(0, 0, 800, 400);

        if (state.transitionAlpha > 0.75) {
          let loadingTitle = 'ENTERING THE SANCTUARY...';
          let loadingSub = 'PREPARE FOR LEVEL 2';
          let loadingColor = '#c084fc';
          let loadingSubColor = '#a855f7';

          if (state.level === 'forest') {
            loadingTitle = 'ENTERING THE SANCTUARY...';
            loadingSub = 'PREPARE FOR LEVEL 2: SANCTUARY';
            loadingColor = '#c084fc';
            loadingSubColor = '#a855f7';
          } else if (state.level === 'sanctuary') {
            loadingTitle = 'CROSSING NEON GRID BOUNDARIES...';
            loadingSub = 'PREPARE FOR LEVEL 3: CYBER DUSK';
            loadingColor = '#f43f5e';
            loadingSubColor = '#be123c';
          } else if (state.level === 'neon_grid') {
            loadingTitle = 'CLIMBING COLD ARCTIC GLOWS...';
            loadingSub = 'PREPARE FOR LEVEL 4: ARCTIC AURORA';
            loadingColor = '#22d3ee';
            loadingSubColor = '#0891b2';
          } else if (state.level === 'aurora_glow') {
            loadingTitle = 'ASCENDING TO COSMIC DAWN...';
            loadingSub = 'PREPARE FOR LEVEL 5: COSMIC SPACE';
            loadingColor = '#fbbf24';
            loadingSubColor = '#d97706';
          } else if (state.level === 'cosmic_dawn') {
            loadingTitle = 'BOOTING RETRO ARCADE PORTAL...';
            loadingSub = 'PREPARE FOR LEVEL 6: RETRO ARCADE';
            loadingColor = '#ec4899';
            loadingSubColor = '#be185d';
          } else if (state.level === 'arcade') {
            loadingTitle = 'RUNNING TO THE GREEN PLAYGROUND...';
            loadingSub = 'PREPARE FOR LEVEL 7: FRESH PLAYGROUND';
            loadingColor = '#22c55e';
            loadingSubColor = '#15803d';
          } else if (state.level === 'playground') {
            loadingTitle = 'ENTERING THE GRAND MUSEUM...';
            loadingSub = 'PREPARE FOR LEVEL 8: MUSEUM EXHIBITS';
            loadingColor = '#cbd5e1';
            loadingSubColor = '#64748b';
          } else if (state.level === 'museum') {
            loadingTitle = 'DIVING INTO THE DEEP OCEAN...';
            loadingSub = 'PREPARE FOR LEVEL 9: SEABED DEPTHS';
            loadingColor = '#06b6d4';
            loadingSubColor = '#0369a1';
          } else if (state.level === 'water') {
            loadingTitle = 'DESCENDING TO VOLCANIC CRATER...';
            loadingSub = 'PREPARE FOR LEVEL 10: MAGMA CHAMBER';
            loadingColor = '#ef4444';
            loadingSubColor = '#991b1b';
          }

          ctx.fillStyle = loadingColor;
          ctx.font = '11px "Press Start 2P", monospace, Courier';
          ctx.textAlign = 'center';
          ctx.fillText(loadingTitle, 400, 200);
          
          ctx.fillStyle = loadingSubColor;
          ctx.font = '8px "Press Start 2P", monospace, Courier';
          ctx.fillText(loadingSub, 400, 230);
        }
        ctx.restore();
      }
    }

      // Restore high-DPI scaling context state
      ctx.restore();

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  const handleCheatWin = () => {
    playSound('success');
    const state = stateRef.current;
    if (state.level !== 'volcano') {
      // Cheat skip to current level's gate sequence!
      state.gameState = 'victory_sequence';
      setGameState('victory_sequence');
      state.victoryTimer = 0;
      state.sanctuaryX = 520; // Static location
      state.wizardVictoryX = 460; // instantly close to entrance for quick dev skip!
    } else {
      // Reached final volcano: Complete victory!
      state.gameState = 'victory';
      setGameState('victory');
      state.score = 15000;
      state.coins = 50;
      setScore(15000);
      setCoins(50);
      
      confetti({
        particleCount: 120,
        spread: 80,
        colors: ['#22d3ee', '#ff00ff', '#fbbf24']
      });

      addXpDirectly(50);
      addGoldDirectly(60);
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-slate-950 text-white z-50 font-pixel overflow-hidden">
      {/* 1. Header overlay bar at the top */}
      <div className="absolute top-0 left-0 w-full z-20 bg-slate-950/65 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-800/40 select-none">
        <span className="text-pastel-purple font-bold tracking-wider text-xs md:text-sm flex items-center gap-2">
          <span className="pixel-star animate-pulse"></span>
          ALISTAIR'S MYSTERIOUS RUN
        </span>
        <div className="flex gap-6 items-center text-[10px] text-slate-300">
          <span>BEST: {highScore}m</span>
          <span className="text-pastel-cyan font-bold">
            TARGET: {
              currentLevel === 'volcano' ? '15000m' :
              currentLevel === 'water' ? '13500m' :
              currentLevel === 'museum' ? '12000m' :
              currentLevel === 'playground' ? '10500m' :
              currentLevel === 'arcade' ? '9000m' :
              currentLevel === 'cosmic_dawn' ? '7500m' :
              currentLevel === 'aurora_glow' ? '6000m' :
              currentLevel === 'neon_grid' ? '4500m' :
              currentLevel === 'sanctuary' ? '3000m' : '1500m'
            }
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs font-sans px-3.5 py-1.5 border border-slate-800 hover:border-slate-400 rounded bg-slate-900/90 active:scale-95 shadow-sm"
        >
          [CLOSE]
        </button>
      </div>

      {/* 2. Full-Screen Canvas container spanning corner to corner */}
      <div className="w-full h-full relative bg-[#bae6fd] flex items-center justify-center z-0">
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={400} 
          className="block w-full h-full object-cover absolute inset-0"
        />

        {/* Dynamic gameover/victory overlay screens on top of full-screen background canvas */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/65 select-none z-10 p-4">
            <button 
              onClick={startGame}
              className="px-8 py-3.5 bg-pastel-pink text-slate-800 rounded font-pixel text-xs font-bold border-2 border-slate-800 hover:bg-pastel-yellow hover:scale-105 active:translate-y-0.5 shadow-md hover:shadow-[0_0_15px_#ff00ff] transition-all cursor-pointer mt-12 mb-6"
            >
              🧙‍♂️ START FROM LEVEL 1
            </button>

            {/* Level Selector Grid Overlay */}
            <div className="flex flex-col items-center bg-slate-900/90 border border-slate-800 p-5 rounded-lg max-w-lg shadow-xl animate-[fade-in_0.2s_ease-out]">
              <span className="text-[9px] text-pastel-cyan uppercase font-bold tracking-widest mb-3">Select Starting Stage</span>
              <div className="grid grid-cols-5 gap-2.5">
                {[...Array(10)].map((_, i) => {
                  const lvlNum = i + 1;
                  const lvlNames = [
                    'forest', 'sanctuary', 'neon_grid', 'aurora_glow', 'cosmic_dawn',
                    'arcade', 'playground', 'museum', 'water', 'volcano'
                  ];
                  const lvlLabels = [
                    'Forest', 'Sanctuary', 'Cyber', 'Arctic', 'Cosmic',
                    'Arcade', 'Play', 'Museum', 'Ocean', 'Volcano'
                  ];
                  return (
                    <button
                      key={lvlNum}
                      onClick={() => selectLevelAndStart(lvlNames[i], (lvlNum - 1) * 1500)}
                      className="px-2 py-2.5 bg-slate-800 hover:bg-pastel-pink hover:text-slate-950 border border-slate-700 hover:border-slate-400 rounded text-[9px] font-pixel transition-all cursor-pointer text-slate-300 active:scale-95 flex flex-col items-center gap-1 min-w-[72px]"
                    >
                      <span className="font-extrabold text-[10px] text-pastel-yellow">LVL {lvlNum}</span>
                      <span className="text-[6px] opacity-75 truncate max-w-[62px]">{lvlLabels[i]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {gameState === 'gameover' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center select-none p-4 z-10 animate-[fade-in_0.25s_ease-out]">
            <span className="text-4xl mb-2 animate-bounce">💀</span>
            <h2 className="text-[#ef4444] text-sm font-pixel font-bold tracking-widest uppercase mb-1">RUN FAILED</h2>
            <p className="text-[10px] text-slate-400 max-w-xs mb-6 leading-normal">
              You hit an obstacle! Distance reached: <strong className="text-slate-200">{score}m</strong>. Coins collected: <strong className="text-amber-400 inline-flex items-center gap-1 align-middle">
                <svg className="w-3.5 h-3.5 text-amber-500 fill-current select-none shrink-0 inline-block align-middle" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="1.5" fill="#fbbf24" />
                  <circle cx="12" cy="12" r="7" stroke="#d97706" strokeWidth="1" fill="#f59e0b" />
                  <circle cx="12" cy="12" r="3" fill="#fef08a" />
                </svg>
                <span>{coins}</span>
              </strong>.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="px-5 py-2.5 bg-pastel-cyan text-slate-800 rounded font-pixel text-[10px] font-bold border border-slate-800 hover:bg-pastel-yellow transition-all cursor-pointer"
              >
                TRY AGAIN
              </button>
              <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded font-pixel text-[10px] border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
              >
                BACK TO HUB
              </button>
            </div>
          </div>
        )}

        {gameState === 'victory' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-center select-none p-4 z-10 animate-[fade-in_0.25s_ease-out]">
            <span className="text-5xl mb-2 animate-pulse">🏆</span>
            <h2 className="text-pastel-cyan text-sm font-pixel font-bold tracking-widest uppercase mb-1">VICTORY ASCENDED</h2>
            <p className="text-[10px] text-slate-400 max-w-xs mb-6 leading-normal">
              You conquered the volcanic crater and completed Alistair's ultimate run at <strong className="text-slate-200">15000m</strong>! Earned <strong className="text-pastel-purple font-extrabold">+50 XP & +60 Gold</strong>!
            </p>
            <div className="flex gap-4">
              <button 
                onClick={startGame}
                className="px-5 py-2.5 bg-pastel-pink text-slate-800 rounded font-pixel text-[10px] font-bold border border-slate-800 hover:bg-pastel-yellow transition-all cursor-pointer"
              >
                RUN AGAIN
              </button>
              <button 
                onClick={onClose}
                className="px-5 py-2.5 bg-slate-800 text-slate-300 rounded font-pixel text-[10px] border border-slate-700 hover:bg-slate-700 transition-all cursor-pointer"
              >
                BACK TO HUB
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 3. Footer controls instruction bar at the bottom */}
      <div className="absolute bottom-0 left-0 w-full z-20 bg-slate-950/65 backdrop-blur-md px-6 py-4 flex justify-between items-center border-t border-slate-800/40 text-[9px] text-slate-400 select-none">
        <div className="flex gap-6">
          <div>JUMP: <strong className="text-pastel-cyan">W / UP Arrow / Space</strong></div>
          <div>SLIDE: <strong className="text-pastel-pink">S / DOWN Arrow</strong></div>
        </div>
        <button
          onClick={handleCheatWin}
          className="text-[7px] text-purple-400 hover:text-white bg-purple-950/40 hover:bg-purple-900 border border-purple-800 px-3 py-1.5 rounded transition-all cursor-pointer active:scale-95"
          title="Cheat trigger victory or transition level"
        >
          🔧 DEV: ESCAPE RUN
        </button>
      </div>
    </div>
  );
}

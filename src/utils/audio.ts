let sharedAudioCtx: AudioContext | null = null;
let activeThemeInterval: any = null;
let droneOsc: OscillatorNode | null = null;
let droneGain: GainNode | null = null;
let isThemeRunning = false;

const getAudioContext = (): AudioContext | null => {
  try {
    if (typeof window === 'undefined') return null;
    if (!sharedAudioCtx) {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        sharedAudioCtx = new AudioCtxClass();
        console.log("🔊 Shared AudioContext instantiated successfully.");
      }
    }
    return sharedAudioCtx;
  } catch (e) {
    console.error("❌ Failed to instantiate AudioContext:", e);
    return null;
  }
};

// Autoplay Unlocker: Unlock/Resume AudioContext explicitly inside a real user interaction callback
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    const ctx = getAudioContext();
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      ctx.resume().then(() => {
        console.log("🔊 AudioContext successfully unlocked and resumed via user interaction!");
        
        // Remove event listeners upon successful resumption
        window.removeEventListener('click', unlockAudio);
        window.removeEventListener('keydown', unlockAudio);
        window.removeEventListener('mousedown', unlockAudio);
        window.removeEventListener('touchstart', unlockAudio);
        window.removeEventListener('pointerdown', unlockAudio);
        
        // Trigger theme music if it was queued to play
        if (isThemeRunning && !activeThemeInterval) {
          triggerThemeSynth();
        }
      }).catch(err => {
        console.warn("⚠️ AudioContext resume promise rejected:", err);
      });
    } else {
      // Already running
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
      window.removeEventListener('mousedown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('pointerdown', unlockAudio);
      
      if (isThemeRunning && !activeThemeInterval) {
        triggerThemeSynth();
      }
    }
  };
  
  window.addEventListener('click', unlockAudio);
  window.addEventListener('keydown', unlockAudio);
  window.addEventListener('mousedown', unlockAudio);
  window.addEventListener('touchstart', unlockAudio);
  window.addEventListener('pointerdown', unlockAudio);
}

export const playSound = (type: 'hover' | 'click' | 'success') => {
  try {
    const audioCtx = getAudioContext();
    if (!audioCtx) return;

    // Proactively heal suspended state synchronously inside user interaction callback
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(e => console.warn("Failed to resume context on playSound:", e));
    }

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'hover') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(400, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, audioCtx.currentTime + 0.05);
      gainNode.gain.setValueAtTime(0.20, audioCtx.currentTime); // Safe robust volume
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'click') {
      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(300, audioCtx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0.20, audioCtx.currentTime); // Safe robust volume
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'success') {
      // Coin sound
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5
      oscillator.frequency.setValueAtTime(1318.51, audioCtx.currentTime + 0.1); // E6
      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime); // Rich volume
      gainNode.gain.setValueAtTime(0.35, audioCtx.currentTime + 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.4);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.4);
    }
  } catch (e) {
    console.error("Audio playback failed", e);
  }
};

// Synth theme implementation
const triggerThemeSynth = () => {
  const audioCtx = getAudioContext();
  if (!audioCtx || audioCtx.state === 'suspended') return;

  try {
    // 1. Soft atmospheric drone (low-frequency triangle wave at D2)
    if (!droneOsc) {
      droneOsc = audioCtx.createOscillator();
      droneGain = audioCtx.createGain();
      droneOsc.type = 'triangle';
      droneOsc.frequency.setValueAtTime(73.42, audioCtx.currentTime); // D2 note
      droneGain.gain.setValueAtTime(0.12, audioCtx.currentTime); // Faint cozy background drone (boosted to be fully audible)
      droneOsc.connect(droneGain);
      droneGain.connect(audioCtx.destination);
      droneOsc.start();
    }

    // 2. Slow arpeggiator melody
    const notes = [146.83, 174.61, 220.00, 293.66, 349.23, 440.00]; // D3, F3, A3, D4, F4, A4 (D Minor scale)
    let step = 0;

    const playStep = () => {
      if (!sharedAudioCtx || sharedAudioCtx.state === 'suspended' || !isThemeRunning) return;
      
      const time = sharedAudioCtx.currentTime;
      const osc = sharedAudioCtx.createOscillator();
      const gainNode = sharedAudioCtx.createGain();
      
      osc.type = 'sine';
      const freq = notes[step % notes.length];
      osc.frequency.setValueAtTime(freq, time);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.99, time + 1.2);
      
      // Use 0.0001 instead of 0 to avoid Safari exponential ramp errors
      gainNode.gain.setValueAtTime(0.0001, time);
      gainNode.gain.linearRampToValueAtTime(0.10, time + 0.3); // Arpeggio melody (boosted to be fully audible)
      gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 2.0);
      
      osc.connect(gainNode);
      gainNode.connect(sharedAudioCtx.destination);
      osc.start(time);
      osc.stop(time + 2.1);
      
      step = (step + (Math.random() > 0.5 ? 1 : 2)) % notes.length;
    };

    if (!activeThemeInterval) {
      playStep();
      activeThemeInterval = setInterval(playStep, 1800);
    }
  } catch (e) {
    console.error("Failed to start synth theme:", e);
  }
};

export const startMysteriousTheme = () => {
  isThemeRunning = true;
  const audioCtx = getAudioContext();
  
  // Proactively unlock suspended contexts when entering the run
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume()
      .then(() => triggerThemeSynth())
      .catch(err => {
        console.warn("Could not resume context inside theme start:", err);
        // Fallback: try triggering anyway
        triggerThemeSynth();
      });
  } else {
    triggerThemeSynth();
  }
};

export const stopMysteriousTheme = () => {
  isThemeRunning = false;
  
  if (activeThemeInterval) {
    clearInterval(activeThemeInterval);
    activeThemeInterval = null;
  }
  
  if (droneOsc) {
    try {
      droneOsc.stop();
    } catch (e) {}
    droneOsc = null;
  }
  
  if (droneGain) {
    try {
      droneGain.disconnect();
    } catch (e) {}
    droneGain = null;
  }
};

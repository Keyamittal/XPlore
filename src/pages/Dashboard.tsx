import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGame } from '../context/GameContext';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';
import { Lock } from 'lucide-react';

export default function Dashboard() {
  const {
    user: currentUser,
    addXpDirectly,
    inventory,
    useItem,
    quests,
    mysteryMission,
    mysteryMissionState,
    mysteryMissionSkips,
    acceptMysteryMission,
    completeMysteryMission,
    shuffleMysteryMission,
    skipMysteryMission,
    cheatCompleteAllQuests
  } = useGame();
  const navigate = useNavigate();
  
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [hasShownUnlockForState, setHasShownUnlockForState] = useState<string | null>(null);

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


  // Boss Battle RPG game states
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [bossHp, setBossHp] = useState(150);
  const [playerHp, setPlayerHp] = useState(100);
  const [playerMana, setPlayerMana] = useState(50);
  const [nextBossAction, setNextBossAction] = useState<'slash' | 'heavy' | 'roar' | 'stun'>('slash');
  const [playerDefending, setPlayerDefending] = useState(false);
  const [isBackpackOpen, setIsBackpackOpen] = useState(false);

  // Fight-specific item buffs/states
  const [bossStunned, setBossStunned] = useState(false);
  const [shieldActive, setShieldActive] = useState(false);
  const [fightMightBonus, setFightMightBonus] = useState(0);
  const [guaranteedCrit, setGuaranteedCrit] = useState(false);

  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [battleFlashing, setBattleFlashing] = useState<'boss' | 'player' | null>(null);
  const [battleOutcome, setBattleOutcome] = useState<'victory' | 'defeat' | null>(null);

  const selectNextBossAction = () => {
    const rand = Math.random();
    if (rand < 0.35) return 'slash';
    if (rand < 0.65) return 'heavy';
    if (rand < 0.85) return 'stun';
    return 'roar';
  };

  const startBossBattle = () => {
    playSound('click');
    setBossHp(150);
    setPlayerHp(100);
    setPlayerMana(50);
    setNextBossAction('heavy'); // Telegraph a massive initial attack to teach them Defend strategy!
    setBattleLogs(['⚔️ A towering colossal Monster appeared! Strategy is required to survive.']);
    setBattleFlashing(null);
    setBattleOutcome(null);
    setIsBattleActive(true);
    setBossStunned(false);
    setShieldActive(false);
    setFightMightBonus(0);
    setGuaranteedCrit(false);
    setPlayerDefending(false);
    setIsBackpackOpen(false); // Collapsed by default
  };

  const handleAttack = () => {
    if (battleOutcome) return;
    playSound('click');

    // Check for passive item bonuses & might elixir fight buffs
    const elixirMight = inventory.find(item => item.id === 'elixir_might');
    const hasMight = elixirMight && elixirMight.qty > 0;
    const damageBonus = (hasMight ? 10 : 0) + fightMightBonus;

    const luckyCharm = inventory.find(item => item.id === 'lucky_charm');
    const hasLucky = luckyCharm && luckyCharm.qty > 0;

    const isCrit = guaranteedCrit || (hasLucky && Math.random() < 0.3);
    if (guaranteedCrit) {
      setGuaranteedCrit(false); // consume guaranteed crit buff
    }

    // Player deals damage
    const baseDamage = Math.floor(Math.random() * 7) + 12 + damageBonus; // base 12 - 18 plus potential might bonus
    const playerDamage = isCrit ? baseDamage * 2 : baseDamage;

    const newBossHp = Math.max(0, bossHp - playerDamage);
    setBossHp(newBossHp);
    setBattleFlashing('boss');
    setTimeout(() => setBattleFlashing(null), 150);

    const manaGain = 12;
    const newMana = Math.min(100, playerMana + manaGain);
    setPlayerMana(newMana);

    let logMsg = `⚔️ Slash Strike! Dealt ${playerDamage} damage to the Boss! (+${manaGain} Mana)`;
    if (isCrit) {
      logMsg = `✨ CRITICAL SLASH! Dealt ${playerDamage} damage to the Boss! (+${manaGain} Mana)`;
    }

    if (newBossHp <= 0) {
      setBattleOutcome('victory');
      playSound('success');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#f8b7c1ff', '#AEECEF', '#FFFACD', '#D8B4E2']
      });
      addXpDirectly(50);
      setBattleLogs(prev => [logMsg, '🏆 VICTORY! You defeated the Boss Monster and earned +50 XP!', ...prev]);
      return;
    }

    setBattleLogs(prev => [logMsg, ...prev]);
    executeBossTurn(newBossHp, playerHp, newMana, shieldActive, bossStunned, false);
  };

  const handleCastSpell = () => {
    if (battleOutcome) return;
    if (playerMana < 18) {
      playSound('click');
      setBattleLogs(prev => ['❌ Not enough Mana! Slash or Defend to recover Mana.', ...prev]);
      return;
    }
    playSound('click');

    const elixirMight = inventory.find(item => item.id === 'elixir_might');
    const hasMight = elixirMight && elixirMight.qty > 0;
    const damageBonus = (hasMight ? 10 : 0) + fightMightBonus;

    const luckyCharm = inventory.find(item => item.id === 'lucky_charm');
    const hasLucky = luckyCharm && luckyCharm.qty > 0;

    const isCrit = guaranteedCrit || (hasLucky && Math.random() < 0.3);
    if (guaranteedCrit) {
      setGuaranteedCrit(false);
    }

    const baseDamage = Math.floor(Math.random() * 11) + 28 + damageBonus; // 28 - 38 base damage
    const playerDamage = isCrit ? baseDamage * 2 : baseDamage;

    const newBossHp = Math.max(0, bossHp - playerDamage);
    setBossHp(newBossHp);
    setBattleFlashing('boss');
    setTimeout(() => setBattleFlashing(null), 150);

    const newMana = playerMana - 18;
    setPlayerMana(newMana);

    let logMsg = `🔥 Fireball! Vaporized the Boss for ${playerDamage} damage! (-18 Mana)`;
    if (isCrit) {
      logMsg = `✨ MAGICAL CRIT! Fireball exploded for ${playerDamage} damage! (-18 Mana)`;
    }

    if (newBossHp <= 0) {
      setBattleOutcome('victory');
      playSound('success');
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FFB6C1', '#AEECEF', '#FFFACD', '#D8B4E2']
      });
      addXpDirectly(50);
      setBattleLogs(prev => [logMsg, '🏆 VICTORY! You defeated the Boss Monster and earned +50 XP!', ...prev]);
      return;
    }

    setBattleLogs(prev => [logMsg, ...prev]);
    executeBossTurn(newBossHp, playerHp, newMana, shieldActive, bossStunned, false);
  };

  const handleDefend = () => {
    if (battleOutcome) return;
    playSound('click');
    setPlayerDefending(true);

    const manaGain = 8;
    const newMana = Math.min(100, playerMana + manaGain);
    setPlayerMana(newMana);

    const logMsg = `🛡️ You guard and prepare for the Monster's next move. (+${manaGain} Mana)`;
    setBattleLogs(prev => [logMsg, ...prev]);

    executeBossTurn(bossHp, playerHp, newMana, shieldActive, bossStunned, true);
  };

  const executeBossTurn = (
    currentBossHp: number,
    currentPlayerHp: number,
    currentMana: number,
    isShieldActive: boolean,
    isBossStunned: boolean,
    isDefendingNow: boolean = false
  ) => {
    setTimeout(() => {
      if (isBossStunned) {
        setBossStunned(false); // consume stun
        setBattleLogs(prev => ['🌀 The Monster is STUNNED and cannot move! You get a free turn!', ...prev]);
        return;
      }

      let bossDamage = 0;
      let logs: string[] = [];
      let playerStunnedNext = false;

      // Handle telegraphed actions
      if (nextBossAction === 'slash') {
        bossDamage = Math.floor(Math.random() * 7) + 12; // 12 - 18
        if (isDefendingNow) {
          bossDamage = Math.floor(bossDamage * 0.4); // 60% reduction
          logs.push(`🛡️ You defended! Swipe strike damage reduced to ${bossDamage}!`);
        } else {
          logs.push(`🔥 The Monster swiped at you and dealt ${bossDamage} damage!`);
        }
      } else if (nextBossAction === 'heavy') {
        bossDamage = Math.floor(Math.random() * 9) + 26; // 26 - 34
        if (isDefendingNow) {
          bossDamage = Math.floor(bossDamage * 0.4); // 60% reduction
          logs.push(`🛡️ You defended! Flame Breath damage reduced to ${bossDamage}!`);
        } else {
          logs.push(`🔥 Flame Breath! The Monster breathed fire dealing ${bossDamage} damage!`);
        }
      } else if (nextBossAction === 'roar') {
        const healAmt = 25;
        setBossHp(prev => Math.min(150, prev + healAmt));
        logs.push(`💚 Healing Roar! The Monster roared and recovered ${healAmt} HP!`);
      } else if (nextBossAction === 'stun') {
        bossDamage = 10;
        playerStunnedNext = true;
        if (isDefendingNow) {
          bossDamage = 4;
          playerStunnedNext = false; // Defending blocks the stun!
          logs.push(`🛡️ You defended! Stun Wave damage reduced to ${bossDamage} and blocked Stun!`);
        } else {
          logs.push(`🌀 Stun Wave! The Monster dealt ${bossDamage} damage and STUNNED you!`);
        }
      }

      setPlayerDefending(false);

      if (isShieldActive && bossDamage > 0) {
        setShieldActive(false); // consume shield
        bossDamage = 0;
        playerStunnedNext = false;
        logs.push('🛡️ Your Task Shield blocked the Monster\'s attack completely! 0 damage taken!');
      }

      const newPlayerHp = Math.max(0, currentPlayerHp - bossDamage);
      setPlayerHp(newPlayerHp);

      // Auto-revive / protect if player has a Task Shield in inventory to prevent defeat once!
      if (newPlayerHp <= 0) {
        const taskShieldItem = inventory.find(i => i.id === 'task_shield');
        if (taskShieldItem && taskShieldItem.qty > 0) {
          useItem('task_shield'); // consume it!
          setPlayerHp(30);
          playerStunnedNext = false;
          logs.push('✨ UNDYING WILL! Your Task Shield broke to save your life! Restored to 30 HP!');
          setBattleLogs(prev => [...logs, ...prev]);
          return;
        } else {
          setBattleOutcome('defeat');
          logs.push('💀 GAME OVER! You were defeated by the Boss Monster.');
        }
      }

      const nextAction = selectNextBossAction();
      setNextBossAction(nextAction);

      if (playerStunnedNext && newPlayerHp > 0) {
        logs.push('🌀 You are stunned! Your turn is skipped!');
        setBattleLogs(prev => [...logs, ...prev]);
        setTimeout(() => {
          executeBossTurn(currentBossHp, newPlayerHp, currentMana, false, false, false);
        }, 1200);
        return;
      }

      setBattleFlashing('player');
      setTimeout(() => setBattleFlashing(null), 150);
      setBattleLogs(prev => [...logs, ...prev]);
    }, 600);
  };

  const handleUseItemInBattle = (itemId: string) => {
    if (battleOutcome) return;
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.qty <= 0) return;

    playSound('click');
    useItem(itemId);

    const logs: string[] = [];
    let endTurn = true;

    if (itemId === 'hp_potion') {
      const healAmount = 45;
      const newHp = Math.min(100, playerHp + healAmount);
      setPlayerHp(newHp);
      logs.push(`🧪 You drank a Health Potion! Recovered ${healAmount} HP!`);
    } else if (itemId === 'xp_booster') {
      const damage = 35;
      const newBossHp = Math.max(0, bossHp - damage);
      setBossHp(newBossHp);
      setBattleFlashing('boss');
      setTimeout(() => setBattleFlashing(null), 150);
      logs.push(`⚡ You activated an XP Booster! Triggered an energy explosion dealing ${damage} damage to the Boss!`);
      logs.push(`✨ Granted +10 bonus XP!`);
      addXpDirectly(10);

      if (newBossHp <= 0) {
        setBattleOutcome('victory');
        playSound('success');
        confetti({
          particleCount: 80,
          spread: 80,
          colors: ['#FFB6C1', '#AEECEF', '#FFFACD', '#D8B4E2']
        });
        addXpDirectly(50);
        setBattleLogs(prev => [...logs, '🏆 VICTORY! You defeated the Boss Monster and earned +50 XP!', ...prev]);
        return;
      }
    } else if (itemId === 'boss_key') {
      setBossStunned(true);
      logs.push(`🔑 You unlocked cosmic runes with the Boss Key! The Boss is STUNNED and skips its next counter-attack!`);
      endTurn = false; // stunning the boss doesn't end your turn!
    } else if (itemId === 'elixir_might') {
      setFightMightBonus(prev => prev + 15);
      const newHp = Math.min(100, playerHp + 20);
      setPlayerHp(newHp);
      logs.push(`🧪 You consumed the Elixir of Might! Fight power permanently boosted by +15 damage per hit! (Recovered +20 HP)`);
    } else if (itemId === 'lucky_charm') {
      setGuaranteedCrit(true);
      logs.push(`🍀 You rubbed the Lucky Charm! Good fortune guarantees your next strike will be a CRITICAL HIT (2x damage)!`);
      endTurn = false; // rubbing the charm doesn't end your turn!
    } else if (itemId === 'task_shield') {
      setShieldActive(true);
      logs.push(`🛡️ You activated a bubble barrier using the Task Shield! The next Boss attack will deal 0 damage!`);
    }

    setBattleLogs(prev => [...logs, ...prev]);

    if (endTurn) {
      executeBossTurn(bossHp, playerHp, playerMana, shieldActive || (itemId === 'task_shield'), bossStunned, false);
    }
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
                  <div className="flex items-center gap-3">
                    <span className="text-[9px] font-pixel font-bold text-slate-800 bg-slate-100 px-2 py-0.5 border border-slate-200 rounded">
                      {quests.filter(q => q.completed).length}/12 COMPLETE
                    </span>
                    <span
                      onClick={() => { playSound('success'); cheatCompleteAllQuests(); }}
                      className="text-[7px] font-pixel text-purple-600 hover:text-white bg-purple-50 hover:bg-purple-600 border border-purple-300 hover:border-purple-600 px-1.5 py-0.5 rounded cursor-pointer transition-all shadow-sm active:scale-95"
                      title="Developer bypass to complete all quests"
                    >
                      🔧 DEV: COMPLETE ALL
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
              className="w-12 h-12 bg-white border border-pastel-cyan rounded flex items-center justify-center shrink-0 cursor-pointer hover:bg-slate-50 transition-colors group/backpack shadow-sm"
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
            onClick={() => { playSound('click'); navigate('/quests'); }}
            className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2 cursor-pointer group/header hover:border-slate-300 transition-colors relative"
            title="Go to Quest Board"
          >
            <span className="font-pixel text-[9px] text-purple-900 font-bold tracking-wider group-hover/header:text-purple-700 transition-colors flex items-center gap-1">
              <span className="pixel-star scale-75 inline-block mr-1"></span>
              BOSS BATTLE
            </span>
            <button
              className="text-pastel-cyan hover:text-pastel-yellow transition-colors font-pixel text-[9px] flex items-center gap-1 font-bold bg-slate-50 hover:bg-slate-100 border border-slate-200 px-2 py-0.5 rounded shadow-sm hover:border-pastel-cyan"
            >
              GO <span className="transform group-hover/header:translate-x-0.5 transition-transform font-bold">&gt;</span>
            </button>
          </div>
          <div className="flex items-start gap-3 flex-1 w-full">
            <div className="w-12 h-12 bg-white border border-pastel-cyan rounded flex items-center justify-center shrink-0">
              <img alt="Monster" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJqvHAG-77KicVUI6E5y9OaLNkH_KmJdNe55qpYx88_5Bj9UidrzNgUD0CzFxKy2FFiALRwoWNCCG9RkV_v_dfOJVIyGRVx22_Onm79syyy4NPBX7OloQvVyVXcSFYoxDXgy5TYkrkulfSxLFP0ReMg7Zm5oQFl5wc_Bl3xZfUSLwIRRdfb07fWmemFXoJ1UHPvh1EaJ60SkoJmzSlTIJdmqlutsGL6ckXI4nuRgosI8DNoXrYHpn8-MXomLHo6QXOMDGIske93lA" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between h-full w-full">
              <p className="text-[11px] text-slate-600 leading-snug mb-2 font-medium">Face monsters in the turn-based RPG arena. Click <strong className="text-purple-700">FIGHT</strong> to battle the boss and earn +50 XP!</p>
              <div className="flex items-center mt-auto pt-1 w-full justify-center">
                <button
                  onClick={(e) => { e.preventDefault(); startBossBattle(); }}
                  className="w-[80%] py-1.5 bg-pastel-pink pixel-border text-slate-800 text-[9px] font-pixel font-bold hover:bg-pastel-yellow transition-all text-center uppercase active:scale-95 shadow-sm"
                >
                  FIGHT BOSS
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
            {/* Pioneer Badge */}
            <div className="flex flex-col items-center w-24 relative group cursor-pointer">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center w-48 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white rounded-lg shadow-2xl text-center z-50 pointer-events-none transition-all">
                <span className="font-pixel text-[8px] text-pastel-purple mb-1 font-bold tracking-wider">PIONEER</span>
                <span className="text-[7px] font-pixel text-slate-400 mb-2 uppercase tracking-wide">Epic Achievement</span>
                <p className="text-[10px] text-slate-200 leading-relaxed font-medium">Awarded for participating in the early beta launch of XPlore.</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
              </div>

              {/* Badge Icon Box */}
              <div className="w-20 h-20 bg-white border-2 border-pastel-purple rounded-xl flex items-center justify-center p-3 shadow-sm hover:border-pastel-purple hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <img alt="Badge 1" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDyld3ucNrBEnVMGVCs96XYLSdMMdu6oRN4MIEsZCWHuIsLL6ai0DFjz35-Figuq-09a4D63ibGnc7PHE13kG_W_EeuY44aWqcqRoRj8JRtJkvC12ZcYR9dQM3kkQi22VeemDAW2KLMN6bPxZfJ4E8Eeq2eUrSbks8S3PCErCTg4njrtrTx7zv5BBR1PBWJphR6d2XjrWNQo-MUuMI5-2WHf9MqLbouCww6-4TnqlR1Mc68BOY5yn6QelRPLKUowkMh70olMQkCoP4" />
              </div>
              <span className="font-pixel text-[10px] text-purple-900 text-center font-bold tracking-tight mt-3 break-words w-full leading-normal">Pioneer</span>
            </div>

            {/* 7 Day Streak Badge */}
            <div className="flex flex-col items-center w-24 relative group cursor-pointer">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center w-48 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white rounded-lg shadow-2xl text-center z-50 pointer-events-none transition-all">
                <span className="font-pixel text-[8px] text-pastel-cyan mb-1 font-bold tracking-wider">7-DAY STREAK</span>
                <span className="text-[7px] font-pixel text-slate-400 mb-2 uppercase tracking-wide">Common Achievement</span>
                <p className="text-[10px] text-slate-200 leading-relaxed font-medium">Earned by completing at least one quest daily for 7 consecutive days.</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
              </div>

              {/* Badge Icon Box */}
              <div className="w-20 h-20 bg-white border-2 border-pastel-cyan rounded-xl flex items-center justify-center p-3 shadow-sm hover:border-pastel-cyan hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <img alt="Badge 2" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBA28AWJVzEP4rilqd2miatF92iCYMyzmSfu0nzQbWRtwKfe7Rxx76bXtEuNfrP25J4eyXMWFy2iAgnWGs9uVYGYFQojU4mgoFC_j0Aa2lYJavBILrPUXnFBQ5MAczSrXejgvduHGDEur-RsaZUNqcPo8EVkU6ncpNSbLYpBLujQGfOODaNqij7VfvAB8uew0j53yGJLteB-wWwU0VWG56fh8uJTUqgznPcUOGbSsKgtBtU_Irsqqcd-HbxxyQsfH04ZcVtVCFvDG8" />
              </div>
              <span className="font-pixel text-[10px] text-cyan-900 text-center font-bold tracking-tight mt-3 break-words w-full leading-normal">7 Day Streak</span>
            </div>

            {/* First Blood Badge */}
            <div className="flex flex-col items-center w-24 relative group cursor-pointer">
              {/* Tooltip */}
              <div className="absolute bottom-full mb-3 hidden group-hover:flex flex-col items-center w-48 p-3 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-white rounded-lg shadow-2xl text-center z-50 pointer-events-none transition-all">
                <span className="font-pixel text-[8px] text-pastel-pink mb-1 font-bold tracking-wider">FIRST BLOOD</span>
                <span className="text-[7px] font-pixel text-slate-400 mb-2 uppercase tracking-wide">Common Achievement</span>
                <p className="text-[10px] text-slate-200 leading-relaxed font-medium">Earned by successfully completing your very first quest.</p>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
              </div>

              {/* Badge Icon Box */}
              <div className="w-20 h-20 bg-white border-2 border-pastel-pink rounded-xl flex items-center justify-center p-3 shadow-sm hover:border-pastel-pink hover:shadow-md transition-all duration-300 transform hover:scale-105">
                <img alt="Badge 3" className="w-full h-full object-contain" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwMhPLbsNBqQFHgDRrfPJkBj4Dp2Jei9NnyW8NHcBiF7NaOvkuCK4tCbqgMxemIdESHLQEw-0B6zrzQMcgftBXoXcODBPa9mWsG6ZwQhI3p_3RUmm9F6n7VBJMVs9pQVr17dKijspk04WxjjBaxRfhOWjPEiTVtcNZCYAP2-hN8QmlEfLg2s31RTugG3FZI3zLK2c4a8XS2RnT6o7S2feK8aSjUIt0BsNgP1YyNg0-AYVCxihaUp5j4lkaWRtv38dNy7IiLysHOGk" />
              </div>
              <span className="font-pixel text-[10px] text-rose-900 text-center font-bold tracking-tight mt-3 break-words w-full leading-normal">First Blood</span>
            </div>
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

            <div
              onClick={() => { playSound('click'); navigate('/skill-exchange'); }}
              className="flex items-center justify-between bg-white p-4 border-2 border-slate-800 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-cyan)] hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-pastel-cyan/20 blur"></div>
                  <img alt="Python Logo" className="w-8 h-8 relative z-10" src="https://lh3.googleusercontent.com/aida-public/AB6AXuArfFALn5dWrwM_nbqci6htaa0RqRfRjD1-Zk848xT8DmHjgZttPtJWcFj7QNrW2RKqJzvKtKC3ssqnV1A1xj8q3lMWgR6lkWU28V3pIRD6ZkQgX3ToASsIZwRhGGALne94k6CX-0pubpVptpBSf6FdPTP49QlBwBdy-mwlv6wijKSEvEDCfPCVELO97h6FEGQKvNgba4ExvudAb6r-MOREKYL9uX2cKmIjrA5Ta-ZYKZJcTXnLfoywdoQTXIs4ko54PhuFUQ0QEvc" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold text-sm tracking-wide group-hover:text-pastel-cyan transition-colors">Python Basics</p>
                  <p className="text-xs text-slate-500 font-medium">In demand by 3 users</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); playSound('click'); navigate('/skill-exchange'); }}
                className="px-4 py-2 bg-transparent border-2 border-slate-300 rounded text-slate-600 font-pixel text-[8px] group-hover:border-pastel-cyan group-hover:text-pastel-cyan transition-colors"
              >
                TEACH
              </button>
            </div>

            <div
              onClick={() => { playSound('click'); navigate('/skill-exchange'); }}
              className="flex items-center justify-between bg-white p-4 border-2 border-slate-800 shadow-[2px_2px_0px_#334155] hover:shadow-[4px_4px_0px_theme(colors.pastel-pink)] hover:-translate-y-1 transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-4">
                <div className="bg-white p-2 rounded relative overflow-hidden group-hover:scale-110 transition-transform">
                  <div className="absolute inset-0 bg-pastel-pink/20 blur"></div>
                  <img alt="React Logo" className="w-8 h-8 relative z-10" src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" />
                </div>
                <div>
                  <p className="text-slate-800 font-bold text-sm tracking-wide group-hover:text-rose-500 transition-colors">React Hook Mastery</p>
                  <p className="text-xs text-slate-500 font-medium">Requested by you</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); playSound('click'); navigate('/skill-exchange'); }}
                className="px-4 py-2 bg-transparent border-2 border-slate-300 rounded text-slate-600 font-pixel text-[8px] group-hover:border-rose-500 group-hover:text-rose-500 transition-colors"
              >
                FIND
              </button>
            </div>

          </div>
        </section>
      </div>

      {/* Boss Battle Modal */}
      {isBattleActive && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-[fade-in_0.2s_ease-out]">
          <div className="bg-slate-900/95 border-4 border-slate-700/80 rounded-2xl p-5 md:p-6 relative max-w-2xl w-full font-pixel shadow-[0_0_40px_rgba(168,85,247,0.35)] text-white flex flex-col justify-between overflow-hidden min-h-[580px] md:min-h-[520px] transition-all duration-300">

            {/* Backpack Overlay Drawer */}
            <div
              className={`absolute right-0 top-0 bottom-0 w-80 bg-slate-950/95 backdrop-blur-2xl border-l border-slate-800/80 p-5 flex flex-col justify-between z-40 transition-transform duration-300 ease-in-out shadow-2xl rounded-r-2xl ${isBackpackOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
              <div className="flex flex-col h-full overflow-hidden">
                {/* Drawer Header */}
                <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 shrink-0">
                  <span className="text-xs text-amber-400 font-bold tracking-wider flex items-center gap-1.5 uppercase">
                    🎒 Battle Backpack
                  </span>
                  <button
                    onClick={() => { playSound('click'); setIsBackpackOpen(false); }}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs"
                  >
                    [← BACK]
                  </button>
                </div>

                <p className="text-[8.5px] text-slate-400 leading-tight mb-4 shrink-0">
                  Click to consume inventory items for powerful combat effects!
                </p>

                {/* Backpack Items Scroll List */}
                <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {inventory.map((item) => {
                    const isZero = item.qty === 0;

                    // Short, high-impact tactical labels instead of long clutter text
                    let battleLabel = '';
                    let battleBtnText = 'USE';
                    if (item.id === 'hp_potion') { battleLabel = '💚 Restore 45 Health'; battleBtnText = 'HEAL'; }
                    else if (item.id === 'xp_booster') { battleLabel = '⚡ Deal 35 DMG +10 XP'; battleBtnText = 'BLAST'; }
                    else if (item.id === 'boss_key') { battleLabel = '🌀 Stun Boss (Free Turn)'; battleBtnText = 'STUN'; }
                    else if (item.id === 'elixir_might') { battleLabel = '🧪 +15 DMG per strike'; battleBtnText = 'DRINK'; }
                    else if (item.id === 'lucky_charm') { battleLabel = '🍀 Guaranteed CRIT strike'; battleBtnText = 'RUB'; }
                    else if (item.id === 'task_shield') { battleLabel = '🛡️ Block next boss hit'; battleBtnText = 'BARRIER'; }

                    return (
                      <div
                        key={item.id}
                        className={`p-2.5 rounded-lg border border-slate-800 bg-slate-900/60 flex items-center gap-3 justify-between transition-all ${isZero ? 'opacity-35' : 'hover:bg-slate-900/90'}`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-2xl shrink-0 select-none">{item.icon}</span>
                          <div className="flex flex-col min-w-0 leading-tight">
                            <span className="text-[9px] font-bold text-slate-200 truncate">{item.name}</span>
                            <span className="text-[7.5px] text-amber-500 font-bold">QTY: {item.qty}</span>
                            <span className="text-[7px] text-slate-400 mt-1 font-semibold leading-none">{battleLabel}</span>
                          </div>
                        </div>

                        <button
                          disabled={isZero || !!battleOutcome}
                          onClick={() => handleUseItemInBattle(item.id)}
                          className={`px-3 py-1.5 text-[8px] font-bold rounded-md border shrink-0 transition-all ${isZero
                            ? 'bg-slate-950 text-slate-700 border-slate-900 cursor-not-allowed shadow-none'
                            : 'bg-gradient-to-b from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 border-amber-500 text-slate-950 cursor-pointer shadow-md hover:scale-105 active:translate-y-0.5'
                            }`}
                        >
                          {battleBtnText}
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Passive Advantages Section */}
                <div className="border-t border-slate-800 pt-3 mt-4 shrink-0 text-[8px] text-slate-500 flex flex-col gap-2 bg-slate-950/80 p-3 rounded-xl">
                  <span className="font-bold text-slate-400 tracking-wider">⚡ PASSIVE ADVANTAGES:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🧪</span>
                    <span>Might Elixir: {inventory.find(i => i.id === 'elixir_might')?.qty ? '✅ +10 DMG Passive Active' : '❌ Inactive'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs">🍀</span>
                    <span>Lucky Charm: {inventory.find(i => i.id === 'lucky_charm')?.qty ? '✅ +30% Crit Passive Active' : '❌ Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Battle Panel Container */}
            <div className="flex flex-col flex-1 justify-between h-full">

              {/* Header */}
              <div className="flex justify-between items-center border-b border-slate-800 pb-3 mb-4 shrink-0">
                <span className="text-pastel-purple font-bold tracking-wider text-xs md:text-sm flex items-center gap-2">
                  <span className="pixel-star animate-pulse"></span>
                  BOSS BATTLE ARENA
                </span>
                <button
                  onClick={handleRun}
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer text-xs md:text-sm"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Status Buff Bar */}
              <div className="flex flex-wrap gap-1.5 mb-4 px-2 py-1 bg-slate-950/60 border border-slate-800 rounded-lg text-[9px] text-slate-400 items-center select-none shrink-0">
                <span className="font-bold text-pastel-purple text-[8px] mr-1 uppercase">BUFFS:</span>
                {bossStunned && <span className="bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 px-2 py-0.5 rounded-full animate-pulse font-bold">🌀 STUNNED</span>}
                {shieldActive && <span className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 px-2 py-0.5 rounded-full animate-pulse font-bold">🛡️ SHIELDED</span>}
                {fightMightBonus > 0 && <span className="bg-rose-500/20 border border-rose-500/40 text-rose-400 px-2 py-0.5 rounded-full font-bold">⚔️ MIGHT +{fightMightBonus}</span>}
                {guaranteedCrit && <span className="bg-amber-500/20 border border-amber-500/40 text-amber-400 px-2 py-0.5 rounded-full animate-pulse font-bold">🍀 CRIT CHANCE</span>}
                {playerDefending && <span className="bg-teal-500/20 border border-teal-500/40 text-teal-300 px-2 py-0.5 rounded-full animate-pulse font-bold">🛡️ GUARDING</span>}
                {!bossStunned && !shieldActive && fightMightBonus === 0 && !guaranteedCrit && !playerDefending && <span className="text-slate-500 italic">None Active</span>}
              </div>

              {/* Grid Panel: Boss vs Player */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 flex-1">

                {/* Boss Column */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col items-center justify-between text-center relative overflow-hidden">

                  {/* Boss Intent Telegraph Badge */}
                  <div className="absolute top-2 left-2 right-2 flex justify-center z-20">
                    {nextBossAction === 'heavy' && (
                      <span className="bg-rose-950/80 border border-rose-700/80 text-rose-300 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.3)] animate-pulse">
                        🔥 INTENT: FLAME BREATH
                      </span>
                    )}
                    {nextBossAction === 'stun' && (
                      <span className="bg-cyan-950/80 border border-cyan-700/80 text-cyan-300 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.3)] animate-pulse">
                        🌀 INTENT: STUN WAVE
                      </span>
                    )}
                    {nextBossAction === 'roar' && (
                      <span className="bg-emerald-950/80 border border-emerald-700/80 text-emerald-300 text-[8px] font-bold px-2 py-0.5 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        💚 INTENT: HEALING ROAR
                      </span>
                    )}
                    {nextBossAction === 'slash' && (
                      <span className="bg-slate-950/80 border border-slate-700/80 text-slate-300 text-[8px] font-bold px-2 py-0.5 rounded-full">
                        ⚔️ INTENT: SWIPE STRIKE
                      </span>
                    )}
                  </div>

                  {/* Boss Image Container */}
                  <div className={`w-20 h-20 md:w-24 md:h-24 bg-slate-900/60 border ${battleFlashing === 'boss' ? 'border-rose-500 bg-rose-950/30 scale-95' : 'border-slate-800'} rounded-xl flex items-center justify-center p-2 relative overflow-hidden transition-all duration-150 mt-4`}>
                    <div className="absolute inset-0 bg-cyan-500/5 blur-[2px]"></div>
                    <img
                      alt="Boss Monster"
                      className={`w-full h-full object-contain relative z-10 ${battleOutcome ? '' : 'animate-bounce'}`}
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAJqvHAG-77KicVUI6E5y9OaLNkH_KmJdNe55qpYx88_5Bj9UidrzNgUD0CzFxKy2FFiALRwoWNCCG9RkV_v_dfOJVIyGRVx22_Onm79syyy4NPBX7OloQvVyVXcSFYoxDXgy5TYkrkulfSxLFP0ReMg7Zm5oQFl5wc_Bl3xZfUSLwIRRdfb07fWmemFXoJ1UHPvh1EaJ60SkoJmzSlTIJdmqlutsGL6ckXI4nuRgosI8DNoXrYHpn8-MXomLHo6QXOMDGIske93lA"
                    />
                  </div>

                  {/* Boss Health Bar */}
                  <div className="w-full mt-3">
                    <div className="flex justify-between text-[9px] text-cyan-400 mb-1 px-1 font-bold">
                      <span>BOSS MONSTER</span>
                      <span>{bossHp} / 150 HP</span>
                    </div>
                    <div className="w-full h-3 bg-slate-950 border border-slate-800 p-0.5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
                        style={{ width: `${Math.max(0, (bossHp / 150) * 100)}%` }}
                      />
                    </div>

                    {/* Strategy Hints based on telemetry */}
                    <div className="text-[7.5px] text-slate-400 mt-2 leading-tight select-none italic text-left px-1">
                      {nextBossAction === 'heavy' && "⚠️ Flame Breath charges a massive hit. Guarding is highly recommended!"}
                      {nextBossAction === 'stun' && "🌀 Stun Wave stuns and skips your turn unless you Defend."}
                      {nextBossAction === 'roar' && "💚 Healing Roar restores 25 HP. Perfect turn to Strike or Cast Spell!"}
                      {nextBossAction === 'slash' && "⚔️ Swipe Strike deals moderate quick damage. Counter with a heavy strike."}
                    </div>
                  </div>
                </div>

                {/* Player Column */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between text-left relative overflow-hidden">

                  {/* Player Credentials */}
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-rose-500 to-indigo-500 border border-white/10 flex items-center justify-center font-bold text-white shadow-sm shrink-0">
                      {currentUser.initials}
                    </div>
                    <div>
                      <div className="text-slate-100 font-bold text-xs leading-none">{currentUser.username}</div>
                      <div className="text-[8px] text-slate-400 font-pixel mt-1 uppercase tracking-wide">{currentUser.title || 'ADVENTURER'}</div>
                    </div>
                  </div>

                  {/* HP & MP Dual Bars */}
                  <div className="w-full space-y-2.5">
                    {/* Health Bar */}
                    <div>
                      <div className="flex justify-between text-[9px] text-rose-400 mb-1 px-1 font-bold">
                        <span>HEALTH (HP)</span>
                        <span>{playerHp} / 100 HP</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 border border-slate-800 p-0.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r from-rose-500 to-pink-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(244,63,94,0.4)] ${battleFlashing === 'player' ? 'bg-red-500 animate-pulse' : ''}`}
                          style={{ width: `${playerHp}%` }}
                        />
                      </div>
                    </div>

                    {/* Mana Bar */}
                    <div>
                      <div className="flex justify-between text-[9px] text-indigo-400 mb-1 px-1 font-bold">
                        <span>MANA (MP)</span>
                        <span>{playerMana} / 100 MP</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 border border-slate-800 p-0.5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-violet-400 rounded-full transition-all duration-300 shadow-[0_0_8px_rgba(99,102,241,0.4)]"
                          style={{ width: `${playerMana}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Brief Strategy Instruction */}
                  <div className="text-[7.5px] text-slate-400 mt-2 leading-tight italic px-1 select-none">
                    💡 Slashes grant +12 MP. Spells cost 18 MP but deal huge damage. Guarding halves damage, blocks stuns, and grants +8 MP!
                  </div>
                </div>
              </div>

              {/* Combat Logs Timeline */}
              <div className="bg-slate-950/80 border border-slate-800/80 text-slate-300 p-3 h-24 overflow-y-auto text-[9.5px] font-mono mb-4 rounded-xl select-text custom-scrollbar flex flex-col-reverse gap-1.5 shadow-inner shrink-0">
                {battleLogs.map((log, index) => {
                  // Custom coloring based on combat status
                  let textColor = 'text-slate-300';
                  if (log.includes('⚔️') || log.includes('Slash') || log.includes('Strike')) textColor = 'text-cyan-400';
                  else if (log.includes('🔥') || log.includes('Fireball') || log.includes('breathed') || log.includes('Flame')) textColor = 'text-orange-400';
                  else if (log.includes('🛡️') || log.includes('defended') || log.includes('shield') || log.includes('barrier')) textColor = 'text-emerald-400';
                  else if (log.includes('💚') || log.includes('Healing') || log.includes('UNDYING') || log.includes('will')) textColor = 'text-teal-300';
                  else if (log.includes('🏆') || log.includes('VICTORY')) textColor = 'text-amber-400 font-bold';
                  else if (log.includes('💀') || log.includes('GAME OVER') || log.includes('defeated')) textColor = 'text-rose-500 font-bold';
                  else if (log.includes('🌀') || log.includes('STUN') || log.includes('Stun')) textColor = 'text-purple-400';
                  else if (log.includes('🍀') || log.includes('Lucky')) textColor = 'text-yellow-400';

                  return (
                    <div key={index} className={`leading-tight flex items-start gap-1 ${textColor}`}>
                      <span>{log}</span>
                    </div>
                  );
                })}
              </div>

              {/* RPG Decision Action Controls */}
              {battleOutcome ? (
                <div className="flex flex-col gap-2 shrink-0">
                  <div className={`text-center font-bold text-xs p-2.5 rounded-lg ${battleOutcome === 'victory' ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse' : 'text-rose-400 bg-rose-500/10 border border-rose-500/30'}`}>
                    {battleOutcome === 'victory' ? '🏆 VICTORY! Earned +50 XP and +50 Gold!' : '💀 GAME OVER! You were defeated.'}
                  </div>
                  <div className="flex gap-3">
                    {battleOutcome === 'defeat' && (
                      <button
                        onClick={startBossBattle}
                        className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 border border-rose-600 rounded-lg text-white text-xs font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
                      >
                        TRY AGAIN
                      </button>
                    )}
                    <button
                      onClick={handleRun}
                      className="flex-1 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold hover:bg-slate-700 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer text-center"
                    >
                      CLOSE BATTLE
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 shrink-0">

                  {/* Attack (Slash) Button */}
                  <button
                    onClick={handleAttack}
                    className="py-2 px-1 bg-gradient-to-b from-cyan-500 to-blue-600 border border-cyan-600 hover:border-cyan-400 text-white text-[10px] rounded-lg font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 leading-none"
                    title="Deal 12-18 base damage. Generates +12 MP."
                  >
                    <span className="text-sm">⚔️</span>
                    <span>SLASH STRIKE</span>
                    <span className="text-[7px] text-cyan-200 mt-0.5 font-normal">+12 MANA</span>
                  </button>

                  {/* Cast Spell Button */}
                  <button
                    disabled={playerMana < 18}
                    onClick={handleCastSpell}
                    className={`py-2 px-1 rounded-lg font-bold shadow-md flex flex-col items-center justify-center gap-0.5 leading-none transition-all ${playerMana < 18
                      ? 'bg-slate-800/80 border border-slate-700 text-slate-500 cursor-not-allowed opacity-50'
                      : 'bg-gradient-to-b from-indigo-500 to-violet-600 border border-indigo-600 hover:border-indigo-400 text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                      }`}
                    title="Cast Fireball. Costs 18 MP. Deals 28-38 damage."
                  >
                    <span className="text-sm">🔥</span>
                    <span>FIREBALL</span>
                    <span className={`text-[7px] mt-0.5 font-normal ${playerMana < 18 ? 'text-slate-500' : 'text-indigo-200'}`}>18 MANA</span>
                  </button>

                  {/* Defend Button */}
                  <button
                    onClick={handleDefend}
                    className="py-2 px-1 bg-gradient-to-b from-emerald-500 to-teal-600 border border-emerald-600 hover:border-emerald-400 text-white text-[10px] rounded-lg font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 leading-none"
                    title="Prepares a shield. Reduces incoming damage by 60% and blocks stuns. Generates +8 MP."
                  >
                    <span className="text-sm">🛡️</span>
                    <span>DEFEND</span>
                    <span className="text-[7px] text-emerald-200 mt-0.5 font-normal">+8 MANA</span>
                  </button>

                  {/* Backpack Items Drawer Toggle Button */}
                  <button
                    onClick={() => { playSound('click'); setIsBackpackOpen(!isBackpackOpen); }}
                    className={`py-2 px-1 border rounded-lg font-bold shadow-md flex flex-col items-center justify-center gap-0.5 leading-none transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${isBackpackOpen
                      ? 'bg-amber-600 border-amber-500 text-white'
                      : 'bg-gradient-to-b from-slate-800 to-slate-900 border-slate-700 hover:border-amber-400 text-amber-400'
                      }`}
                    title="Toggle item backpack drawer."
                  >
                    <span className="text-sm">🎒</span>
                    <span>🎒 ITEMS</span>
                    <span className="text-[7px] text-amber-300/80 mt-0.5 font-normal">BAGPACK</span>
                  </button>

                  {/* Flee Button */}
                  <button
                    onClick={handleRun}
                    className="py-2 px-1 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 hover:border-slate-500 text-white text-[10px] rounded-lg font-bold shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 leading-none col-span-2 md:col-span-1"
                    title="Escape from the Boss Battle."
                  >
                    <span className="text-sm">🏃</span>
                    <span>RUN AWAY</span>
                    <span className="text-[7px] text-slate-400 mt-0.5 font-normal">FLEE</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 1. Mystery Mission Unlock Modal */}
      {showUnlockModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-[fade-in_0.25s_ease-out]">
          <div className="panel-border-purple p-6 bg-slate-900 border-4 border-purple-500 max-w-md w-full text-white relative text-center shadow-[0_0_30px_rgba(168,85,247,0.6)] animate-[scale-in_0.2s_ease-out]">
            {/* Holographic glowing lines/glow effect */}
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>
            
            <div className="text-pastel-purple font-pixel text-xs font-bold tracking-widest mb-2 uppercase animate-pulse">
              ✨ SYSTEM SYNC COMPLETE ✨
            </div>
            
            <h2 className="text-pastel-purple font-extrabold text-lg md:text-xl tracking-wider font-pixel mb-4 drop-shadow-[0_0_8px_#d946ef]">
              MYSTERY MISSION CHEST UNLOCKED!
            </h2>
            
            {/* Spinning chest visual */}
            <div className="my-6 relative flex justify-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-purple-800 to-indigo-900 border-4 border-purple-400 flex items-center justify-center text-6xl select-none shadow-[0_0_20px_#a855f7] animate-[bounce_3s_infinite_ease-in-out]">
                🎁
              </div>
              <div className="absolute -top-2 -right-2 text-2xl animate-[spin_6s_infinite_linear]">⭐</div>
              <div className="absolute -bottom-2 -left-2 text-2xl animate-[spin_8s_infinite_linear]">✨</div>
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-6 font-medium">
              Ho ho! Magnificent! You completed all daily habits on the Quest Board! Merchant Alistair has revealed a secret, real-world <strong className="text-pastel-purple">Mystery Mission</strong> for you. Complete it to unlock exclusive rewards!
            </p>

            <button
              onClick={() => { playSound('click'); setShowUnlockModal(false); acceptMysteryMission(); }}
              className="w-full py-3 bg-pastel-pink hover:bg-pastel-yellow text-slate-800 border-2 border-slate-800 font-pixel text-[10px] font-black tracking-wider shadow-[4px_4px_0px_#1e293b] active:translate-y-[2px] active:shadow-none hover:translate-y-[-1px] transition-all cursor-pointer text-center"
            >
              REVEAL & ACCEPT MYSTERY MISSION ⚡
            </button>
          </div>
        </div>
      )}

      {/* 2. Rewards Success Modal */}
      {showRewardsModal && mysteryMission && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-lg flex items-center justify-center z-50 p-4 animate-[fade-in_0.25s_ease-out]">
          <div className="panel-border-yellow p-6 bg-slate-900 border-4 border-yellow-500 max-w-md w-full text-white relative text-center shadow-[0_0_40px_rgba(251,191,36,0.6)] animate-[scale-in_0.2s_ease-out]">
            <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>

            <div className="text-pastel-yellow font-pixel text-xs font-bold tracking-widest mb-2 uppercase animate-pulse">
              🏆 MISSION ACCOMPLISHED 🏆
            </div>

            <h2 className="text-pastel-yellow font-extrabold text-lg md:text-xl tracking-wider font-pixel mb-4 drop-shadow-[0_0_10px_#fbbf24]">
              SPONTANEOUS HERO REWARD!
            </h2>

            {/* Glowing awards grid */}
            <div className="bg-slate-950/80 border border-slate-800/80 p-4 rounded-lg my-5 flex flex-col gap-4 text-left shadow-inner">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <span className="text-[10px] text-slate-500 font-pixel font-bold">REWARD</span>
                <span className="text-[10px] text-emerald-400 font-pixel font-bold">GRANTED</span>
              </div>

              {/* XP */}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-300 font-medium">Daily Fun Quest XP</span>
                <span className="text-xs text-pastel-pink font-bold font-pixel">+{mysteryMission.xpReward} XP</span>
              </div>

              {/* Title */}
              {mysteryMission.unlockedTitle && (
                <div className="flex justify-between items-center border-t border-slate-900/60 pt-2">
                  <span className="text-xs text-slate-300 font-medium">New Equipped Title</span>
                  <span className="text-xs text-amber-400 font-bold border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 rounded uppercase font-pixel tracking-wider">
                    {mysteryMission.unlockedTitle}
                  </span>
                </div>
              )}

              {/* Badge */}
              {mysteryMission.unlockedBadge && (
                <div className="flex justify-between items-center border-t border-slate-900/60 pt-2">
                  <span className="text-xs text-slate-300 font-medium">Legendary Achievement Badge</span>
                  <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-pixel">
                    <span>{mysteryMission.unlockedBadge.icon}</span>
                    <span>{mysteryMission.unlockedBadge.name}</span>
                  </span>
                </div>
              )}

              {/* Collectible */}
              {mysteryMission.unlockedCollectible && (
                <div className="flex justify-between items-center border-t border-slate-900/60 pt-2">
                  <span className="text-xs text-slate-300 font-medium">Rare Collectible Showcase Item</span>
                  <span className="text-xs font-semibold text-slate-100 flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/30 px-2 py-0.5 rounded font-pixel">
                    <span>{mysteryMission.unlockedCollectible.icon}</span>
                    <span>{mysteryMission.unlockedCollectible.name}</span>
                  </span>
                </div>
              )}
            </div>

            <p className="text-slate-300 text-xs leading-relaxed mb-6">
              Incredible bravery, hero! You stepped outside the digital world to complete today's spontaneous real-life challenge. You are now officially recognized as a pioneer of spontaneous adventures!
            </p>

            <button
              onClick={() => { playSound('click'); setShowRewardsModal(false); navigate('/profile'); }}
              className="w-full py-3 bg-pastel-yellow hover:bg-pastel-pink text-slate-800 border-2 border-slate-800 font-pixel text-[10px] font-black tracking-wider shadow-[4px_4px_0px_#1e293b] hover:translate-y-[-1px] transition-all cursor-pointer text-center"
            >
              SWEET! EQUIP MY REWARDS 👑
            </button>
          </div>
        </div>
      )}

    </>
  );
}

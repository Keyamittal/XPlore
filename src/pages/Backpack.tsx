import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { playSound } from '../utils/audio';
import { funChallenges } from '../data/funQuests';
import confetti from 'canvas-confetti';

export default function Backpack() {
  const { gold, inventory, buyItem, useItem, unlockedCollectibles } = useGame();
  const [activeTab, setActiveTab] = useState<'backpack' | 'shop' | 'collectibles'>('backpack');
  const [merchantDialogue, setMerchantDialogue] = useState<string>(
    "Welcome, traveler! Spend your hard-earned gold coins on items to aid your journey."
  );
  const [useFeedback, setUseFeedback] = useState<string | null>(null);

  const handlePurchase = (id: string, name: string, price: number) => {
    if (gold < price) {
      playSound('click');
      setMerchantDialogue("Hmph! You don't have enough gold coins for that! Complete more quests first.");
      return;
    }

    const success = buyItem(id);
    if (success) {
      playSound('success');
      setMerchantDialogue(`Ah, a fine choice! You purchased a ${name}. May it serve you well!`);
      // Fire small coin confetti
      confetti({
        particleCount: 15,
        spread: 30,
        colors: ['#FFD54F', '#FFC107'],
        origin: { y: 0.8 }
      });
    } else {
      setMerchantDialogue("Something went wrong with the transaction. Try again!");
    }
  };

  const handleUseItem = (id: string) => {
    playSound('click');
    const success = useItem(id);
    if (success) {
      playSound('success');
      
      if (id === 'xp_booster') {
        setUseFeedback(`⚡ Consumed XP Booster! Granted +50 XP!`);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#CE93D8', '#F48FB1', '#FFD54F', '#0E7490']
        });
      } else if (id === 'task_shield') {
        setUseFeedback(`🛡️ Activated Task Shield! Streak incremented by +1 & protected!`);
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#81C784', '#AEECEF']
        });
      } else if (id === 'hp_potion') {
        setUseFeedback(`🧪 Consumed Health Potion! Restored Health. (Tip: Health Potions are consumed automatically during Boss Battles!)`);
      } else if (id === 'boss_key') {
        setUseFeedback(`🔑 Unlocked a Mysterious Vault with the Boss Key! Granted +100 XP!`);
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FFD54F', '#FFC107', '#E0A96D']
        });
      } else if (id === 'elixir_might') {
        setUseFeedback(`🧪 Drank the Elixir of Might! Granted +60 XP! (Tip: Keep in inventory for passive +10 Boss damage boost!)`);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F48FB1', '#CE93D8']
        });
      } else if (id === 'lucky_charm') {
        setUseFeedback(`🍀 Activated the Lucky Charm! Granted +35 XP! (Tip: Keep in inventory for passive 30% Critical strike chance!)`);
        confetti({
          particleCount: 60,
          spread: 50,
          origin: { y: 0.7 },
          colors: ['#81C784', '#FFFACD']
        });
      }

      setTimeout(() => setUseFeedback(null), 4000);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-[fade-in_0.3s_ease-out]">
      {/* Page Header - Restructured to match other beautiful page headers and blend perfectly */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/50 pb-4">
        <div>
          <h1 className="text-pastel-purple font-bold text-2xl font-pixel mb-3 drop-shadow-[0_0_8px_rgba(206,147,216,0.6)]">BACKPACK & SHOP</h1>
          <p className="text-slate-500 text-sm">Gear up, manage resources, and prepare for glory!</p>
        </div>
        
        {/* Restructured Gold Balance Pill (Matches Quest Board header styling, with static coin, no spin) */}
        <div className="flex bg-slate-50 border border-pastel-yellow px-6 py-3 rounded-lg gap-3 items-center shadow-sm">
          <div className="w-8 h-8 rounded-full bg-pastel-yellow flex items-center justify-center text-lg select-none shadow-inner border border-amber-600">
            🪙
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-slate-500 font-pixel text-[10px] block mb-0.5">YOUR BALANCE</span>
            <span className="text-amber-600 font-pixel text-lg font-bold drop-shadow-[0_0_5px_rgba(217,119,6,0.3)]">{gold} GOLD</span>
          </div>
        </div>
      </div>

      {/* Merchant / Feedback Banner */}
      <section className="panel-border-cyan p-4 bg-slate-900 border-4 border-slate-800 text-white font-pixel text-[10px] relative overflow-hidden flex flex-col md:flex-row items-center gap-4">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none"></div>

        {/* Merchant Avatar Container */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <div className="w-14 h-14 bg-slate-800 border-2 border-pastel-cyan rounded flex items-center justify-center text-3xl select-none shadow-sm relative">
            🧙‍♂️
          </div>
          <span className="bg-pastel-cyan text-white text-[8px] font-pixel font-bold px-1.5 py-0.5 rounded-sm border border-slate-800 shadow-sm leading-none">
            MERCHANT
          </span>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <span className="text-pastel-cyan font-bold tracking-wider uppercase block mb-1">» Merchant Alistair says:</span>
          <p className="text-slate-300 leading-relaxed font-medium select-text">
            {activeTab === 'collectibles' 
              ? "Ho ho! Marvelous! You are showcasing your legendary Rare Collectibles! These are only earned by accomplishing secret Mystery Missions. They represent your real-world bravery!"
              : merchantDialogue}
          </p>
        </div>
      </section>

      {/* Consumable Use Feedback Alert */}
      {useFeedback && (
        <div className="bg-emerald-50 border-4 border-emerald-500 text-emerald-800 p-4 font-pixel text-[10px] shadow-[4px_4px_0px_#10B981] animate-bounce text-center">
          {useFeedback}
        </div>
      )}

      {/* Tabs Layout */}
      <div className="flex border-b-4 border-slate-800 mb-2 overflow-x-auto">
        <button
          onClick={() => { playSound('click'); setActiveTab('backpack'); }}
          className={`px-6 py-3 font-pixel text-[10px] font-bold border-t-4 border-x-4 border-slate-800 transition-all select-none whitespace-nowrap ${
            activeTab === 'backpack'
              ? 'bg-[#F8B7C1] text-slate-800 border-b-4 border-b-[#F8B7C1] translate-y-[4px]'
              : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-b-0 translate-y-0 shadow-[inset_0_-8px_8px_rgba(0,0,0,0.05)]'
          }`}
        >
          MY BACKPACK
        </button>
        <button
          onClick={() => { playSound('click'); setActiveTab('shop'); }}
          className={`px-6 py-3 font-pixel text-[10px] font-bold border-t-4 border-x-4 border-slate-800 transition-all select-none whitespace-nowrap ${
            activeTab === 'shop'
              ? 'bg-pastel-yellow text-slate-800 border-b-4 border-b-pastel-yellow translate-y-[4px]'
              : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-b-0 translate-y-0 shadow-[inset_0_-8px_8px_rgba(0,0,0,0.05)]'
          }`}
        >
          MERCHANT SHOP
        </button>
        <button
          onClick={() => { playSound('click'); setActiveTab('collectibles'); }}
          className={`px-6 py-3 font-pixel text-[10px] font-bold border-t-4 border-x-4 border-slate-800 transition-all select-none whitespace-nowrap ${
            activeTab === 'collectibles'
              ? 'bg-pastel-purple text-white border-b-4 border-b-pastel-purple translate-y-[4px]'
              : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-b-0 translate-y-0 shadow-[inset_0_-8px_8px_rgba(0,0,0,0.05)]'
          }`}
        >
          🏆 RARE COLLECTIBLES ({unlockedCollectibles?.length || 0}/8)
        </button>
      </div>

      {/* Inventory Panel */}
      {activeTab === 'backpack' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const isZero = item.qty === 0;
            return (
              <section
                key={item.id}
                className={`panel-border-pink p-5 flex flex-col justify-between bg-white transition-all ${
                  isZero ? 'opacity-70 saturate-50' : 'hover:-translate-y-1 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Item Header */}
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                    <span className="font-pixel text-[9px] text-pastel-pink font-bold tracking-wider uppercase">
                      {item.type === 'heal' ? 'RESTORATIVE' : item.type === 'xp' ? 'BOOSTER' : 'DEFENSIVE'}
                    </span>
                    <span className="font-pixel text-[10px] bg-slate-100 border border-slate-300 px-2 py-0.5 rounded shadow-sm text-slate-700 font-bold">
                      QTY: {item.qty}
                    </span>
                  </div>

                  {/* Icon & Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-50 border-2 border-slate-800 rounded flex items-center justify-center text-3xl select-none shadow-sm shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm tracking-wide">{item.name}</h3>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>

                {/* Use Action Button */}
                <button
                  disabled={isZero}
                  onClick={() => handleUseItem(item.id)}
                  className={`w-full py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold shadow-[2px_2px_0px_#1e293b] transition-all ${
                    isZero
                      ? 'bg-slate-100 text-slate-400 border-slate-400 shadow-none cursor-not-allowed opacity-50'
                      : 'bg-[#F8B7C1] text-slate-800 hover:bg-pastel-yellow hover:translate-y-[-1px] cursor-pointer'
                  }`}
                >
                  {isZero ? 'OUT OF STOCK' : `CONSUME / USE ${item.name.toUpperCase()}`}
                </button>
              </section>
            );
          })}
        </div>
      )}

      {/* Shop Panel */}
      {activeTab === 'shop' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventory.map((item) => {
            const canAfford = gold >= item.price;
            return (
              <section
                key={item.id}
                className="panel-border-yellow p-5 flex flex-col justify-between bg-white hover:-translate-y-1 hover:shadow-md transition-all"
              >
                <div>
                  {/* Shop Item Header */}
                  <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                    <span className="font-pixel text-[9px] text-amber-600 font-bold tracking-wider uppercase">
                      FOR SALE
                    </span>
                    <span className="font-pixel text-[10px] bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 rounded shadow-sm font-bold flex items-center gap-1">
                      🪙 {item.price}G
                    </span>
                  </div>

                  {/* Icon & Info */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-50 border-2 border-slate-800 rounded flex items-center justify-center text-3xl select-none shadow-sm shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm tracking-wide">{item.name}</h3>
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-1">{item.description}</p>
                    </div>
                  </div>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handlePurchase(item.id, item.name, item.price)}
                  className={`w-full py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold shadow-[2px_2px_0px_#1e293b] transition-all flex items-center justify-center gap-2 ${
                    canAfford
                      ? 'bg-pastel-yellow text-slate-800 hover:bg-[#F8B7C1] hover:translate-y-[-1px] cursor-pointer'
                      : 'bg-rose-50 text-rose-500 border-rose-300 shadow-none cursor-not-allowed hover:bg-rose-100'
                  }`}
                >
                  {canAfford ? `🪙 BUY FOR ${item.price} GOLD` : '❌ NOT ENOUGH GOLD'}
                </button>
              </section>
            );
          })}
        </div>
      )}

      {/* Collectibles Panel */}
      {activeTab === 'collectibles' && (
        <div className="flex flex-col gap-6">
          <div className="bg-pastel-purple/10 border-2 border-pastel-purple/50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed">
            <span className="font-bold text-pastel-purple font-pixel text-[10px] block mb-1">👑 THE TROPHY CABINET</span>
            Earn rare, dynamic collectibles by completing the high-risk, high-fun <strong className="text-pastel-purple">Mystery Missions (Daily Fun Quests)</strong>. Equip your unlocked badges in the Profile and show off your real-life feats!
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {funChallenges.map((challenge) => {
              const collectible = challenge.unlockedCollectible;
              if (!collectible) return null;

              // Check if unlocked
              const unlockedRecord = unlockedCollectibles?.find((c: any) => c.id === collectible.id);
              const isUnlocked = !!unlockedRecord;

              return (
                <section
                  key={collectible.id}
                  className={`panel-border-purple p-5 bg-white relative flex flex-col justify-between items-center text-center transition-all ${
                    isUnlocked
                      ? 'hover:-translate-y-1 hover:shadow-lg shadow-[0_4px_20px_rgba(206,147,216,0.15)] bg-gradient-to-b from-white to-purple-50/20'
                      : 'opacity-65 saturate-50'
                  }`}
                >
                  {/* Status Banner */}
                  <div className="absolute top-3 right-3">
                    {isUnlocked ? (
                      <span className="font-pixel text-[8px] bg-emerald-500 text-white px-2 py-0.5 rounded shadow-sm font-bold uppercase animate-pulse">
                        UNLOCKED
                      </span>
                    ) : (
                      <span className="font-pixel text-[8px] bg-slate-200 text-slate-500 px-2 py-0.5 rounded shadow-sm font-bold uppercase">
                        LOCKED
                      </span>
                    )}
                  </div>

                  {/* Trophy Icon */}
                  <div className="my-4 relative">
                    <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-5xl select-none shadow-md ${
                      isUnlocked 
                        ? 'bg-gradient-to-tr from-amber-100 to-yellow-50 border-yellow-400 animate-[bounce_3s_infinite_ease-in-out]' 
                        : 'bg-slate-100 border-slate-300'
                    }`}>
                      {isUnlocked ? collectible.icon : '🔒'}
                    </div>
                    {isUnlocked && (
                      <div className="absolute -bottom-1 -right-1 text-base bg-white border border-slate-300 rounded-full w-6 h-6 flex items-center justify-center shadow-inner">
                        ⭐
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="w-full flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-slate-800 text-base tracking-wide mt-2">
                        {collectible.name}
                      </h3>
                      
                      <p className="text-slate-500 text-[11px] leading-relaxed mt-2 px-1">
                        {isUnlocked 
                          ? collectible.description 
                          : `Unlock this rare artifact of prestige by taking on challenges in the real world.`
                        }
                      </p>
                    </div>

                    <div className="border-t border-slate-100/80 mt-4 pt-3 w-full">
                      {isUnlocked ? (
                        <div className="text-[10px] text-emerald-600 font-pixel">
                          Unlocked: {unlockedRecord.date || 'Today'}
                        </div>
                      ) : (
                        <div className="text-[10px] text-pastel-purple font-medium bg-purple-50 rounded py-1 px-1.5 border border-purple-100/40">
                          Quest: "{challenge.title}"
                        </div>
                      )}
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

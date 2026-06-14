import { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import { playSound, startMysteriousTheme, stopMysteriousTheme } from '../utils/audio';
import { funChallenges } from '../data/funQuests';
import confetti from 'canvas-confetti';

export default function Backpack() {
  const { 
    gold, 
    inventory, 
    buyItem, 
    useItem, 
    unlockedCollectibles,
    buyEgg,
    pets
  } = useGame();
  
  useEffect(() => {
    // Start mysterious background merchant music
    startMysteriousTheme();
    return () => {
      // Clean up and stop mysterious music on unmount
      stopMysteriousTheme();
    };
  }, []);

  const [activeTab, setActiveTab] = useState<'backpack' | 'shop' | 'collectibles'>('backpack');
  const [shopSubTab, setShopSubTab] = useState<'consumables' | 'pets'>('consumables');
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



  const handlePurchaseEgg = (id: string, name: string, price: number, petType: string) => {
    if (gold < price) {
      playSound('click');
      setMerchantDialogue("Hmph! You don't have enough gold coins for that! Complete more quests first.");
      return;
    }

    if (pets.some(p => p.type === petType)) {
      playSound('click');
      setMerchantDialogue(`You already have a pet companion of type: ${petType.toUpperCase()}. Alistair restricts duplicates!`);
      return;
    }

    const success = buyEgg(id);
    if (success) {
      playSound('success');
      setMerchantDialogue(`A pristine egg! The ${name} has been placed in your evolution locker. Hatch it soon!`);
      confetti({
        particleCount: 30,
        spread: 40,
        colors: ['#FFD54F', '#E0F2FE', '#FDF2F8'],
        origin: { y: 0.8 }
      });
    } else {
      setMerchantDialogue("Transaction error! Try again later.");
    }
  };

  const handleUseItem = (id: string) => {
    playSound('click');
    const success = useItem(id);
    if (success) {
      playSound('success');
      
      if (id === 'xp_booster') {
        setUseFeedback(`⚡ Consumed XP Booster! Granted +50 XP! (Tip: Keep in backpack for passive +25% score speed during Alistair's Run!)`);
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#CE93D8', '#F48FB1', '#FFD54F', '#0E7490']
        });
      } else if (id === 'task_shield') {
        setUseFeedback(`Activated Task Shield! Streak incremented by +1 & protected! (Tip: Task Shields are consumed automatically during Alistair's Run to block defeat!)`);
        confetti({
          particleCount: 30,
          spread: 40,
          origin: { y: 0.7 },
          colors: ['#81C784', '#AEECEF']
        });
      } else if (id === 'hp_potion') {
        setUseFeedback(`🧪 Consumed Health Potion! Restored Health. (Tip: Health Potions are consumed automatically during Alistair's Run to block defeat!)`);
      } else if (id === 'boss_key') {
        setUseFeedback(`🔑 Used Boss Key! Granted +100 XP! (Tip: Keep in backpack for passive 20% slow motion Chrono Warp speed during Alistair's Run!)`);
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.5 },
          colors: ['#FFD54F', '#FFC107', '#E0A96D']
        });
      } else if (id === 'elixir_might') {
        setUseFeedback(`🧪 Drank the Elixir of Might! Granted +60 XP! (Tip: Keep in backpack for passive 15% lower gravity floaty jumps during Alistair's Run!)`);
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#F48FB1', '#CE93D8']
        });
      } else if (id === 'lucky_charm') {
        setUseFeedback(`🍀 Activated the Lucky Charm! Granted +35 XP! (Tip: Keep in backpack for passive 2x coin spawning rate during Alistair's Run!)`);
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
          <h1 className="font-bold text-2xl font-pixel mb-3 text-[#5c4257] drop-shadow-[0_0_8px_rgba(92,66,87,0.4)]">BACKPACK & SHOP</h1>
          <p className="text-slate-500 text-sm">Gear up, manage resources, and prepare for glory!</p>
        </div>
        
        {/* Restructured Gold Balance Pill (Matches Quest Board header styling, with static coin, no spin) */}
        <div className="flex bg-slate-50 border border-[#f0dccf] px-6 py-3 rounded-lg gap-3 items-center shadow-sm">
          <div className="w-8 h-8 rounded-full bg-[#f0dccf] flex items-center justify-center select-none shadow-inner border border-amber-600 p-1.5 animate-[pulse_3s_infinite_ease-in-out]">
            <svg className="w-full h-full text-amber-500 fill-current select-none shrink-0" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="1.5" fill="#fbbf24" />
              <circle cx="12" cy="12" r="7" stroke="#d97706" strokeWidth="1" fill="#f59e0b" />
              <circle cx="12" cy="12" r="3" fill="#fef08a" />
            </svg>
          </div>
          <div className="flex flex-col items-center md:items-start">
            <span className="text-slate-500 font-pixel text-[10px] block mb-0.5">YOUR BALANCE</span>
            <span className="text-amber-600 font-pixel text-lg font-bold drop-shadow-[0_0_5px_rgba(217,119,6,0.3)]">{gold} GOLD</span>
          </div>
        </div>
      </div>

      {/* Merchant / Feedback Banner */}
      <section className="panel-border-cyan p-5 bg-cyan-50/50 border-4 border-slate-800 text-slate-800 font-pixel text-[10px] relative overflow-hidden flex flex-col md:flex-row items-center gap-5">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-grid opacity-5 pointer-events-none"></div>

        {/* Twinkling Sparkles */}
        <div className="absolute top-2 right-8 text-[12px] animate-pulse select-none text-yellow-300 opacity-75">✨</div>
        <div className="absolute bottom-3 left-24 text-[8px] animate-pulse select-none text-yellow-200 opacity-60" style={{ animationDelay: '200ms' }}>✨</div>
        <div className="absolute top-8 left-1/3 text-[10px] animate-pulse select-none text-yellow-300 opacity-50" style={{ animationDelay: '500ms' }}>✨</div>
        <div className="absolute bottom-4 right-1/3 text-[14px] animate-pulse select-none text-yellow-400 opacity-70" style={{ animationDelay: '100ms' }}>✨</div>
        <div className="absolute top-4 right-1/4 text-[9px] animate-pulse select-none text-yellow-100 opacity-80" style={{ animationDelay: '700ms' }}>✨</div>

        {/* Merchant Avatar Container */}
        <div className="flex flex-col items-center gap-1.5 shrink-0">
          <div className="w-16 h-16 bg-slate-100 border-2 border-pastel-cyan rounded flex items-center justify-center text-4xl select-none shadow-sm relative">
            🧙‍♂️
          </div>
          <span className="bg-pastel-cyan text-white text-[7.5px] font-pixel font-bold px-4 py-1.5 rounded-md border-2 border-slate-800 shadow-md leading-none tracking-widest whitespace-nowrap mt-1">
            MERCHANT
          </span>
        </div>

        <div className="flex-1 text-center md:text-left z-10">
          <span className="text-cyan-700 font-bold tracking-wider uppercase block mb-1">» Merchant Alistair says:</span>
          <p className="text-slate-600 leading-relaxed font-medium select-text text-[11px] font-sans">
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

      <div className="flex border-b-4 border-slate-800 mb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { playSound('click'); setActiveTab('backpack'); }}
          className={`px-6 py-3 font-pixel text-[10px] font-bold border-t-4 border-x-4 border-slate-800 transition-all select-none whitespace-nowrap ${
            activeTab === 'backpack'
              ? 'bg-[#cc6d78] text-white border-b-4 border-b-[#cc6d78] translate-y-[4px]'
              : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-b-0 translate-y-0 shadow-[inset_0_-8px_8px_rgba(0,0,0,0.05)]'
          }`}
        >
          MY BACKPACK
        </button>
        <button
          onClick={() => { playSound('click'); setActiveTab('shop'); }}
          className={`px-6 py-3 font-pixel text-[10px] font-bold border-t-4 border-x-4 border-slate-800 transition-all select-none whitespace-nowrap ${
            activeTab === 'shop'
              ? 'bg-[#f0dccf] text-slate-800 border-b-4 border-b-[#f0dccf] translate-y-[4px]'
              : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-b-0 translate-y-0 shadow-[inset_0_-8px_8px_rgba(0,0,0,0.05)]'
          }`}
        >
          MERCHANT SHOP
        </button>
        <button
          onClick={() => { playSound('click'); setActiveTab('collectibles'); }}
          className={`px-6 py-3 font-pixel text-[10px] font-bold border-t-4 border-x-4 border-slate-800 transition-all select-none whitespace-nowrap ${
            activeTab === 'collectibles'
              ? 'bg-[#5c4257] text-white border-b-4 border-b-[#5c4257] translate-y-[4px]'
              : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 border-b-0 translate-y-0 shadow-[inset_0_-8px_8px_rgba(0,0,0,0.05)]'
          }`}
        >
          RARE COLLECTIBLES ({unlockedCollectibles?.length || 0}/8)
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
                className={`p-5 flex flex-col justify-between bg-white transition-all border-4 border-slate-800 ${
                  isZero ? 'opacity-70 saturate-50' : 'hover:-translate-y-1 hover:shadow-md'
                }`}
                style={{
                  boxShadow: 'inset -4px -4px 0px rgba(0, 0, 0, 0.05), 4px 4px 0px #cc6d78',
                  borderRadius: 0,
                  position: 'relative'
                }}
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
                      : 'bg-[#cc6d78] text-white hover:bg-[#f0dccf] hover:text-slate-800 hover:translate-y-[-1px] cursor-pointer'
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
        <div className="flex flex-col gap-6 w-full animate-[fade-in_0.25s_ease-out]">
          {/* Shop Sub-tabs */}
          <div className="flex gap-2 border-b border-slate-200 pb-2 mb-2 overflow-x-auto no-scrollbar">
            <button
              onClick={() => { playSound('click'); setShopSubTab('consumables'); }}
              className={`px-4 py-2.5 font-pixel text-[8.5px] font-bold border-2 border-slate-800 transition-all select-none whitespace-nowrap ${
                shopSubTab === 'consumables'
                  ? 'bg-[#f0dccf] text-slate-800 shadow-[2px_2px_0px_#1e293b]'
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-none'
              }`}
            >
              CONSUMABLE ITEMS
            </button>

            <button
              onClick={() => { playSound('click'); setShopSubTab('pets'); }}
              className={`px-4 py-2.5 font-pixel text-[8.5px] font-bold border-2 border-slate-800 transition-all select-none whitespace-nowrap ${
                shopSubTab === 'pets'
                  ? 'bg-[#f0dccf] text-slate-800 shadow-[2px_2px_0px_#1e293b]'
                  : 'bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 shadow-none'
              }`}
            >
              COMPANION EGGS
            </button>
          </div>

          {/* Consumables List */}
          {shopSubTab === 'consumables' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {inventory.map((item) => {
                const canAfford = gold >= item.price;
                return (
                  <section
                    key={item.id}
                    className="p-5 flex flex-col justify-between bg-white hover:-translate-y-1 hover:shadow-md transition-all border-4 border-slate-800"
                    style={{
                      boxShadow: 'inset -4px -4px 0px rgba(0, 0, 0, 0.05), 4px 4px 0px #f0dccf',
                      borderRadius: 0,
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                        <span className="font-pixel text-[9px] text-amber-600 font-bold tracking-wider uppercase">
                          FOR SALE
                        </span>
                        <span className="font-pixel text-[10px] bg-[#f0dccf] border border-[#f0dccf] text-amber-700 px-2 py-0.5 rounded shadow-sm font-bold flex items-center gap-1.5">
                          <svg className="w-3 h-3 text-amber-500 fill-current select-none shrink-0" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="1.5" fill="#fbbf24" />
                            <circle cx="12" cy="12" r="7" stroke="#d97706" strokeWidth="1" fill="#f59e0b" />
                            <circle cx="12" cy="12" r="3" fill="#fef08a" />
                          </svg>
                          {item.price}G
                        </span>
                      </div>

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

                    <button
                      onClick={() => handlePurchase(item.id, item.name, item.price)}
                      className={`w-full py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold shadow-[2px_2px_0px_#1e293b] transition-all flex items-center justify-center gap-2 ${
                        canAfford
                          ? 'bg-[#f0dccf] text-slate-800 hover:bg-[#cc6d78] hover:text-white hover:translate-y-[-1px] cursor-pointer'
                          : 'bg-rose-50 text-rose-500 border-rose-300 shadow-none cursor-not-allowed hover:bg-rose-100'
                      }`}
                    >
                      {canAfford ? (
                        `BUY FOR ${item.price} GOLD`
                      ) : (
                        '❌ NOT ENOUGH GOLD'
                      )}
                    </button>
                  </section>
                );
              })}
            </div>
          )}

          {/* Companion eggs list */}
          {shopSubTab === 'pets' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { id: 'cozy_fox', name: 'Cozy Fox Egg', price: 100, petType: 'fox', icon: '🥚', description: 'Hatch to unlock Pippin the Fox, who doubles all coin spawn rates during the Mysterious Run!' },
                { id: 'wise_owl', name: 'Wise Owl Egg', price: 120, petType: 'owl', icon: '🥚', description: 'Hatch to unlock Ollie the Owl, who grants a passive +10% score bonus in Mysterious Run!' },
                { id: 'floaty_frog', name: 'Floaty Frog Egg', price: 80, petType: 'frog', icon: '🥚', description: 'Hatch to unlock Bubu the Frog, who lowers jumping gravity by 12% for floatier leaps!' },
                { id: 'lucky_cat', name: 'Lucky Cat Egg', price: 90, petType: 'cat', icon: '🥚', description: 'Hatch to unlock Cookie the Cat, who grants a passive +12% score bonus in Mysterious Run!' },
                { id: 'cozy_panda', name: 'Cozy Panda Egg', price: 110, petType: 'panda', icon: '🥚', description: 'Hatch to unlock Bamboo the Panda, who grants a passive +15% score bonus in Mysterious Run!' },
                { id: 'happy_duck', name: 'Happy Duck Egg', price: 70, petType: 'duck', icon: '🥚', description: 'Hatch to unlock Ducky the Duck, who decreases jumping gravity by 8% for floatier leaps!' },
                { id: 'starry_dragon', name: 'Starry Dragon Egg', price: 150, petType: 'dragon', icon: '🥚', description: 'Hatch to unlock Drake the Dragon, who slows obstacle scrolling speed by 20%!' },
                { id: 'mystic_unicorn', name: 'Mystic Unicorn Egg', price: 200, petType: 'unicorn', icon: '🥚', description: 'Hatch to unlock Sparkles the Unicorn, who grants a passive +25% score bonus in Mysterious Run!' },
                { id: 'sleepy_sloth', name: 'Sleepy Sloth Egg', price: 130, petType: 'sloth', icon: '🥚', description: 'Hatch to unlock Sid the Sloth, who slows obstacle scrolling speed by 20%!' },
                { id: 'cosmic_phoenix', name: 'Cosmic Phoenix Egg', price: 180, petType: 'phoenix', icon: '🥚', description: 'Hatch to unlock Phoenix the Firebird, who doubles all coin spawn rates during the Mysterious Run!' }
              ].map((item) => {
                const canAfford = gold >= item.price;
                const isOwned = pets.some(p => p.type === item.petType);
                return (
                  <section
                    key={item.id}
                    className="p-5 flex flex-col justify-between bg-white hover:-translate-y-1 hover:shadow-md transition-all border-4 border-slate-800"
                    style={{
                      boxShadow: 'inset -4px -4px 0px rgba(0, 0, 0, 0.05), 4px 4px 0px #f0dccf',
                      borderRadius: 0,
                      position: 'relative'
                    }}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3 border-b border-slate-100 pb-2">
                        <span className="font-pixel text-[9px] text-amber-600 font-bold tracking-wider uppercase">
                          {isOwned ? 'OWNED COMPANION' : 'FOR SALE'}
                        </span>
                        <span className="font-pixel text-[10px] bg-[#f0dccf] border border-[#f0dccf] text-amber-700 px-2 py-0.5 rounded shadow-sm font-bold flex items-center gap-1.5">
                          <svg className="w-3.5 h-3.5 text-amber-500 fill-current select-none shrink-0" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke="#b45309" strokeWidth="1.5" fill="#fbbf24" />
                            <circle cx="12" cy="12" r="7" stroke="#d97706" strokeWidth="1" fill="#f59e0b" />
                            <circle cx="12" cy="12" r="3" fill="#fef08a" />
                          </svg>
                          {item.price}G
                        </span>
                      </div>

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

                    <button
                      disabled={isOwned}
                      onClick={() => handlePurchaseEgg(item.id, item.name, item.price, item.petType)}
                      className={`w-full py-2.5 border-2 border-slate-800 font-pixel text-[9px] font-bold shadow-[2px_2px_0px_#1e293b] transition-all flex items-center justify-center gap-2 ${
                        isOwned 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-300 shadow-none cursor-not-allowed'
                          : canAfford
                          ? 'bg-[#f0dccf] text-slate-800 hover:bg-[#cc6d78] hover:text-white hover:translate-y-[-1px] cursor-pointer'
                          : 'bg-rose-50 text-rose-500 border-rose-300 shadow-none cursor-not-allowed hover:bg-rose-100'
                      }`}
                    >
                      {isOwned ? (
                        '✔️ ALREADY OWNED'
                      ) : canAfford ? (
                        `BUY FOR ${item.price} GOLD`
                      ) : (
                        '❌ NOT ENOUGH GOLD'
                      )}
                    </button>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Collectibles Panel */}
      {activeTab === 'collectibles' && (
        <div className="flex flex-col gap-6">
          <div className="bg-[#5c4257]/10 border-2 border-[#5c4257]/50 p-4 rounded-lg text-slate-700 text-sm leading-relaxed">
            <span className="font-bold text-[#5c4257] font-pixel text-[10px] block mb-1">👑 THE TROPHY CABINET</span>
            Earn rare, dynamic collectibles by completing the high-risk, high-fun <strong className="text-[#5c4257]">Mystery Missions (Daily Fun Quests)</strong>. Equip your unlocked badges in the Profile and show off your real-life feats!
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
                  className="p-5 bg-white relative flex flex-col justify-between items-center text-center transition-all border-4 border-slate-800"
                  style={{
                    boxShadow: isUnlocked 
                      ? 'inset -4px -4px 0px rgba(0, 0, 0, 0.05), 4px 4px 0px #5c4257' 
                      : 'inset -4px -4px 0px rgba(0, 0, 0, 0.05), 4px 4px 0px #cbd5e1',
                    borderRadius: 0,
                    position: 'relative'
                  }}
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
                        <div className="text-[10px] text-[#5c4257] font-medium bg-[#5c4257]/10 rounded py-1 px-1.5 border border-[#5c4257]/20">
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

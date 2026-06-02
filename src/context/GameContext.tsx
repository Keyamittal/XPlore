import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initialQuests, getDailyQuests } from '../data/quests';
import type { Quest } from '../data/quests';
import { funChallenges } from '../data/funQuests';
import type { FunChallenge } from '../data/funQuests';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  price: number;
  icon: string;
  type: 'heal' | 'xp' | 'shield';
}

interface GameState {
  user: any;
  quests: Quest[];
  gold: number;
  inventory: InventoryItem[];
  login: (username: string, token: string) => void;
  logout: () => void;
  completeQuest: (questId: string) => Promise<void>;
  addXpDirectly: (amount: number) => Promise<void>;
  buyItem: (itemId: string) => boolean;
  useItem: (itemId: string) => boolean;
  addGoldDirectly: (amount: number) => void;
  
  // Mystery Mission / Fun Quests addition
  mysteryMission: FunChallenge | null;
  mysteryMissionState: 'locked' | 'unlocked' | 'accepted' | 'completed';
  mysteryMissionSkips: number;
  unlockedTitles: string[];
  unlockedCollectibles: any[];
  unlockedMysteryBadges: any[];
  activeTitle: string;
  equipTitle: (title: string) => void;
  unlockMysteryMission: () => void;
  acceptMysteryMission: () => void;
  completeMysteryMission: () => Promise<void>;
  shuffleMysteryMission: () => Promise<void>;
  skipMysteryMission: () => void;
  cheatCompleteAllQuests: () => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [quests, setQuests] = useState<Quest[]>(initialQuests);

  // Mystery Mission States
  const [mysteryMission, setMysteryMission] = useState<FunChallenge | null>(null);
  const [mysteryMissionState, setMysteryMissionState] = useState<'locked' | 'unlocked' | 'accepted' | 'completed'>('locked');
  const [mysteryMissionSkips, setMysteryMissionSkips] = useState<number>(1);
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>(['NOVICE']);
  const [unlockedCollectibles, setUnlockedCollectibles] = useState<any[]>([]);
  const [unlockedMysteryBadges, setUnlockedMysteryBadges] = useState<any[]>([]);
  const [activeTitle, setActiveTitle] = useState<string>('NOVICE');

  // Backpack & Resources states
  const [gold, setGold] = useState<number>(150);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'hp_potion', name: 'Health Potion', description: "Vitality Brew. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 3, price: 20, icon: '🧪', type: 'heal' },
    { id: 'xp_booster', name: 'XP Booster', description: "Score Multiplier. Grants +25% extra score over time during Alistair's Infinite Run!", qty: 1, price: 50, icon: '⚡', type: 'xp' },
    { id: 'task_shield', name: 'Task Shield', description: "Streak Guard & Barrier. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 1, price: 40, icon: '🛡️', type: 'shield' },
    { id: 'boss_key', name: 'Boss Key', description: "Chrono Key. Chrono warp! Slows down obstacle movement speeds by 20% during Alistair's Run for easier dodging!", qty: 0, price: 80, icon: '🔑', type: 'shield' },
    { id: 'elixir_might', name: 'Elixir of Might', description: "Elixir of Agility. Decreases gravity by 15% during Alistair's Run, giving Alistair floatier and higher jumps!", qty: 0, price: 60, icon: '🧪', type: 'heal' },
    { id: 'lucky_charm', name: 'Lucky Charm', description: "Fortune Charm. Attracts wealth! Multiplies coin spawning rate by 2x during Alistair's Infinite Run!", qty: 0, price: 35, icon: '🍀', type: 'xp' }
  ]);

  // Sync gold & inventory with localStorage on user change
  useEffect(() => {
    if (user && user.id) {
      const savedGold = localStorage.getItem(`xplore_gold_${user.id}`);
      if (savedGold !== null) {
        setGold(Number(savedGold));
      } else {
        setGold(150);
        localStorage.setItem(`xplore_gold_${user.id}`, '150');
      }

      const savedInv = localStorage.getItem(`xplore_inventory_${user.id}`);
      if (savedInv !== null) {
        try {
          const parsed = JSON.parse(savedInv);
          const defaultItems: InventoryItem[] = [
            { id: 'hp_potion', name: 'Health Potion', description: "Vitality Brew. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 3, price: 20, icon: '🧪', type: 'heal' },
            { id: 'xp_booster', name: 'XP Booster', description: "Score Multiplier. Grants +25% extra score over time during Alistair's Infinite Run!", qty: 1, price: 50, icon: '⚡', type: 'xp' },
            { id: 'task_shield', name: 'Task Shield', description: "Streak Guard & Barrier. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 1, price: 40, icon: '🛡️', type: 'shield' },
            { id: 'boss_key', name: 'Boss Key', description: "Chrono Key. Chrono warp! Slows down obstacle movement speeds by 20% during Alistair's Run for easier dodging!", qty: 0, price: 80, icon: '🔑', type: 'shield' },
            { id: 'elixir_might', name: 'Elixir of Might', description: "Elixir of Agility. Decreases gravity by 15% during Alistair's Run, giving Alistair floatier and higher jumps!", qty: 0, price: 60, icon: '🧪', type: 'heal' },
            { id: 'lucky_charm', name: 'Lucky Charm', description: "Fortune Charm. Attracts wealth! Multiplies coin spawning rate by 2x during Alistair's Infinite Run!", qty: 0, price: 35, icon: '🍀', type: 'xp' }
          ];
          
          const merged = defaultItems.map(def => {
            const existing = parsed.find((p: any) => p.id === def.id);
            return existing ? { ...def, qty: existing.qty } : def;
          });
          setInventory(merged);
          localStorage.setItem(`xplore_inventory_${user.id}`, JSON.stringify(merged));
        } catch (e) {
          console.error("Failed to parse inventory:", e);
        }
      } else {
        const defaultInv: InventoryItem[] = [
          { id: 'hp_potion', name: 'Health Potion', description: "Vitality Brew. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 3, price: 20, icon: '🧪', type: 'heal' },
          { id: 'xp_booster', name: 'XP Booster', description: "Score Multiplier. Grants +25% extra score over time during Alistair's Infinite Run!", qty: 1, price: 50, icon: '⚡', type: 'xp' },
          { id: 'task_shield', name: 'Task Shield', description: "Streak Guard & Barrier. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 1, price: 40, icon: '🛡️', type: 'shield' },
          { id: 'boss_key', name: 'Boss Key', description: "Chrono Key. Chrono warp! Slows down obstacle movement speeds by 20% during Alistair's Run for easier dodging!", qty: 0, price: 80, icon: '🔑', type: 'shield' },
          { id: 'elixir_might', name: 'Elixir of Might', description: "Elixir of Agility. Decreases gravity by 15% during Alistair's Run, giving Alistair floatier and higher jumps!", qty: 0, price: 60, icon: '🧪', type: 'heal' },
          { id: 'lucky_charm', name: 'Lucky Charm', description: "Fortune Charm. Attracts wealth! Multiplies coin spawning rate by 2x during Alistair's Infinite Run!", qty: 0, price: 35, icon: '🍀', type: 'xp' }
        ];
        setInventory(defaultInv);
        localStorage.setItem(`xplore_inventory_${user.id}`, JSON.stringify(defaultInv));
      }

      // Load Mystery Mission and customized user titles/collectibles
      const savedTitles = localStorage.getItem(`xplore_unlocked_titles_${user.id}`);
      if (savedTitles) {
        setUnlockedTitles(JSON.parse(savedTitles));
      } else {
        setUnlockedTitles(['NOVICE']);
        localStorage.setItem(`xplore_unlocked_titles_${user.id}`, JSON.stringify(['NOVICE']));
      }

      const savedActiveTitle = localStorage.getItem(`xplore_active_title_${user.id}`);
      if (savedActiveTitle) {
        setActiveTitle(savedActiveTitle);
      } else {
        setActiveTitle(user.title || 'NOVICE');
      }

      const savedCollectibles = localStorage.getItem(`xplore_collectibles_${user.id}`);
      if (savedCollectibles) {
        setUnlockedCollectibles(JSON.parse(savedCollectibles));
      } else {
        setUnlockedCollectibles([]);
        localStorage.setItem(`xplore_collectibles_${user.id}`, JSON.stringify([]));
      }

      const savedBadges = localStorage.getItem(`xplore_mystery_badges_${user.id}`);
      if (savedBadges) {
        setUnlockedMysteryBadges(JSON.parse(savedBadges));
      } else {
        setUnlockedMysteryBadges([]);
        localStorage.setItem(`xplore_mystery_badges_${user.id}`, JSON.stringify([]));
      }

      const savedMission = localStorage.getItem(`xplore_mystery_mission_${user.id}`);
      if (savedMission) {
        setMysteryMission(JSON.parse(savedMission));
      } else {
        setMysteryMission(null);
      }

      const savedMissionState = localStorage.getItem(`xplore_mystery_mission_state_${user.id}`);
      if (savedMissionState) {
        setMysteryMissionState(savedMissionState as any);
      } else {
        setMysteryMissionState('locked');
      }

      const savedSkips = localStorage.getItem(`xplore_mystery_skips_${user.id}`);
      if (savedSkips) {
        setMysteryMissionSkips(Number(savedSkips));
      } else {
        setMysteryMissionSkips(1);
      }

      // Load Quests and verify calendar daily rotation
      const savedQuests = localStorage.getItem(`xplore_quests_${user.id}`);
      const savedQuestsDay = localStorage.getItem(`xplore_quests_day_${user.id}`);
      const currentDay = new Date().getDate();

      const isNewDay = !(savedQuests && savedQuestsDay && Number(savedQuestsDay) === currentDay);
      
      // Auto-heal check: if today's quests are loaded but not all completed, mystery mission must be locked
      let shouldForceLock = false;
      if (!isNewDay && savedQuests) {
        try {
          const parsedQuests = JSON.parse(savedQuests);
          if (Array.isArray(parsedQuests) && parsedQuests.length > 0 && !parsedQuests.every((q: any) => q.completed)) {
            shouldForceLock = true;
          }
        } catch (e) {}
      }

      if (isNewDay) {
        // Day rotated or no saved quests exist - load new quests and initialize localStorage
        const freshQuests = getDailyQuests();
        setQuests(freshQuests);
        localStorage.setItem(`xplore_quests_${user.id}`, JSON.stringify(freshQuests));
        localStorage.setItem(`xplore_quests_day_${user.id}`, String(currentDay));

        // Reset daily mystery mission to locked for the new day
        setMysteryMission(null);
        setMysteryMissionState('locked');
        setMysteryMissionSkips(1);
        localStorage.removeItem(`xplore_mystery_mission_${user.id}`);
        localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'locked');
        localStorage.setItem(`xplore_mystery_skips_${user.id}`, '1');
      } else {
        try {
          setQuests(JSON.parse(savedQuests!));
        } catch (e) {
          console.error("Failed to parse saved quests:", e);
          setQuests(initialQuests);
        }

        if (shouldForceLock) {
          setMysteryMission(null);
          setMysteryMissionState('locked');
          localStorage.removeItem(`xplore_mystery_mission_${user.id}`);
          localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'locked');
        }
      }
    }
  }, [user]);



  useEffect(() => {
    const savedUser = localStorage.getItem('xplore_user');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      
      // Auto-sync in background to fix old cache anomalies natively
      fetch('http://localhost:3000/api/user/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: parsed.id })
      })
      .then(res => res.json())
      .then(data => {
        if (data.user) {
           const savedActiveTitle = localStorage.getItem(`xplore_active_title_${parsed.id}`);
           const syncedUser = savedActiveTitle ? { ...data.user, title: savedActiveTitle } : data.user;
           setUser(syncedUser);
           localStorage.setItem('xplore_user', JSON.stringify(syncedUser));
        }
      })
      .catch(err => console.error("Auto-sync failed:", err));
    }
  }, []);

  const login = (userData: any, token: string) => {
    localStorage.setItem('xplore_user', JSON.stringify(userData));
    localStorage.setItem('xplore_token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('xplore_user');
    localStorage.removeItem('xplore_token');
    setUser(null);
  };

  const addGoldDirectly = (amount: number) => {
    if (!user) return;
    setGold(prev => {
      const newVal = prev + amount;
      localStorage.setItem(`xplore_gold_${user.id}`, String(newVal));
      return newVal;
    });
  };

  const buyItem = (itemId: string) => {
    if (!user) return false;
    const item = inventory.find(i => i.id === itemId);
    if (!item) return false;
    if (gold < item.price) return false;

    // Deduct gold
    const newGold = gold - item.price;
    setGold(newGold);
    localStorage.setItem(`xplore_gold_${user.id}`, String(newGold));

    // Add to inventory quantity
    const updated = inventory.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i);
    setInventory(updated);
    localStorage.setItem(`xplore_inventory_${user.id}`, JSON.stringify(updated));
    return true;
  };

  const useItem = (itemId: string) => {
    if (!user) return false;
    const item = inventory.find(i => i.id === itemId);
    if (!item || item.qty <= 0) return false;

    // Decrement item quantity
    const updated = inventory.map(i => i.id === itemId ? { ...i, qty: i.qty - 1 } : i);
    setInventory(updated);
    localStorage.setItem(`xplore_inventory_${user.id}`, JSON.stringify(updated));

    // Apply item effect
    if (itemId === 'xp_booster') {
      addXpDirectly(50);
    } else if (itemId === 'task_shield') {
      const updatedUser = { ...user, streak: user.streak + 1 };
      setUser(updatedUser);
      localStorage.setItem('xplore_user', JSON.stringify(updatedUser));
    } else if (itemId === 'boss_key') {
      addXpDirectly(100);
    } else if (itemId === 'elixir_might') {
      addXpDirectly(60);
    } else if (itemId === 'lucky_charm') {
      addXpDirectly(35);
    }

    return true;
  };

  const completeQuest = async (questId: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    // Direct synchronous updates to quests to prevent any React render race conditions
    const updatedQuests = quests.map(q => q.id === questId ? { ...q, completed: true } : q);
    setQuests(updatedQuests);

    if (user) {
      localStorage.setItem(`xplore_quests_${user.id}`, JSON.stringify(updatedQuests));
      localStorage.setItem(`xplore_quests_day_${user.id}`, String(new Date().getDate()));
      // Award Gold corresponding to double the XP reward of the completed quest
      addGoldDirectly(quest.xpReward * 2);

      // 1. Call Backend to Add XP
      try {
        const response = await fetch('http://localhost:3000/api/user/add-xp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id, amount: quest.xpReward })
        });
        const data = await response.json();
        
        if (data.success) {
          // 2. Update Global User State
          const savedActiveTitle = localStorage.getItem(`xplore_active_title_${user.id}`);
          const updatedUser = { 
            ...user, 
            xp: data.newXp, 
            totalXP: data.totalXP,
            level: data.newLevel, 
            title: savedActiveTitle || data.newTitle,
            xpToNext: data.xpToNext
          };
          setUser(updatedUser);
          localStorage.setItem('xplore_user', JSON.stringify(updatedUser)); // Keep synced
        }
      } catch (err) {
        console.error("Failed to sync XP with server:", err);
      }
    }
  };

  const addXpDirectly = async (amount: number) => {
    if (!user) return;

    // Automatically award gold on quest completions
    if (amount === 5) {
      addGoldDirectly(10);
    } else if (amount === 10) {
      addGoldDirectly(25);
    } else if (amount === 50) {
      addGoldDirectly(50);
    }

    try {
      const response = await fetch('http://localhost:3000/api/user/add-xp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, amount })
      });
      const data = await response.json();
      
      if (data.success) {
        const savedActiveTitle = localStorage.getItem(`xplore_active_title_${user.id}`);
        const updatedUser = { 
          ...user, 
          xp: data.newXp, 
          totalXP: data.totalXP,
          level: data.newLevel, 
          title: savedActiveTitle || data.newTitle,
          xpToNext: data.xpToNext
        };
        setUser(updatedUser);
        localStorage.setItem('xplore_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Direct XP add failed:", err);
    }
  };

  // Auto-unlock listener for completing all daily tasks
  useEffect(() => {
    if (user && quests.length > 0 && quests.every(q => q.completed)) {
      if (mysteryMissionState === 'locked') {
        const randChallenge = funChallenges[Math.floor(Math.random() * funChallenges.length)];
        setMysteryMission(randChallenge);
        setMysteryMissionState('unlocked');
        localStorage.setItem(`xplore_mystery_mission_${user.id}`, JSON.stringify(randChallenge));
        localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'unlocked');
      }
    }
  }, [quests, user, mysteryMissionState]);

  const equipTitle = (title: string) => {
    if (!user) return;
    setActiveTitle(title);
    localStorage.setItem(`xplore_active_title_${user.id}`, title);
    
    const updatedUser = { ...user, title };
    setUser(updatedUser);
    localStorage.setItem('xplore_user', JSON.stringify(updatedUser));
  };

  const unlockMysteryMission = () => {
    if (!user) return;
    const randChallenge = funChallenges[Math.floor(Math.random() * funChallenges.length)];
    setMysteryMission(randChallenge);
    setMysteryMissionState('unlocked');
    localStorage.setItem(`xplore_mystery_mission_${user.id}`, JSON.stringify(randChallenge));
    localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'unlocked');
  };

  const acceptMysteryMission = () => {
    if (!user) return;
    setMysteryMissionState('accepted');
    localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'accepted');
  };

  const completeMysteryMission = async () => {
    if (!user || !mysteryMission) return;
    
    setMysteryMissionState('completed');
    localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'completed');

    // Add XP reward
    await addXpDirectly(mysteryMission.xpReward);

    // Unlocks:
    // 1. Title reward
    if (mysteryMission.unlockedTitle) {
      setUnlockedTitles(prev => {
        if (!prev.includes(mysteryMission.unlockedTitle!)) {
          const updated = [...prev, mysteryMission.unlockedTitle!];
          localStorage.setItem(`xplore_unlocked_titles_${user.id}`, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }

    // 2. Badge reward
    if (mysteryMission.unlockedBadge) {
      setUnlockedMysteryBadges(prev => {
        if (!prev.some(b => b.id === mysteryMission.unlockedBadge!.id)) {
          const updated = [...prev, { ...mysteryMission.unlockedBadge, date: new Date().toLocaleDateString() }];
          localStorage.setItem(`xplore_mystery_badges_${user.id}`, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }

    // 3. Collectible reward
    if (mysteryMission.unlockedCollectible) {
      setUnlockedCollectibles(prev => {
        if (!prev.some(c => c.id === mysteryMission.unlockedCollectible!.id)) {
          const updated = [...prev, { ...mysteryMission.unlockedCollectible, date: new Date().toLocaleDateString() }];
          localStorage.setItem(`xplore_collectibles_${user.id}`, JSON.stringify(updated));
          return updated;
        }
        return prev;
      });
    }
  };

  const shuffleMysteryMission = async () => {
    if (!user) return;
    
    // Deduct 10 XP points
    await addXpDirectly(-10);

    // Choose another challenge randomly
    const currentId = mysteryMission?.id;
    const available = funChallenges.filter(c => c.id !== currentId);
    const randChallenge = available[Math.floor(Math.random() * available.length)];
    
    setMysteryMission(randChallenge);
    setMysteryMissionState('unlocked');
    
    localStorage.setItem(`xplore_mystery_mission_${user.id}`, JSON.stringify(randChallenge));
    localStorage.setItem(`xplore_mystery_mission_state_${user.id}`, 'unlocked');
  };

  const skipMysteryMission = () => {
    if (!user || mysteryMissionSkips <= 0) return;
    
    setMysteryMissionSkips(0);
    localStorage.setItem(`xplore_mystery_skips_${user.id}`, '0');

    // Shuffle for free
    const currentId = mysteryMission?.id;
    const available = funChallenges.filter(c => c.id !== currentId);
    const randChallenge = available[Math.floor(Math.random() * available.length)];
    
    setMysteryMission(randChallenge);
    localStorage.setItem(`xplore_mystery_mission_${user.id}`, JSON.stringify(randChallenge));
  };

  const cheatCompleteAllQuests = () => {
    const updatedQuests = quests.map(q => ({ ...q, completed: true }));
    setQuests(updatedQuests);
    if (user) {
      localStorage.setItem(`xplore_quests_${user.id}`, JSON.stringify(updatedQuests));
      localStorage.setItem(`xplore_quests_day_${user.id}`, String(new Date().getDate()));
    }
  };

  return (
    <GameContext.Provider value={{
      user, quests, gold, inventory, login, logout, completeQuest, addXpDirectly, buyItem, useItem, addGoldDirectly,
      mysteryMission, mysteryMissionState, mysteryMissionSkips, unlockedTitles, unlockedCollectibles, unlockedMysteryBadges, activeTitle,
      equipTitle, unlockMysteryMission, acceptMysteryMission, completeMysteryMission, shuffleMysteryMission, skipMysteryMission, cheatCompleteAllQuests
    }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error('useGame must be used within a GameProvider');
  return context;
}

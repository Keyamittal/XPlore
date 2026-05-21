import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initialQuests } from '../data/quests';
import type { Quest } from '../data/quests';

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
}

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [quests, setQuests] = useState<Quest[]>(initialQuests);

  // Backpack & Resources states
  const [gold, setGold] = useState<number>(150);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'hp_potion', name: 'Health Potion', description: 'Restores 45 HP during Boss Battles.', qty: 3, price: 20, icon: '🧪', type: 'heal' },
    { id: 'xp_booster', name: 'XP Booster', description: 'Instantly grants +50 XP upon consumption.', qty: 1, price: 50, icon: '⚡', type: 'xp' },
    { id: 'task_shield', name: 'Task Shield', description: 'Protects your daily streak from resetting.', qty: 1, price: 40, icon: '🛡️', type: 'shield' },
    { id: 'boss_key', name: 'Boss Key', description: 'A mysterious golden key to unlock hidden dungeons and secret vaults.', qty: 0, price: 80, icon: '🔑', type: 'shield' },
    { id: 'elixir_might', name: 'Elixir of Might', description: 'Increases your physical damage outputs in RPG Boss Battles (passive +10 damage boost).', qty: 0, price: 60, icon: '🧪', type: 'heal' },
    { id: 'lucky_charm', name: 'Lucky Charm', description: 'Increases critical strike chance in boss encounters (passive 30% chance for 2x crit).', qty: 0, price: 35, icon: '🍀', type: 'xp' }
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
            { id: 'hp_potion', name: 'Health Potion', description: 'Restores 45 HP during Boss Battles.', qty: 3, price: 20, icon: '🧪', type: 'heal' },
            { id: 'xp_booster', name: 'XP Booster', description: 'Instantly grants +50 XP upon consumption.', qty: 1, price: 50, icon: '⚡', type: 'xp' },
            { id: 'task_shield', name: 'Task Shield', description: 'Protects your daily streak from resetting.', qty: 1, price: 40, icon: '🛡️', type: 'shield' },
            { id: 'boss_key', name: 'Boss Key', description: 'A mysterious golden key to unlock hidden dungeons and secret vaults.', qty: 0, price: 80, icon: '🔑', type: 'shield' },
            { id: 'elixir_might', name: 'Elixir of Might', description: 'Increases your physical damage outputs in RPG Boss Battles (passive +10 damage boost).', qty: 0, price: 60, icon: '🧪', type: 'heal' },
            { id: 'lucky_charm', name: 'Lucky Charm', description: 'Increases critical strike chance in boss encounters (passive 30% chance for 2x crit).', qty: 0, price: 35, icon: '🍀', type: 'xp' }
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
          { id: 'hp_potion', name: 'Health Potion', description: 'Restores 45 HP during Boss Battles.', qty: 3, price: 20, icon: '🧪', type: 'heal' },
          { id: 'xp_booster', name: 'XP Booster', description: 'Instantly grants +50 XP upon consumption.', qty: 1, price: 50, icon: '⚡', type: 'xp' },
          { id: 'task_shield', name: 'Task Shield', description: 'Protects your daily streak from resetting.', qty: 1, price: 40, icon: '🛡️', type: 'shield' },
          { id: 'boss_key', name: 'Boss Key', description: 'A mysterious golden key to unlock hidden dungeons and secret vaults.', qty: 0, price: 80, icon: '🔑', type: 'shield' },
          { id: 'elixir_might', name: 'Elixir of Might', description: 'Increases your physical damage outputs in RPG Boss Battles (passive +10 damage boost).', qty: 0, price: 60, icon: '🧪', type: 'heal' },
          { id: 'lucky_charm', name: 'Lucky Charm', description: 'Increases critical strike chance in boss encounters (passive 30% chance for 2x crit).', qty: 0, price: 35, icon: '🍀', type: 'xp' }
        ];
        setInventory(defaultInv);
        localStorage.setItem(`xplore_inventory_${user.id}`, JSON.stringify(defaultInv));
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
           setUser(data.user);
           localStorage.setItem('xplore_user', JSON.stringify(data.user));
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

    // Optimistic UI Update
    setQuests(prev => prev.map(q => q.id === questId ? { ...q, completed: true } : q));

    if (user) {
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
          const updatedUser = { 
            ...user, 
            xp: data.newXp, 
            totalXP: data.totalXP,
            level: data.newLevel, 
            title: data.newTitle,
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
        const updatedUser = { 
          ...user, 
          xp: data.newXp, 
          totalXP: data.totalXP,
          level: data.newLevel, 
          title: data.newTitle,
          xpToNext: data.xpToNext
        };
        setUser(updatedUser);
        localStorage.setItem('xplore_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Direct XP add failed:", err);
    }
  };

  return (
    <GameContext.Provider value={{ user, quests, gold, inventory, login, logout, completeQuest, addXpDirectly, buyItem, useItem, addGoldDirectly }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) throw new Error('useGame must be used within a GameProvider');
  return context;
}

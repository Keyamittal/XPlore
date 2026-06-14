import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { initialQuests, getDailyQuests } from '../data/quests';
import type { Quest } from '../data/quests';
import { funChallenges } from '../data/funQuests';
import type { FunChallenge } from '../data/funQuests';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  qty: number;
  price: number;
  icon: string;
  type: 'heal' | 'xp' | 'shield';
}

export interface Pet {
  id: string;
  name: string;
  type: 'fox' | 'owl' | 'frog' | 'cat' | 'dragon' | 'panda' | 'duck' | 'unicorn' | 'sloth' | 'phoenix';
  stage: 'egg' | 'baby' | 'adult';
  xpNeeded: number;
  currentXp: number;
  icon: string;
  buffDesc: string;
}

export interface PlacedFurniture {
  id: string;
  furnitureId: string;
  name: string;
  icon: string;
  x: number;
  y: number;
}

export interface FurnitureItem {
  id: string;
  name: string;
  price: number;
  icon: string;
  qtyOwned: number;
  description: string;
}

interface GameState {
  user: any;
  quests: Quest[];
  gold: number;
  inventory: InventoryItem[];
  login: (userData: any, token: string, streakMissed?: boolean, oldStreak?: number) => void;
  logout: () => void;
  completeQuest: (questId: string, proofText?: string, proofImage?: string) => Promise<void>;
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

  // Streak Miss Modal addition
  showStreakMissed: boolean;
  setShowStreakMissed: (val: boolean) => void;
  streakMissedOldValue: number;

  // Level Up Modal addition
  showLevelUpModal: boolean;
  setShowLevelUpModal: (val: boolean) => void;
  levelUpNewValue: number;

  // Game Active addition
  isGameActive: boolean;
  setIsGameActive: (val: boolean) => void;

  // Pets & Sanctuary additions
  pets: Pet[];
  activePetId: string | null;
  equipPet: (petId: string | null) => void;
  buyEgg: (eggId: string) => boolean;
  hatchPet: (petId: string) => void;
  furnitureCatalog: FurnitureItem[];
  placedFurniture: PlacedFurniture[];
  buyFurniture: (furnitureId: string) => boolean;
  placeFurniture: (furnitureId: string, x: number, y: number) => boolean;
  removeFurniture: (placementId: string) => void;
  updatePlacedPosition: (placementId: string, x: number, y: number) => void;
}

const GameContext = createContext<GameState | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(() => {
    const saved = sessionStorage.getItem('xplore_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [quests, setQuests] = useState<Quest[]>(initialQuests);

  // Mystery Mission States
  const [mysteryMission, setMysteryMission] = useState<FunChallenge | null>(null);
  const [mysteryMissionState, setMysteryMissionState] = useState<'locked' | 'unlocked' | 'accepted' | 'completed'>('locked');
  const [mysteryMissionSkips, setMysteryMissionSkips] = useState<number>(1);
  const [unlockedTitles, setUnlockedTitles] = useState<string[]>(['NOVICE']);
  const [unlockedCollectibles, setUnlockedCollectibles] = useState<any[]>([]);
  const [unlockedMysteryBadges, setUnlockedMysteryBadges] = useState<any[]>([]);
  const [activeTitle, setActiveTitle] = useState<string>('NOVICE');

  // Streak Miss States
  const [showStreakMissed, setShowStreakMissed] = useState<boolean>(false);
  const [streakMissedOldValue, setStreakMissedOldValue] = useState<number>(0);

  // Level Up States
  const [showLevelUpModal, setShowLevelUpModal] = useState<boolean>(false);
  const [levelUpNewValue, setLevelUpNewValue] = useState<number>(1);

  // Game Active States
  const [isGameActive, setIsGameActive] = useState<boolean>(false);
  const [pendingLevelUp, setPendingLevelUp] = useState<number | null>(null);

  // Backpack & Resources states
  const [gold, setGold] = useState<number>(150);

  // Pets & Sanctuary states
  const [pets, setPets] = useState<Pet[]>([]);
  const [activePetId, setActivePetId] = useState<string | null>(null);
  const [placedFurniture, setPlacedFurniture] = useState<PlacedFurniture[]>([]);
  const [furnitureCatalog, setFurnitureCatalog] = useState<FurnitureItem[]>([
    { id: 'cozy_sofa', name: 'Cozy Sofa', price: 40, icon: '🛋️', qtyOwned: 0, description: 'A soft velvet sofa in a soothing pastel tone.' },
    { id: 'pixel_bonsai', name: 'Pixel Bonsai', price: 20, icon: '🪴', qtyOwned: 0, description: 'A perfectly pruned miniature desktop bonsai tree.' },
    { id: 'coffee_mug', name: 'Warm Mug', price: 10, icon: '☕', qtyOwned: 0, description: 'A steaming cup of fresh cozy chiptune espresso.' },
    { id: 'retro_radio', name: 'Retro Radio', price: 30, icon: '📻', qtyOwned: 0, description: 'Plays sweet chiptunes and soft static rainfall.' },
    { id: 'pastel_futon', name: 'Pastel Futon', price: 50, icon: '🛏️', qtyOwned: 0, description: 'A fluffy pink mattress that smells of lavender.' },
    { id: 'starry_window', name: 'Starry Window', price: 60, icon: '🪟', qtyOwned: 0, description: 'A magical pane showing a drifting pixel galaxy.' },
    { id: 'warm_fireplace', name: 'Fireplace', price: 80, icon: '🪵', qtyOwned: 0, description: 'A tiny brick hearth with warm dancing embers.' },
    { id: 'oak_bookshelf', name: 'Bookshelf', price: 45, icon: '📚', qtyOwned: 0, description: 'Stacked high with guidebooks and mystery novels.' },
  ]);
  const [inventory, setInventory] = useState<InventoryItem[]>([
    { id: 'hp_potion', name: 'Health Potion', description: "Vitality Brew. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 3, price: 20, icon: '🧪', type: 'heal' },
    { id: 'xp_booster', name: 'XP Booster', description: "Score Multiplier. Grants +25% extra score over time during Alistair's Infinite Run!", qty: 1, price: 50, icon: '⚡', type: 'xp' },
    { id: 'task_shield', name: 'Task Shield', description: "Streak Guard & Barrier. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 1, price: 40, icon: '🔒', type: 'shield' },
    { id: 'boss_key', name: 'Boss Key', description: "Chrono Key. Chrono warp! Slows down obstacle movement speeds by 20% during Alistair's Run for easier dodging!", qty: 0, price: 80, icon: '🔑', type: 'shield' },
    { id: 'elixir_might', name: 'Elixir of Might', description: "Elixir of Agility. Decreases gravity by 15% during Alistair's Run, giving Alistair floatier and higher jumps!", qty: 0, price: 60, icon: '🧪', type: 'heal' },
    { id: 'lucky_charm', name: 'Lucky Charm', description: "Fortune Charm. Attracts wealth! Multiplies coin spawning rate by 2x during Alistair's Infinite Run!", qty: 0, price: 35, icon: '🍀', type: 'xp' }
  ]);

  // Trigger queued level up when game becomes inactive
  useEffect(() => {
    if (!isGameActive && pendingLevelUp !== null) {
      setLevelUpNewValue(pendingLevelUp);
      setShowLevelUpModal(true);
      setPendingLevelUp(null);
    }
  }, [isGameActive, pendingLevelUp]);

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
            { id: 'task_shield', name: 'Task Shield', description: "Streak Guard & Barrier. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 1, price: 40, icon: '🔒', type: 'shield' },
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
          { id: 'task_shield', name: 'Task Shield', description: "Streak Guard & Barrier. Automatically consumed on collision during Alistair's Run to block defeat and grant temporary invincibility!", qty: 1, price: 40, icon: '🔒', type: 'shield' },
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

      // Load Pets
      const savedPets = localStorage.getItem(`xplore_pets_${user.id}`);
      if (savedPets !== null) {
        setPets(JSON.parse(savedPets));
      } else {
        setPets([]);
        localStorage.setItem(`xplore_pets_${user.id}`, JSON.stringify([]));
      }

      const savedActivePetId = localStorage.getItem(`xplore_active_pet_${user.id}`);
      if (savedActivePetId !== null) {
        setActivePetId(savedActivePetId);
      } else {
        setActivePetId(null);
      }

      // Load placed furniture
      const savedPlaced = localStorage.getItem(`xplore_placed_furniture_${user.id}`);
      if (savedPlaced !== null) {
        setPlacedFurniture(JSON.parse(savedPlaced));
      } else {
        setPlacedFurniture([]);
        localStorage.setItem(`xplore_placed_furniture_${user.id}`, JSON.stringify([]));
      }

      // Load furniture catalog
      const savedCatalog = localStorage.getItem(`xplore_furniture_catalog_${user.id}`);
      if (savedCatalog !== null) {
        try {
          const parsed = JSON.parse(savedCatalog);
          const defaultCatalog = [
            { id: 'cozy_sofa', name: 'Cozy Sofa', price: 40, icon: '🛋️', qtyOwned: 0, description: 'A soft velvet sofa in a soothing pastel tone.' },
            { id: 'pixel_bonsai', name: 'Pixel Bonsai', price: 20, icon: '🪴', qtyOwned: 0, description: 'A perfectly pruned miniature desktop bonsai tree.' },
            { id: 'coffee_mug', name: 'Warm Mug', price: 10, icon: '☕', qtyOwned: 0, description: 'A steaming cup of fresh cozy chiptune espresso.' },
            { id: 'retro_radio', name: 'Retro Radio', price: 30, icon: '📻', qtyOwned: 0, description: 'Plays sweet chiptunes and soft static rainfall.' },
            { id: 'pastel_futon', name: 'Pastel Futon', price: 50, icon: '🛏️', qtyOwned: 0, description: 'A fluffy pink mattress that smells of lavender.' },
            { id: 'starry_window', name: 'Starry Window', price: 60, icon: '🪟', qtyOwned: 0, description: 'A magical pane showing a drifting pixel galaxy.' },
            { id: 'warm_fireplace', name: 'Fireplace', price: 80, icon: '🪵', qtyOwned: 0, description: 'A tiny brick hearth with warm dancing embers.' },
            { id: 'oak_bookshelf', name: 'Bookshelf', price: 45, icon: '📚', qtyOwned: 0, description: 'Stacked high with guidebooks and mystery novels.' },
          ];
          const merged = defaultCatalog.map(def => {
            const existing = parsed.find((p: any) => p.id === def.id);
            return existing ? { ...def, qtyOwned: existing.qtyOwned } : def;
          });
          setFurnitureCatalog(merged);
          localStorage.setItem(`xplore_furniture_catalog_${user.id}`, JSON.stringify(merged));
        } catch (e) {
          console.error("Failed to parse catalog:", e);
        }
      } else {
        const defaultCatalog = [
          { id: 'cozy_sofa', name: 'Cozy Sofa', price: 40, icon: '🛋️', qtyOwned: 0, description: 'A soft velvet sofa in a soothing pastel tone.' },
          { id: 'pixel_bonsai', name: 'Pixel Bonsai', price: 20, icon: '🪴', qtyOwned: 0, description: 'A perfectly pruned miniature desktop bonsai tree.' },
          { id: 'coffee_mug', name: 'Warm Mug', price: 10, icon: '☕', qtyOwned: 0, description: 'A steaming cup of fresh cozy chiptune espresso.' },
          { id: 'retro_radio', name: 'Retro Radio', price: 30, icon: '📻', qtyOwned: 0, description: 'Plays sweet chiptunes and soft static rainfall.' },
          { id: 'pastel_futon', name: 'Pastel Futon', price: 50, icon: '🛏️', qtyOwned: 0, description: 'A fluffy pink mattress that smells of lavender.' },
          { id: 'starry_window', name: 'Starry Window', price: 60, icon: '🪟', qtyOwned: 0, description: 'A magical pane showing a drifting pixel galaxy.' },
          { id: 'warm_fireplace', name: 'Fireplace', price: 80, icon: '🪵', qtyOwned: 0, description: 'A tiny brick hearth with warm dancing embers.' },
          { id: 'oak_bookshelf', name: 'Bookshelf', price: 45, icon: '📚', qtyOwned: 0, description: 'Stacked high with guidebooks and mystery novels.' },
        ];
        setFurnitureCatalog(defaultCatalog);
        localStorage.setItem(`xplore_furniture_catalog_${user.id}`, JSON.stringify(defaultCatalog));
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
        // Fetch sync from backend to update streak and check for missed streak
        fetch('http://localhost:3000/api/user/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        .then(res => res.json())
        .then(data => {
          if (data.user) {
            const savedActiveTitle = localStorage.getItem(`xplore_active_title_${user.id}`);
            const syncedUser = savedActiveTitle ? { ...data.user, title: savedActiveTitle } : data.user;
            setUser(syncedUser);
            sessionStorage.setItem('xplore_user', JSON.stringify(syncedUser));
            
            if (data.streakMissed) {
              setStreakMissedOldValue(data.oldStreak || 1);
              setShowStreakMissed(true);
            }
          }
        })
        .catch(err => console.error("Sync on new day failed:", err));

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



  const login = (userData: any, token: string, streakMissed?: boolean, oldStreak?: number) => {
    sessionStorage.setItem('xplore_user', JSON.stringify(userData));
    sessionStorage.setItem('xplore_token', token);
    setUser(userData);
    if (streakMissed) {
      setStreakMissedOldValue(oldStreak || 1);
      setShowStreakMissed(true);
    } else {
      setShowStreakMissed(false);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('xplore_user');
    sessionStorage.removeItem('xplore_token');
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
      sessionStorage.setItem('xplore_user', JSON.stringify(updatedUser));
    } else if (itemId === 'boss_key') {
      addXpDirectly(100);
    } else if (itemId === 'elixir_might') {
      addXpDirectly(60);
    } else if (itemId === 'lucky_charm') {
      addXpDirectly(35);
    }

    return true;
  };

  const feedActivePetXp = (amount: number) => {
    if (!activePetId || amount <= 0 || !user) return;
    
    setPets(prevPets => {
      const updated = prevPets.map(pet => {
        if (pet.id !== activePetId) return pet;
        if (pet.stage === 'adult') return pet; // Already fully grown
        
        let newXp = pet.currentXp + amount;
        let stage: Pet['stage'] = pet.stage;
        let xpNeeded = pet.xpNeeded;
        let name = pet.name;
        let icon = pet.icon;
        
        if (stage === 'egg') {
          // Cap at 100 XP (ready to hatch), don't auto-hatch in background!
          if (newXp >= xpNeeded) {
            newXp = xpNeeded;
          }
        }
        
        if (stage === 'baby' && newXp >= xpNeeded) {
          // Evolve to adult!
          stage = 'adult';
          newXp = newXp - xpNeeded;
          xpNeeded = 0; // Max level
          
          if (pet.type === 'fox') {
            name = 'Adult Pippin';
            icon = '🦊';
          } else if (pet.type === 'owl') {
            name = 'Adult Ollie';
            icon = '🦉';
          } else if (pet.type === 'frog') {
            name = 'Adult Bubu';
            icon = '🐸';
          } else if (pet.type === 'cat') {
            name = 'Adult Cookie';
            icon = '🐱';
          } else if (pet.type === 'dragon') {
            name = 'Adult Drake';
            icon = '🐉';
          } else if (pet.type === 'panda') {
            name = 'Adult Bamboo';
            icon = '🐼';
          } else if (pet.type === 'duck') {
            name = 'Adult Ducky';
            icon = '🦆';
          } else if (pet.type === 'unicorn') {
            name = 'Adult Sparkles';
            icon = '🦄';
          } else if (pet.type === 'sloth') {
            name = 'Adult Sid';
            icon = '🦥';
          } else if (pet.type === 'phoenix') {
            name = 'Adult Phoenix';
            icon = '🦅';
          } else {
            name = 'Adult Companion';
            icon = '✨';
          }
          playSound('success');
          confetti({
            particleCount: 150,
            spread: 90,
            colors: ['#FFD54F', '#4CAF50', '#2196F3']
          });
        }
        
        return {
          ...pet,
          stage,
          currentXp: newXp,
          xpNeeded,
          name,
          icon
        };
      });
      
      localStorage.setItem(`xplore_pets_${user.id}`, JSON.stringify(updated));
      return updated;
    });
  };

  const completeQuest = async (questId: string, proofText?: string, proofImage?: string) => {
    const quest = quests.find(q => q.id === questId);
    if (!quest || quest.completed) return;

    // Direct synchronous updates to quests to prevent any React render race conditions
    const updatedQuests = quests.map(q => q.id === questId ? { ...q, completed: true, proofText, proofImage } : q);
    setQuests(updatedQuests);

    if (user) {
      localStorage.setItem(`xplore_quests_${user.id}`, JSON.stringify(updatedQuests));
      localStorage.setItem(`xplore_quests_day_${user.id}`, String(new Date().getDate()));
      
      const allCompleted = updatedQuests.every(q => q.completed);
      if (allCompleted) {
        fetch('http://localhost:3000/api/user/complete-quests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        }).catch(err => console.error("Failed to mark quests completed:", err));
      }
      // Award Gold corresponding to double the XP reward of the completed quest
      addGoldDirectly(quest.xpReward * 2);
      
      // Feed XP to active pet
      if (activePetId) {
        feedActivePetXp(quest.xpReward);
      }

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
          if (data.newLevel > user.level) {
            if (isGameActive) {
              setPendingLevelUp(data.newLevel);
            } else {
              setLevelUpNewValue(data.newLevel);
              setShowLevelUpModal(true);
            }
          }
          setUser(updatedUser);
          sessionStorage.setItem('xplore_user', JSON.stringify(updatedUser)); // Keep synced
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

    if (amount > 0 && activePetId) {
      feedActivePetXp(amount);
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
        if (data.newLevel > user.level) {
          if (isGameActive) {
            setPendingLevelUp(data.newLevel);
          } else {
            setLevelUpNewValue(data.newLevel);
            setShowLevelUpModal(true);
          }
        }
        setUser(updatedUser);
        sessionStorage.setItem('xplore_user', JSON.stringify(updatedUser));
      }
    } catch (err) {
      console.error("Direct XP add failed:", err);
    }
  };

  const equipPet = (petId: string | null) => {
    if (!user) return;
    setActivePetId(petId);
    if (petId === null) {
      localStorage.removeItem(`xplore_active_pet_${user.id}`);
    } else {
      localStorage.setItem(`xplore_active_pet_${user.id}`, petId);
    }
  };

  const buyEgg = (eggId: string) => {
    if (!user) return false;

    const eggTemplates: { [key: string]: { name: string; price: number; type: Pet['type']; icon: string; buffDesc: string } } = {
      cozy_fox: { name: 'Cozy Fox Egg', price: 100, type: 'fox', icon: '🥚', buffDesc: 'Doubles coin spawns (Pippin the Fox)' },
      wise_owl: { name: 'Wise Owl Egg', price: 120, type: 'owl', icon: '🥚', buffDesc: '+10% score bonus (Ollie the Owl)' },
      floaty_frog: { name: 'Floaty Frog Egg', price: 80, type: 'frog', icon: '🥚', buffDesc: '-12% lower gravity jumps (Bubu the Frog)' },
      lucky_cat: { name: 'Lucky Cat Egg', price: 90, type: 'cat', icon: '🥚', buffDesc: '+12% score bonus (Cookie the Cat)' },
      starry_dragon: { name: 'Starry Dragon Egg', price: 150, type: 'dragon', icon: '🥚', buffDesc: 'Slowing scrolling speeds by 20% (Drake the Dragon)' },
      cozy_panda: { name: 'Cozy Panda Egg', price: 110, type: 'panda', icon: '🥚', buffDesc: '+15% score bonus (Bamboo the Panda)' },
      happy_duck: { name: 'Happy Duck Egg', price: 70, type: 'duck', icon: '🥚', buffDesc: '-8% lower gravity jumps (Ducky the Duck)' },
      mystic_unicorn: { name: 'Mystic Unicorn Egg', price: 200, type: 'unicorn', icon: '🥚', buffDesc: '+25% score bonus (Sparkles the Unicorn)' },
      sleepy_sloth: { name: 'Sleepy Sloth Egg', price: 130, type: 'sloth', icon: '🥚', buffDesc: 'Slowing scrolling speeds by 20% (Sid the Sloth)' },
      cosmic_phoenix: { name: 'Cosmic Phoenix Egg', price: 180, type: 'phoenix', icon: '🥚', buffDesc: 'Doubles coin spawns (Phoenix the Firebird)' }
    };

    const egg = eggTemplates[eggId];
    if (!egg) return false;
    if (gold < egg.price) return false;

    // Check if user already has this pet type (each type can be owned only once)
    if (pets.some(p => p.type === egg.type)) {
      return false;
    }

    // Deduct gold
    const newGold = gold - egg.price;
    setGold(newGold);
    localStorage.setItem(`xplore_gold_${user.id}`, String(newGold));

    const newPet: Pet = {
      id: `${egg.type}_${Date.now()}`,
      name: egg.name,
      type: egg.type,
      stage: 'egg',
      xpNeeded: 100,
      currentXp: 0,
      icon: egg.icon,
      buffDesc: egg.buffDesc
    };

    const updatedPets = [...pets, newPet];
    setPets(updatedPets);
    localStorage.setItem(`xplore_pets_${user.id}`, JSON.stringify(updatedPets));
    return true;
  };

  const buyFurniture = (furnitureId: string) => {
    if (!user) return false;
    const item = furnitureCatalog.find(f => f.id === furnitureId);
    if (!item) return false;
    if (gold < item.price) return false;

    const newGold = gold - item.price;
    setGold(newGold);
    localStorage.setItem(`xplore_gold_${user.id}`, String(newGold));

    const updatedCatalog = furnitureCatalog.map(f => 
      f.id === furnitureId ? { ...f, qtyOwned: f.qtyOwned + 1 } : f
    );
    setFurnitureCatalog(updatedCatalog);
    localStorage.setItem(`xplore_furniture_catalog_${user.id}`, JSON.stringify(updatedCatalog));
    return true;
  };

  const placeFurniture = (furnitureId: string, x: number, y: number) => {
    if (!user) return false;

    // Look in furniture catalog first
    const catalogItem = furnitureCatalog.find(f => f.id === furnitureId);
    if (catalogItem) {
      if (catalogItem.qtyOwned <= 0) return false;

      const updatedCatalog = furnitureCatalog.map(f => 
        f.id === furnitureId ? { ...f, qtyOwned: f.qtyOwned - 1 } : f
      );
      setFurnitureCatalog(updatedCatalog);
      localStorage.setItem(`xplore_furniture_catalog_${user.id}`, JSON.stringify(updatedCatalog));

      const newPlacement: PlacedFurniture = {
        id: `${furnitureId}_${Date.now()}`,
        furnitureId,
        name: catalogItem.name,
        icon: catalogItem.icon,
        x,
        y
      };

      const updatedPlaced = [...placedFurniture, newPlacement];
      setPlacedFurniture(updatedPlaced);
      localStorage.setItem(`xplore_placed_furniture_${user.id}`, JSON.stringify(updatedPlaced));
      return true;
    }

    // Look in unlocked collectibles
    const collectibleItem = unlockedCollectibles.find(c => c.id === furnitureId);
    if (collectibleItem) {
      // Check if already placed
      if (placedFurniture.some(p => p.furnitureId === furnitureId)) {
        return false;
      }

      const newPlacement: PlacedFurniture = {
        id: `${furnitureId}_${Date.now()}`,
        furnitureId,
        name: collectibleItem.name,
        icon: collectibleItem.icon,
        x,
        y
      };

      const updatedPlaced = [...placedFurniture, newPlacement];
      setPlacedFurniture(updatedPlaced);
      localStorage.setItem(`xplore_placed_furniture_${user.id}`, JSON.stringify(updatedPlaced));
      return true;
    }

    return false;
  };

  const removeFurniture = (placementId: string) => {
    if (!user) return;

    const placement = placedFurniture.find(p => p.id === placementId);
    if (!placement) return;

    // If it's a catalog item, return it to owned inventory
    const catalogItem = furnitureCatalog.find(f => f.id === placement.furnitureId);
    if (catalogItem) {
      const updatedCatalog = furnitureCatalog.map(f => 
        f.id === placement.furnitureId ? { ...f, qtyOwned: f.qtyOwned + 1 } : f
      );
      setFurnitureCatalog(updatedCatalog);
      localStorage.setItem(`xplore_furniture_catalog_${user.id}`, JSON.stringify(updatedCatalog));
    }

    const updatedPlaced = placedFurniture.filter(p => p.id !== placementId);
    setPlacedFurniture(updatedPlaced);
    localStorage.setItem(`xplore_placed_furniture_${user.id}`, JSON.stringify(updatedPlaced));
  };

  const updatePlacedPosition = (placementId: string, x: number, y: number) => {
    if (!user) return;

    const updated = placedFurniture.map(p => 
      p.id === placementId ? { ...p, x, y } : p
    );
    setPlacedFurniture(updated);
    localStorage.setItem(`xplore_placed_furniture_${user.id}`, JSON.stringify(updated));
  };

  const hatchPet = (petId: string) => {
    if (!user) return;
    setPets(prevPets => {
      const updated = prevPets.map(pet => {
        if (pet.id !== petId) return pet;
        
        let name = pet.name;
        let icon = pet.icon;
        
        if (pet.type === 'fox') {
          name = 'Baby Pippin';
          icon = '🦊';
        } else if (pet.type === 'owl') {
          name = 'Baby Ollie';
          icon = '🦉';
        } else if (pet.type === 'frog') {
          name = 'Baby Bubu';
          icon = '🐸';
        } else if (pet.type === 'cat') {
          name = 'Baby Cookie';
          icon = '🐱';
        } else if (pet.type === 'dragon') {
          name = 'Baby Drake';
          icon = '🐉';
        } else if (pet.type === 'panda') {
          name = 'Baby Bamboo';
          icon = '🐼';
        } else if (pet.type === 'duck') {
          name = 'Baby Ducky';
          icon = '🦆';
        } else if (pet.type === 'unicorn') {
          name = 'Baby Sparkles';
          icon = '🦄';
        } else if (pet.type === 'sloth') {
          name = 'Baby Sid';
          icon = '🦥';
        } else if (pet.type === 'phoenix') {
          name = 'Baby Phoenix';
          icon = '🦅';
        }

        return {
          ...pet,
          stage: 'baby' as const,
          currentXp: 0,
          xpNeeded: 300,
          name,
          icon
        };
      });
      localStorage.setItem(`xplore_pets_${user.id}`, JSON.stringify(updated));
      return updated;
    });
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
    sessionStorage.setItem('xplore_user', JSON.stringify(updatedUser));
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
      fetch('http://localhost:3000/api/user/complete-quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      }).catch(err => console.error("Failed to mark quests completed:", err));
    }
  };

  return (
    <GameContext.Provider value={{
      user, quests, gold, inventory, login, logout, completeQuest, addXpDirectly, buyItem, useItem, addGoldDirectly,
      mysteryMission, mysteryMissionState, mysteryMissionSkips, unlockedTitles, unlockedCollectibles, unlockedMysteryBadges, activeTitle,
      equipTitle, unlockMysteryMission, acceptMysteryMission, completeMysteryMission, shuffleMysteryMission, skipMysteryMission, cheatCompleteAllQuests,
      showStreakMissed, setShowStreakMissed, streakMissedOldValue,
      showLevelUpModal, setShowLevelUpModal, levelUpNewValue,
      isGameActive, setIsGameActive,
      pets, activePetId, equipPet, buyEgg, hatchPet, furnitureCatalog, placedFurniture, buyFurniture, placeFurniture, removeFurniture, updatePlacedPosition
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

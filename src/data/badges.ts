// Mock data: Badges & Achievements
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export const badges: Badge[] = [
  { 
    id: 'b0', 
    name: 'Pioneer', 
    description: 'Awarded for participating in the early beta launch of XPlore.', 
    icon: '🚀', 
    unlocked: false, 
    rarity: 'epic' 
  },
  { 
    id: 'b1', 
    name: 'First Quest', 
    description: 'Complete your very first quest.', 
    icon: '⚔️', 
    unlocked: false, 
    rarity: 'common' 
  },
  { 
    id: 'b2', 
    name: 'On a Roll', 
    description: 'Maintain a 7-day streak.', 
    icon: '🔥', 
    unlocked: false, 
    rarity: 'common' 
  },
  { id: 'b3', name: 'Scholar', description: 'Complete 50 Academic quests.', icon: '🎓', unlocked: false, rarity: 'rare' },
  { id: 'b4', name: 'Knowledge Broker', description: 'Share a skill with a peer.', icon: '🤝', unlocked: false, rarity: 'common' },
  { id: 'b5', name: 'Level 10', description: 'Reach level 10.', icon: '⭐', unlocked: false, rarity: 'rare' },
  { id: 'b6', name: 'Wellness Warrior', description: 'Complete 20 Wellness quests.', icon: '💪', unlocked: false, rarity: 'common' },
  { id: 'b7', name: 'Streak Lord', description: 'Hit a 30-day streak.', icon: '👑', unlocked: false, rarity: 'epic' },
  { id: 'b8', name: 'Side Quest Hero', description: 'Complete 10 skill exchange sessions.', icon: '🌟', unlocked: false, rarity: 'epic' },
  { id: 'b9', name: 'The Centurion', description: 'Complete 100 quests total.', icon: '🛡️', unlocked: false, rarity: 'rare' },
  { id: 'b10', name: 'Level 25', description: 'Reach the elite level of 25.', icon: '💎', unlocked: false, rarity: 'legendary' },
  { id: 'b11', name: 'Deep Worker', description: 'Complete 15 Deep Work sessions.', icon: '🎯', unlocked: false, rarity: 'rare' },
  { id: 'b12', name: 'Legend of XPLORE', description: 'Reach level 30 and top the leaderboard.', icon: '🏆', unlocked: false, rarity: 'legendary' },
];

export const checkBadgeUnlocked = (
  badgeId: string,
  user: any,
  completedQuestsCount: number,
  skillsCount: number,
  sessionsCount: number
): boolean => {
  if (!user) return false;
  const level = user.level || 1;
  const streak = user.streak || 0;

  switch (badgeId) {
    case 'b0': // Pioneer
      return user.username === 'AryanK' || user.joinDate?.includes('2023') || user.joinDate?.includes('2025') || user.isBetaParticipant;
    case 'b1': // First Quest
      return completedQuestsCount >= 1;
    case 'b2': // On a Roll
      return streak >= 7;
    case 'b3': // Scholar
      return completedQuestsCount >= 50;
    case 'b4': // Knowledge Broker
      return skillsCount >= 1;
    case 'b5': // Level 10
      return level >= 10;
    case 'b6': // Wellness Warrior
      return completedQuestsCount >= 20;
    case 'b7': // Streak Lord
      return streak >= 30;
    case 'b8': // Side Quest Hero
      return sessionsCount >= 10;
    case 'b9': // The Centurion
      return completedQuestsCount >= 100;
    case 'b10': // Level 25
      return level >= 25;
    case 'b11': // Deep Worker
      return completedQuestsCount >= 15;
    case 'b12': // Legend of XPLORE
      return level >= 30;
    default:
      return false;
  }
};

export const titles = [
  { name: 'Newcomer', unlocked: true, requiredLevel: 1 },
  { name: 'Apprentice', unlocked: true, requiredLevel: 5 },
  { name: 'Adventurer', unlocked: true, requiredLevel: 8 },
  { name: 'The Scholar', unlocked: true, requiredLevel: 12 },
  { name: 'Quest Master', unlocked: false, requiredLevel: 16 },
  { name: 'The Grinder', unlocked: false, requiredLevel: 20 },
  { name: 'Rising Legend', unlocked: false, requiredLevel: 25 },
  { name: 'The Legend', unlocked: false, requiredLevel: 30 },
];

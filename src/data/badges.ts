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
  { id: 'b1', name: 'First Quest', description: 'Complete your very first quest.', icon: '⚔️', unlocked: true, rarity: 'common' },
  { id: 'b2', name: 'On a Roll', description: 'Maintain a 7-day streak.', icon: '🔥', unlocked: true, rarity: 'common' },
  { id: 'b3', name: 'Scholar', description: 'Complete 50 Academic quests.', icon: '🎓', unlocked: true, rarity: 'rare' },
  { id: 'b4', name: 'Knowledge Broker', description: 'Share a skill with a peer.', icon: '🤝', unlocked: true, rarity: 'common' },
  { id: 'b5', name: 'Level 10', description: 'Reach level 10.', icon: '⭐', unlocked: true, rarity: 'rare' },
  { id: 'b6', name: 'Wellness Warrior', description: 'Complete 20 Wellness quests.', icon: '💪', unlocked: true, rarity: 'common' },
  { id: 'b7', name: 'Streak Lord', description: 'Hit a 30-day streak.', icon: '👑', unlocked: false, rarity: 'epic' },
  { id: 'b8', name: 'Side Quest Hero', description: 'Complete 10 skill exchange sessions.', icon: '🌟', unlocked: false, rarity: 'epic' },
  { id: 'b9', name: 'The Centurion', description: 'Complete 100 quests total.', icon: '🛡️', unlocked: false, rarity: 'rare' },
  { id: 'b10', name: 'Level 25', description: 'Reach the elite level of 25.', icon: '💎', unlocked: false, rarity: 'legendary' },
  { id: 'b11', name: 'Deep Worker', description: 'Complete 15 Deep Work sessions.', icon: '🎯', unlocked: false, rarity: 'rare' },
  { id: 'b12', name: 'Legend of XPLORE', description: 'Reach level 30 and top the leaderboard.', icon: '🏆', unlocked: false, rarity: 'legendary' },
];

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

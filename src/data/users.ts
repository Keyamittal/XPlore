// Mock data: Users
export interface User {
  id: string;
  username: string;
  initials: string;
  level: number;
  title: string;
  xp: number;
  xpToNext: number;
  streak: number;
  totalXP: number;
  questsCompleted: number;
  skillsShared: number;
  joinDate: string;
}

export const currentUser: User = {
  id: 'u1',
  username: 'Aryan K.',
  initials: 'AK',
  level: 12,
  title: 'The Scholar',
  xp: 0,
  xpToNext: 100,
  streak: 12,
  totalXP: 1200,
  questsCompleted: 87,
  skillsShared: 6,
  joinDate: 'Jan 2026',
};

export const leaderboardUsers: User[] = [
  { id: 'u2', username: 'Meera S.', initials: 'MS', level: 34, title: 'The Legend', xp: 50, xpToNext: 100, streak: 34, totalXP: 3450, questsCompleted: 198, skillsShared: 14, joinDate: 'Sep 2025' },
  { id: 'u3', username: 'Dev P.', initials: 'DP', level: 28, title: 'The Grinder', xp: 20, xpToNext: 100, streak: 28, totalXP: 2820, questsCompleted: 172, skillsShared: 10, joinDate: 'Oct 2025' },
  { id: 'u4', username: 'Riya M.', initials: 'RM', level: 21, title: 'Quest Master', xp: 90, xpToNext: 100, streak: 21, totalXP: 2190, questsCompleted: 154, skillsShared: 8, joinDate: 'Oct 2025' },
  { id: 'u1', username: 'Aryan K.', initials: 'AK', level: 12, title: 'The Scholar', xp: 0, xpToNext: 100, streak: 12, totalXP: 1200, questsCompleted: 87, skillsShared: 6, joinDate: 'Jan 2026' },
  { id: 'u5', username: 'Sana T.', initials: 'ST', level: 9, title: 'Rising Star', xp: 50, xpToNext: 100, streak: 9, totalXP: 950, questsCompleted: 64, skillsShared: 3, joinDate: 'Feb 2026' },
  { id: 'u6', username: 'Karan B.', initials: 'KB', level: 5, title: 'Adventurer', xp: 20, xpToNext: 100, streak: 5, totalXP: 520, questsCompleted: 48, skillsShared: 2, joinDate: 'Feb 2026' },
  { id: 'u7', username: 'Nisha G.', initials: 'NG', level: 3, title: 'Apprentice', xp: 40, xpToNext: 100, streak: 3, totalXP: 340, questsCompleted: 39, skillsShared: 1, joinDate: 'Mar 2026' },
];

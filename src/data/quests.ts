// Mock data: Quests
export type QuestCategory = 'Academic' | 'Wellness' | 'Productivity';
export type Difficulty = 1 | 2 | 3;

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: QuestCategory;
  xpReward: number;
  difficulty: Difficulty;
  completed: boolean;
  icon: string;
}

export const initialQuests: Quest[] = [
  // priority 1 or 2 -> 5 XP, priority 3 -> 10 XP
  // Academic
  { id: 'q1', title: 'Attend All Classes', description: 'Show up for every scheduled lecture today.', category: 'Academic', xpReward: 5, difficulty: 2, completed: false, icon: '🎓' },
  { id: 'q2', title: 'Submit Your Assignment', description: 'Turn in any pending assignment before the deadline.', category: 'Academic', xpReward: 10, difficulty: 3, completed: false, icon: '📝' },
  { id: 'q3', title: 'Take Notes for 2 Lectures', description: 'Write structured notes during class.', category: 'Academic', xpReward: 5, difficulty: 1, completed: false, icon: '✏️' },
  { id: 'q4', title: 'Complete Practice Problems', description: 'Solve at least 5 practice problems from any subject.', category: 'Academic', xpReward: 10, difficulty: 3, completed: false, icon: '🧮' },

  // Wellness
  { id: 'q5', title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day.', category: 'Wellness', xpReward: 5, difficulty: 1, completed: false, icon: '💧' },
  { id: 'q6', title: 'Get 7+ Hours of Sleep', description: 'Rest well to perform at your best.', category: 'Wellness', xpReward: 10, difficulty: 3, completed: false, icon: '😴' },
  { id: 'q7', title: '20-Minute Walk / Exercise', description: 'Move your body — even a short walk counts!', category: 'Wellness', xpReward: 5, difficulty: 1, completed: false, icon: '🏃' },
  { id: 'q8', title: 'Eat a Healthy Meal', description: 'Skip the junk and fuel your brain right.', category: 'Wellness', xpReward: 5, difficulty: 1, completed: false, icon: '🥗' },

  // Productivity
  { id: 'q9', title: 'No Social Media Before Noon', description: 'Start your day focused and distraction-free.', category: 'Productivity', xpReward: 10, difficulty: 3, completed: false, icon: '📵' },
  { id: 'q10', title: 'Read for 30 Minutes', description: 'Read anything — textbook, novel, article.', category: 'Productivity', xpReward: 5, difficulty: 1, completed: false, icon: '📚' },
  { id: 'q11', title: 'Plan Your Day (To-Do List)', description: 'Write out a to-do list at the start of your day.', category: 'Productivity', xpReward: 5, difficulty: 1, completed: false, icon: '📋' },
  { id: 'q12', title: 'Deep Work Session (1 Hour)', description: 'Work without interruptions for a full hour.', category: 'Productivity', xpReward: 10, difficulty: 3, completed: false, icon: '🎯' },
];

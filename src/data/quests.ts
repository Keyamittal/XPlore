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

// Academic Pool (10 items)
const ACADEMIC_POOL: Omit<Quest, 'completed'>[] = [
  { id: 'ap1', title: 'Attend All Classes', description: 'Show up for every scheduled lecture today.', category: 'Academic', xpReward: 5, difficulty: 2, icon: '🎓' },
  { id: 'ap2', title: 'Submit Your Assignment', description: 'Turn in any pending assignment before the deadline.', category: 'Academic', xpReward: 10, difficulty: 3, icon: '📝' },
  { id: 'ap3', title: 'Take Notes for 2 Lectures', description: 'Write structured notes during class.', category: 'Academic', xpReward: 5, difficulty: 1, icon: '✏️' },
  { id: 'ap4', title: 'Complete Practice Problems', description: 'Solve at least 5 practice problems from any subject.', category: 'Academic', xpReward: 10, difficulty: 3, icon: '🧮' },
  { id: 'ap5', title: 'Feynman Technique Blitz', description: 'Explain a complex academic topic to a classmate or out loud.', category: 'Academic', xpReward: 5, difficulty: 2, icon: '🗣️' },
  { id: 'ap6', title: 'Active Recall Session', description: 'Review at least 15 flashcards or review terms without checking notes.', category: 'Academic', xpReward: 5, difficulty: 1, icon: '🎴' },
  { id: 'ap7', title: 'Library Hermit Quest', description: 'Spend at least 2 hours studying in the quiet zone of the library.', category: 'Academic', xpReward: 10, difficulty: 3, icon: '🏛️' },
  { id: 'ap8', title: 'Engage in Class', description: 'Ask or answer a clarifying question during class or office hours.', category: 'Academic', xpReward: 5, difficulty: 1, icon: '🙋‍♂️' },
  { id: 'ap9', title: 'Draft a 1-Page Summary', description: 'Summarize a textbook chapter or lecture topic into a 1-page guide.', category: 'Academic', xpReward: 5, difficulty: 2, icon: '📁' },
  { id: 'ap10', title: 'Research Deep Dive', description: 'Read 1 academic paper or research article related to your major.', category: 'Academic', xpReward: 10, difficulty: 3, icon: '🔬' }
];

// Wellness Pool (10 items)
const WELLNESS_POOL: Omit<Quest, 'completed'>[] = [
  { id: 'wp1', title: 'Drink 8 Glasses of Water', description: 'Stay hydrated throughout the day.', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '💧' },
  { id: 'wp2', title: 'Get 7+ Hours of Sleep', description: 'Rest well to perform at your best.', category: 'Wellness', xpReward: 10, difficulty: 3, icon: '😴' },
  { id: 'wp3', title: '20-Minute Walk / Exercise', description: 'Move your body — even a short walk counts!', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '🏃' },
  { id: 'wp4', title: 'Eat a Healthy Meal', description: 'Skip the junk food and fuel your brain right.', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '🥗' },
  { id: 'wp5', title: 'Digital Sunset at Bedtime', description: 'Turn off all screens at least 30 minutes before sleeping.', category: 'Wellness', xpReward: 10, difficulty: 3, icon: '🌅' },
  { id: 'wp6', title: 'Mindful Meditation', description: 'Spend 5 minutes practicing deep breathing or quiet meditation.', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '🧘' },
  { id: 'wp7', title: 'Stretch & Posture Check', description: 'Stand up, stretch your back, and adjust your posture once every hour.', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '🪑' },
  { id: 'wp8', title: 'IRL Social Connection', description: 'Meet up or call a friend or family member for a genuine conversation.', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '❤️' },
  { id: 'wp9', title: 'Soak Up the Sun', description: 'Spend 10 minutes outdoors getting direct morning sunlight.', category: 'Wellness', xpReward: 5, difficulty: 1, icon: '☀️' },
  { id: 'wp10', title: 'Sugar-Free Challenge', description: 'Avoid refined sugars, sodas, and sweet snacks for the entire day.', category: 'Wellness', xpReward: 10, difficulty: 3, icon: '🍎' }
];

// Productivity Pool (10 items)
const PRODUCTIVITY_POOL: Omit<Quest, 'completed'>[] = [
  { id: 'pp1', title: 'No Social Media Before Noon', description: 'Start your day focused and distraction-free.', category: 'Productivity', xpReward: 10, difficulty: 3, icon: '📵' },
  { id: 'pp2', title: 'Read for 30 Minutes', description: 'Read anything — textbook, novel, article.', category: 'Productivity', xpReward: 5, difficulty: 1, icon: '📚' },
  { id: 'pp3', title: 'Plan Your Day (To-Do List)', description: 'Write out a to-do list at the start of your day.', category: 'Productivity', xpReward: 5, difficulty: 1, icon: '📋' },
  { id: 'pp4', title: 'Deep Work Session (1 Hour)', description: 'Work without interruptions for a full hour.', category: 'Productivity', xpReward: 10, difficulty: 3, icon: '🎯' },
  { id: 'pp5', title: 'Inbox & Notifications Clean', description: 'Clean up your email inbox and clear unneeded notifications.', category: 'Productivity', xpReward: 5, difficulty: 1, icon: '📧' },
  { id: 'pp6', title: 'Triple Pomodoro Master', description: 'Complete 3 Pomodoro sessions (25 mins work + 5 mins rest).', category: 'Productivity', xpReward: 10, difficulty: 3, icon: '🍅' },
  { id: 'pp7', title: 'Desk Declutter Quest', description: 'Clean and organize your physical study environment completely.', category: 'Productivity', xpReward: 5, difficulty: 1, icon: '🧹' },
  { id: 'pp8', title: 'Learn 3 Efficient Shortcuts', description: 'Learn and use 3 new keyboard shortcuts to boost study speed.', category: 'Productivity', xpReward: 5, difficulty: 1, icon: '⌨' },
  { id: 'pp9', title: 'Weekly Milestone Check', description: 'Define one key goal for this week and write it on a sticky note.', category: 'Productivity', xpReward: 5, difficulty: 1, icon: '🏆' },
  { id: 'pp10', title: 'Anti-Multitask Block (2 Hours)', description: 'Focus 100% on a single task at a time for 2 full hours.', category: 'Productivity', xpReward: 10, difficulty: 3, icon: '🧱' }
];

// Helper to select 4 quests from a category pool based deterministically on the current calendar day
const selectQuestsForDay = (pool: Omit<Quest, 'completed'>[], day: number): Omit<Quest, 'completed'>[] => {
  const selected: Omit<Quest, 'completed'>[] = [];
  const poolSize = pool.length;
  
  for (let i = 0; i < 4; i++) {
    // Generate a rotating starting index based on the day
    const index = (day + i * 3) % poolSize;
    const quest = pool[index];
    
    // Avoid title duplication
    if (selected.some(q => q.title === quest.title)) {
      selected.push(pool[(index + 1) % poolSize]);
    } else {
      selected.push(quest);
    }
  }
  return selected;
};

// Main generator returning 12 dynamic daily quests (4 Academic, 4 Wellness, 4 Productivity) with q1-q12 IDs
export const getDailyQuests = (): Quest[] => {
  const day = new Date().getDate(); // Day of month: 1 to 31
  
  const selectedAcademic = selectQuestsForDay(ACADEMIC_POOL, day);
  const selectedWellness = selectQuestsForDay(WELLNESS_POOL, day);
  const selectedProductivity = selectQuestsForDay(PRODUCTIVITY_POOL, day);
  
  // Combine and map into full Quests with q1-q12 IDs
  return [...selectedAcademic, ...selectedWellness, ...selectedProductivity].map((q, index) => ({
    ...q,
    completed: false,
    id: `q${index + 1}`
  }));
};

// Preserve initialQuests for default context initial state, generated for today's date
export const initialQuests: Quest[] = getDailyQuests();

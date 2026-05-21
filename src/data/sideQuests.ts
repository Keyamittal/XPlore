export type SideQuest = {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  completed: boolean;
  timeLimit?: string;
  isDaily: boolean;
};

export const initialSideQuests: SideQuest[] = [
  { id: 'sq1', title: 'Morning Stretch', description: 'Start the day with a 5-minute stretch.', xpReward: 5, completed: false, isDaily: true },
  { id: 'sq2', title: 'Help a Peer', description: 'Answer a question in the student forum.', xpReward: 10, completed: false, timeLimit: '2h left', isDaily: false },
  { id: 'sq3', title: 'Organize Desk', description: 'Clear your workspace for better focus.', xpReward: 5, completed: false, isDaily: true },
  { id: 'sq4', title: 'Flashcard Review', description: 'Review 20 flashcards for any subject.', xpReward: 10, completed: false, isDaily: false },
];

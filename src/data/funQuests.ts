export interface FunChallenge {
  id: string;
  title: string;
  description: string;
  category: 'Social' | 'Creativity' | 'Wellness' | 'Spontaneous';
  xpReward: number;
  unlockedTitle?: string;
  unlockedBadge?: { id: string; name: string; icon: string; description: string; rarity: 'epic' | 'legendary' | 'rare' };
  unlockedCollectible?: { id: string; name: string; icon: string; description: string };
  icon: string;
}

export const funChallenges: FunChallenge[] = [
  {
    id: 'fc1',
    title: 'Text "We need to talk"',
    description: "Send your best friend a dramatic 'we need to talk' message and reveal it's a joke after 10 seconds.",
    category: 'Social',
    xpReward: 50,
    unlockedTitle: 'Chaos Goblin',
    unlockedBadge: { id: 'mb_chaos', name: 'Goblin Energy', icon: '👺', description: 'Unlock the Chaos Goblin title by causing dramatic moments.', rarity: 'epic' },
    unlockedCollectible: { id: 'col_coffee', name: 'Golden Coffee Cup', icon: '☕', description: 'A shiny golden coffee cup representing ultimate creativity and caffeine power.' },
    icon: '👺'
  },
  {
    id: 'fc2',
    title: 'Sing Bollywood Out Loud',
    description: 'Sing one Bollywood song loudly for 30 seconds straight.',
    category: 'Spontaneous',
    xpReward: 50,
    unlockedTitle: 'Main Character',
    unlockedBadge: { id: 'mb_superstar', name: 'Superstar Spirit', icon: '🎭', description: 'Sing your heart out in public to prove you are the main character.', rarity: 'epic' },
    unlockedCollectible: { id: 'col_mic', name: 'Bollywood Mic', icon: '🎤', description: 'A sparkling golden microphone awarded to those who sing their hearts out.' },
    icon: '🎤'
  },
  {
    id: 'fc3',
    title: 'Cinematic Coffee Reel',
    description: 'Record a beautiful cinematic coffee-making reel.',
    category: 'Creativity',
    xpReward: 40,
    unlockedTitle: 'Caffeine Addict',
    unlockedCollectible: { id: 'col_camera', name: 'Cinematic Camera', icon: '🎥', description: 'A high-end retro camera awarded for recording cinematic daily routines.' },
    icon: '🎥'
  },
  {
    id: 'fc4',
    title: 'Embarrassing Photo Story',
    description: 'Post an old embarrassing photo on your story for 5 minutes.',
    category: 'Social',
    xpReward: 60,
    unlockedTitle: 'Certified Menace',
    unlockedBadge: { id: 'mb_menace', name: 'Certified Threat', icon: '☣️', description: 'Share absolute cringe to be labeled a public menace.', rarity: 'legendary' },
    unlockedCollectible: { id: 'col_album', name: 'Old Photo Album', icon: '📖', description: 'A dusty photo album of precious embarrassing moments shared with the world.' },
    icon: '💀'
  },
  {
    id: 'fc5',
    title: '3 Online Compliments',
    description: 'Compliment 3 different strangers online with genuine positivity.',
    category: 'Wellness',
    xpReward: 40,
    unlockedTitle: 'Wholesome Hero',
    unlockedCollectible: { id: 'col_heart', name: 'Heart of Gold', icon: '💛', description: 'A pure gold heart awarded for spreading kindness to strangers online.' },
    icon: '😇'
  },
  {
    id: 'fc6',
    title: 'Dance to Trending Song',
    description: 'Dance freely to a random trending song for 1 minute.',
    category: 'Spontaneous',
    xpReward: 40,
    unlockedTitle: 'Dance Machine',
    unlockedCollectible: { id: 'col_shoes', name: 'Shiny Dancing Shoes', icon: '👟', description: 'Glittering neon sneakers that make you want to dance.' },
    icon: '👟'
  },
  {
    id: 'fc7',
    title: 'Touch Grass (No Phone)',
    description: 'Go outside and touch actual grass for 10 minutes without using your phone.',
    category: 'Wellness',
    xpReward: 50,
    unlockedTitle: 'Nature Guru',
    unlockedBadge: { id: 'mb_grass', name: 'Ground Toucher', icon: '🌱', description: 'Reconnect with actual soil and nature by touching grass.', rarity: 'rare' },
    unlockedCollectible: { id: 'col_grass', name: 'Fresh Grass Turf', icon: '🌾', description: 'A patch of actual soil and grass, symbolizing successful grounding.' },
    icon: '🌿'
  },
  {
    id: 'fc8',
    title: 'Speak in Movie Dialogues',
    description: 'Call a friend and speak only in movie dialogues for 2 full minutes.',
    category: 'Spontaneous',
    xpReward: 50,
    unlockedTitle: 'Drama King',
    unlockedCollectible: { id: 'col_oscar', name: 'Oscar Trophy', icon: '🏆', description: 'An acting trophy for speaking entirely in movie dialogues.' },
    icon: '🎭'
  }
];

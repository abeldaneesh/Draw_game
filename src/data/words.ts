import type { WordOption } from '../types/game';


export const WORD_DATABASE: WordOption[] = [
  // --- ANIMALS ---
  { word: 'Cat', category: 'Animals', difficulty: 'easy' },
  { word: 'Dog', category: 'Animals', difficulty: 'easy' },
  { word: 'Elephant', category: 'Animals', difficulty: 'medium' },
  { word: 'Tiger', category: 'Animals', difficulty: 'easy' },
  { word: 'Monkey', category: 'Animals', difficulty: 'easy' },
  { word: 'Giraffe', category: 'Animals', difficulty: 'medium' },
  { word: 'Penguin', category: 'Animals', difficulty: 'easy' },
  { word: 'Dolphin', category: 'Animals', difficulty: 'medium' },
  { word: 'Kangaroo', category: 'Animals', difficulty: 'medium' },
  { word: 'Octopus', category: 'Animals', difficulty: 'medium' },
  { word: 'Crocodile', category: 'Animals', difficulty: 'hard' },
  { word: 'Flamingo', category: 'Animals', difficulty: 'medium' },
  { word: 'Chameleon', category: 'Animals', difficulty: 'hard' },
  { word: 'Squirrel', category: 'Animals', difficulty: 'medium' },
  { word: 'Hedgehog', category: 'Animals', difficulty: 'hard' },
  { word: 'Bat', category: 'Animals', difficulty: 'easy' },
  { word: 'Owl', category: 'Animals', difficulty: 'easy' },
  { word: 'Snake', category: 'Animals', difficulty: 'easy' },
  { word: 'Frog', category: 'Animals', difficulty: 'easy' },
  { word: 'Panda', category: 'Animals', difficulty: 'easy' },
  { word: 'Shark', category: 'Animals', difficulty: 'easy' },
  { word: 'Whale', category: 'Animals', difficulty: 'easy' },
  { word: 'Butterfly', category: 'Animals', difficulty: 'easy' },
  { word: 'Beaver', category: 'Animals', difficulty: 'medium' },
  { word: 'Peacock', category: 'Animals', difficulty: 'hard' },
  { word: 'Hippo', category: 'Animals', difficulty: 'easy' },
  { word: 'Rhino', category: 'Animals', difficulty: 'medium' },
  { word: 'Sloth', category: 'Animals', difficulty: 'medium' },
  { word: 'Jellyfish', category: 'Animals', difficulty: 'medium' },
  { word: 'Seahorse', category: 'Animals', difficulty: 'medium' },

  // --- OBJECTS ---
  { word: 'Phone', category: 'Objects', difficulty: 'easy' },
  { word: 'Laptop', category: 'Objects', difficulty: 'easy' },
  { word: 'Chair', category: 'Objects', difficulty: 'easy' },
  { word: 'Camera', category: 'Objects', difficulty: 'easy' },
  { word: 'Umbrella', category: 'Objects', difficulty: 'easy' },
  { word: 'Clock', category: 'Objects', difficulty: 'easy' },
  { word: 'Guitar', category: 'Objects', difficulty: 'easy' },
  { word: 'Backpack', category: 'Objects', difficulty: 'easy' },
  { word: 'Scissors', category: 'Objects', difficulty: 'medium' },
  { word: 'Telescope', category: 'Objects', difficulty: 'hard' },
  { word: 'Key', category: 'Objects', difficulty: 'easy' },
  { word: 'Compass', category: 'Objects', difficulty: 'hard' },
  { word: 'Hourglass', category: 'Objects', difficulty: 'hard' },
  { word: 'Microscope', category: 'Objects', difficulty: 'hard' },
  { word: 'Flashlight', category: 'Objects', difficulty: 'easy' },
  { word: 'Candle', category: 'Objects', difficulty: 'easy' },
  { word: 'Mirror', category: 'Objects', difficulty: 'easy' },
  { word: 'Pillow', category: 'Objects', difficulty: 'easy' },
  { word: 'Hammer', category: 'Objects', difficulty: 'easy' },
  { word: 'Toothbrush', category: 'Objects', difficulty: 'easy' },
  { word: 'Headphones', category: 'Objects', difficulty: 'easy' },
  { word: 'Crown', category: 'Objects', difficulty: 'easy' },
  { word: 'Anchor', category: 'Objects', difficulty: 'medium' },
  { word: 'Boomerang', category: 'Objects', difficulty: 'hard' },
  { word: 'Lighthouse', category: 'Objects', difficulty: 'medium' },

  // --- FOOD ---
  { word: 'Pizza', category: 'Food', difficulty: 'easy' },
  { word: 'Burger', category: 'Food', difficulty: 'easy' },
  { word: 'Apple', category: 'Food', difficulty: 'easy' },
  { word: 'Banana', category: 'Food', difficulty: 'easy' },
  { word: 'Cake', category: 'Food', difficulty: 'easy' },
  { word: 'Ice Cream', category: 'Food', difficulty: 'easy' },
  { word: 'Donut', category: 'Food', difficulty: 'easy' },
  { word: 'Sushi', category: 'Food', difficulty: 'medium' },
  { word: 'Taco', category: 'Food', difficulty: 'easy' },
  { word: 'Watermelon', category: 'Food', difficulty: 'easy' },
  { word: 'Popcorn', category: 'Food', difficulty: 'easy' },
  { word: 'Pineapple', category: 'Food', difficulty: 'easy' },
  { word: 'Pancake', category: 'Food', difficulty: 'medium' },
  { word: 'Pretzel', category: 'Food', difficulty: 'medium' },
  { word: 'Avocado', category: 'Food', difficulty: 'easy' },
  { word: 'Cookie', category: 'Food', difficulty: 'easy' },
  { word: 'French Fries', category: 'Food', difficulty: 'easy' },
  { word: 'Strawberry', category: 'Food', difficulty: 'easy' },
  { word: 'Cupcake', category: 'Food', difficulty: 'easy' },
  { word: 'Waffle', category: 'Food', difficulty: 'medium' },
  { word: 'Spaghetti', category: 'Food', difficulty: 'medium' },
  { word: 'Hot Dog', category: 'Food', difficulty: 'easy' },
  { word: 'Lollipop', category: 'Food', difficulty: 'easy' },
  { word: 'Cheese', category: 'Food', difficulty: 'easy' },
  { word: 'Croissant', category: 'Food', difficulty: 'hard' },

  // --- PLACES ---
  { word: 'School', category: 'Places', difficulty: 'easy' },
  { word: 'Hospital', category: 'Places', difficulty: 'medium' },
  { word: 'Airport', category: 'Places', difficulty: 'medium' },
  { word: 'Beach', category: 'Places', difficulty: 'easy' },
  { word: 'Castle', category: 'Places', difficulty: 'easy' },
  { word: 'Pyramid', category: 'Places', difficulty: 'easy' },
  { word: 'Volcano', category: 'Places', difficulty: 'easy' },
  { word: 'Library', category: 'Places', difficulty: 'medium' },
  { word: 'Supermarket', category: 'Places', difficulty: 'medium' },
  { word: 'Cinema', category: 'Places', difficulty: 'medium' },
  { word: 'Space Station', category: 'Places', difficulty: 'hard' },
  { word: 'Amusement Park', category: 'Places', difficulty: 'hard' },
  { word: 'Forest', category: 'Places', difficulty: 'easy' },
  { word: 'Desert', category: 'Places', difficulty: 'easy' },
  { word: 'Igloo', category: 'Places', difficulty: 'easy' },
  { word: 'Island', category: 'Places', difficulty: 'easy' },
  { word: 'Subway', category: 'Places', difficulty: 'medium' },
  { word: 'Bakery', category: 'Places', difficulty: 'medium' },
  { word: 'Museum', category: 'Places', difficulty: 'medium' },
  { word: 'Stadium', category: 'Places', difficulty: 'hard' },

  // --- ACTIVITIES ---
  { word: 'Swimming', category: 'Activities', difficulty: 'easy' },
  { word: 'Running', category: 'Activities', difficulty: 'easy' },
  { word: 'Dancing', category: 'Activities', difficulty: 'easy' },
  { word: 'Sleeping', category: 'Activities', difficulty: 'easy' },
  { word: 'Fishing', category: 'Activities', difficulty: 'easy' },
  { word: 'Surfing', category: 'Activities', difficulty: 'medium' },
  { word: 'Cooking', category: 'Activities', difficulty: 'easy' },
  { word: 'Skateboarding', category: 'Activities', difficulty: 'medium' },
  { word: 'Skiing', category: 'Activities', difficulty: 'medium' },
  { word: 'Singing', category: 'Activities', difficulty: 'easy' },
  { word: 'Cycling', category: 'Activities', difficulty: 'easy' },
  { word: 'Painting', category: 'Activities', difficulty: 'easy' },
  { word: 'Camping', category: 'Activities', difficulty: 'medium' },
  { word: 'Bowling', category: 'Activities', difficulty: 'easy' },
  { word: 'Archery', category: 'Activities', difficulty: 'hard' },
  { word: 'Gardening', category: 'Activities', difficulty: 'medium' },
  { word: 'Juggling', category: 'Activities', difficulty: 'hard' },
  { word: 'Reading', category: 'Activities', difficulty: 'easy' },
  { word: 'Boxing', category: 'Activities', difficulty: 'easy' },
  { word: 'Climbing', category: 'Activities', difficulty: 'medium' },

  // --- TECHNOLOGY ---
  { word: 'Computer', category: 'Technology', difficulty: 'easy' },
  { word: 'Robot', category: 'Technology', difficulty: 'easy' },
  { word: 'Internet', category: 'Technology', difficulty: 'hard' },
  { word: 'Keyboard', category: 'Technology', difficulty: 'easy' },
  { word: 'Rocket', category: 'Technology', difficulty: 'easy' },
  { word: 'Drone', category: 'Technology', difficulty: 'medium' },
  { word: 'Satellite', category: 'Technology', difficulty: 'hard' },
  { word: 'Gamepad', category: 'Technology', difficulty: 'easy' },
  { word: 'Headset', category: 'Technology', difficulty: 'easy' },
  { word: 'Solar Panel', category: 'Technology', difficulty: 'hard' },
  { word: 'Virtual Reality', category: 'Technology', difficulty: 'hard' },
  { word: 'Smartwatch', category: 'Technology', difficulty: 'medium' },
  { word: 'Battery', category: 'Technology', difficulty: 'easy' },
  { word: 'Printer', category: 'Technology', difficulty: 'medium' },
  { word: 'USB Drive', category: 'Technology', difficulty: 'medium' },

  // --- NATURE ---
  { word: 'Sun', category: 'Nature', difficulty: 'easy' },
  { word: 'Moon', category: 'Nature', difficulty: 'easy' },
  { word: 'Rainbow', category: 'Nature', difficulty: 'easy' },
  { word: 'Lightning', category: 'Nature', difficulty: 'easy' },
  { word: 'Waterfall', category: 'Nature', difficulty: 'medium' },
  { word: 'Tornado', category: 'Nature', difficulty: 'medium' },
  { word: 'Snowflake', category: 'Nature', difficulty: 'medium' },
  { word: 'Sunflower', category: 'Nature', difficulty: 'easy' },
  { word: 'Cactus', category: 'Nature', difficulty: 'easy' },
  { word: 'Mountain', category: 'Nature', difficulty: 'easy' },
  { word: 'Comet', category: 'Nature', difficulty: 'hard' },
  { word: 'Eclipse', category: 'Nature', difficulty: 'hard' },
  { word: 'Coral Reef', category: 'Nature', difficulty: 'hard' },
  { word: 'Tree', category: 'Nature', difficulty: 'easy' },
  { word: 'Cloud', category: 'Nature', difficulty: 'easy' },

  // --- VEHICLES ---
  { word: 'Car', category: 'Vehicles', difficulty: 'easy' },
  { word: 'Bicycle', category: 'Vehicles', difficulty: 'easy' },
  { word: 'Airplane', category: 'Vehicles', difficulty: 'easy' },
  { word: 'Submarine', category: 'Vehicles', difficulty: 'medium' },
  { word: 'Helicopter', category: 'Vehicles', difficulty: 'medium' },
  { word: 'Train', category: 'Vehicles', difficulty: 'easy' },
  { word: 'Fire Truck', category: 'Vehicles', difficulty: 'easy' },
  { word: 'Sailboat', category: 'Vehicles', difficulty: 'medium' },
  { word: 'Hot Air Balloon', category: 'Vehicles', difficulty: 'medium' },
  { word: 'Tractor', category: 'Vehicles', difficulty: 'medium' },
  { word: 'Ambulance', category: 'Vehicles', difficulty: 'easy' },
  { word: 'Spaceship', category: 'Vehicles', difficulty: 'medium' },

  // --- JOBS & FANTASY ---
  { word: 'Astronaut', category: 'Jobs & Fantasy', difficulty: 'medium' },
  { word: 'Pirate', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Ninja', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Wizard', category: 'Jobs & Fantasy', difficulty: 'medium' },
  { word: 'Superhero', category: 'Jobs & Fantasy', difficulty: 'medium' },
  { word: 'Doctor', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Chef', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Firefighter', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Detective', category: 'Jobs & Fantasy', difficulty: 'hard' },
  { word: 'Dragon', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Unicorn', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Mermaid', category: 'Jobs & Fantasy', difficulty: 'medium' },
  { word: 'Alien', category: 'Jobs & Fantasy', difficulty: 'easy' },
  { word: 'Vampire', category: 'Jobs & Fantasy', difficulty: 'medium' },
  { word: 'Mummy', category: 'Jobs & Fantasy', difficulty: 'medium' }
];

export function getRandomWords(
  count: number = 3,
  difficulty: string = 'mixed',
  customWords: string[] = [],
  usedWords: Set<string> = new Set()
): WordOption[] {
  let pool = [...WORD_DATABASE];

  // Include custom words if available
  if (customWords && customWords.length > 0) {
    const customOptions: WordOption[] = customWords.map((w) => ({
      word: w.trim(),
      category: 'Custom Word',
      difficulty: 'medium',
    }));
    pool = [...customOptions, ...pool];
  }

  // Filter by difficulty if specified
  if (difficulty !== 'mixed') {
    const filtered = pool.filter((w) => w.difficulty === difficulty || w.category === 'Custom Word');
    if (filtered.length >= count) {
      pool = filtered;
    }
  }

  // Exclude recently used words if pool has enough words left
  const unusedPool = pool.filter((w) => !usedWords.has(w.word.toLowerCase()));
  if (unusedPool.length >= count) {
    pool = unusedPool;
  }

  // Shuffle pool using Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // De-duplicate by word text
  const uniqueWords: WordOption[] = [];
  const seen = new Set<string>();

  for (const item of shuffled) {
    const lower = item.word.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      uniqueWords.push(item);
      if (uniqueWords.length === count) break;
    }
  }

  return uniqueWords;
}

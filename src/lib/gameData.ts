import { Recipe } from '@/types/game'
import { supabase } from './supabase';

export const sampleRecipes: Recipe[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    emoji: '🍕',
    ingredients: ['flour', 'tomato', 'mozzarella', 'basil', 'olive oil'],
    difficulty: 'medium',
    category: 'Italian',
    description: 'Classic Italian pizza with fresh ingredients'
  },
  {
    id: '2',
    name: 'Chocolate Chip Cookies',
    emoji: '🍪',
    ingredients: ['flour', 'butter', 'sugar', 'eggs', 'chocolate chips', 'vanilla'],
    difficulty: 'easy',
    category: 'Dessert',
    description: 'Soft and chewy chocolate chip cookies'
  },
  {
    id: '3',
    name: 'Caesar Salad',
    emoji: '🥗',
    ingredients: ['lettuce', 'parmesan', 'croutons', 'lemon', 'garlic', 'anchovies'],
    difficulty: 'easy',
    category: 'Salad',
    description: 'Fresh and tangy Caesar salad'
  },
  {
    id: '4',
    name: 'Beef Tacos',
    emoji: '🌮',
    ingredients: ['beef', 'tortillas', 'onion', 'tomato', 'lettuce', 'cheese', 'salsa'],
    difficulty: 'medium',
    category: 'Mexican',
    description: 'Delicious beef tacos with fresh toppings'
  },
  {
    id: '5',
    name: 'Chicken Curry',
    emoji: '🍛',
    ingredients: ['chicken', 'onion', 'garlic', 'ginger', 'coconut milk', 'curry powder', 'rice'],
    difficulty: 'hard',
    category: 'Indian',
    description: 'Spicy and aromatic chicken curry'
  },
  {
    id: '6',
    name: 'Pancakes',
    emoji: '🥞',
    ingredients: ['flour', 'milk', 'eggs', 'butter', 'sugar', 'baking powder'],
    difficulty: 'easy',
    category: 'Breakfast',
    description: 'Fluffy and delicious pancakes'
  },
  {
    id: '7',
    name: 'Sushi Roll',
    emoji: '🍣',
    ingredients: ['rice', 'nori', 'salmon', 'cucumber', 'avocado', 'wasabi'],
    difficulty: 'hard',
    category: 'Japanese',
    description: 'Fresh and healthy sushi roll'
  },
  {
    id: '8',
    name: 'Spaghetti Carbonara',
    emoji: '🍝',
    ingredients: ['pasta', 'eggs', 'bacon', 'parmesan', 'black pepper', 'garlic'],
    difficulty: 'medium',
    category: 'Italian',
    description: 'Creamy and delicious carbonara'
  },
  {
    id: '9',
    name: 'Chocolate Cake',
    emoji: '🍰',
    ingredients: ['flour', 'cocoa', 'sugar', 'eggs', 'milk', 'butter', 'vanilla', 'baking powder'],
    difficulty: 'medium',
    category: 'Dessert',
    description: 'Rich and moist chocolate cake'
  },
  {
    id: '10',
    name: 'Greek Salad',
    emoji: '🥙',
    ingredients: ['cucumber', 'tomato', 'olives', 'feta', 'onion', 'olive oil'],
    difficulty: 'easy',
    category: 'Mediterranean',
    description: 'Fresh and healthy Greek salad'
  }
]

export const getRandomRecipe = (): Recipe => {
  const randomIndex = Math.floor(Math.random() * sampleRecipes.length)
  return sampleRecipes[randomIndex]
}

export const getRecipeByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): Recipe[] => {
  return sampleRecipes.filter(recipe => recipe.difficulty === difficulty)
}

export const getRecipeById = (id: string): Recipe | undefined => {
  return sampleRecipes.find(recipe => recipe.id === id)
}

export const getRandomSavedRecipe = async () => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);
  if (error || !data || data.length === 0) return null;
  return data[0];
};

export const getNextUnusedRecipes = async (count = 3) => {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .is('used_on', null)
    .order('created_at', { ascending: true })
    .limit(count);
  if (error || !data) return [];
  return data;
};

export const markRecipeAsUsedToday = async (id: string) => {
  // Get today's date in AEST (UTC+10)
  const now = new Date();
  const aestOffset = 10 * 60 * 60 * 1000;
  const aestDate = new Date(now.getTime() + aestOffset).toISOString().slice(0, 10);
  const { error } = await supabase
    .from('recipes')
    .update({ used_on: aestDate })
    .eq('id', id);
  return !error;
};

// Returns ms until the next 8am AEST (UTC+10, no DST)
export function getTimeToNext8amAEST() {
  const now = new Date();
  // Get current UTC time in ms
  const nowUTC = now.getTime();
  // Convert to AEST (UTC+10, no DST)
  const nowAEST = new Date(nowUTC + 10 * 60 * 60 * 1000);
  // Calculate next 8am AEST in UTC
  let next8amAEST = new Date(Date.UTC(
    nowAEST.getUTCFullYear(),
    nowAEST.getUTCMonth(),
    nowAEST.getUTCDate(),
    8, 0, 0, 0
  ));
  if (nowAEST.getUTCHours() >= 8) {
    // If it's 8am or later in AEST, next 8am is tomorrow
    next8amAEST.setUTCDate(next8amAEST.getUTCDate() + 1);
  }
  // Convert next8amAEST (AEST) to UTC ms
  const next8amAEST_utc = next8amAEST.getTime() - 10 * 60 * 60 * 1000;
  const diff = next8amAEST_utc - nowUTC;
  return diff > 0 ? diff : 0;
}

export function getOrCreateGuestId() {
  let guestId = localStorage.getItem('foodle_guest_id');
  if (!guestId) {
    guestId = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
    localStorage.setItem('foodle_guest_id', guestId);
  }
  return guestId;
} 
import { Recipe } from '@/types/game'

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
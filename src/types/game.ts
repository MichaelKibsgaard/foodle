export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  description?: string;
  image_url?: string;
  recipe_image?: string;
  photo_url?: string;
  ingredients_long?: string[] | string;
  instructions_long?: string;
  instructions?: string;
  servings?: number;
  cookTime?: number;
  username?: string;
  userlink?: string;
}

export interface GameState {
  currentRecipe: Recipe | null;
  guessedIngredients: string[];
  correctIngredients: string[];
  attempts: number;
  maxAttempts: number;
  gameStatus: 'playing' | 'won' | 'lost';
  hintsUsed: number;
  maxHints: number;
  startTime: number;
  endTime?: number;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  totalRecipes: number;
  averageAttempts: number;
  totalHintsUsed: number;
  bestTime?: number;
}

export interface GameResult {
  recipeId: string;
  recipeName: string;
  attempts: number;
  hintsUsed: number;
  timeSpent: number;
  won: boolean;
  date: string;
}

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Hint {
  type: 'letter_count' | 'first_letter' | 'full_ingredient';
  ingredient: string;
  revealed: boolean;
} 
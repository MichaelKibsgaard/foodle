export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  ingredients: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
  description?: string;
  cookTime?: number; // in minutes
  servings?: number; // number of people served
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
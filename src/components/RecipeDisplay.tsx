import React from 'react'
import { Recipe } from '@/types/game'

interface RecipeDisplayProps {
  recipe: Recipe
}

export const RecipeDisplay: React.FC<RecipeDisplayProps> = ({ recipe }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'text-green-500'
      case 'medium':
        return 'text-yellow-500'
      case 'hard':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8 text-center">
      <div className="mb-6">
        <div className="text-8xl mb-4 animate-bounce-slow">
          {recipe.emoji}
        </div>
        <h2 className="text-4xl font-bold mb-2 text-shadow glow-animation">
          {recipe.name}
        </h2>
        <div className="flex items-center justify-center space-x-4">
          <div className="glass-panel px-3 py-1 rounded-lg">
            <span className={`text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty.toUpperCase()}
            </span>
          </div>
          <div className="glass-panel px-3 py-1 rounded-lg">
            <span className="text-sm text-wordle-absent">
              {recipe.category}
            </span>
          </div>
        </div>
      </div>
      
      {recipe.description && (
        <div className="glass-panel p-4 rounded-lg mb-6 max-w-2xl mx-auto">
          <p className="text-wordle-absent">
            {recipe.description}
          </p>
        </div>
      )}
      
      <div className="glass-panel inline-block px-4 py-2 rounded-lg">
        <div className="text-sm text-wordle-absent">
          Find {recipe.ingredients.length} ingredients to complete this recipe!
        </div>
      </div>
    </div>
  )
} 
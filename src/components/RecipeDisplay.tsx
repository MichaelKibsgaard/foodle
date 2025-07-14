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
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="mb-6">
          <div className="text-8xl mb-4 animate-bounce-slow">
            {recipe.emoji}
          </div>
          <h2 className="text-4xl font-bold mb-2 text-shadow">
            {recipe.name}
          </h2>
          <div className="flex items-center justify-center space-x-4">
            <span className={`text-sm font-medium ${getDifficultyColor(recipe.difficulty)}`}>
              {recipe.difficulty.toUpperCase()}
            </span>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {recipe.category}
            </span>
          </div>
        </div>
        
        {recipe.description && (
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            {recipe.description}
          </p>
        )}
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Find {recipe.ingredients.length} ingredients to complete this recipe!
        </div>
      </div>
    </div>
  )
} 
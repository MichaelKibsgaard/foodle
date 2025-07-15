'use client'

import React from 'react'
import { Recipe } from '@/types/game'

interface IngredientGridProps {
  recipe: Recipe
  guessedIngredients: string[]
  correctIngredients: string[]
}

export const IngredientGrid: React.FC<IngredientGridProps> = ({
  recipe,
  guessedIngredients,
  correctIngredients,
}) => {
  const getIngredientStatus = (ingredient: string) => {
    const normalizedIngredient = ingredient.toLowerCase()
    const normalizedGuessed = guessedIngredients.map(g => g.toLowerCase())
    
    if (correctIngredients.map(c => c.toLowerCase()).includes(normalizedIngredient)) {
      return 'correct'
    }
    
    if (normalizedGuessed.includes(normalizedIngredient)) {
      return 'absent'
    }
    
    return 'empty'
  }

  const getTileContent = (ingredient: string, index: number) => {
    const status = getIngredientStatus(ingredient)
    if (status === 'correct') {
      return <span className="text-accent-pink font-bold">{ingredient.toUpperCase()}</span>;
    }
    // Show dashes for each letter if not guessed
    return (
      <span className="ingredient-dashes">
        {Array.from({ length: ingredient.length }).map(() => '_').join(' ')}
      </span>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-semibold mb-6 text-center text-wordle-text">
        {recipe.emoji} {recipe.name}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
        {recipe.ingredients.map((ingredient, index) => {
          const status = getIngredientStatus(ingredient)
          const isCorrect = status === 'correct';
          return (
            <div key={index} className="flex flex-col items-center justify-center">
              <div className="ingredient-box">
                <span className={`ingredient-dashes whitespace-nowrap ${isCorrect ? 'text-accent-pink font-bold' : ''}`}>
                  {isCorrect ? ingredient.toUpperCase() : '_'.repeat(ingredient.length)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-6 text-center">
        <div className="glass-panel inline-block px-4 py-2 rounded-lg">
          <span className="text-sm text-wordle-absent">
            {correctIngredients.length} of {recipe.ingredients.length} ingredients found
          </span>
        </div>
      </div>
    </div>
  )
} 
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
      return <span className="text-vibrant-pink font-bold">{ingredient.toUpperCase()}</span>;
    }
    // Show dashes for each letter if not guessed
    return (
      <span className="font-mono tracking-widest text-vibrant-deep opacity-60">
        {Array.from({ length: ingredient.length }).map(() => '_').join(' ')}
      </span>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-semibold mb-6 text-center text-wordle-text glow-animation">
        {recipe.emoji} {recipe.name}
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {recipe.ingredients.map((ingredient, index) => {
          const status = getIngredientStatus(ingredient)
          const content = getTileContent(ingredient, index)
          const isRevealed = correctIngredients.map(c => c.toLowerCase()).includes(ingredient.toLowerCase())
          
          return (
            <div
              key={index}
              className={`
                wordle-tile hover:scale-105 transition-all duration-300
                ${status === 'correct' ? 'correct flip-animation' : ''}
                ${status === 'absent' ? 'absent flip-animation' : ''}
                ${content && status === 'empty' ? 'filled' : ''}
                ${isRevealed ? 'correct' : ''}
              `}
              style={{
                animationDelay: `${index * 0.1}s`
              }}
            >
              {content}
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
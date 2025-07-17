'use client'

import React from 'react'
import { Recipe } from '@/types/game'

interface IngredientGridProps {
  recipe: Recipe
  guessedIngredients: string[]
  correctIngredients: string[]
  onHint?: () => void
  lastGuessedIngredient?: string
  lastGuessCorrect?: boolean
}

export const IngredientGrid: React.FC<IngredientGridProps> = ({
  recipe,
  guessedIngredients,
  correctIngredients,
  onHint,
  lastGuessedIngredient,
  lastGuessCorrect,
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
    // Show '?' for unguessed
    return (
      <span className="text-gray-400 font-bold text-lg">?</span>
    );
  }

  return (
    <div className="bg-white/80 rounded-3xl shadow-2xl p-8 w-full max-w-lg flex flex-col items-center border border-white/60 backdrop-blur-md">
      <div className="flex flex-wrap gap-2 w-full justify-center mb-8">
        {recipe.ingredients.map((ingredient, index) => {
          const status = getIngredientStatus(ingredient)
          const isCorrect = status === 'correct';
          const isLastGuessed =
            lastGuessedIngredient &&
            ingredient.toLowerCase() === lastGuessedIngredient.toLowerCase();
          const animationClass = isLastGuessed
            ? lastGuessCorrect
              ? 'animate-pop'
              : 'animate-shake'
            : '';
          return (
            <div
              key={index}
              className={`rounded-xl px-4 py-3 min-w-[70px] min-h-[36px] flex items-center justify-center shadow transition-all duration-150 font-mono text-base
                ${isCorrect ? 'bg-pink-100 text-accent-pink border-pink-200' : 'bg-[#FFF5F0] text-gray-400 border border-[#F3E8FF]'}
                ${animationClass}
              `}
            >
              {getTileContent(ingredient, index)}
            </div>
          )
        })}
      </div>
      <div className="mt-2 text-center">
        <button
          type="button"
          className="btn-outline px-5 py-2 rounded-xl transition-all duration-150 hover:scale-105"
          onClick={typeof onHint === 'function' ? onHint : undefined}
        >
          Hint
        </button>
      </div>
    </div>
  )
} 
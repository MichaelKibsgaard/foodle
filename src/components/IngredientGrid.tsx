'use client'

import React from 'react'
import { Recipe } from '@/types/game'
import { useMemo } from 'react';

interface IngredientGridProps {
  recipe: Recipe
  guessedIngredients: string[]
  correctIngredients: string[]
  onHint?: () => void
  lastGuessedIngredient?: string
  lastGuessCorrect?: boolean
  hintedIngredient?: string // new prop for hint highlight
  gameStatus?: 'playing' | 'won' | 'lost'
}

export const IngredientGrid: React.FC<IngredientGridProps> = ({
  recipe,
  guessedIngredients,
  correctIngredients,
  onHint,
  lastGuessedIngredient,
  lastGuessCorrect,
  hintedIngredient,
  gameStatus,
}) => {
  const getIngredientStatus = (ingredient: string) => {
    const normalizedIngredient = ingredient.toLowerCase()
    const normalizedGuessed = guessedIngredients.map(g => g.toLowerCase())
    const normalizedCorrect = correctIngredients.map(c => c.toLowerCase())

    if (gameStatus === 'won' || gameStatus === 'lost') {
      if (normalizedCorrect.includes(normalizedIngredient)) return 'correct';
      return 'missed';
    }
    if (normalizedCorrect.includes(normalizedIngredient)) {
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
      return (
        <span className="text-green-700 font-extrabold text-lg md:text-xl tracking-wide animate-ingredient-pop">
          {ingredient.toUpperCase()}
        </span>
      );
    }
    if (status === 'missed') {
      return (
        <span className="text-red-500 font-extrabold text-lg md:text-xl tracking-wide animate-ingredient-pop">
          {ingredient.toUpperCase()}
        </span>
      );
    }
    // Show underscores for unguessed ingredients
    return (
      <span className="text-gray-500 dark:text-gray-400 font-bold text-lg md:text-xl opacity-80 tracking-wider">
        {'_'.repeat(ingredient.length)}
      </span>
    );
  }

  // Progress bar calculation
  const total = recipe.ingredients.length;
  const found = correctIngredients.length;
  const percent = Math.round((found / total) * 100);

  // Memoize for performance
  const ingredientTiles = useMemo(() => recipe.ingredients.map((ingredient, index) => {
    const status = getIngredientStatus(ingredient);
    const isCorrect = status === 'correct';
    const isMissed = status === 'missed';
    const isLastGuessed =
      lastGuessedIngredient &&
      ingredient.toLowerCase() === lastGuessedIngredient.toLowerCase();
    const animationClass = isLastGuessed
      ? lastGuessCorrect
        ? 'animate-pop'
        : 'animate-shake'
      : isCorrect
        ? 'animate-ingredient-pop'
      : isMissed
        ? 'animate-ingredient-pop'
        : '';
    // No icon or emoji for correct answers
    return (
      <div
        key={index}
        className={`rounded-xl px-3 py-2 flex flex-col items-center justify-center shadow transition-all duration-150 font-mono text-base border-2 flex-grow flex-shrink min-w-[60px] min-h-[40px] max-h-[56px]
          ${isCorrect ? 'bg-green-animate text-green-700 border-green-400' : isMissed ? 'bg-red-100 text-red-600 border-red-400' : 'bg-[#FFF5F0] dark:bg-gray-800 text-gray-400 border border-[#F3E8FF] dark:border-gray-700'}
          ${animationClass}
          ${hintedIngredient && ingredient.toLowerCase() === hintedIngredient.toLowerCase() && !isCorrect ? 'ring-4 ring-yellow-300 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/30' : ''}
        `}
        aria-label={isCorrect ? `${ingredient} (found)` : isMissed ? `${ingredient} (missed)` : 'Unknown ingredient'}
        tabIndex={0}
        style={{ fontSize: '0.95rem', margin: '2px', boxSizing: 'border-box', flexBasis: 'auto' }}
      >
        {getTileContent(ingredient, index)}
      </div>
    );
  }), [recipe.ingredients, correctIngredients, guessedIngredients, lastGuessedIngredient, lastGuessCorrect, hintedIngredient, gameStatus]);

  return (
    <div className="bg-white/80 rounded-3xl shadow-2xl p-4 w-full max-w-lg flex flex-col items-center border border-white/60 backdrop-blur-md">
      {/* Progress Bar */}
      <div className="w-full mb-2">
        <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-pink-400 to-yellow-300 transition-all duration-500"
            style={{ width: `${percent}%` }}
            aria-valuenow={found}
            aria-valuemax={total}
            aria-valuemin={0}
            role="progressbar"
          />
        </div>
        <div className="text-xs text-center mt-0.5 text-gray-500 dark:text-gray-300">
          {found} of {total} ingredients found
        </div>
      </div>
      <div className="flex flex-wrap gap-1 w-full justify-center mb-4">
        {ingredientTiles}
      </div>
      {/* Remove the hint button from here */}
    </div>
  );
} 
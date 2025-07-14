import React from 'react'
import { Check, X } from 'lucide-react'

interface IngredientGridProps {
  recipe: any
  guessedIngredients: string[]
  correctIngredients: string[]
}

export const IngredientGrid: React.FC<IngredientGridProps> = ({
  recipe,
  guessedIngredients,
  correctIngredients,
}) => {
  const isCorrectGuess = (ingredient: string) => {
    return correctIngredients.includes(ingredient.toLowerCase())
  }

  const isIncorrectGuess = (ingredient: string) => {
    return guessedIngredients.includes(ingredient.toLowerCase()) && 
           !correctIngredients.includes(ingredient.toLowerCase())
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-xl font-semibold mb-4 text-center">
          Your Guesses
        </h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {guessedIngredients.map((ingredient, index) => (
            <div
              key={index}
              className={`ingredient-tile ${
                isCorrectGuess(ingredient)
                  ? 'correct-guess'
                  : isIncorrectGuess(ingredient)
                  ? 'incorrect-guess'
                  : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="capitalize">{ingredient}</span>
                {isCorrectGuess(ingredient) && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                {isIncorrectGuess(ingredient) && (
                  <X className="w-4 h-4 text-red-600" />
                )}
              </div>
            </div>
          ))}
        </div>
        
        {guessedIngredients.length === 0 && (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            Start guessing ingredients to see them here!
          </div>
        )}
      </div>
    </div>
  )
} 
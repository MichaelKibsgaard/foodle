import React from 'react'
import { Trophy, RefreshCw, Share2 } from 'lucide-react'
import { Recipe } from '@/types/game'

interface GameResultProps {
  gameStatus: 'won' | 'lost'
  recipe: Recipe
  attempts: number
  hintsUsed: number
  onRestart: () => void
  timeSpent?: number
}

export const GameResult: React.FC<GameResultProps> = ({
  gameStatus,
  recipe,
  attempts,
  hintsUsed,
  onRestart,
  timeSpent,
}) => {
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const shareResult = () => {
    const result = `🍽️ Foodle Result:
${gameStatus === 'won' ? '✅ Won' : '❌ Lost'} - ${recipe.name} ${recipe.emoji}
Attempts: ${attempts}/5
Hints used: ${hintsUsed}/3
${timeSpent ? `Time: ${formatTime(timeSpent)}` : ''}

Play at: foodle-game.vercel.app`

    if (navigator.share) {
      navigator.share({
        title: 'Foodle Result',
        text: result,
      })
    } else {
      navigator.clipboard.writeText(result)
      // You could add a toast notification here
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-8 text-center">
        <div className="mb-6">
          {gameStatus === 'won' ? (
            <div className="text-green-500 mb-4">
              <Trophy className="w-16 h-16 mx-auto animate-bounce" />
              <h2 className="text-3xl font-bold mt-2">Congratulations!</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                You found all the ingredients!
              </p>
            </div>
          ) : (
            <div className="text-red-500 mb-4">
              <h2 className="text-3xl font-bold">Game Over</h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                Better luck next time!
              </p>
            </div>
          )}
        </div>

        <div className="mb-8">
          <h3 className="text-xl font-semibold mb-4">
            Recipe: {recipe.name} {recipe.emoji}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-primary-500">{attempts}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Attempts</div>
            </div>
            <div className="glass-card rounded-xl p-4">
              <div className="text-2xl font-bold text-yellow-500">{hintsUsed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Hints Used</div>
            </div>
          </div>
          
          {timeSpent && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Time: {formatTime(timeSpent)}
              </div>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h4 className="text-lg font-semibold mb-3">All Ingredients:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-lg mx-auto">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="ingredient-tile correct-guess"
              >
                <span className="capitalize">{ingredient}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={onRestart}
            className="glass-button px-6 py-3 rounded-xl font-medium
                       flex items-center space-x-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Play Again</span>
          </button>
          
          <button
            onClick={shareResult}
            className="glass-button px-6 py-3 rounded-xl font-medium
                       flex items-center space-x-2"
          >
            <Share2 className="w-5 h-5" />
            <span>Share</span>
          </button>
        </div>
      </div>
    </div>
  )
} 
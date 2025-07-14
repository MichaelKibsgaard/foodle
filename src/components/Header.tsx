import React from 'react'
import { Trophy, Target, Clock } from 'lucide-react'

interface HeaderProps {
  gameStatus: 'playing' | 'won' | 'lost'
  attempts: number
  maxAttempts: number
  hintsUsed: number
  maxHints: number
}

export const Header: React.FC<HeaderProps> = ({
  gameStatus,
  attempts,
  maxAttempts,
  hintsUsed,
  maxHints,
}) => {
  return (
    <header className="w-full max-w-4xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h1 className="text-3xl font-bold text-glow">
              🍽️ Foodle
            </h1>
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Food Ingredient Guessing Game
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Target className="w-5 h-5 text-primary-500" />
              <span className="text-sm font-medium">
                {attempts}/{maxAttempts}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span className="text-sm font-medium">
                {hintsUsed}/{maxHints}
              </span>
            </div>
            
            {gameStatus === 'won' && (
              <div className="flex items-center space-x-2 text-green-500">
                <Trophy className="w-5 h-5" />
                <span className="text-sm font-medium">Winner!</span>
              </div>
            )}
            
            {gameStatus === 'lost' && (
              <div className="flex items-center space-x-2 text-red-500">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">Game Over</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
} 
import React from 'react'
import { Send, Lightbulb } from 'lucide-react'

interface GameInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  onHint: () => void
  disabled: boolean
  hintsUsed: number
  maxHints: number
  gameStatus: 'playing' | 'won' | 'lost'
}

export const GameInput: React.FC<GameInputProps> = ({
  value,
  onChange,
  onSubmit,
  onHint,
  disabled,
  hintsUsed,
  maxHints,
  gameStatus,
}) => {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <div className="glass-card rounded-2xl p-6">
        <form onSubmit={onSubmit} className="flex items-center space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Type an ingredient..."
              disabled={disabled || gameStatus !== 'playing'}
              className="w-full px-4 py-3 rounded-xl bg-white/20 dark:bg-white/10 
                         border border-white/30 dark:border-white/20 
                         text-gray-900 dark:text-white placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-primary-500
                         disabled:opacity-50 disabled:cursor-not-allowed
                         backdrop-blur-sm"
            />
          </div>
          
          <button
            type="submit"
            disabled={disabled || gameStatus !== 'playing' || !value.trim()}
            className="glass-button px-6 py-3 rounded-xl font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
          >
            <Send className="w-5 h-5" />
            <span>Guess</span>
          </button>
          
          <button
            type="button"
            onClick={onHint}
            disabled={disabled || gameStatus !== 'playing' || hintsUsed >= maxHints}
            className="hint-button px-4 py-3 rounded-xl font-medium
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center space-x-2"
          >
            <Lightbulb className={`w-5 h-5 ${hintsUsed > 0 ? 'animate-pulse-slow' : ''}`} />
            <span>Hint</span>
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Press Enter to submit your guess
        </div>
      </div>
    </div>
  )
} 
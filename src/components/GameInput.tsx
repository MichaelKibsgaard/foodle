'use client'

import React, { useState, useEffect } from 'react'
import { Lightbulb, Send } from 'lucide-react'

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
  const [isShaking, setIsShaking] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!value.trim()) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 500)
      return
    }
    onSubmit(e)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any)
    }
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Input Field */}
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={disabled}
            placeholder="Enter an ingredient..."
            className={`
              glass-input w-full px-4 py-3 text-lg font-semibold text-center
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isShaking ? 'shake-animation' : ''}
              text-wordle-text placeholder-wordle-text/60
            `}
            maxLength={20}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="glass-button p-2 rounded-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              <Send className="w-4 h-4 text-wordle-text" />
            </button>
          </div>
        </div>

        {/* Hint Button */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={onHint}
            disabled={disabled || hintsUsed >= maxHints}
            className="glass-button flex items-center space-x-2 px-4 py-2 rounded-lg hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 text-wordle-text font-semibold"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Hint ({hintsUsed}/{maxHints})</span>
          </button>
        </div>

        {/* Instructions */}
        <div className="text-center text-sm text-wordle-absent">
          <p>Guess the ingredients in the recipe. Correct guesses don't count against your attempts!</p>
          <p className="mt-1">You have {maxHints - hintsUsed} hints remaining.</p>
        </div>
      </form>
    </div>
  )
} 
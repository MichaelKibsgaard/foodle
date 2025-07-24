'use client'

import React, { useState, useEffect, useRef } from 'react'
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
  const [isShaking, setIsShaking] = useState(false);
  const [muted, setMuted] = useState(false);
  const correctSound = useRef<HTMLAudioElement | null>(null);
  const incorrectSound = useRef<HTMLAudioElement | null>(null);
  const hintSound = useRef<HTMLAudioElement | null>(null);

  const playSound = (type: 'correct' | 'incorrect' | 'hint') => {
    if (muted) return;
    if (type === 'correct') correctSound.current?.play();
    if (type === 'incorrect') incorrectSound.current?.play();
    if (type === 'hint') hintSound.current?.play();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      playSound('incorrect');
      return;
    }
    onSubmit(e);
    // Play correct/incorrect sound based on game logic (to be handled in parent)
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <form onSubmit={handleSubmit} className="space-y-4" aria-label="Guess an ingredient">
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
              glass-input game-input-stats w-full max-w-xl px-4 text-lg font-semibold text-center
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isShaking ? 'shake-animation' : ''}
              text-wordle-text placeholder-wordle-text/60
              focus:ring-2 focus:ring-accent-pink
            `}
            maxLength={20}
            aria-label="Ingredient guess input"
            autoFocus
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
            <button
              type="submit"
              disabled={disabled || !value.trim()}
              className="game-input-stats-btn rounded-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-pink"
              style={{
                background: 'linear-gradient(270deg, #ff80b5, #ffd580, #ff80b5, #fffbe7) !important',
                backgroundSize: '400% 400% !important',
                animation: 'btn-roll 12s linear infinite !important',
                color: '#fff !important',
                fontWeight: 700,
                letterSpacing: '0.03em',
                border: 'none',
              }}
              aria-label="Submit guess"
            >
              HELLO
            </button>
            <button
              type="button"
              onClick={() => setMuted(m => !m)}
              className="glass-button p-2 rounded-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-pink"
              aria-label={muted ? 'Unmute sound effects' : 'Mute sound effects'}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
        {/* Sound elements */}
        <audio ref={correctSound} src="/sounds/correct-answer.mp3" preload="auto" />
        <audio ref={incorrectSound} src="/sounds/incorrect-answer.mp3" preload="auto" />
        <audio ref={hintSound} src="/sounds/hint.mp3" preload="auto" />
        {/* Hint Button */}
        <button
          type="button"
          className="bg-gray-200 text-gray-700 flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-300 font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-accent-pink"
          onClick={() => { onHint(); playSound('hint'); }}
          disabled={disabled || hintsUsed >= maxHints}
          aria-label="Get a hint"
        >
          <span>Hint ({hintsUsed}/{maxHints})</span>
        </button>
        {/* Instructions */}
        <div className="text-center text-sm text-wordle-absent">
          <p>Guess the ingredients in the recipe. Correct guesses don't count against your attempts!</p>
          <p className="mt-1">You have {maxHints - hintsUsed} hints remaining.</p>
        </div>
      </form>
    </div>
  );
} 
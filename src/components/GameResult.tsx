'use client'

import React, { useRef, useEffect } from 'react'
import { Trophy, Clock, RotateCcw, Share2 } from 'lucide-react'
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
  const winSound = useRef<HTMLAudioElement | null>(null);
  const loseSound = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (gameStatus === 'won') winSound.current?.play();
    if (gameStatus === 'lost') loseSound.current?.play();
  }, [gameStatus]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const shareResult = () => {
    // Emoji grid: pink square for found, gray for missing
    const grid = recipe.ingredients.map(ingredient =>
      recipe.ingredients.includes(ingredient) ? '🟪' : '⬜'
    ).join('');
    const result = `FOODLE ${gameStatus === 'won' ? '✅' : '❌'} ${attempts}/5\n${recipe.name}\n${grid}\nfoodle-game.com`;
    navigator.clipboard.writeText(result);
    // You could add a toast notification here
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <audio ref={winSound} src="/sounds/you-won.mp3" preload="auto" />
      <audio ref={loseSound} src="/sounds/you-lost.mp3" preload="auto" />
      <div className="text-center space-y-6">
        {/* Result Header */}
        <div className="space-y-2">
          <div className="text-4xl animate-bounce-slow" aria-label={gameStatus === 'won' ? 'Win' : 'Loss'}>
            {gameStatus === 'won' ? '🎉' : '😔'}
          </div>
          <h2 className="text-2xl font-bold text-wordle-text glow-animation">
            {gameStatus === 'won' ? 'Congratulations!' : 'Better luck next time!'}
          </h2>
          <p className="text-wordle-absent">
            {gameStatus === 'won' 
              ? `You found all ingredients in ${attempts} incorrect attempts`
              : `You used ${attempts} attempts but didn't find all ingredients`
            }
          </p>
        </div>
        {/* Recipe Info */}
        <h3 className="text-lg font-semibold text-wordle-text mb-2">
          {recipe.emoji} {recipe.name}
        </h3>
        <div className="flex justify-center space-x-4 text-sm text-wordle-absent">
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4" />
            <span>{timeSpent ? formatTime(timeSpent) : '--:--'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Trophy className="w-4 h-4" />
            <span>{hintsUsed} hints used</span>
          </div>
        </div>
        {/* Emoji grid for sharing */}
        <div className="flex justify-center my-2" aria-label="Result emoji grid">
          {recipe.ingredients.map((ingredient, idx) => (
            <span key={idx} className="text-2xl mx-0.5" aria-hidden="true">
              {gameStatus === 'won' ? '🟪' : '⬜'}
            </span>
          ))}
        </div>
        {/* Ingredients List */}
        <div className="text-left">
          <h4 className="font-semibold text-wordle-text mb-3">Ingredients:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {recipe.ingredients.map((ingredient, index) => (
              <div
                key={index}
                className="glass-panel px-3 py-2 rounded-lg text-wordle-text text-sm font-medium hover:scale-105 transition-all duration-300"
                tabIndex={0}
                aria-label={ingredient}
              >
                {ingredient}
              </div>
            ))}
          </div>
        </div>
        {/* Action Buttons */}
        <button
          onClick={onRestart}
          className="glass-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 text-wordle-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent-pink"
          aria-label="Play again"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Play Again</span>
        </button>
        <button
          onClick={shareResult}
          className="glass-button flex items-center justify-center space-x-2 px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 text-wordle-text font-semibold focus:outline-none focus:ring-2 focus:ring-accent-pink"
          aria-label="Share result"
        >
          <Share2 className="w-4 h-4" />
          <span>Share Result</span>
        </button>
        {/* Stats Summary */}
        <div className="glass-panel inline-block px-4 py-2 rounded-lg">
          <p className="text-sm text-wordle-absent">Next recipe in 24 hours</p>
        </div>
      </div>
    </div>
  );
} 
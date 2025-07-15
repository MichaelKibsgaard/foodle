'use client'

import React from 'react'
import { X, Trophy, Target, Clock, TrendingUp } from 'lucide-react'

interface StatisticsModalProps {
  onClose: () => void
  gameStatus: 'playing' | 'won' | 'lost'
  attempts: number
  maxAttempts: number
  hintsUsed: number
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  onClose,
  gameStatus,
  attempts,
  maxAttempts,
  hintsUsed,
}) => {
  // Mock statistics data - in a real app, this would come from localStorage or a database
  const stats = {
    gamesPlayed: 42,
    gamesWon: 38,
    currentStreak: 5,
    bestStreak: 12,
    winRate: Math.round((38 / 42) * 100),
    averageAttempts: 3.2,
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-wordle-text glow-animation">Statistics</h2>
          <button
            onClick={onClose}
            className="glass-button p-1 rounded-lg hover:scale-105 transition-all duration-300"
          >
            <X className="w-5 h-5 text-wordle-text" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Current Game Status */}
          {gameStatus !== 'playing' && (
            <div className="glass-panel text-center p-4 rounded-lg">
              <div className="text-lg font-semibold text-wordle-text">
                {gameStatus === 'won' ? '🎉 You Won!' : '😔 Game Over'}
              </div>
              <div className="text-sm text-wordle-absent mt-1">
                {gameStatus === 'won' 
                  ? `Completed in ${attempts} incorrect attempts`
                  : `Used ${attempts} attempts`
                }
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel text-center p-4 rounded-lg hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold text-wordle-text">{stats.gamesPlayed}</div>
              <div className="text-sm text-wordle-absent">Games Played</div>
            </div>
            
            <div className="glass-panel text-center p-4 rounded-lg hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold text-wordle-text">{stats.winRate}%</div>
              <div className="text-sm text-wordle-absent">Win Rate</div>
            </div>
            
            <div className="glass-panel text-center p-4 rounded-lg hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold text-wordle-text">{stats.currentStreak}</div>
              <div className="text-sm text-wordle-absent">Current Streak</div>
            </div>
            
            <div className="glass-panel text-center p-4 rounded-lg hover:scale-105 transition-all duration-300">
              <div className="text-2xl font-bold text-wordle-text">{stats.bestStreak}</div>
              <div className="text-sm text-wordle-absent">Best Streak</div>
            </div>
          </div>

          {/* Average Performance */}
          <div className="glass-panel text-center p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Target className="w-5 h-5 text-wordle-text" />
              <span className="text-lg font-semibold text-wordle-text">Average Performance</span>
            </div>
            <div className="text-2xl font-bold text-wordle-text">{stats.averageAttempts}</div>
            <div className="text-sm text-wordle-absent">incorrect attempts per game</div>
          </div>

          {/* Share Button */}
          <button className="glass-button w-full px-4 py-2 rounded-lg hover:scale-105 transition-all duration-300 text-wordle-text font-semibold">
            Share Results
          </button>
        </div>
      </div>
    </div>
  )
} 
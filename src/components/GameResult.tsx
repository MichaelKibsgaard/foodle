'use client'

import React, { useRef, useEffect } from 'react'
import { Trophy, Clock, RotateCcw, Share2 } from 'lucide-react'
import { Recipe } from '@/types/game'
import jsPDF from 'jspdf';

interface GameResultProps {
  gameStatus: 'won' | 'lost'
  recipe: Recipe
  attempts: number
  hintsUsed: number
  onRestart: () => void
  timeSpent?: number
  guessedWords: string[]
}

export const GameResult: React.FC<GameResultProps> = ({
  gameStatus,
  recipe,
  attempts,
  hintsUsed,
  onRestart,
  timeSpent,
  guessedWords,
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
          {/* Guessed Words List */}
          <div className="mt-6">
            <h4 className="font-semibold text-wordle-text mb-2">Your Guesses:</h4>
            <div className="flex flex-wrap gap-2">
              {guessedWords.length === 0 ? (
                <span className="text-gray-400">No guesses made.</span>
              ) : (
                guessedWords.map((word, idx) => {
                  const isCorrect = recipe.ingredients.map(i => i.toLowerCase()).includes(word.toLowerCase());
                  return (
                    <span
                      key={idx}
                      className={`px-3 py-1 rounded-full text-sm font-semibold border-2 ${isCorrect ? 'bg-green-200 text-green-800 border-green-400' : 'bg-red-100 text-red-600 border-red-300'}`}
                    >
                      {word}
                    </span>
                  );
                })
              )}
            </div>
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
        <button
          className="mt-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition"
          onClick={async () => {
            try {
              const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
              const pageWidth = doc.internal.pageSize.getWidth();
              const pageHeight = doc.internal.pageSize.getHeight();
              let y = 36;
              // Title
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(22);
              doc.setTextColor(34,197,94);
              doc.text(recipe.name || 'Recipe', pageWidth / 2, y, { align: 'center' });
              y += 10;
              // Ingredients/Instructions
              const sectionStartY = y + 10;
              const sectionHeight = pageHeight - sectionStartY - 48;
              doc.setFillColor(245, 255, 245);
              doc.rect(24, sectionStartY, (pageWidth / 2) - 32, sectionHeight, 'F');
              doc.rect(pageWidth / 2 + 8, sectionStartY, (pageWidth / 2) - 32, sectionHeight, 'F');
              // Ingredients (left)
              let ingY = sectionStartY + 20;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              doc.setTextColor(34,197,94);
              doc.text('Ingredients', 36, ingY);
              ingY += 14;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.setTextColor(60,60,60);
              recipe.ingredients.forEach((ing: string) => {
                doc.text(`- ${ing}`, 40, ingY);
                ingY += 12;
              });
              // Instructions (right) - not available, so show guesses
              let instrY = sectionStartY + 20;
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              doc.setTextColor(34,197,94);
              doc.text('Your Guesses', pageWidth / 2 + 20, instrY);
              instrY += 14;
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.setTextColor(60,60,60);
              guessedWords.forEach((word: string) => {
                doc.text(word, pageWidth / 2 + 24, instrY);
                instrY += 12;
              });
              // Foodle logo/text bottom right
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(10);
              doc.setTextColor(180,180,180);
              doc.text('Foodle', pageWidth - 40, pageHeight - 24);
              doc.save(`${recipe.name || 'recipe'}.pdf`);
            } catch (err) {
              alert('Export to PDF failed. See console for details.');
              console.error('Export to PDF error:', err);
            }
          }}
        >
          Export to PDF
        </button>
      </div>
    </div>
  );
} 
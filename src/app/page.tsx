'use client'

import React from 'react'
import { Header } from '@/components/Header'
import { RecipeDisplay } from '@/components/RecipeDisplay'
import { IngredientGrid } from '@/components/IngredientGrid'
import { GameInput } from '@/components/GameInput'
import { GameResult } from '@/components/GameResult'
import { useGame } from '@/hooks/useGame'

export default function Home() {
  const {
    gameState,
    hints,
    inputValue,
    setInputValue,
    makeGuess,
    useHint,
    handleSubmit,
    startNewGame,
  } = useGame()

  if (!gameState.currentRecipe) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading game...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen py-8">
      <Header
        gameStatus={gameState.gameStatus}
        attempts={gameState.attempts}
        maxAttempts={gameState.maxAttempts}
        hintsUsed={gameState.hintsUsed}
        maxHints={gameState.maxHints}
      />

      <RecipeDisplay recipe={gameState.currentRecipe} />

      <IngredientGrid
        recipe={gameState.currentRecipe}
        guessedIngredients={gameState.guessedIngredients}
        correctIngredients={gameState.correctIngredients}
      />

      {gameState.gameStatus === 'playing' && (
        <GameInput
          value={inputValue}
          onChange={setInputValue}
          onSubmit={handleSubmit}
          onHint={useHint}
          disabled={false}
          hintsUsed={gameState.hintsUsed}
          maxHints={gameState.maxHints}
          gameStatus={gameState.gameStatus}
        />
      )}

      {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && (
        <GameResult
          gameStatus={gameState.gameStatus}
          recipe={gameState.currentRecipe}
          attempts={gameState.attempts}
          hintsUsed={gameState.hintsUsed}
          onRestart={startNewGame}
          timeSpent={gameState.endTime ? gameState.endTime - gameState.startTime : undefined}
        />
      )}

      {/* Hint Display */}
      {hints.some(hint => hint.revealed) && (
        <div className="w-full max-w-4xl mx-auto p-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-center">
              💡 Hints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hints
                .filter(hint => hint.revealed)
                .map((hint, index) => (
                  <div
                    key={index}
                    className="hint-button rounded-xl p-4 text-center"
                  >
                    <div className="font-medium capitalize">{hint.ingredient}</div>
                    <div className="text-sm opacity-75">
                      {hint.type === 'letter_count' && `${hint.ingredient.length} letters`}
                      {hint.type === 'first_letter' && `Starts with "${hint.ingredient[0]}"`}
                      {hint.type === 'full_ingredient' && 'Full ingredient revealed'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </main>
  )
} 
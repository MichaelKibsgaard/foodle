'use client'

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { IngredientGrid } from '@/components/IngredientGrid';
import { GameInput } from '@/components/GameInput';
import { GameResult } from '@/components/GameResult';
import { useGame } from '@/hooks/useGame';
import { AuthModal } from '@/components/AuthModal';

const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="modal-content max-w-lg mx-auto text-center">
      <h2 className="text-2xl font-bold mb-4 text-vibrant-pink">How to Play Foodle</h2>
      <ol className="text-lg text-vibrant-deep space-y-3 mb-6 text-left">
        <li><b>1.</b> Guess the ingredients in the recipe. Each ingredient is hidden as dashes (e.g. <span className='inline-block font-mono'>_ _ _ _</span>).</li>
        <li><b>2.</b> Type your guess and press Enter. Correct guesses fill in the word and turn <span className='text-vibrant-pink font-bold'>pink</span>!</li>
        <li><b>3.</b> You have a limited number of attempts. Only incorrect guesses count against you.</li>
        <li><b>4.</b> Use hints if you get stuck!</li>
      </ol>
      <button className="btn-primary w-full" onClick={onClose}>Start Playing</button>
    </div>
  </div>
);

export default function Home() {
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showAuth, setShowAuth] = useState(false);

  // Game logic
  const {
    gameState,
    hints,
    inputValue,
    setInputValue,
    makeGuess,
    useHint,
    handleSubmit,
    startNewGame,
  } = useGame();

  // Landing page
  if (!showGame) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-main-gradient">
        <div className="flex flex-col items-center space-y-6 p-8 rounded-3xl shadow-2xl bg-glass-card">
          <div className="text-6xl mb-2">🍲</div>
          <h1 className="text-5xl font-extrabold text-vibrant-pink mb-2 tracking-tight">Foodle</h1>
          <div className="text-xl text-vibrant-deep mb-4">Get 5 chances to guess the ingredients in a recipe.</div>
          <div className="flex space-x-4 mb-4">
            <button className="btn-outline px-6 py-2" onClick={() => alert('Subscribe coming soon!')}>Subscribe</button>
            <button className="btn-outline px-6 py-2" onClick={() => setShowAuth(true)}>Log in</button>
            <button className="btn-primary px-8 py-2" onClick={() => setShowHowToPlay(true)}>Play</button>
          </div>
          <div className="text-sm text-vibrant-deep mt-2">{new Date().toLocaleDateString()}<br/>No. {1487}<br/>Edited by Foodle Team</div>
        </div>
        {showHowToPlay && (
          <HowToPlayModal onClose={() => { setShowHowToPlay(false); setShowGame(true); }} />
        )}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </main>
    );
  }

  // Main game UI
  return (
    <main className="min-h-screen py-8 bg-main-gradient">
      <Header
        gameStatus={gameState.gameStatus}
        attempts={gameState.attempts}
        maxAttempts={gameState.maxAttempts}
        hintsUsed={gameState.hintsUsed}
        maxHints={gameState.maxHints}
      />
      <div className="w-full max-w-4xl mx-auto px-4">
        {gameState.currentRecipe && (
          <IngredientGrid
            recipe={gameState.currentRecipe}
            guessedIngredients={gameState.guessedIngredients}
            correctIngredients={gameState.correctIngredients}
          />
        )}
      </div>
      {gameState.gameStatus === 'playing' && gameState.currentRecipe && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-8">
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
        </div>
      )}
      {(gameState.gameStatus === 'won' || gameState.gameStatus === 'lost') && gameState.currentRecipe && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-8">
          <GameResult
            gameStatus={gameState.gameStatus}
            recipe={gameState.currentRecipe}
            attempts={gameState.attempts}
            hintsUsed={gameState.hintsUsed}
            onRestart={startNewGame}
            timeSpent={gameState.endTime ? gameState.endTime - gameState.startTime : undefined}
          />
        </div>
      )}
      {/* Hint Display */}
      {hints.some(hint => hint.revealed) && (
        <div className="w-full max-w-4xl mx-auto px-4 mt-8">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-center text-vibrant-pink">
              💡 Hints
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hints
                .filter(hint => hint.revealed)
                .map((hint, index) => (
                  <div
                    key={index}
                    className="glass-panel p-4 rounded-lg text-center hover:scale-105 transition-all duration-300"
                  >
                    <div className="font-medium capitalize text-vibrant-deep">{hint.ingredient}</div>
                    <div className="text-sm text-vibrant-pink mt-1">
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
  );
} 
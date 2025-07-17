'use client'

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { IngredientGrid } from '@/components/IngredientGrid';
import { GameInput } from '@/components/GameInput';
import { GameResult } from '@/components/GameResult';
import { useGame } from '@/hooks/useGame';
import { AuthModal } from '@/components/AuthModal';
import { supabase } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { getNextUnusedRecipes, markRecipeAsUsedToday } from '@/lib/gameData';
import { GuessHistory } from '@/components/GuessHistory';

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

function getTimeToNextUTCMidnight() {
  const now = new Date();
  const next = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  return next.getTime() - now.getTime();
}

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export default function Home() {
  // Timer for next 8am AEST (move to top, before any returns)
  function getTimeToNext8amAEST() {
    const now = new Date();
    // AEST is UTC+10
    const nowAEST = new Date(now.getTime() + 10 * 60 * 60 * 1000);
    let next8am = new Date(nowAEST);
    next8am.setHours(8, 0, 0, 0);
    if (nowAEST.getHours() >= 8) {
      next8am.setDate(next8am.getDate() + 1);
    }
    // Convert back to UTC
    const next8amUTC = new Date(next8am.getTime() - 10 * 60 * 60 * 1000);
    return next8amUTC.getTime() - now.getTime();
  }
  function formatAestTime(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  const [aestTimeLeft, setAestTimeLeft] = useState(getTimeToNext8amAEST());
  useEffect(() => {
    const interval = setInterval(() => {
      setAestTimeLeft(getTimeToNext8amAEST());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

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
    loadingRecipe,
    startPracticeGame,
  } = useGame();

  // State for hint pop-up
  const [hintPopup, setHintPopup] = useState<string | null>(null);
  // State for ad modal and extra hint
  const [showAdModal, setShowAdModal] = useState(false);
  const [extraHintUnlocked, setExtraHintUnlocked] = useState(false);
  const [maxHints, setMaxHints] = useState(gameState.maxHints);
  // Sync maxHints with gameState unless extra hint is unlocked
  useEffect(() => {
    if (!extraHintUnlocked) setMaxHints(gameState.maxHints);
  }, [gameState.maxHints, extraHintUnlocked]);

  // Custom hint handler to show popup
  const handleHint = () => {
    // Find the next unrevealed hint
    const unrevealed = hints.find(h => !h.revealed);
    if (unrevealed) {
      setHintPopup(`Hint: The first letter of one ingredient is '${unrevealed.ingredient[0].toUpperCase()}'`);
      setTimeout(() => setHintPopup(null), 3000);
    }
    useHint();
  };

  // Handler for watching ad
  const handleWatchAd = () => {
    setShowAdModal(true);
    setTimeout(() => {
      setShowAdModal(false);
      setExtraHintUnlocked(true);
      setMaxHints(h => h + 1);
    }, 3000);
  };

  // State for main box shake animation
  const [shakeBox, setShakeBox] = useState(false);

  // Animation state for last guess
  const [lastGuessedIngredient, setLastGuessedIngredient] = useState<string | undefined>(undefined);
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | undefined>(undefined);
  // Wrap makeGuess to track last guess
  const handleGuess = (ingredient: string) => {
    if (!gameState.currentRecipe) return;
    const normalizedGuess = ingredient.toLowerCase().trim();
    const normalizedIngredients = gameState.currentRecipe.ingredients.map(i => i.toLowerCase());
    setLastGuessedIngredient(normalizedGuess);
    const isCorrect = normalizedIngredients.includes(normalizedGuess);
    setLastGuessCorrect(isCorrect);
    if (!isCorrect) {
      setShakeBox(true);
      setTimeout(() => setShakeBox(false), 400);
    }
    makeGuess(ingredient);
    setTimeout(() => {
      setLastGuessedIngredient(undefined);
      setLastGuessCorrect(undefined);
    }, 500);
  };

  // Timer for next game
  const [timeLeft, setTimeLeft] = useState(getTimeToNextUTCMidnight());
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeToNextUTCMidnight());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const [nextRecipes, setNextRecipes] = useState<any[]>([]);
  // Fetch next 3 unused recipes for admin
  useEffect(() => {
    if (user) {
      getNextUnusedRecipes().then(setNextRecipes);
    }
  }, [user]);
  // Handler to mark a recipe as used for today
  const handleSetTodayRecipe = async (id: string) => {
    await markRecipeAsUsedToday(id);
    await getNextUnusedRecipes().then(setNextRecipes);
    // Reload the game (fetch today's recipe)
    startNewGame();
  };

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
            { !user && (
              <button className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-xl px-5 py-2 flex items-center gap-2 shadow transition-all duration-150 hover:scale-105 hover:from-pink-500 hover:to-yellow-400" onClick={() => setShowAuth(true)}>
                <span className="material-icons" style={{ fontSize: '20px' }}>login</span>
                Log In
              </button>
            )}
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
  if (loadingRecipe) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-wordle-background">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent-pink mx-auto mb-4"></div>
          <p className="mt-4 text-wordle-absent">Loading today&apos;s recipe...</p>
        </div>
      </main>
    );
  }

  // Main UI
  return (
    <main className="min-h-screen bg-wordle-background flex flex-col">
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-6 py-4 w-full max-w-5xl mx-auto relative bg-white/60 backdrop-blur-md shadow-md rounded-b-2xl">
        {/* Logo */}
        <div className="text-2xl font-extrabold tracking-widest text-gray-800 drop-shadow-sm">FOODLE</div>
        {/* Timer Centered Absolutely */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gray-200/80 text-gray-700 rounded-2xl px-8 py-2 font-mono text-lg font-semibold shadow transition-all">
            Next game in {formatAestTime(aestTimeLeft)} (8:00am AEST)
          </div>
        </div>
        {/* Right: Book, Graph, Sign In */}
        <div className="flex items-center space-x-4">
          <button className="bg-gray-100 rounded-full p-2 shadow hover:bg-gray-200 transition-all duration-150 hover:scale-110" title="Cookbook">
            <span role="img" aria-label="book">📖</span>
          </button>
          <button className="bg-gray-100 rounded-full p-2 shadow hover:bg-gray-200 transition-all duration-150 hover:scale-110" title="Statistics">
            <span role="img" aria-label="graph">📊</span>
          </button>
          { !user && (
            <button className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-lg px-3 py-1.5 flex items-center gap-1 shadow transition-all duration-150 hover:scale-105 hover:from-pink-500 hover:to-yellow-400 text-sm" onClick={() => setShowAuth(true)}>
              <span className="material-icons" style={{ fontSize: '16px' }}>login</span>
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Main Centered Box */}
      <div className="flex justify-center w-full max-w-5xl mx-auto mt-4">
        {/* Main Game Box */}
        <div className={`bg-white/80 rounded-3xl shadow-2xl p-6 w-full max-w-lg flex flex-col items-center border border-white/60 backdrop-blur-md transition-all duration-150 ${shakeBox ? 'animate-shake' : ''}`}>
          {/* Food of the day name or fallback */}
          <div className="flex items-center justify-center gap-3 text-4xl font-extrabold text-gray-900 mb-2 text-center tracking-tight drop-shadow-md">
            {gameState.currentRecipe?.emoji && <span>{gameState.currentRecipe.emoji}</span>}
            <span>{gameState.currentRecipe?.name || 'No food of the day set!'}</span>
          </div>
          {/* Cuisine and Difficulty */}
          <div className="flex justify-center items-center space-x-4 mb-5">
            <div className="bg-gray-100 rounded-lg px-4 py-1 text-gray-700 text-base font-semibold shadow-sm">
              {gameState.currentRecipe?.category || 'Cuisine'}
            </div>
            <div className="bg-gray-100 rounded-lg px-4 py-1 text-gray-700 text-base font-semibold flex items-center shadow-sm">
              {gameState.currentRecipe?.difficulty
                ? gameState.currentRecipe.difficulty.charAt(0).toUpperCase() + gameState.currentRecipe.difficulty.slice(1)
                : 'Difficulty'}
            </div>
          </div>
          {/* Photo Placeholder */}
          <div className="bg-gray-300 w-44 h-32 rounded-2xl mb-6 flex items-center justify-center text-gray-400 text-xl border-2 border-gray-200 shadow-inner">
            Photo
          </div>
          {/* Ingredient Boxes */}
          {gameState.currentRecipe && (
            <div className="w-full mb-4">
              <IngredientGrid
                recipe={gameState.currentRecipe}
                guessedIngredients={gameState.guessedIngredients}
                correctIngredients={gameState.correctIngredients}
                onHint={
                  gameState.hintsUsed >= maxHints && !extraHintUnlocked
                    ? handleWatchAd
                    : handleHint
                }
                lastGuessedIngredient={lastGuessedIngredient}
                lastGuessCorrect={lastGuessCorrect}
              />
            </div>
          )}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex justify-center items-center space-x-6 bg-white/60 backdrop-blur-md rounded-2xl px-8 py-4 mt-4 shadow-lg border border-white/50 mx-auto">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Guesses Remaining</span>
          <span className="font-bold text-lg text-gray-800">{gameState.maxAttempts - gameState.attempts}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Hints Used</span>
          <span className="font-bold text-lg text-gray-800">{gameState.hintsUsed} / {maxHints}</span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-500">Ingredients Remaining</span>
          <span className="font-bold text-lg text-gray-800">{gameState.currentRecipe ? gameState.currentRecipe.ingredients.length - gameState.correctIngredients.length : '-'}</span>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex justify-center mt-4">
        <form onSubmit={e => { e.preventDefault(); if (inputValue.trim()) handleGuess(inputValue); }} className="flex items-center space-x-2 max-w-lg mx-auto">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-gray-800 focus:outline-none focus:ring-4 focus:ring-accent-pink/30 transition-all duration-150 shadow"
            placeholder="Type an ingredient..."
            disabled={gameState.gameStatus !== 'playing'}
          />
          <button
            type="submit"
            className="btn-primary px-7 py-3 rounded-xl transition-all duration-150 hover:scale-105"
            disabled={gameState.gameStatus !== 'playing'}
          >
            Submit
          </button>
        </form>
      </div>

      {/* Admin: Next 3 Recipes */}
      {user && nextRecipes.length > 0 && (
        <div className="w-full max-w-2xl mx-auto mt-4 mb-6 p-4 bg-white/80 rounded-xl shadow flex flex-col gap-2">
          <div className="font-bold text-gray-700 mb-2">Next 3 Unused Recipes</div>
          {nextRecipes.map((recipe) => (
            <div key={recipe.id} className="flex items-center justify-between p-2 bg-gray-100 rounded-lg">
              <span className="font-semibold">{recipe.name}</span>
              <button className="bg-blue-500 text-white rounded px-3 py-1 text-sm font-bold hover:bg-blue-600 transition" onClick={() => handleSetTodayRecipe(recipe.id)}>
                Set as Today
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Auth Modal */}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Hint Pop-up */}
      {hintPopup && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 bg-white/90 border border-pink-200 rounded-xl px-6 py-3 shadow-lg text-lg font-semibold text-pink-600 animate-pop">
          {hintPopup}
        </div>
      )}

      {/* Ad Modal */}
      {showAdModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center max-w-xs">
            <div className="text-3xl mb-4">🎬</div>
            <div className="text-lg font-semibold mb-2">Watching ad...</div>
            <div className="text-sm text-gray-500">Your extra hint will be unlocked in a moment.</div>
          </div>
        </div>
      )}

      {/* Guess History floating right (desktop only) */}
      <div className="fixed top-1/4 right-8 z-40 hidden md:block">
        <GuessHistory
          guesses={gameState.guessedIngredients}
          correctIngredients={gameState.correctIngredients}
        />
      </div>

      {/* Newsletter & Submit Box (bottom left, desktop only) */}
      <div className="fixed bottom-8 left-8 z-40 hidden md:flex flex-col w-80 bg-gradient-to-br from-white/80 via-pink-50/80 to-yellow-50/80 backdrop-blur-md rounded-2xl shadow-2xl border border-pink-100/60 overflow-hidden">
        {/* Top: Newsletter */}
        <div className="p-4 flex flex-col items-start">
          <div className="font-extrabold text-base text-gray-700 mb-1">Stay up to date</div>
          <span className="text-gray-500 text-xs mb-2">with projects</span>
          <form className="w-full flex flex-row gap-2 items-center">
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-accent-pink/30 placeholder-gray-400 text-xs"
              disabled
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-lg px-4 py-2 shadow transition-all duration-150 disabled:opacity-60 text-sm transform hover:scale-105 hover:shadow-lg active:scale-95 hover:animate-pop active:animate-pop shine-btn"
              disabled
            >
              Submit
            </button>
          </form>
        </div>
        {/* Divider */}
        <div className="h-px bg-gray-300 my-1 mx-auto" style={{ width: 'calc(100% - 8px)' }} />
        {/* Bottom: Submit Recipe */}
        <div className="p-4 flex flex-col items-start">
          <div className="font-extrabold text-base text-gray-700 mb-1">Submit your own recipes</div>
          <button
            className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-lg px-3 py-1 mt-1 shadow transition-all duration-150 disabled:opacity-60 text-sm transform hover:scale-105 hover:shadow-lg active:scale-95 hover:animate-pop active:animate-pop shine-btn"
            disabled
          >
            Submit Recipe
          </button>
        </div>
      </div>
    </main>
  );
} 
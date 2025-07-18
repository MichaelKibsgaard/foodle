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
import Confetti from 'react-confetti';
import { CookbookModal } from '@/components/CookbookModal';
import { StatisticsModal } from '@/components/StatisticsModal';

// Modern, clean modal for How To Play
const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 text-center border border-pink-100 animate-fade-in">
      <h2 className="text-3xl font-extrabold mb-4 text-vibrant-pink tracking-tight">How to Play Foodle</h2>
      <ol className="text-lg text-gray-700 dark:text-gray-200 space-y-3 mb-6 text-left font-medium">
        <li><b>1.</b> Guess the ingredients in the recipe. Each ingredient is hidden as dashes (e.g. <span className='inline-block font-mono'>_ _ _ _</span>).</li>
        <li><b>2.</b> Type your guess and press Enter. Correct guesses fill in the word and turn <span className='text-vibrant-pink font-bold'>pink</span>!</li>
        <li><b>3.</b> You have a limited number of attempts. Only incorrect guesses count against you.</li>
        <li><b>4.</b> Use hints if you get stuck!</li>
      </ol>
      <button className="btn-primary w-full py-3 text-lg rounded-xl" onClick={onClose}>Start Playing</button>
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
  // Dark mode state and toggle
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Confetti state
  const [showConfetti, setShowConfetti] = useState(false);

  // User and modal state
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showGame, setShowGame] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCookbook, setShowCookbook] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

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

  // Game logic (must come before confetti effect)
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

  // Confetti effect (must be after gameState is defined)
  useEffect(() => {
    if (gameState && gameState.gameStatus === 'won') {
      setShowConfetti(true);
      const timeout = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.gameStatus]);

  // State for hint pop-up and highlighted ingredient
  const [hintPopup, setHintPopup] = useState<string | null>(null);
  const [hintedIngredient, setHintedIngredient] = useState<string | null>(null);
  // State for ad modal and extra hint
  const [showAdModal, setShowAdModal] = useState(false);
  const [extraHintUnlocked, setExtraHintUnlocked] = useState(false);
  const [maxHints, setMaxHints] = useState(gameState.maxHints);
  // Sync maxHints with gameState unless extra hint is unlocked
  useEffect(() => {
    if (!extraHintUnlocked) setMaxHints(gameState.maxHints);
  }, [gameState.maxHints, extraHintUnlocked]);

  // Track hint progress for each ingredient
  const [hintProgress, setHintProgress] = useState<{ [ingredient: string]: number }>({});

  // Custom hint handler to show popup and highlight ingredient
  const handleHint = () => {
    // Find the next unrevealed and unguessed ingredient
    const unrevealed = hints.find(h => !h.revealed && !gameState.correctIngredients.includes(h.ingredient));
    if (unrevealed) {
      // Determine how many letters have already been hinted for this ingredient
      const progress = hintProgress[unrevealed.ingredient] || 0;
      const nextProgress = Math.min(progress + 1, unrevealed.ingredient.length);
      setHintProgress(prev => ({ ...prev, [unrevealed.ingredient]: nextProgress }));
      const prefix = unrevealed.ingredient.slice(0, nextProgress).toUpperCase();
      setHintPopup(`Hint: The first ${nextProgress} letter${nextProgress > 1 ? 's' : ''} of one ingredient: '${prefix}'`);
      setHintedIngredient(unrevealed.ingredient);
      setTimeout(() => setHintPopup(null), 3000);
      setTimeout(() => setHintedIngredient(null), 3500);
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
  // Add audio ref for correct sound
  const correctSoundRef = React.useRef<HTMLAudioElement | null>(null);
  // Wrap makeGuess to track last guess
  const handleGuess = (ingredient: string) => {
    if (!gameState.currentRecipe) return;
    const normalizedGuess = ingredient.toLowerCase().trim();
    const normalizedIngredients = gameState.currentRecipe.ingredients.map(i => i.toLowerCase());
    setLastGuessedIngredient(normalizedGuess);
    const isCorrect = normalizedIngredients.includes(normalizedGuess);
    setLastGuessCorrect(isCorrect);
    if (isCorrect) {
      correctSoundRef.current?.play();
    }
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
  if (!gameState) { // Changed from showGame to gameState
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-pink-50 via-yellow-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        <div className="flex flex-col items-center space-y-8 p-10 rounded-3xl shadow-2xl bg-white/80 dark:bg-gray-900/80 border border-pink-100/60 max-w-xl w-full animate-fade-in">
          <div className="text-7xl mb-2">🍲</div>
          <h1 className="text-6xl font-extrabold text-vibrant-pink mb-2 tracking-tight drop-shadow-lg">Foodle</h1>
          <div className="text-2xl text-gray-700 dark:text-gray-200 mb-6 font-medium">Guess the ingredients in today’s recipe!</div>
          <div className="flex space-x-4 mb-4">
            <button className="btn-outline px-8 py-3 text-lg rounded-xl" onClick={() => alert('Subscribe coming soon!')}>Subscribe</button>
            { !user && (
              <button className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-xl px-6 py-3 flex items-center gap-2 shadow transition-all duration-150 hover:scale-105 hover:from-pink-500 hover:to-yellow-400 text-lg" onClick={() => setShowAuth(true)}>
                <span className="material-icons" style={{ fontSize: '22px' }}>login</span>
                Log In
              </button>
            )}
            <button className="btn-primary px-10 py-3 text-lg rounded-xl" onClick={() => setShowHowToPlay(true)}>Play</button>
          </div>
          <div className="text-base text-gray-500 mt-2">{new Date().toLocaleDateString()}<br/>No. 1487<br/>Edited by Foodle Team</div>
        </div>
        {showHowToPlay && (
          <HowToPlayModal onClose={() => { setShowHowToPlay(false); }} />
        )}
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </main>
    );
  }

  // Main game UI
  if (loadingRecipe) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 via-yellow-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        <div className="bg-white/80 dark:bg-gray-900/80 rounded-3xl p-10 text-center shadow-2xl border border-pink-100/60 animate-fade-in">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-accent-pink mx-auto mb-6"></div>
          <p className="mt-4 text-gray-400 text-lg font-medium">Loading today&apos;s recipe...</p>
        </div>
      </main>
    );
  }

  // Main UI
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-500">
      {/* Confetti overlay */}
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
          numberOfPieces={250}
          recycle={false}
        />
      )}
      {/* Top Bar */}
      <div className="sticky top-0 z-20 flex items-center justify-between px-4 py-2 w-full max-w-5xl mx-auto relative bg-white/70 dark:bg-gray-900/70 backdrop-blur-md shadow-md rounded-b-2xl border-b border-pink-100/40 animate-fade-in">
        {/* Logo */}
        <div className="text-xl font-extrabold tracking-widest text-gray-800 dark:text-white drop-shadow-sm">FOODLE</div>
        {/* Timer Centered Absolutely */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 rounded-2xl px-6 py-1 font-mono text-base font-semibold shadow transition-all">
            Next game in {formatAestTime(aestTimeLeft)}
          </div>
        </div>
        {/* Right: Book, Graph, Dark Mode, Sign In */}
        <div className="flex items-center space-x-2">
          <button
            className={`rounded-full p-2 shadow transition-all duration-150 hover:scale-110 ${darkMode ? 'bg-gray-800 text-yellow-300' : 'bg-gray-100 text-gray-700'}`}
            title="Toggle dark mode"
            onClick={() => setDarkMode(dm => !dm)}
            aria-label="Toggle dark mode"
          >
            {darkMode ? (
              <span role="img" aria-label="moon" className="text-xl">🌙</span>
            ) : (
              <span role="img" aria-label="sun" className="text-xl">☀️</span>
            )}
          </button>
          <button
            className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 hover:scale-110"
            title="Cookbook"
            onClick={() => setShowCookbook(true)}
            aria-label="Open cookbook"
          >
            <span role="img" aria-label="book">📖</span>
          </button>
          <button
            className="bg-gray-100 dark:bg-gray-800 rounded-full p-2 shadow hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-150 hover:scale-110"
            title="Statistics"
            onClick={() => setShowStats(true)}
            aria-label="Open statistics"
          >
            <span role="img" aria-label="graph">📊</span>
          </button>
          { !user && (
            <button className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-lg px-4 py-2 flex items-center gap-1 shadow transition-all duration-150 hover:scale-105 hover:from-pink-500 hover:to-yellow-400 text-base" onClick={() => setShowAuth(true)}>
              <span className="material-icons" style={{ fontSize: '18px' }}>login</span>
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Main Centered Box */}
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto mt-8">
        {/* Game Over Message */}
        {['won', 'lost'].includes(gameState.gameStatus) && (
          <div className={`mb-4 text-2xl font-bold ${gameState.gameStatus === 'won' ? 'text-green-600' : 'text-red-500'}`}>
            Game Over! {gameState.gameStatus === 'won' ? 'You won!' : 'Better luck next time!'}
          </div>
        )}
        {/* Main Game Box */}
        <div className={`bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-6 w-full max-w-xl flex flex-col items-center border border-pink-100/60 backdrop-blur-md transition-all duration-150 ${shakeBox ? 'animate-shake' : ''} animate-fade-in`}>
          {/* Food of the day name or fallback */}
          <div className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-900 dark:text-white mb-8 mt-6 text-center tracking-tight drop-shadow-md">
            {gameState.currentRecipe?.emoji && <span>{gameState.currentRecipe.emoji}</span>}
            <span>{gameState.currentRecipe?.name || 'No food of the day set!'}</span>
          </div>
          {/* Photo Placeholder */}
          <div className="bg-gray-200 dark:bg-gray-800 w-48 h-36 rounded-2xl mb-14 flex items-center justify-center text-gray-400 text-2xl border-2 border-gray-100 dark:border-gray-800 shadow-inner">
            Photo
          </div>
          {/* Ingredient Boxes */}
          {gameState.currentRecipe && (
            <div className="w-full mb-6">
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
                hintedIngredient={hintedIngredient ?? undefined}
              />
            </div>
          )}
        </div>

        {/* Stats Bar with Hint Button */}
        <div className="flex flex-row justify-between items-center gap-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-xl px-4 py-2 mt-4 shadow border border-pink-100/30 mx-auto w-full max-w-xl animate-fade-in">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Guesses Left</span>
            <span className="font-bold text-base text-gray-800 dark:text-white">{gameState.maxAttempts - gameState.attempts}</span>
          </div>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Hints Used</span>
            <span className="font-bold text-base text-gray-800 dark:text-white">{gameState.hintsUsed} / {maxHints}</span>
          </div>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Ingredients Left</span>
            <span className="font-bold text-base text-gray-800 dark:text-white">{gameState.currentRecipe ? gameState.currentRecipe.ingredients.length - gameState.correctIngredients.length : '-'}</span>
          </div>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <button
              type="button"
              className="btn-outline px-3 py-1 rounded-xl transition-all duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-accent-pink text-sm w-full"
              onClick={typeof handleHint === 'function' ? handleHint : undefined}
              aria-label="Get a hint"
              disabled={gameState.hintsUsed >= maxHints && !extraHintUnlocked}
            >
              Hint
            </button>
          </div>
        </div>
      </div>

      {/* Input Area */}
      <div className="flex justify-center mt-8">
        <form onSubmit={e => { e.preventDefault(); if (inputValue.trim()) handleGuess(inputValue); }} className="flex items-center space-x-4 max-w-xl mx-auto w-full animate-fade-in">
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            className="flex-1 rounded-xl border border-gray-300 dark:border-gray-700 px-6 py-4 text-gray-800 dark:text-white bg-white/80 dark:bg-gray-900/80 focus:outline-none focus:ring-4 focus:ring-accent-pink/30 transition-all duration-150 shadow text-lg"
            placeholder="Type an ingredient..."
            disabled={gameState.gameStatus !== 'playing'}
          />
          <button
            type="submit"
            className="btn-primary px-10 py-4 rounded-xl text-lg transition-all duration-150 hover:scale-105"
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
      {showCookbook && <CookbookModal onClose={() => setShowCookbook(false)} />}
      {showStats && <StatisticsModal onClose={() => setShowStats(false)} gameStatus={gameState.gameStatus} attempts={gameState.attempts} maxAttempts={gameState.maxAttempts} hintsUsed={gameState.hintsUsed} />}

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
          <div className="font-extrabold text-base text-gray-700 mb-1">Stay up to date with our latest projects:</div>
          <span className="text-gray-500 text-xs mb-2"></span>
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
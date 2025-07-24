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
import { getNextUnusedRecipes, markRecipeAsUsedToday, getTimeToNext8amAEST } from '@/lib/gameData';
import { GuessHistory } from '@/components/GuessHistory';
import Confetti from 'react-confetti';
import { CookbookModal } from '@/components/CookbookModal';
import { StatisticsModal } from '@/components/StatisticsModal';
import { RecipeSubmitModal } from '@/components/RecipeSubmitModal';
import { jsPDF } from 'jspdf';

// Modern, clean modal for How To Play
const HowToPlayModal: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
    <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-lg w-full mx-4 text-center border border-gray-200 dark:border-gray-800 animate-fade-in">
      <h2 className="text-3xl font-extrabold mb-4 text-green-600 dark:text-green-400 tracking-tight" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>How to Play Foodle</h2>
      <ol className="text-lg text-gray-700 dark:text-gray-200 space-y-3 mb-6 text-left font-medium">
        <li><b>1.</b> Guess the ingredients in the recipe.</li>
        <li><b>2.</b> Type your guess and press Enter. Correct guesses fill in the word and turn <span className='text-green-600 dark:text-green-400 font-bold'>green</span>!</li>
        <li><b>3.</b> You have a limited number of attempts. Only incorrect guesses count against you.</li>
        <li><b>4.</b> Use hints if you get stuck!</li>
      </ol>
      <button className="w-full py-3 text-lg rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold transition" style={{ boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)' }} onClick={onClose}>Start Playing</button>
    </div>
  </div>
);

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
  // All hooks at the top (no hooks after any return)
  const [showConfetti, setShowConfetti] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(() => {
    // Show instructions on first load, but only once per session
    if (typeof window !== 'undefined') {
      return !window.sessionStorage.getItem('foodle-how-to-play-shown');
    }
    return true;
  });
  const [showGame, setShowGame] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showCookbook, setShowCookbook] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [retroMode, setRetroMode] = useState(false);
  
  // Apply retro mode to body
  useEffect(() => {
    if (retroMode) {
      document.body.classList.add('retro-mode');
    } else {
      document.body.classList.remove('retro-mode');
    }
  }, [retroMode]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // (Removed local getTimeToNext8amAEST)
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

  useEffect(() => {
    if (gameState && gameState.gameStatus === 'won') {
      setShowConfetti(true);
      console.log('Playing win sound');
      winSoundRef.current?.play().catch(e => console.error('Error playing win sound:', e));
      const timeout = setTimeout(() => setShowConfetti(false), 3500);
      return () => clearTimeout(timeout);
    }
    if (gameState && gameState.gameStatus === 'lost') {
      console.log('Playing lose sound');
      loseSoundRef.current?.play().catch(e => console.error('Error playing lose sound:', e));
    }
  }, [gameState?.gameStatus]);

  // Debug: Log recipe data
  useEffect(() => {
    if (gameState?.currentRecipe) {
      console.log('Current recipe data:', gameState.currentRecipe);
      console.log('Recipe image URL:', gameState.currentRecipe.recipe_image);
    }
  }, [gameState?.currentRecipe]);

  const [hintPopup, setHintPopup] = useState<string | null>(null);
  const [hintedIngredient, setHintedIngredient] = useState<string | null>(null);
  const [showAdModal, setShowAdModal] = useState(false);
  const [extraHintUnlocked, setExtraHintUnlocked] = useState(false);
  const [maxHints, setMaxHints] = useState(gameState.maxHints);
  useEffect(() => {
    if (!extraHintUnlocked) setMaxHints(gameState.maxHints);
  }, [gameState.maxHints, extraHintUnlocked]);
  const [hintProgress, setHintProgress] = useState<{ [ingredient: string]: number }>({});
  const handleHint = () => {
    const unrevealed = hints.find(h => !h.revealed && !gameState.correctIngredients.includes(h.ingredient));
    if (unrevealed) {
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
  const handleWatchAd = () => {
    setShowAdModal(true);
    setTimeout(() => {
      setShowAdModal(false);
      setExtraHintUnlocked(true);
      setMaxHints(h => h + 1);
    }, 3000);
  };
  const [shakeBox, setShakeBox] = useState(false);
  const [lastGuessedIngredient, setLastGuessedIngredient] = useState<string | undefined>(undefined);
  const [lastGuessCorrect, setLastGuessCorrect] = useState<boolean | undefined>(undefined);
  const correctSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const incorrectSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const winSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const loseSoundRef = React.useRef<HTMLAudioElement | null>(null);
  const handleGuess = (ingredient: string) => {
    if (!gameState.currentRecipe) return;
    const normalizedGuess = ingredient.toLowerCase().trim();
    
    // Easter egg: enable retro mode when "retro" is typed
    if (normalizedGuess === 'retro') {
      setRetroMode(true);
      setInputValue('');
      return;
    }
    
    const normalizedIngredients = gameState.currentRecipe.ingredients.map(i => i.toLowerCase());
    setLastGuessedIngredient(normalizedGuess);
    const isCorrect = normalizedIngredients.includes(normalizedGuess);
    setLastGuessCorrect(isCorrect);
    if (isCorrect) {
      console.log('Playing correct sound');
      correctSoundRef.current?.play().catch(e => console.error('Error playing correct sound:', e));
    }
    if (!isCorrect) {
      console.log('Playing incorrect sound');
      incorrectSoundRef.current?.play().catch(e => console.error('Error playing incorrect sound:', e));
      setShakeBox(true);
      setTimeout(() => setShakeBox(false), 400);
    }
    makeGuess(ingredient);
    setTimeout(() => {
      setLastGuessedIngredient(undefined);
      setLastGuessCorrect(undefined);
    }, 500);
  };
  const [timeLeft, setTimeLeft] = useState(getTimeToNext8amAEST());
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeToNext8amAEST());
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const [nextRecipes, setNextRecipes] = useState<any[]>([]);
  useEffect(() => {
    if (user) {
      getNextUnusedRecipes().then(setNextRecipes);
    }
  }, [user]);
  const handleSetTodayRecipe = async (id: string) => {
    await markRecipeAsUsedToday(id);
    await getNextUnusedRecipes().then(setNextRecipes);
    startNewGame();
  };
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterStatus, setNewsletterStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail) return;
    setNewsletterStatus('submitting');
    const { error } = await supabase.from('newsletter_signups').insert([
      { email: newsletterEmail, created_at: new Date().toISOString() },
    ]);
    if (!error) {
      setNewsletterStatus('success');
      setNewsletterEmail('');
    } else {
      setNewsletterStatus('error');
    }
  };
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const handleRecipeSubmit = async (data: any) => {
    const { name, cuisine, difficulty, ingredients, description, instructions, servings, image_url, submitter_name, submitter_email } = data;
    const { error } = await supabase.from('recipes').insert([
      {
        name,
        category: cuisine,
        difficulty: difficulty.toLowerCase(),
        ingredients,
        description,
        instructions,
        servings,
        image_url: image_url || null,
        submitter_name,
        submitter_email,
        created_at: new Date().toISOString(),
      },
    ]);
    if (!error) setSubmitSuccess(true);
  };

  const [showRecipePopup, setShowRecipePopup] = useState(false);

  // Show the popup when the user wins
  useEffect(() => {
    if (gameState && gameState.gameStatus === 'won') {
      setShowRecipePopup(true);
      const timeout = setTimeout(() => setShowRecipePopup(false), 5000);
      return () => clearTimeout(timeout);
    }
  }, [gameState?.gameStatus]);

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

  // Newsletter signup state
  const newsletterStatusUI = newsletterStatus === 'success' ? 'Thank you for subscribing!' : newsletterStatus === 'error' ? 'There was an error. Please try again.' : '';

  // When instructions modal is closed, mark as shown for this session
  const handleCloseHowToPlay = () => {
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('foodle-how-to-play-shown', '1');
    }
    setShowHowToPlay(false);
  };

  // Main UI
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex flex-col transition-colors duration-500">
      {/* Top-right pop-up for full recipe */}
      {showRecipePopup && (
        <div className="fixed top-6 right-6 z-50 px-0 py-0 animate-fade-in">
          <div className="relative bg-white dark:bg-gray-900 border-2 border-green-300 dark:border-green-600 rounded-2xl shadow-xl px-4 py-2 flex flex-col items-center min-w-[160px]"
            style={{ boxShadow: '0 4px 32px 0 rgba(34,197,94,0.10)', animation: 'pulseGlow 1.5s infinite alternate' }}>
            <span className="text-gray-800 dark:text-gray-100 font-semibold text-sm mb-1 text-center">Scroll to the bottom for the full recipe</span>
            <span className="block mt-0.5 animate-bounce text-green-500 dark:text-green-400 text-2xl" style={{ filter: 'drop-shadow(0 2px 6px #bbf7d0)' }}>&#x25BC;</span>
          </div>
          <style>{`
            @keyframes pulseGlow {
              0% { box-shadow: 0 4px 32px 0 rgba(34,197,94,0.10), 0 0 0 0 #bbf7d0; border-color: #bbf7d0; }
              100% { box-shadow: 0 4px 32px 0 rgba(34,197,94,0.18), 0 0 12px 4px #bbf7d0; border-color: #4ade80; }
            }
          `}</style>
        </div>
      )}
      {/* Show instructions pop-up at the start */}
      {showHowToPlay && <HowToPlayModal onClose={handleCloseHowToPlay} />}
      {/* Audio elements */}
      <audio ref={correctSoundRef} src="/sounds/correct-answer.mp3" preload="auto" />
      <audio ref={incorrectSoundRef} src="/sounds/incorrect-answer.mp3" preload="auto" />
      <audio ref={winSoundRef} src="/sounds/you-won.mp3" preload="auto" />
      <audio ref={loseSoundRef} src="/sounds/you-lost.mp3" preload="auto" />
      {/* Confetti overlay */}
      {showConfetti && (
        <Confetti
          width={typeof window !== 'undefined' ? window.innerWidth : 1920}
          height={typeof window !== 'undefined' ? window.innerHeight : 1080}
          numberOfPieces={250}
          recycle={false}
        />
      )}
      {/* Header Bar (replaces old top bar) */}
      <Header
        gameStatus={gameState.gameStatus}
        attempts={gameState.attempts}
        maxAttempts={gameState.maxAttempts}
        hintsUsed={gameState.hintsUsed}
        maxHints={maxHints}
      />

      {/* Main Centered Box */}
      <div className="flex flex-col items-center w-full max-w-5xl mx-auto mt-8 mb-8">
        {/* Game Over Message */}
        {['won', 'lost'].includes(gameState.gameStatus) && (
          <div className={`mb-4 text-2xl font-bold ${gameState.gameStatus === 'won' ? 'text-green-600' : 'text-red-500'}`}>
            Game Over! {gameState.gameStatus === 'won' ? 'You won!' : 'Better luck next time!'}
          </div>
        )}
        {/* Main Game Box */}
        <div className={`bg-white/90 dark:bg-gray-900/90 rounded-3xl shadow-2xl p-6 w-full max-w-xl flex flex-col items-center border border-pink-100/60 backdrop-blur-md transition-all duration-150 ${shakeBox ? 'animate-shake' : ''} animate-fade-in`}>
          {/* Food of the day name or fallback */}
          <div className="flex items-center justify-center gap-2 text-3xl font-extrabold text-gray-900 dark:text-white mb-4 mt-2 text-center tracking-tight drop-shadow-md">
            {gameState.currentRecipe?.emoji && <span>{gameState.currentRecipe.emoji}</span>}
            <span>{gameState.currentRecipe?.name || 'No food of the day set!'}</span>
          </div>
          {/* Photo Placeholder or Recipe Image */}
          {(() => {
            const img = gameState.currentRecipe?.photo_url || gameState.currentRecipe?.image_url || gameState.currentRecipe?.recipe_image;
            if (img) {
              return (
                <img
                  src={img}
                  alt={gameState.currentRecipe.name + ' photo'}
                  className="w-48 h-36 object-cover rounded-2xl mb-1 border-2 border-gray-100 dark:border-gray-800 shadow-inner"
                />
              );
            }
            return (
              <div className="bg-gray-200 dark:bg-gray-800 w-48 h-36 rounded-2xl mb-1 flex items-center justify-center text-gray-400 text-2xl border-2 border-gray-100 dark:border-gray-800 shadow-inner">
                Photo
              </div>
            );
          })()}
          {/* Username and Instagram link row */}
          {gameState.currentRecipe && (
            <div className="flex justify-center items-center gap-2 text-xs mb-4 space-x-4">
              {/* Username */}
              {gameState.currentRecipe.username && gameState.currentRecipe.username.trim() ? (
                <span className="flex items-center font-semibold text-green-700 dark:text-green-400">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.314 0-6 1.686-6 3.75V18h12v-2.25C16 13.686 13.314 12 10 12z" /></svg>
                  {gameState.currentRecipe.username}
                </span>
              ) : (
                <span className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.314 0-6 1.686-6 3.75V18h12v-2.25C16 13.686 13.314 12 10 12z" /></svg>
                  No Username
                </span>
              )}
              {/* Instagram Link */}
              {gameState.currentRecipe.userlink && gameState.currentRecipe.userlink.trim() ? (
                <a
                  href={gameState.currentRecipe.userlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-2"
                >
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5a4.25 4.25 0 01-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 2.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zm0 1.5a2.75 2.75 0 110 5.5 2.75 2.75 0 010-5.5zm5.25 1.25a1 1 0 110 2 1 1 0 010-2z" /></svg>
                  [Instagram]
                </a>
              ) : (
                <span className="flex items-center text-gray-400 ml-2">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5a4.25 4.25 0 01-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 2.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zm0 1.5a2.75 2.75 0 110 5.5 2.75 2.75 0 010-5.5zm5.25 1.25a1 1 0 110 2 1 1 0 010-2z" /></svg>
                  [No Instagram]
                </span>
              )}
            </div>
          )}
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
                gameStatus={gameState.gameStatus}
              />
            </div>
          )}
        </div>

        {/* Stats Bar with Hint Button */}
        <div className="stats-container flex flex-row justify-between items-center gap-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-md rounded-xl px-4 py-2 mt-4 shadow border border-pink-100/30 mx-auto w-full max-w-xl animate-fade-in">
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Guesses Left</span>
            <span className="font-bold text-base text-gray-800 dark:text-white">{gameState.maxAttempts - gameState.attempts}</span>
          </div>
          <div className="flex flex-col items-center flex-1 min-w-0">
            <span className="text-xs text-gray-500 dark:text-gray-400">Hints Used</span>
            <span className="font-bold text-base text-gray-800 dark:text-white">{gameState.hintsUsed} / {maxHints}</span>
          </div>
          {gameState.currentRecipe ? (
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ingredients Left</span>
              <span className="font-bold text-base text-gray-800 dark:text-white">{gameState.currentRecipe.ingredients.length - gameState.correctIngredients.length}</span>
            </div>
          ) : (
            <div className="flex flex-col items-center flex-1 min-w-0">
              <span className="text-xs text-gray-500 dark:text-gray-400">Ingredients Left</span>
              <span className="font-bold text-base text-gray-800 dark:text-white">-</span>
            </div>
          )}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <button
              type="button"
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded-xl transition-all duration-150 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-accent-pink text-sm w-full disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={typeof handleHint === 'function' ? handleHint : undefined}
              aria-label="Get a hint"
              disabled={gameState.hintsUsed >= maxHints && !extraHintUnlocked}
            >
              Hint
            </button>
          </div>
        </div>

        {/* Input Area */}
        <div className="flex justify-center mt-4">
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
              className="px-10 py-4 rounded-xl text-lg transition-all duration-150 hover:scale-105 font-bold shadow animate-gradient-move"
              style={{
                background: 'linear-gradient(270deg, #ff80b5, #ffd580, #ff80b5, #fffbe7)',
                backgroundSize: '400% 400%',
                color: '#fff',
                fontWeight: 700,
                letterSpacing: '0.03em',
                borderRadius: '1rem',
                boxShadow: '0 2px 12px 0 rgba(0,0,0,0.07)',
              }}
              disabled={gameState.gameStatus !== 'playing'}
            >
              Submit
            </button>
          </form>
        </div>
      </div>

      {/* Place recipe box as a normal section below the main game box */}
      {['won', 'lost'].includes(gameState.gameStatus) && gameState.currentRecipe && (
        <div className="w-full flex justify-center mt-8 mb-8">
          <div className="bg-white/95 dark:bg-gray-900/95 border-t-4 border-green-300 dark:border-green-600 shadow-2xl rounded-3xl max-w-2xl w-full mx-4 px-6 py-6 flex flex-col items-center animate-fade-in">
            <div className="flex items-center gap-3 mb-2">
              {gameState.currentRecipe.emoji && <span className="text-3xl">{gameState.currentRecipe.emoji}</span>}
              <span className="text-xl font-bold text-gray-800 dark:text-white">{gameState.currentRecipe.name}</span>
            </div>
            {/* Username and link row */}
            <div className="flex justify-center items-center gap-2 text-xs mb-4 space-x-4">
              {/* Username */}
              {gameState.currentRecipe.username && gameState.currentRecipe.username.trim() ? (
                <span className="flex items-center font-semibold text-green-700 dark:text-green-400">
                  <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.314 0-6 1.686-6 3.75V18h12v-2.25C16 13.686 13.314 12 10 12z" /></svg>
                  {gameState.currentRecipe.username}
                </span>
              ) : (
                <span className="flex items-center text-gray-400">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.314 0-6 1.686-6 3.75V18h12v-2.25C16 13.686 13.314 12 10 12z" /></svg>
                  No Username
                </span>
              )}
              {/* Instagram Link */}
              {gameState.currentRecipe.userlink && gameState.currentRecipe.userlink.trim() ? (
                <a
                  href={gameState.currentRecipe.userlink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-2"
                >
                  <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5a4.25 4.25 0 01-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 2.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zm0 1.5a2.75 2.75 0 110 5.5 2.75 2.75 0 010-5.5zm5.25 1.25a1 1 0 110 2 1 1 0 010-2z" /></svg>
                  [Instagram]
                </a>
              ) : (
                <span className="flex items-center text-gray-400 ml-2">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5a4.25 4.25 0 01-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 2.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zm0 1.5a2.75 2.75 0 110 5.5 2.75 2.75 0 010-5.5zm5.25 1.25a1 1 0 110 2 1 1 0 010-2z" /></svg>
                  [No Instagram]
                </span>
              )}
            </div>
            {/* Serves, Time, Cuisine, Difficulty row */}
            <div className="mb-4 text-gray-500 text-sm flex flex-wrap items-center gap-4 space-x-4 space-y-2">
              <span className="flex items-center gap-1"><svg className="inline w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6 5.87v-2a4 4 0 00-3-3.87m6 5.87v-2a4 4 0 00-3-3.87" /></svg>Serves {gameState.currentRecipe.servings || 4}</span>
              <span className="flex items-center gap-1"><svg className="inline w-4 h-4 ml-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>{gameState.currentRecipe.cookTime || '30'} min</span>
              <span className="ml-4 flex items-center gap-1"><span role="img" aria-label="Cuisine">🍽️</span>{gameState.currentRecipe.category ? gameState.currentRecipe.category.charAt(0).toUpperCase() + gameState.currentRecipe.category.slice(1) : 'Unknown'}</span>
              <span className="ml-4 flex items-center gap-1"><span role="img" aria-label="Difficulty">🎯</span>{gameState.currentRecipe.difficulty ? gameState.currentRecipe.difficulty.charAt(0).toUpperCase() + gameState.currentRecipe.difficulty.slice(1) : 'Unknown'}</span>
            </div>
            {gameState.currentRecipe && (() => {
              const img = gameState.currentRecipe.photo_url || gameState.currentRecipe.image_url || gameState.currentRecipe.recipe_image;
              if (img) {
                return <img src={img} alt={gameState.currentRecipe.name + ' photo'} className="rounded-xl max-h-32 object-cover mb-2" />;
              }
              return null;
            })()}
            <div className="w-full flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <div className="font-semibold mb-1 text-green-700 dark:text-green-300 mt-6">Ingredients:</div>
                {Array.isArray(gameState.currentRecipe.ingredients_long) && gameState.currentRecipe.ingredients_long.length > 0 ? (
                  <ul className="list-disc list-inside mb-2 text-gray-700 dark:text-gray-200 text-sm">
                    {gameState.currentRecipe.ingredients_long.map((ing: string, idx: number) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                ) : typeof gameState.currentRecipe.ingredients_long === 'string' && gameState.currentRecipe.ingredients_long.trim().length > 0 ? (
                  <div className="mb-2 whitespace-pre-line text-gray-700 dark:text-gray-200 text-sm">{gameState.currentRecipe.ingredients_long}</div>
                ) : Array.isArray(gameState.currentRecipe.ingredients) && gameState.currentRecipe.ingredients.length > 0 ? (
                  <ul className="list-disc list-inside mb-2 text-gray-700 dark:text-gray-200 text-sm">
                    {gameState.currentRecipe.ingredients.map((ing: string, idx: number) => (
                      <li key={idx}>{ing}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-gray-400 text-sm">No ingredients</div>
                )}
              </div>
              <div className="flex-1">
                <div className="font-semibold mb-1 text-green-700 dark:text-green-300 mt-6">Instructions:</div>
                {gameState.currentRecipe.instructions_long ? (
                  <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line text-sm">{gameState.currentRecipe.instructions_long}</div>
                ) : gameState.currentRecipe.instructions ? (
                  <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line text-sm">{gameState.currentRecipe.instructions}</div>
                ) : (
                  <div className="text-gray-400 text-sm">No instructions</div>
                )}
              </div>
            </div>
            <button
              className="mt-6 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition"
              onClick={async () => {
                try {
                  const recipe = gameState.currentRecipe;
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
                  // Photo
                  let photoHeight = 0;
                  if (recipe.photo_url || recipe.image_url || recipe.recipe_image) {
                    try {
                      const imgUrl = recipe.photo_url || recipe.image_url || recipe.recipe_image;
                      const img = new window.Image();
                      img.crossOrigin = 'Anonymous';
                      img.src = imgUrl;
                      await new Promise((resolve, reject) => {
                        img.onload = resolve;
                        img.onerror = reject;
                      });
                      const imgWidth = 120;
                      photoHeight = 80;
                      doc.addImage(img, 'JPEG', (pageWidth - imgWidth) / 2, y, imgWidth, photoHeight);
                    } catch (e) {
                      // ignore image errors
                    }
                  } else {
                    // Placeholder
                    doc.setFillColor(220, 220, 220);
                    doc.rect((pageWidth - 120) / 2, y, 120, 80, 'F');
                    doc.setFontSize(12);
                    doc.setTextColor(180,180,180);
                    doc.text('No photo', pageWidth / 2, y + 40, { align: 'center' });
                  }
                  y += photoHeight + 16;
                  // Description
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(12);
                  doc.setTextColor(60,60,60);
                  const descLines = doc.splitTextToSize(recipe.description || 'No description', pageWidth - 60);
                  doc.text(descLines, pageWidth / 2, y, { align: 'center' });
                  y += descLines.length * 14 + 2;
                  // Username and Servings
                  doc.setFont('helvetica', 'italic');
                  doc.setFontSize(11);
                  doc.setTextColor(120,120,120);
                  let metaParts = [];
                  if (recipe.username) metaParts.push(`By: ${recipe.username}`);
                  if (recipe.servings) metaParts.push(`Serves: ${recipe.servings}`);
                  const metaText = metaParts.join('   ');
                  if (metaText) {
                    doc.text(metaText, pageWidth / 2, y, { align: 'center' });
                    y += 16;
                  }
                  // Ingredients/instructions section
                  const sectionStartY = y;
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
                  const ingredients = Array.isArray(recipe.ingredients_long) && recipe.ingredients_long.length > 0
                    ? recipe.ingredients_long
                    : typeof recipe.ingredients_long === 'string' && recipe.ingredients_long.trim().length > 0
                      ? recipe.ingredients_long.split('\n')
                      : Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
                        ? recipe.ingredients
                        : [];
                  ingredients.forEach((ing: string) => {
                    doc.text(`- ${ing}`, 40, ingY);
                    ingY += 12;
                  });
                  // Instructions (right)
                  let instrY = sectionStartY + 20;
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(14);
                  doc.setTextColor(34,197,94);
                  doc.text('Instructions', pageWidth / 2 + 20, instrY);
                  instrY += 14;
                  doc.setFont('helvetica', 'normal');
                  doc.setFontSize(11);
                  doc.setTextColor(60,60,60);
                  const instructions = recipe.instructions_long || recipe.instructions || '';
                  const instrLines = doc.splitTextToSize(instructions, (pageWidth / 2) - 48);
                  doc.text(instrLines, pageWidth / 2 + 24, instrY);
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
      )}

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
          <span className="text-gray-500 text-xs mb-2">
            {newsletterStatusUI}
          </span>
          <form className="w-full flex flex-row gap-2 items-center" onSubmit={handleNewsletterSubmit}>
            <input
              type="email"
              placeholder="Your email"
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-gray-800 bg-white/70 focus:outline-none focus:ring-2 focus:ring-accent-pink/30 placeholder-gray-400 text-xs"
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              required
              disabled={newsletterStatus === 'submitting'}
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-lg px-4 py-2 shadow transition-all duration-150 disabled:opacity-60 text-sm transform hover:scale-105 hover:shadow-lg active:scale-95 hover:animate-pop active:animate-pop shine-btn"
              disabled={newsletterStatus === 'submitting'}
            >
              {newsletterStatus === 'submitting' ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        </div>
        {/* Divider */}
        <div className="h-px bg-gray-300 my-1 mx-auto" style={{ width: 'calc(100% - 8px)' }} />
        {/* Bottom: Submit Recipe */}
        <div className="p-4 flex flex-col items-start">
          <div className="font-extrabold text-base text-gray-700 mb-1">Submit your own recipes</div>
          <button
            className="bg-gradient-to-r from-pink-400 to-yellow-300 text-white font-bold rounded-lg px-3 py-1 mt-1 shadow transition-all duration-150 text-sm transform hover:scale-105 hover:shadow-lg active:scale-95 hover:animate-pop active:animate-pop shine-btn"
            onClick={() => setShowRecipeModal(true)}
          >
            Submit Recipe
          </button>
        </div>
      </div>
      {/* Recipe Submit Modal */}
      {showRecipeModal && (
        <RecipeSubmitModal
          onClose={() => setShowRecipeModal(false)}
          onSubmit={handleRecipeSubmit}
          user={user ? { email: user.email ?? '', name: user.user_metadata?.name ?? undefined } : null}
        />
      )}

      {/* Audio Elements for Sound Effects */}
      <audio ref={correctSoundRef} preload="auto">
        <source src="/sounds/correct-answer.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={incorrectSoundRef} preload="auto">
        <source src="/sounds/incorrect-answer.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={winSoundRef} preload="auto">
        <source src="/sounds/you-won.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={loseSoundRef} preload="auto">
        <source src="/sounds/you-lost.mp3" type="audio/mpeg" />
      </audio>
    </main>
  );
} 
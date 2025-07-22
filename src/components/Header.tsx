'use client'

import React, { useState } from 'react'
import { BookOpen, BarChart3 } from 'lucide-react'
import { StatisticsModal } from './StatisticsModal'
import { CookbookModal } from './CookbookModal'
import { AuthModal } from './AuthModal';
import { supabase } from '@/lib/supabase';
import { useMemo, useEffect } from 'react';

interface HeaderProps {
  gameStatus: 'playing' | 'won' | 'lost'
  attempts: number
  maxAttempts: number
  hintsUsed: number
  maxHints: number
}

export const Header: React.FC<HeaderProps> = ({
  gameStatus,
  attempts,
  maxAttempts,
  hintsUsed,
  maxHints,
}) => {
  const [showStats, setShowStats] = useState(false);
  const [showCookbook, setShowCookbook] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [streakAnimated, setStreakAnimated] = useState(false);

  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      // Fetch streak from user_stats
      if (data.user) {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('current_streak, last_played')
          .eq('user_id', data.user.id)
          .single();
        setStreak(stats?.current_streak || 0);
        // Animation: if last_played is today, animate
        if (stats?.last_played) {
          const lastPlayed = new Date(stats.last_played);
          const today = new Date();
          if (
            lastPlayed.getUTCFullYear() === today.getUTCFullYear() &&
            lastPlayed.getUTCMonth() === today.getUTCMonth() &&
            lastPlayed.getUTCDate() === today.getUTCDate()
          ) {
            setStreakAnimated(true);
            setTimeout(() => setStreakAnimated(false), 1200);
          }
        }
      }
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => getUser());
    // Always trigger spark animation on mount
    setStreakAnimated(true);
    const timeout = setTimeout(() => setStreakAnimated(false), 1200);
    return () => {
      listener?.subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const avatar = useMemo(() => {
    if (!user) return null;
    if (user.avatar_url) return <img src={user.avatar_url} alt="avatar" className="w-7 h-7 rounded-full" />;
    if (user.user_metadata && user.user_metadata.name) return user.user_metadata.name[0].toUpperCase();
    return null;
  }, [user]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Sign out error:', error.message);
      } else {
    setUser(null);
      }
    } catch (err) {
      console.error('Sign out exception:', err);
    }
  };

  console.log('HEADER DEBUG:', { user, streak });

  // Timer for next recipe (AEST 8am)
  const getTimeToNext8amAEST = () => {
    const now = new Date();
    const nowAEST = new Date(now.getTime() + 10 * 60 * 60 * 1000);
    let next8am = new Date(nowAEST);
    next8am.setHours(8, 0, 0, 0);
    if (nowAEST.getHours() >= 8) {
      next8am.setDate(next8am.getDate() + 1);
    }
    const next8amUTC = new Date(next8am.getTime() - 10 * 60 * 60 * 1000);
    return next8amUTC.getTime() - now.getTime();
  };
  const formatAestTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };
  const [aestTimeLeft, setAestTimeLeft] = useState(getTimeToNext8amAEST());
  useEffect(() => {
    const interval = setInterval(() => {
      setAestTimeLeft(getTimeToNext8amAEST());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="w-full max-w-4xl mx-auto px-4 py-4 flex items-center justify-between bg-white/90 dark:bg-gray-900/90 shadow border border-gray-200 dark:border-gray-800 rounded-b-2xl relative">
          {/* Logo */}
          <div className="flex items-center gap-2">
          <span className="text-xl font-extrabold tracking-widest text-gray-800 dark:text-white">FOODLE</span>
          {avatar && (
              <span className="ml-2 text-lg" aria-label="User avatar">{avatar}</span>
            )}
          </div>
        {/* Centered Timer (absolutely centered for the whole header) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          <div className="bg-gray-100/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 rounded-2xl px-6 py-1 font-mono text-base font-semibold shadow transition-all">
            Next recipe in {formatAestTime(aestTimeLeft)}
              </div>
            </div>
        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <div
            className={`relative flex items-center group mr-2 ${streakAnimated ? 'animate-streak-pop' : ''}`}
            aria-label={user ? 'Daily streak' : 'Sign in to track your streak'}
            title={user ? 'Daily streak' : 'Sign in to track your streak'}
          >
            {user ? (
              <>
                <span role="img" aria-label="fire" className="text-2xl">🔥</span>
                <span className="font-bold text-lg ml-0.5">{streak}</span>
                {streakAnimated && (
                  <>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 text-xl animate-ping" style={{ animationDuration: '0.7s' }}>✨</span>
                    <span className="absolute -top-1 left-1/3 text-pink-400 text-lg animate-bounce" style={{ animationDuration: '0.9s' }}>✨</span>
                    <span className="absolute -top-1 right-1/3 text-orange-400 text-lg animate-spin" style={{ animationDuration: '1.1s' }}>✨</span>
                  </>
                )}
              </>
            ) : (
              <>
                <span
                  role="img"
                  aria-label="no streak"
                  className="text-2xl"
                  style={{ position: 'relative', filter: 'grayscale(0.5)' }}
                >🔥
                  <span
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '0',
                      transform: 'translate(-50%, 0)',
                      fontSize: '0.8em',
                      color: '#111',
                      pointerEvents: 'none',
                    }}
                  >❓</span>
                </span>
                {streakAnimated && (
                  <>
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-yellow-400 text-xl animate-ping" style={{ animationDuration: '0.7s' }}>✨</span>
                    <span className="absolute -top-1 left-1/3 text-pink-400 text-lg animate-bounce" style={{ animationDuration: '0.9s' }}>✨</span>
                    <span className="absolute -top-1 right-1/3 text-orange-400 text-lg animate-spin" style={{ animationDuration: '1.1s' }}>✨</span>
                  </>
                )}
              </>
            )}
          </div>
            <button
              onClick={() => setShowCookbook(true)}
              className="glass-button p-2 rounded-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-pink"
              title="Cookbook"
              aria-label="Open cookbook"
            >
              <span role="img" aria-label="Cookbook">📖</span>
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="glass-button p-2 rounded-lg hover:scale-105 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-accent-pink"
              title="Statistics"
              aria-label="Open statistics"
            >
              <span role="img" aria-label="Stats">📊</span>
            </button>
            {/* User/Account Button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSignOut}
                  className="glass-button px-3 py-1 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-accent-pink"
                  aria-label="Sign out"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="glass-button px-3 py-1 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-accent-pink"
                aria-label="Sign in"
              >
                Sign In
              </button>
            )}
        </div>
      </header>
      {/* Modals */}
      {showStats && (
        <StatisticsModal
          onClose={() => setShowStats(false)}
          gameStatus={gameStatus}
          attempts={attempts}
          maxAttempts={maxAttempts}
          hintsUsed={hintsUsed}
        />
      )}
      {showCookbook && (
        <CookbookModal
          onClose={() => setShowCookbook(false)}
        />
      )}
      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} />
      )}
    </>
  );
}; 
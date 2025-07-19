'use client'

import React, { useState } from 'react'
import { BookOpen, BarChart3 } from 'lucide-react'
import { StatisticsModal } from './StatisticsModal'
import { CookbookModal } from './CookbookModal'
import { AuthModal } from './AuthModal';
import { supabase } from '@/lib/supabase';
import { useMemo } from 'react';

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

  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      // Fetch streak from user_stats
      if (data.user) {
        const { data: stats } = await supabase
          .from('user_stats')
          .select('current_streak')
          .eq('user_id', data.user.id)
          .single();
        setStreak(stats?.current_streak || 0);
      }
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => getUser());
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const avatar = useMemo(() => {
    if (!user) return '👤';
    if (user.avatar_url) return <img src={user.avatar_url} alt="avatar" className="w-7 h-7 rounded-full" />;
    if (user.email) return user.email[0].toUpperCase();
    return '👤';
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <header className="w-full max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="glass-nav flex items-center justify-between w-full">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <h1 className="foodle-logo text-2xl text-wordle-text glow-animation">FOODLE</h1>
            {user && (
              <span className="ml-2 text-lg" aria-label="User avatar">{avatar}</span>
            )}
          </div>
          {/* Game Info */}
          <div className="flex items-center space-x-4">
            <div className="glass-panel px-3 py-1 rounded-lg">
              <div className="text-sm text-wordle-text">
                <span className="font-semibold">{attempts}</span>
                <span className="text-wordle-absent">/{maxAttempts}</span>
              </div>
            </div>
            {gameStatus === 'playing' && (
              <div className="glass-panel px-3 py-1 rounded-lg">
                <div className="text-sm text-wordle-text">
                  <span className="font-semibold">{hintsUsed}</span>
                  <span className="text-wordle-absent">/{maxHints} hints</span>
                </div>
              </div>
            )}
            {user && (
              <div className="glass-panel px-3 py-1 rounded-lg flex items-center gap-2" aria-label="Daily streak">
                <span role="img" aria-label="fire">🔥</span>
                <span className="font-semibold">{streak}</span>
                <span className="text-xs text-wordle-absent">streak</span>
              </div>
            )}
          </div>
          {/* Action Buttons */}
          <div className="flex items-center gap-2">
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
                <span className="text-wordle-text text-sm">{user.email}</span>
                <button
                  onClick={async () => { await supabase.auth.signOut(); setUser(null); }}
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
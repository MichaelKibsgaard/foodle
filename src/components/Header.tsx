'use client'

import React, { useState } from 'react'
import { BookOpen, BarChart3 } from 'lucide-react'
import { StatisticsModal } from './StatisticsModal'
import { CookbookModal } from './CookbookModal'
import { AuthModal } from './AuthModal';
import { supabase } from '@/lib/supabase';

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

  React.useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    };
    getUser();
    const { data: listener } = supabase.auth.onAuthStateChange(() => getUser());
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <>
      <header className="w-full max-w-4xl mx-auto px-4 py-4">
        <div className="glass-nav flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-wordle-text font-roberto glow-animation">
              FOODLE
            </h1>
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
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowCookbook(true)}
              className="glass-button p-2 rounded-lg hover:scale-105 transition-all duration-300"
              title="Cookbook"
            >
              <span role="img" aria-label="Cookbook">📖</span>
            </button>
            <button
              onClick={() => setShowStats(true)}
              className="glass-button p-2 rounded-lg hover:scale-105 transition-all duration-300"
              title="Statistics"
            >
              <span role="img" aria-label="Stats">📊</span>
            </button>
            {/* User/Account Button */}
            {user ? (
              <div className="flex items-center space-x-2">
                <span className="text-wordle-text text-sm">{user.email}</span>
                <button
                  onClick={handleSignOut}
                  className="glass-button px-3 py-1 rounded-lg text-xs"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="glass-button px-3 py-1 rounded-lg text-xs"
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
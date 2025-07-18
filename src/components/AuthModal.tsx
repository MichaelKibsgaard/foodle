import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [optIn, setOptIn] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError(error.message);
      else onClose();
    } else {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) setError(error.message);
      else setMessage('Check your email to confirm your account!');
      // You can send optIn to your backend here if needed
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-8 max-w-md w-full mx-4 text-center border border-pink-100 animate-fade-in">
        <h2 className="text-3xl font-extrabold mb-4 text-vibrant-pink tracking-tight">
          {mode === 'login' ? 'Log In to Foodle' : 'Sign Up for Foodle'}
        </h2>
        <form onSubmit={mode === 'login' ? handleEmailAuth : handleEmailAuth} className="space-y-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-wordle-text">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="glass-input w-full"
              required
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-sm font-medium text-wordle-text">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="glass-input w-full"
              required
            />
          </div>
          {mode === 'signup' && (
            <div className="flex items-center gap-2 mt-2">
              <input
                id="optin"
                type="checkbox"
                checked={optIn}
                onChange={e => setOptIn(e.target.checked)}
                className="accent-accent-pink rounded border border-wordle-border"
              />
              <label htmlFor="optin" className="text-sm text-wordle-text select-none">
                I want to receive Foodle news and updates
              </label>
            </div>
          )}
          <button type="submit" className={`btn-primary w-full py-3 text-lg rounded-xl ${mode === 'signup' ? 'bg-yellow-400' : ''}`}>
            {loading ? 'Loading...' : mode === 'login' ? 'Log In' : 'Sign Up'}
          </button>
        </form>
        <div className="mt-4 text-sm text-gray-500">
          {mode === 'login' ? (
            <>Don't have an account?{' '}
              <button className="text-vibrant-pink font-bold" onClick={() => setMode('signup')}>Sign Up</button>
            </>
          ) : (
            <>Already have an account?{' '}
              <button className="text-vibrant-pink font-bold" onClick={() => setMode('login')}>Log In</button>
            </>
          )}
        </div>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        {message && <div className="text-green-600 text-center mt-2">{message}</div>}
      </div>
    </div>
  );
}; 
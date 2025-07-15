import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in');
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
    if (view === 'sign-in') {
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
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-sm mx-auto p-8 flex flex-col gap-4">
        <h2 className="text-2xl font-bold text-center mb-2 text-accent-pink">
          {view === 'sign-in' ? 'Sign In to Foodle' : 'Sign Up for Foodle'}
        </h2>
        <form onSubmit={handleEmailAuth} className="space-y-4">
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
          {view === 'sign-up' && (
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
          <button
            type="submit"
            className="btn-primary w-full py-2 font-semibold mt-2"
            disabled={loading}
          >
            {loading ? 'Loading...' : view === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center mt-2 text-sm">
          {view === 'sign-in' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button className="underline text-accent-pink" onClick={() => setView('sign-up')}>Sign Up</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button className="underline text-accent-pink" onClick={() => setView('sign-in')}>Sign In</button>
            </span>
          )}
        </div>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        {message && <div className="text-green-600 text-center mt-2">{message}</div>}
      </div>
    </div>
  );
}; 
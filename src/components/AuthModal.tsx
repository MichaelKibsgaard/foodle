import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

export const AuthModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [view, setView] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    }
    setLoading(false);
  };

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content max-w-sm mx-auto">
        <h2 className="text-xl font-bold text-center mb-4 text-wordle-text">{view === 'sign-in' ? 'Sign In' : 'Sign Up'}</h2>
        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="glass-input w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="glass-input w-full"
            required
          />
          <button
            type="submit"
            className="glass-button w-full py-2 font-semibold"
            disabled={loading}
          >
            {loading ? 'Loading...' : view === 'sign-in' ? 'Sign In' : 'Sign Up'}
          </button>
        </form>
        <div className="text-center mt-4">
          {view === 'sign-in' ? (
            <span>
              Don&apos;t have an account?{' '}
              <button className="underline" onClick={() => setView('sign-up')}>Sign Up</button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button className="underline" onClick={() => setView('sign-in')}>Sign In</button>
            </span>
          )}
        </div>
        {error && <div className="text-red-500 text-center mt-2">{error}</div>}
        {message && <div className="text-green-600 text-center mt-2">{message}</div>}
      </div>
    </div>
  );
}; 
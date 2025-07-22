'use client'

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface StatisticsModalProps {
  onClose: () => void;
  gameStatus: 'playing' | 'won' | 'lost';
  attempts: number;
  maxAttempts: number;
  hintsUsed: number;
}

export const StatisticsModal: React.FC<StatisticsModalProps> = ({
  onClose,
  gameStatus,
  attempts,
  maxAttempts,
  hintsUsed,
}) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [totalHintsUsed, setTotalHintsUsed] = useState<number | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(null);
        setTotalHintsUsed(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(data);
      // Fetch total hints used from game_results
      const { data: hintsData, error } = await supabase
        .from('game_results')
        .select('hints_used')
        .eq('user_id', user.id);
      if (hintsData && Array.isArray(hintsData)) {
        const total = hintsData.reduce((sum, row) => sum + (row.hints_used || 0), 0);
        setTotalHintsUsed(total);
      } else {
        setTotalHintsUsed(0);
      }
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Statistics Modal">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200 dark:border-gray-800 animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white" id="stats-title" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>Statistics</h2>
          <button
            onClick={onClose}
            className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-accent-pink"
            aria-label="Close statistics"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {loading ? (
          <div className="animate-pulse h-32 w-full rounded-lg bg-gray-100 dark:bg-gray-800" aria-busy="true" aria-live="polite"></div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-gray-800 dark:text-white">{stats.games_played}</div>
                <div className="text-sm text-gray-400">Games Played</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="text-2xl font-bold text-accent-pink">{stats.games_won}</div>
                <div className="text-sm text-gray-400">Games Won</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center" aria-label="Current streak">
                <span className="text-3xl" role="img" aria-label="fire">🔥</span>
                <div className="text-2xl font-bold text-accent-pink">{stats.current_streak}</div>
                <div className="text-sm text-gray-400">Current Streak</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col items-center" aria-label="Hints used">
                <span className="text-3xl" role="img" aria-label="hints" style={{ color: '#a78bfa' }}>❓</span>
                <div className="text-2xl font-bold text-accent-pink">{totalHintsUsed !== null ? totalHintsUsed : '--'}</div>
                <div className="text-sm text-gray-400">Hints Used</div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-400">Last played: {stats.last_played ? new Date(stats.last_played).toLocaleString() : 'Never'}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">No stats found.</div>
        )}
      </div>
    </div>
  );
}; 
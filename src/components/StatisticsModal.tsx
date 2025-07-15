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

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStats(null);
        setLoading(false);
        return;
      }
      const { data } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-wordle-text">Statistics</h2>
          <button
            onClick={onClose}
            className="glass-button p-1 rounded-lg hover:scale-105 transition-all duration-300"
          >
            <X className="w-5 h-5 text-wordle-text" />
          </button>
        </div>
        {loading ? (
          <div className="text-center text-wordle-absent">Loading...</div>
        ) : stats ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="glass-panel text-center p-4 rounded-lg">
                <div className="text-2xl font-bold text-wordle-text">{stats.games_played}</div>
                <div className="text-sm text-wordle-absent">Games Played</div>
              </div>
              <div className="glass-panel text-center p-4 rounded-lg">
                <div className="text-2xl font-bold text-accent-pink">{stats.games_won}</div>
                <div className="text-sm text-wordle-absent">Games Won</div>
              </div>
              <div className="glass-panel text-center p-4 rounded-lg">
                <div className="text-2xl font-bold text-accent-pink">{stats.current_streak}</div>
                <div className="text-sm text-wordle-absent">Current Streak</div>
              </div>
              <div className="glass-panel text-center p-4 rounded-lg">
                <div className="text-2xl font-bold text-accent-pink">{stats.best_streak}</div>
                <div className="text-sm text-wordle-absent">Best Streak</div>
              </div>
            </div>
            <div className="glass-panel text-center p-4 rounded-lg">
              <div className="text-sm text-wordle-absent">Last played: {stats.last_played ? new Date(stats.last_played).toLocaleString() : 'Never'}</div>
            </div>
          </div>
        ) : (
          <div className="text-center text-wordle-absent">No stats yet. Play a game to get started!</div>
        )}
      </div>
    </div>
  );
}; 
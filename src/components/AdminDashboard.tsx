'use client'

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface AdminDashboardProps {
  onClose: () => void;
}

interface NewsletterSignup {
  id: string;
  email: string;
  opt_in: boolean;
  created_at: string;
}

interface AnonymousGameResult {
  id: string;
  session_id: string;
  recipe_name: string;
  attempts: number;
  hints_used: number;
  time_spent: number;
  won: boolean;
  created_at: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onClose }) => {
  const [newsletterSignups, setNewsletterSignups] = useState<NewsletterSignup[]>([]);
  const [anonymousGames, setAnonymousGames] = useState<AnonymousGameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'newsletter' | 'games'>('newsletter');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      
      // Fetch newsletter signups
      const { data: signups } = await supabase
        .from('newsletter_signups')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (signups) {
        setNewsletterSignups(signups);
      }

      // Fetch anonymous game results
      const { data: games } = await supabase
        .from('anonymous_game_results')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (games) {
        setAnonymousGames(games);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const exportNewsletterData = () => {
    const csvContent = [
      ['Email', 'Opt-in', 'Created At'],
      ...newsletterSignups.map(signup => [
        signup.email,
        signup.opt_in ? 'Yes' : 'No',
        new Date(signup.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'newsletter_signups.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportGameData = () => {
    const csvContent = [
      ['Session ID', 'Recipe', 'Attempts', 'Hints Used', 'Time Spent (ms)', 'Won', 'Created At'],
      ...anonymousGames.map(game => [
        game.session_id,
        game.recipe_name,
        game.attempts.toString(),
        game.hints_used.toString(),
        game.time_spent.toString(),
        game.won ? 'Yes' : 'No',
        new Date(game.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'anonymous_games.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getGameStats = () => {
    const totalGames = anonymousGames.length;
    const wonGames = anonymousGames.filter(g => g.won).length;
    const avgAttempts = totalGames > 0 ? 
      (anonymousGames.reduce((sum, g) => sum + g.attempts, 0) / totalGames).toFixed(1) : 0;
    const avgTime = totalGames > 0 ? 
      (anonymousGames.reduce((sum, g) => sum + g.time_spent, 0) / totalGames / 1000).toFixed(1) : 0;

    return { totalGames, wonGames, avgAttempts, avgTime };
  };

  const gameStats = getGameStats();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Admin Dashboard</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('newsletter')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'newsletter'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Newsletter Signups ({newsletterSignups.length})
          </button>
          <button
            onClick={() => setActiveTab('games')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeTab === 'games'
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            Anonymous Games ({anonymousGames.length})
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          </div>
        ) : (
          <div className="overflow-y-auto max-h-[60vh]">
            {activeTab === 'newsletter' ? (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Newsletter Signups
                  </h3>
                  <button
                    onClick={exportNewsletterData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{newsletterSignups.length}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Signups</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {newsletterSignups.filter(s => s.opt_in).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Opted In</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {newsletterSignups.filter(s => !s.opt_in).length}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Not Opted In</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {newsletterSignups.map((signup) => (
                    <div
                      key={signup.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">{signup.email}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(signup.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        signup.opt_in
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {signup.opt_in ? 'Opted In' : 'Not Opted In'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                    Anonymous Game Results
                  </h3>
                  <button
                    onClick={exportGameData}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                  >
                    Export CSV
                  </button>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{gameStats.totalGames}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Total Games</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{gameStats.wonGames}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Games Won</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{gameStats.avgAttempts}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Attempts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{gameStats.avgTime}s</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Avg Time</div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {anonymousGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div>
                        <div className="font-medium text-gray-800 dark:text-white">{game.recipe_name}</div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          Session: {game.session_id.slice(0, 8)}... | 
                          {new Date(game.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {game.attempts} attempts, {game.hints_used} hints
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${
                          game.won
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        }`}>
                          {game.won ? 'Won' : 'Lost'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 
'use client'

import React, { useState, useEffect } from 'react';
import { X, Search, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface CookbookModalProps {
  onClose: () => void;
}

export const CookbookModal: React.FC<CookbookModalProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompletedRecipes = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      // Get completed recipe IDs for this user
      const { data: results } = await supabase
        .from('game_results')
        .select('recipe_id, recipe_name, attempts, won')
        .eq('user_id', user.id)
        .eq('won', true);
      if (!results) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      // Get recipe details for completed recipes
      const recipeIds = results.map(r => r.recipe_id);
      if (recipeIds.length === 0) {
        setRecipes([]);
        setLoading(false);
        return;
      }
      const { data: completedRecipes } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);
      setRecipes(completedRecipes || []);
      setLoading(false);
    };
    fetchCompletedRecipes();
  }, []);

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    recipe.ingredients.some((ingredient: string) =>
      ingredient.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-content max-w-2xl max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-wordle-text glow-animation">Cookbook</h2>
          <button
            onClick={onClose}
            className="glass-button p-1 rounded-lg hover:scale-105 transition-all duration-300"
          >
            <X className="w-5 h-5 text-wordle-text" />
          </button>
        </div>
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-wordle-absent" />
          <input
            type="text"
            placeholder="Search recipes or ingredients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="glass-input w-full pl-10 pr-4 py-2 rounded-lg"
          />
        </div>
        {/* Recipes List */}
        <div className="overflow-y-auto max-h-[60vh] space-y-4">
          {loading ? (
            <div className="glass-panel text-center py-8 rounded-lg">
              <span className="text-wordle-absent">Loading...</span>
            </div>
          ) : filteredRecipes.length === 0 ? (
            <div className="glass-panel text-center py-8 rounded-lg">
              <span className="text-wordle-absent">No completed recipes found.</span>
            </div>
          ) : (
            filteredRecipes.map((recipe, index) => (
              <div
                key={index}
                className="glass-panel p-4 rounded-lg hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-wordle-text">{recipe.name}</h3>
                  <div className="flex items-center space-x-2 text-sm text-wordle-absent">
                    <Clock className="w-4 h-4" />
                    <span>{recipe.cookTime || '30'} min</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2 mb-3 text-sm text-wordle-absent">
                  <Users className="w-4 h-4" />
                  <span>Serves {recipe.servings || 4}</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {recipe.ingredients.slice(0, 5).map((ingredient: string, idx: number) => (
                    <span
                      key={idx}
                      className="glass-panel px-2 py-1 text-xs rounded-full text-wordle-text"
                    >
                      {ingredient}
                    </span>
                  ))}
                  {recipe.ingredients.length > 5 && (
                    <span className="glass-panel px-2 py-1 text-xs rounded-full text-wordle-absent">
                      +{recipe.ingredients.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-wordle-border/30 text-center">
          <div className="glass-panel inline-block px-4 py-2 rounded-lg">
            <span className="text-sm text-wordle-absent">{filteredRecipes.length} recipes found</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 
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
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Cookbook Modal">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-4xl w-full mx-4 border border-gray-200 dark:border-gray-800 flex flex-col max-h-[80vh] overflow-hidden animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white" id="cookbook-title" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>Cookbook</h2>
          <button
            onClick={onClose}
            className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-accent-pink"
            aria-label="Close cookbook"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search recipes or ingredients..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-accent-pink"
            aria-label="Search recipes or ingredients"
          />
        </div>
        {/* Recipes Grid */}
        {loading ? (
          <div className="animate-pulse h-32 w-full rounded-lg bg-gray-100 dark:bg-gray-800" aria-busy="true" aria-live="polite"></div>
        ) : filteredRecipes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 text-center py-8 rounded-lg">
            <span className="text-gray-400">Recipes will be added here as you complete them</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 overflow-y-auto pr-2" style={{ maxHeight: '40vh' }}>
            {filteredRecipes.map((recipe, index) => (
              <button
                key={index}
                className={`bg-gray-50 dark:bg-gray-800 p-6 h-52 rounded-xl border border-gray-200 dark:border-gray-700 transition cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent-pink flex flex-col items-start text-left relative overflow-hidden group shine-hover transform-gpu hover:scale-[1.015] m-2`} 
                tabIndex={0}
                aria-label={`Recipe: ${recipe.name}`}
                onClick={() => setSelectedRecipe(recipe)}
                onMouseMove={e => {
                  const btn = e.currentTarget;
                  const rect = btn.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  const edge = Math.min(x, rect.width - x, y, rect.height - y);
                  btn.classList.remove('glow-top', 'glow-bottom', 'glow-left', 'glow-right');
                  if (edge === x) btn.classList.add('glow-left');
                  else if (edge === rect.width - x) btn.classList.add('glow-right');
                  else if (edge === y) btn.classList.add('glow-top');
                  else btn.classList.add('glow-bottom');
                }}
                onMouseLeave={e => {
                  e.currentTarget.classList.remove('glow-top', 'glow-bottom', 'glow-left', 'glow-right');
                }}
              >
                <div className="mb-2">
                  <span className="text-2xl mr-2 align-middle">{recipe.emoji}</span>
                  <span className="font-semibold text-lg text-gray-800 dark:text-white align-middle" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>{recipe.name}</span>
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  <div>Serves: {recipe.servings || 4}</div>
                  <div>Time: {recipe.cookTime || '30'} minutes</div>
                  <div>Cuisine: {recipe.category || 'Unknown'}</div>
                  <div>Difficulty: {recipe.difficulty ? recipe.difficulty.charAt(0).toUpperCase() + recipe.difficulty.slice(1) : 'Unknown'}</div>
                </div>
                {/* Metallic shine effect */}
                <span className="absolute inset-0 pointer-events-none shine-effect" />
              </button>
            ))}
          </div>
        )}
        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700 text-center">
          <div className="inline-block px-4 py-2 rounded-lg bg-gray-50 dark:bg-gray-800">
            <span className="text-sm text-gray-400">{filteredRecipes.length} recipes found</span>
          </div>
        </div>
        {/* Recipe Details Pop-out */}
        {selectedRecipe && (
          <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50" onClick={e => e.target === e.currentTarget && setSelectedRecipe(null)}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedRecipe.emoji}</span>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>{selectedRecipe.name}</h3>
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-accent-pink" aria-label="Close recipe details">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 flex flex-col gap-4">
                {/* Photo */}
                {selectedRecipe.photo_url ? (
                  <div className="flex justify-center mb-2">
                    <img src={selectedRecipe.photo_url} alt={selectedRecipe.name + ' photo'} className="rounded-xl max-h-40 object-cover" />
                  </div>
                ) : (
                  <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center text-gray-400 text-sm mb-2">No photo</div>
                )}
                {/* Description */}
                <div className="text-gray-700 dark:text-gray-200 text-base min-h-[2rem]">
                  {selectedRecipe.description ? selectedRecipe.description : <span className="text-gray-400">No description</span>}
                </div>
                {/* Servings and Time */}
                <div className="mb-2 text-gray-500 text-sm flex items-center gap-3">
                  <Users className="w-4 h-4" />
                  <span>Serves {selectedRecipe.servings || 4}</span>
                  <Clock className="w-4 h-4 ml-4" />
                  <span>{selectedRecipe.cookTime || '30'} min</span>
                </div>
                {/* Ingredients */}
                <div>
                  <div className="font-semibold mb-1">Ingredients:</div>
                  {Array.isArray(selectedRecipe.ingredients_long) && selectedRecipe.ingredients_long.length > 0 ? (
                    <ul className="list-disc list-inside mb-2">
                      {selectedRecipe.ingredients_long.map((ing: string, idx: number) => (
                        <li key={idx}>{ing}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400">No ingredients</div>
                  )}
                </div>
                {/* Instructions */}
                <div>
                  <div className="font-semibold mb-1">Instructions:</div>
                  {selectedRecipe.instructions_long ? (
                    <div>{selectedRecipe.instructions_long}</div>
                  ) : selectedRecipe.instructions ? (
                    <div>{selectedRecipe.instructions}</div>
                  ) : (
                    <div className="text-gray-400">No instructions</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
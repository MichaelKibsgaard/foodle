'use client'

import React, { useState, useEffect, useRef } from 'react';
import { X, Search, Clock, Users } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface CookbookModalProps {
  onClose: () => void;
}

export const CookbookModal: React.FC<CookbookModalProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<any | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

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
        ) : recipes.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-800 text-center py-8 rounded-lg">
            <span className="text-gray-400">You must be signed in and have completed a recipe to see your cookbook.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 overflow-y-auto pr-2" style={{ maxHeight: '40vh', minHeight: '10vh' }}>
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
                  <div>Cuisine: {recipe.category ? recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1) : 'Unknown'}</div>
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
            <div ref={modalRef} className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-xl w-full mx-4 border border-gray-200 dark:border-gray-800 relative" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedRecipe.emoji}</span>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>{selectedRecipe.name}</h3>
                </div>
                <button onClick={() => setSelectedRecipe(null)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition focus:outline-none focus:ring-2 focus:ring-accent-pink no-export" aria-label="Close recipe details">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <button
                className="mb-4 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-sm transition no-export"
                onClick={async () => {
                  try {
                    const recipe = selectedRecipe;
                    const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' });
                    const pageWidth = doc.internal.pageSize.getWidth();
                    const pageHeight = doc.internal.pageSize.getHeight();
                    let y = 36;
                    // Title
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(22);
                    doc.setTextColor(34,197,94); // green accent
                    doc.text(recipe.name || 'Recipe', pageWidth / 2, y, { align: 'center' });
                    y += 10;
                    // Photo
                    let photoHeight = 0;
                    if (recipe.photo_url) {
                      try {
                        const img = new Image();
                        img.crossOrigin = 'Anonymous';
                        img.src = recipe.photo_url;
                        await new Promise((resolve, reject) => {
                          img.onload = resolve;
                          img.onerror = reject;
                        });
                        const imgWidth = 120;
                        photoHeight = 80;
                        doc.addImage(img, 'JPEG', (pageWidth - imgWidth) / 2, y, imgWidth, photoHeight);
                      } catch (e) {
                        // ignore image errors
                      }
                    } else {
                      // Placeholder
                      doc.setFillColor(220, 220, 220);
                      doc.rect((pageWidth - 120) / 2, y, 120, 80, 'F');
                      doc.setFontSize(12);
                      doc.setTextColor(180,180,180);
                      doc.text('No photo', pageWidth / 2, y + 40, { align: 'center' });
                    }
                    y += photoHeight + 16;
                    // Description
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(12);
                    doc.setTextColor(60,60,60);
                    const descLines = doc.splitTextToSize(recipe.description || 'No description', pageWidth - 60);
                    doc.text(descLines, pageWidth / 2, y, { align: 'center' });
                    y += descLines.length * 14 + 2; // less gap after description
                    // Username and Servings
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(11);
                    doc.setTextColor(120,120,120);
                    let metaParts = [];
                    if (recipe.username) metaParts.push(`By: ${recipe.username}`);
                    if (recipe.servings) metaParts.push(`Serves: ${recipe.servings}`);
                    const metaText = metaParts.join('   ');
                    if (metaText) {
                      doc.text(metaText, pageWidth / 2, y, { align: 'center' });
                      y += 16;
                    }
                    // Calculate starting Y for ingredients/instructions just below meta
                    const sectionStartY = y;
                    const sectionHeight = pageHeight - sectionStartY - 48;
                    // Section backgrounds
                    doc.setFillColor(245, 255, 245);
                    doc.rect(24, sectionStartY, (pageWidth / 2) - 32, sectionHeight, 'F');
                    doc.rect(pageWidth / 2 + 8, sectionStartY, (pageWidth / 2) - 32, sectionHeight, 'F');
                    // Ingredients (left)
                    let ingY = sectionStartY + 20;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.setTextColor(34,197,94);
                    doc.text('Ingredients', 36, ingY);
                    ingY += 14;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                    doc.setTextColor(60,60,60);
                    const ingredients = Array.isArray(recipe.ingredients_long) && recipe.ingredients_long.length > 0
                      ? recipe.ingredients_long
                      : typeof recipe.ingredients_long === 'string' && recipe.ingredients_long.trim().length > 0
                        ? recipe.ingredients_long.split('\n')
                        : Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0
                          ? recipe.ingredients
                          : [];
                    ingredients.forEach((ing: string) => {
                      doc.text(`- ${ing}`, 40, ingY);
                      ingY += 12;
                    });
                    // Instructions (right)
                    let instrY = sectionStartY + 20;
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(14);
                    doc.setTextColor(34,197,94);
                    doc.text('Instructions', pageWidth / 2 + 20, instrY);
                    instrY += 14;
                    doc.setFont('helvetica', 'normal');
                    doc.setFontSize(11);
                    doc.setTextColor(60,60,60);
                    const instructions = recipe.instructions_long || recipe.instructions || '';
                    const instrLines = doc.splitTextToSize(instructions, (pageWidth / 2) - 48);
                    doc.text(instrLines, pageWidth / 2 + 24, instrY);
                    // Foodle logo/text bottom right
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(10);
                    doc.setTextColor(180,180,180);
                    doc.text('Foodle', pageWidth - 40, pageHeight - 24);
                    doc.save(`${recipe.name || 'recipe'}.pdf`);
                  } catch (err) {
                    alert('Export to PDF failed. See console for details.');
                    console.error('Export to PDF error:', err);
                  }
                }}
              >
                Export to PDF
              </button>
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
                <div className="mb-2 text-gray-500 text-sm flex items-center gap-3 justify-center w-full">
                  <Users className="w-4 h-4" />
                  <span>Serves {selectedRecipe.servings || 4}</span>
                  <Clock className="w-4 h-4 ml-4" />
                  <span>{selectedRecipe.cookTime || '30'} min</span>
                  {/* Cuisine */}
                  <span className="ml-4 flex items-center gap-1">
                    <span role="img" aria-label="Cuisine">🍽️</span>
                    <span>{selectedRecipe.category ? selectedRecipe.category.charAt(0).toUpperCase() + selectedRecipe.category.slice(1) : 'Unknown'}</span>
                  </span>
                  {/* Difficulty */}
                  <span className="ml-4 flex items-center gap-1">
                    <span role="img" aria-label="Difficulty">🎯</span>
                    <span>{selectedRecipe.difficulty ? selectedRecipe.difficulty.charAt(0).toUpperCase() + selectedRecipe.difficulty.slice(1) : 'Unknown'}</span>
                  </span>
                </div>
                {/* Username and Instagram link row */}
                <div className="flex justify-center items-center gap-2 text-xs mb-2">
                  {/* Username */}
                  {selectedRecipe.username && selectedRecipe.username.trim() ? (
                    <span className="flex items-center font-semibold text-green-700 dark:text-green-400">
                      <svg className="w-4 h-4 mr-1 text-green-500" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.314 0-6 1.686-6 3.75V18h12v-2.25C16 13.686 13.314 12 10 12z" /></svg>
                      {selectedRecipe.username}
                    </span>
                  ) : (
                    <span className="flex items-center text-gray-400">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 20 20"><path d="M10 10a4 4 0 100-8 4 4 0 000 8zm0 2c-3.314 0-6 1.686-6 3.75V18h12v-2.25C16 13.686 13.314 12 10 12z" /></svg>
                      No Username
                    </span>
                  )}
                  {/* Instagram Link */}
                  {selectedRecipe.userlink && selectedRecipe.userlink.trim() ? (
                    <a
                      href={selectedRecipe.userlink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-2"
                    >
                      <svg className="w-4 h-4 mr-1 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5a4.25 4.25 0 01-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 2.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zm0 1.5a2.75 2.75 0 110 5.5 2.75 2.75 0 010-5.5zm5.25 1.25a1 1 0 110 2 1 1 0 010-2z" /></svg>
                      [Instagram]
                    </a>
                  ) : (
                    <span className="flex items-center text-gray-400 ml-2">
                      <svg className="w-4 h-4 mr-1 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M7.75 2A5.75 5.75 0 002 7.75v8.5A5.75 5.75 0 007.75 22h8.5A5.75 5.75 0 0022 16.25v-8.5A5.75 5.75 0 0016.25 2h-8.5zm0 1.5h8.5A4.25 4.25 0 0120.5 7.75v8.5a4.25 4.25 0 01-4.25 4.25h-8.5A4.25 4.25 0 013.5 16.25v-8.5A4.25 4.25 0 017.75 3.5zm4.25 2.75a4.25 4.25 0 100 8.5 4.25 4.25 0 000-8.5zm0 1.5a2.75 2.75 0 110 5.5 2.75 2.75 0 010-5.5zm5.25 1.25a1 1 0 110 2 1 1 0 010-2z" /></svg>
                      [No Instagram]
                    </span>
                  )}
                </div>
                {/* Ingredients */}
                <div>
                  <div className="font-semibold mb-1 text-green-700 dark:text-green-300 mt-6">Ingredients:</div>
                  {Array.isArray(selectedRecipe.ingredients_long) && selectedRecipe.ingredients_long.length > 0 ? (
                    <ul className="list-disc list-inside mb-2 text-gray-700 dark:text-gray-200 text-sm">
                      {selectedRecipe.ingredients_long.map((ing: string, idx: number) => (
                        <li key={idx}>{ing}</li>
                      ))}
                    </ul>
                  ) : typeof selectedRecipe.ingredients_long === 'string' && selectedRecipe.ingredients_long.trim().length > 0 ? (
                    <div className="mb-2 whitespace-pre-line text-gray-700 dark:text-gray-200 text-sm">{selectedRecipe.ingredients_long}</div>
                  ) : Array.isArray(selectedRecipe.ingredients) && selectedRecipe.ingredients.length > 0 ? (
                    <ul className="list-disc list-inside mb-2 text-gray-700 dark:text-gray-200 text-sm">
                      {selectedRecipe.ingredients.map((ing: string, idx: number) => (
                        <li key={idx}>{ing}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-gray-400 text-sm">No ingredients</div>
                  )}
                </div>
                {/* Instructions */}
                <div>
                  <div className="font-semibold mb-1 text-green-700 dark:text-green-300 mt-6">Instructions:</div>
                  {selectedRecipe.instructions_long ? (
                    <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line text-sm">{selectedRecipe.instructions_long}</div>
                  ) : selectedRecipe.instructions ? (
                    <div className="text-gray-700 dark:text-gray-200 whitespace-pre-line text-sm">{selectedRecipe.instructions}</div>
                  ) : (
                    <div className="text-gray-400 text-sm">No instructions</div>
                  )}
                </div>
              </div>
              <div className="absolute bottom-3 right-5 text-xs text-gray-400 select-none pointer-events-none foodle-footer" style={{fontFamily: 'Inter, sans-serif'}}>Foodle</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 
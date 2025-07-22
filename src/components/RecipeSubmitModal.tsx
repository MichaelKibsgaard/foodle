import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

const COMMON_INGREDIENTS = [
  'Eggs', 'Flour', 'Sugar', 'Salt', 'Butter', 'Milk', 'Chicken', 'Beef', 'Pasta', 'Rice', 'Tomato', 'Onion', 'Garlic', 'Cheese', 'Potato', 'Carrot', 'Pepper', 'Oil', 'Bread', 'Fish', 'Beans', 'Spinach', 'Mushroom', 'Lemon', 'Honey', 'Yogurt', 'Corn', 'Apple', 'Banana', 'Other (custom)'
];

const CUISINES = [
  'Italian', 'Mexican', 'Chinese', 'Indian', 'Japanese', 'Thai', 'Middle Eastern', 'Mediterranean', 'French', 'American', 'African', 'Other'
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export const RecipeSubmitModal: React.FC<{
  onClose: () => void,
  onSubmit: (data: any) => void,
  user: { email: string, name?: string } | null
}> = ({ onClose, onSubmit, user }) => {
  const [name, setName] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [ingredients, setIngredients] = useState<string[]>([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [customIngredient, setCustomIngredient] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [description, setDescription] = useState('');
  const [instructions, setInstructions] = useState('');
  const [servings, setServings] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitName, setSubmitName] = useState('');
  const [submitEmail, setSubmitEmail] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fullIngredients, setFullIngredients] = useState('');
  const [instagramLink, setInstagramLink] = useState('');

  // Ingredient add/remove logic
  const addIngredient = () => {
    const value = showCustom ? customIngredient.trim() : ingredientInput;
    if (value && !ingredients.includes(value)) {
      setIngredients([...ingredients, value]);
      setIngredientInput('');
      setCustomIngredient('');
      setShowCustom(false);
    }
  };
  const removeIngredient = (ing: string) => {
    setIngredients(ingredients.filter(i => i !== ing));
  };
  const handleIngredientChange = (val: string) => {
    if (val === 'Other (custom)') {
      setShowCustom(true);
      setIngredientInput('Other (custom)');
    } else {
      setShowCustom(false);
      setIngredientInput(val);
    }
  };

  // Image upload logic (Supabase Storage)
  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const { data, error } = await supabase.storage.from('recipe-images').upload(fileName, file);
    if (error) return null;
    const { data: publicUrlData } = supabase.storage.from('recipe-images').getPublicUrl(fileName);
    return publicUrlData?.publicUrl || null;
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !cuisine || !difficulty || !ingredients.length || !description || !instructions || !servings) return;
    setUploading(true);
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
    }
    // Parse full ingredient list as array (one per line, trimmed, non-empty)
    const ingredientsLongArr = fullIngredients
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    // Use logged-in email if not provided
    const finalEmail = submitEmail || user?.email || '';
    // Insert recipe into user_recipes table
    const { error } = await supabase.from('user_recipes').insert([
      {
        name,
        category: cuisine,
        difficulty: difficulty.toLowerCase(),
        ingredients,
        description,
        instructions,
        servings: Number(servings),
        image_url: imageUrl,
        submitter_name: user?.name || submitName,
        submitter_email: finalEmail,
        ingredients_long: ingredientsLongArr,
        instagram_link: instagramLink,
        created_at: new Date().toISOString(),
      },
    ]);
    setUploading(false);
    if (!error) {
      onClose();
    } else {
      alert('Error submitting recipe. Please try again.');
    }
  };

  // Only require name/email if not logged in
  const requireNameEmail = !user;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label="Submit Recipe Modal">
      <form className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4 border border-gray-200 dark:border-gray-800 animate-fade-in flex flex-col gap-4 overflow-y-auto max-h-[80vh]" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-2 text-gray-800 dark:text-white text-center" style={{ fontFamily: 'Inter, sans-serif', textShadow: 'none' }}>Submit Your Recipe</h2>
        <label className="flex flex-col gap-1">
          Recipe Name
          <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={name} onChange={e => setName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          Cuisine
          <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={cuisine} onChange={e => setCuisine(e.target.value)} required>
            <option value="">Select...</option>
            {CUISINES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Difficulty
          <select className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={difficulty} onChange={e => setDifficulty(e.target.value)} required>
            <option value="">Select...</option>
            {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          Game Ingredients
          <div className="flex gap-2">
            <select className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" value={ingredientInput} onChange={e => handleIngredientChange(e.target.value)}>
              <option value="">Select ingredient...</option>
              {COMMON_INGREDIENTS.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
            {showCustom && (
              <input className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" placeholder="Custom ingredient" value={customIngredient} onChange={e => setCustomIngredient(e.target.value)} />
            )}
            <button type="button" className="bg-green-500 text-white rounded-lg px-3 py-2 font-semibold hover:bg-green-600 transition" onClick={addIngredient}>Add</button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {ingredients.map(ing => (
              <span key={ing} className="bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-full px-3 py-1 text-sm flex items-center gap-1">
                {ing}
                <button type="button" className="ml-1 text-gray-500 hover:text-gray-700" onClick={() => removeIngredient(ing)} aria-label={`Remove ${ing}`}>×</button>
              </span>
            ))}
          </div>
        </label>
        <label className="flex flex-col gap-1">
          Description
          <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={description} onChange={e => setDescription(e.target.value)} required rows={2} />
        </label>
        <label className="flex flex-col gap-1">
          Full Ingredient List
          <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" placeholder="One ingredient per line" rows={3} value={fullIngredients} onChange={e => setFullIngredients(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Instructions
          <textarea className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-400" value={instructions} onChange={e => setInstructions(e.target.value)} required rows={3} />
        </label>
        <label className="flex flex-col gap-1">
          Servings
          <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" type="number" min="1" value={servings} onChange={e => setServings(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1">
          Instagram Link (optional)
          <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" type="url" placeholder="https://instagram.com/yourprofile" value={instagramLink} onChange={e => setInstagramLink(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1">
          Image (optional)
          <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" type="file" accept="image/*" onChange={e => setImageFile(e.target.files?.[0] || null)} />
        </label>
        {requireNameEmail && (
          <>
            <label className="flex flex-col gap-1">
              Name
              <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" value={submitName} onChange={e => setSubmitName(e.target.value)} required />
            </label>
            <label className="flex flex-col gap-1">
              Email
              <input className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-white px-3 py-2" type="email" value={submitEmail} onChange={e => setSubmitEmail(e.target.value)} required />
            </label>
          </>
        )}
        <div className="flex gap-2 mt-4">
          <button type="button" className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-4 py-2 font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition flex-1" onClick={onClose} disabled={uploading}>Cancel</button>
          <button type="submit" className="bg-accent-pink text-white rounded-lg px-4 py-2 font-semibold hover:bg-pink-500 transition flex-1" disabled={uploading}>{uploading ? 'Submitting...' : 'Submit'}</button>
        </div>
      </form>
    </div>
  );
}; 
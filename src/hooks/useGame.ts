import { useState, useEffect, useCallback } from 'react'
import { GameState, Recipe, Hint } from '@/types/game'
import { supabase } from '@/lib/supabase'

const MAX_ATTEMPTS = 5
const MAX_HINTS = 3

function getTodayAESTDateString() {
  const now = new Date();
  // Convert to AEST (UTC+10, no DST)
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds(),
    now.getUTCMilliseconds()
  );
  const nowInAEST = new Date(nowUTC + 10 * 60 * 60 * 1000);
  // If before 8am AEST, use previous day
  let year = nowInAEST.getUTCFullYear();
  let month = nowInAEST.getUTCMonth();
  let date = nowInAEST.getUTCDate();
  if (nowInAEST.getHours() < 8) {
    const prev = new Date(Date.UTC(year, month, date - 1));
    year = prev.getUTCFullYear();
    month = prev.getUTCMonth();
    date = prev.getUTCDate();
  }
  return new Date(Date.UTC(year, month, date)).toISOString().slice(0, 10);
}

function getLocalStorageKey() {
  return `foodle_game_state_${getTodayAESTDateString()}`;
}

export const useGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    currentRecipe: null,
    guessedIngredients: [],
    correctIngredients: [],
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    gameStatus: 'playing',
    hintsUsed: 0,
    maxHints: MAX_HINTS,
    startTime: Date.now(),
  })

  const [hints, setHints] = useState<Hint[]>([])
  const [inputValue, setInputValue] = useState('')
  const [loadingRecipe, setLoadingRecipe] = useState(true)

  // Add user state to check login
  const [user, setUser] = useState<any>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => setUser(user));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => { listener?.subscription.unsubscribe(); };
  }, []);

  // Load from localStorage if not logged in
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem(getLocalStorageKey());
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.currentRecipe && parsed.currentRecipe.ingredients) {
            setGameState(parsed);
            setHints(parsed.hints || []);
            setInputValue(parsed.inputValue || '');
          }
        } catch {}
      }
    }
  }, [user]);

  // Save to localStorage on gameState, hints, or inputValue change if not logged in
  useEffect(() => {
    if (!user) {
      const toSave = {
        ...gameState,
        hints,
        inputValue,
      };
      localStorage.setItem(getLocalStorageKey(), JSON.stringify(toSave));
    }
  }, [gameState, hints, inputValue, user]);

  // Fetch today's recipe by UTC date
  const fetchTodaysRecipe = useCallback(async () => {
    setLoadingRecipe(true)
    const today = getTodayAESTDateString()
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('date', today)
      .single()
    if (error || !recipe) {
      setGameState(prev => ({ ...prev, currentRecipe: null }))
      setLoadingRecipe(false)
      return
    }
    // If user is logged in, check if they've already completed this recipe
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: result } = await supabase
        .from('game_results')
        .select('*')
        .eq('user_id', user.id)
        .eq('recipe_id', recipe.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (result) {
        // Already played: set state to won/lost and show full recipe
        setGameState({
          currentRecipe: recipe,
          guessedIngredients: recipe.ingredients.map((i: string) => i.toLowerCase()),
          correctIngredients: recipe.ingredients.map((i: string) => i.toLowerCase()),
          attempts: result.attempts,
          maxAttempts: MAX_ATTEMPTS,
          gameStatus: result.won ? 'won' : 'lost',
          hintsUsed: result.hints_used,
          maxHints: MAX_HINTS,
          startTime: Date.now(),
          endTime: Date.now(),
        });
        setHints(recipe.ingredients.map((ingredient: string) => ({
          type: 'letter_count',
          ingredient,
          revealed: true,
        })));
        setInputValue('');
        setLoadingRecipe(false);
        return;
      }
    }
    // Not played yet: normal game start
    const newHints: Hint[] = recipe.ingredients.map((ingredient: string) => ({
      type: 'letter_count',
      ingredient,
      revealed: false,
    }))
    setGameState({
      currentRecipe: recipe,
      guessedIngredients: [],
      correctIngredients: [],
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      gameStatus: 'playing',
      hintsUsed: 0,
      maxHints: MAX_HINTS,
      startTime: Date.now(),
    })
    setHints(newHints)
    setInputValue('')
    setLoadingRecipe(false)
  }, [])

  // Initialize game on mount
  useEffect(() => {
    if (!user) {
      const saved = localStorage.getItem(getLocalStorageKey());
      let valid = false;
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.currentRecipe && Array.isArray(parsed.currentRecipe.ingredients) && parsed.currentRecipe.ingredients.length > 0) {
            valid = true;
          }
        } catch {}
      }
      if (!valid) {
        fetchTodaysRecipe();
      }
    } else {
      fetchTodaysRecipe();
    }
  }, [fetchTodaysRecipe, user]);

  // Make a guess
  const makeGuess = useCallback((ingredient: string) => {
    if (!gameState.currentRecipe || gameState.gameStatus !== 'playing') return

    const normalizedGuess = ingredient.toLowerCase().trim()
    const normalizedIngredients = gameState.currentRecipe.ingredients.map(i => i.toLowerCase())

    // Helper for plural/singular and substring matching
    function isAdjacentMatch(guess: string, ingredient: string) {
      // Exact match
      if (guess === ingredient) return true;
      // Plural/singular (basic)
      if (guess.endsWith('s') && guess.slice(0, -1) === ingredient) return true;
      if (ingredient.endsWith('s') && ingredient.slice(0, -1) === guess) return true;
      // Substring (multi-word)
      if (ingredient.includes(guess) || guess.includes(ingredient)) return true;
      return false;
    }

    // Find a matching ingredient (adjacent logic)
    const matchedIngredient = normalizedIngredients.find(ing => isAdjacentMatch(normalizedGuess, ing));

    // If already guessed, do nothing
    if (gameState.guessedIngredients.includes(normalizedGuess)) {
      setInputValue('')
      return
    }

    if (matchedIngredient) {
      // Correct guess, only if not already in correctIngredients
      // Use the canonical ingredient for correctIngredients
      const canonical = matchedIngredient;
      if (!gameState.correctIngredients.includes(canonical)) {
        const newCorrectIngredients = [...gameState.correctIngredients, canonical]
        const newGuessedIngredients = [...gameState.guessedIngredients, normalizedGuess]

        setGameState(prev => ({
          ...prev,
          correctIngredients: newCorrectIngredients,
          guessedIngredients: newGuessedIngredients,
          // attempts is NOT incremented for correct guesses
          gameStatus: newCorrectIngredients.length === gameState.currentRecipe!.ingredients.length ? 'won' : 'playing',
          endTime: newCorrectIngredients.length === gameState.currentRecipe!.ingredients.length ? Date.now() : undefined,
        }))
      } else {
        // Already in correctIngredients, just add to guessedIngredients if not present (shouldn't happen, but for safety)
        setGameState(prev => ({
          ...prev,
          guessedIngredients: prev.guessedIngredients.includes(normalizedGuess) ? prev.guessedIngredients : [...prev.guessedIngredients, normalizedGuess],
        }))
      }
    } else {
      // Incorrect guess
      setGameState(prev => ({
        ...prev,
        guessedIngredients: [...prev.guessedIngredients, normalizedGuess],
        attempts: prev.attempts + 1,
        gameStatus: prev.attempts + 1 >= MAX_ATTEMPTS ? 'lost' : 'playing',
        endTime: prev.attempts + 1 >= MAX_ATTEMPTS ? Date.now() : undefined,
      }))
    }

    setInputValue('')
  }, [gameState])

  // Use hint
  const useHint = useCallback(() => {
    if (gameState.hintsUsed >= MAX_HINTS || !gameState.currentRecipe) return

    const unrevealedHints = hints.filter(hint => !hint.revealed)
    if (unrevealedHints.length === 0) return

    const hintToReveal = unrevealedHints[0]
    const hintIndex = hints.findIndex(hint => hint.ingredient === hintToReveal.ingredient)

    setHints(prev => prev.map((hint, index) => 
      index === hintIndex 
        ? { ...hint, revealed: true }
        : hint
    ))

    setGameState(prev => ({
      ...prev,
      hintsUsed: prev.hintsUsed + 1,
    }))
  }, [gameState.hintsUsed, hints])

  // Handle input submission
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (inputValue.trim()) {
      makeGuess(inputValue)
    }
  }, [inputValue, makeGuess])

  // Save stats to Supabase after game ends
  useEffect(() => {
    const saveStats = async () => {
      if (!gameState.currentRecipe || !['won', 'lost'].includes(gameState.gameStatus)) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      // Save game result for both win and loss
      await supabase.from('game_results').insert([
        {
          user_id: user.id,
          recipe_id: gameState.currentRecipe.id,
          recipe_name: gameState.currentRecipe.name,
          attempts: gameState.attempts,
          hints_used: gameState.hintsUsed,
          time_spent: gameState.endTime && gameState.startTime ? gameState.endTime - gameState.startTime : 0,
          won: gameState.gameStatus === 'won',
          created_at: new Date().toISOString(),
        },
      ]);
      // Fetch current stats
      let { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      const won = gameState.gameStatus === 'won';
      const today = new Date();
      const todayStr = today.toISOString().slice(0, 10);
      let newStats = {
        games_played: 1,
        games_won: won ? 1 : 0,
        current_streak: won ? 1 : 0,
        best_streak: won ? 1 : 0,
        last_played: today.toISOString(),
      };
      let streakUpdatedToday = false;
      if (stats) {
        newStats.games_played = stats.games_played + 1;
        newStats.games_won = stats.games_won + (won ? 1 : 0);
        // Check last_played date for streak logic
        if (won) {
          const lastPlayedDate = stats.last_played ? new Date(stats.last_played) : null;
          if (lastPlayedDate) {
            // Calculate difference in days (UTC)
            const lastPlayedUTC = Date.UTC(lastPlayedDate.getUTCFullYear(), lastPlayedDate.getUTCMonth(), lastPlayedDate.getUTCDate());
            const todayUTC = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
            const diffDays = Math.floor((todayUTC - lastPlayedUTC) / (1000 * 60 * 60 * 24));
            if (diffDays === 1) {
              // Consecutive day, increment streak
              newStats.current_streak = stats.current_streak + 1;
              streakUpdatedToday = true;
            } else if (diffDays === 0) {
              // Already played today, keep streak
              newStats.current_streak = stats.current_streak;
            } else {
              // Missed a day, reset streak
              newStats.current_streak = 1;
              streakUpdatedToday = true;
            }
          } else {
            newStats.current_streak = 1;
            streakUpdatedToday = true;
          }
        } else {
          // Lost, reset streak
          newStats.current_streak = 0;
        }
        newStats.best_streak = won
          ? Math.max(stats.best_streak, newStats.current_streak)
          : stats.best_streak;
        newStats.last_played = today.toISOString();
      } else {
        if (won) streakUpdatedToday = true;
      }
      await supabase.from('user_stats').upsert({
        user_id: user.id,
        ...newStats,
      });
      // Optionally, you can set a state here to trigger animation in the header
      // e.g., setStreakUpdatedToday(streakUpdatedToday);
    };
    saveStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus]);

  // Start a practice game with a given recipe
  const startPracticeGame = useCallback((recipe: Recipe) => {
    const newHints: Hint[] = recipe.ingredients.map((ingredient: string) => ({
      type: 'letter_count',
      ingredient,
      revealed: false,
    }));
    setGameState({
      currentRecipe: recipe,
      guessedIngredients: [],
      correctIngredients: [],
      attempts: 0,
      maxAttempts: MAX_ATTEMPTS,
      gameStatus: 'playing',
      hintsUsed: 0,
      maxHints: MAX_HINTS,
      startTime: Date.now(),
    });
    setHints(newHints);
    setInputValue('');
  }, []);

  return {
    gameState,
    hints,
    inputValue,
    setInputValue,
    makeGuess,
    useHint,
    handleSubmit,
    startNewGame: fetchTodaysRecipe,
    loadingRecipe,
    startPracticeGame,
  }
} 
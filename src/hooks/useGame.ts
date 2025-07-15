import { useState, useEffect, useCallback } from 'react'
import { GameState, Recipe, Hint } from '@/types/game'
import { supabase } from '@/lib/supabase'

const MAX_ATTEMPTS = 5
const MAX_HINTS = 3

function getTodayUTCDateString() {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString().slice(0, 10)
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

  // Fetch today's recipe by UTC date
  const fetchTodaysRecipe = useCallback(async () => {
    setLoadingRecipe(true)
    const today = getTodayUTCDateString()
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
    fetchTodaysRecipe()
  }, [fetchTodaysRecipe])

  // Make a guess
  const makeGuess = useCallback((ingredient: string) => {
    if (!gameState.currentRecipe || gameState.gameStatus !== 'playing') return

    const normalizedGuess = ingredient.toLowerCase().trim()
    const normalizedIngredients = gameState.currentRecipe.ingredients.map(i => i.toLowerCase())

    if (normalizedIngredients.includes(normalizedGuess)) {
      // Correct guess
      const newCorrectIngredients = [...gameState.correctIngredients, normalizedGuess]
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
      // Fetch current stats
      let { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();
      const won = gameState.gameStatus === 'won';
      let newStats = {
        games_played: 1,
        games_won: won ? 1 : 0,
        current_streak: won ? 1 : 0,
        best_streak: won ? 1 : 0,
        last_played: new Date().toISOString(),
      };
      if (stats) {
        newStats.games_played = stats.games_played + 1;
        newStats.games_won = stats.games_won + (won ? 1 : 0);
        newStats.current_streak = won ? stats.current_streak + 1 : 0;
        newStats.best_streak = won
          ? Math.max(stats.best_streak, stats.current_streak + 1)
          : stats.best_streak;
        newStats.last_played = new Date().toISOString();
      }
      await supabase.from('user_stats').upsert({
        user_id: user.id,
        ...newStats,
      });
    };
    saveStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus]);

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
  }
} 
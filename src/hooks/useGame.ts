import { useState, useEffect, useCallback } from 'react'
import { GameState, Recipe, Hint } from '@/types/game'
import { getRandomRecipe } from '@/lib/gameData'

const MAX_ATTEMPTS = 5
const MAX_HINTS = 3

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

  // Initialize new game
  const startNewGame = useCallback(() => {
    const recipe = getRandomRecipe()
    const newHints: Hint[] = recipe.ingredients.map(ingredient => ({
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
  }, [])

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

  // Initialize game on mount
  useEffect(() => {
    startNewGame()
  }, [startNewGame])

  return {
    gameState,
    hints,
    inputValue,
    setInputValue,
    makeGuess,
    useHint,
    handleSubmit,
    startNewGame,
  }
} 
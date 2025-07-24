import React from 'react';

interface GuessHistoryProps {
  guesses: string[];
  correctIngredients: string[];
}

export const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses, correctIngredients }) => {
  // Adjacent match logic (copied from useGame)
  function isAdjacentMatch(guess: string, ingredient: string) {
    guess = guess.toLowerCase();
    ingredient = ingredient.toLowerCase();
    if (guess === ingredient) return true;
    if (guess.endsWith('s') && guess.slice(0, -1) === ingredient) return true;
    if (ingredient.endsWith('s') && ingredient.slice(0, -1) === guess) return true;
    if (ingredient.includes(guess) || guess.includes(ingredient)) return true;
    return false;
  }
  // Find the matched ingredient for a guess
  function getMatchedIngredient(guess: string) {
    return correctIngredients.find(ing => isAdjacentMatch(guess, ing));
  }
  return (
    <div className="guess-history bg-gray-200 rounded-2xl p-4 w-60 min-h-[200px] shadow-lg flex flex-col items-center" role="region" aria-label="Guess History">
      <h3 className="guess-history-title font-bold text-base mb-3 text-gray-700">Your Guesses</h3>
      <div className="flex flex-col gap-2 w-full">
        {guesses.length === 0 ? (
          <div className="text-gray-400 text-center text-sm">No guesses yet.</div>
        ) : (
          guesses.map((guess, idx) => {
            const matched = getMatchedIngredient(guess);
            const isCorrect = !!matched;
            let display;
            if (isCorrect && matched) {
              // Bold the matching part, rest green
              const guessLower = guess.toLowerCase();
              const matchedLower = matched.toLowerCase();
              let start = guessLower.indexOf(matchedLower);
              if (start === -1 && matchedLower.indexOf(guessLower) === 0) {
                // Guess is a prefix of the ingredient
                start = 0;
              }
              if (start >= 0) {
                display = (
                  <span className="truncate max-w-[120px]">
                    {guess.slice(0, start)}
                    <b className="font-extrabold text-green-800" style={{ textShadow: '0 1px 2px #a7f3d0, 0 0 1px #065f46', fontWeight: 900 }}>{guess.slice(start, start + matched.length)}</b>
                    <span className="text-green-800">{guess.slice(start + matched.length)}</span>
                  </span>
                );
              } else {
                // Fallback: just bold the whole guess
                display = <b className="font-extrabold text-green-800" style={{ textShadow: '0 1px 2px #a7f3d0, 0 0 1px #065f46', fontWeight: 900 }}>{guess}</b>;
              }
            } else {
              display = <span className="truncate max-w-[120px]">{guess}</span>;
            }
            return (
              <div
                key={idx}
                className={`guess-history-item flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-sm focus:outline-none focus:ring-2 focus:ring-accent-pink transition-all duration-150 ${
                  isCorrect
                    ? 'bg-green-200 text-green-800 border-2 border-green-400'
                    : 'bg-red-100 text-red-600 border-2 border-red-300'
                }`}
                tabIndex={0}
                aria-label={isCorrect ? `${guess} (correct)` : `${guess} (incorrect)`}
              >
                {display}
                {isCorrect ? (
                  <span className="ml-2" aria-label="Correct guess">✔️</span>
                ) : (
                  <span className="ml-2" aria-label="Incorrect guess">❌</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}; 
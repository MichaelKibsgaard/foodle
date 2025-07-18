import React from 'react';

interface GuessHistoryProps {
  guesses: string[];
  correctIngredients: string[];
}

export const GuessHistory: React.FC<GuessHistoryProps> = ({ guesses, correctIngredients }) => {
  return (
    <div className="bg-gray-200 rounded-2xl p-4 w-60 min-h-[200px] shadow-lg flex flex-col items-center" role="region" aria-label="Guess History">
      <h3 className="font-bold text-lg mb-3 text-gray-700">Your Guesses</h3>
      <div className="flex flex-col gap-2 w-full">
        {guesses.length === 0 ? (
          <div className="text-gray-400 text-center">No guesses yet.</div>
        ) : (
          guesses.map((guess, idx) => {
            const isCorrect = correctIngredients.includes(guess);
            return (
              <div
                key={idx}
                className={`flex items-center justify-between px-3 py-2 rounded-xl font-semibold text-base focus:outline-none focus:ring-2 focus:ring-accent-pink transition-all duration-150 ${
                  isCorrect
                    ? 'bg-green-200 text-green-800 border-2 border-green-400'
                    : 'bg-red-100 text-red-600 border-2 border-red-300'
                }`}
                tabIndex={0}
                aria-label={isCorrect ? `${guess} (correct)` : `${guess} (incorrect)`}
              >
                <span className="truncate max-w-[120px]">{guess}</span>
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
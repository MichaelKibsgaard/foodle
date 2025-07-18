import React from 'react'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'FOODLE - Food Ingredient Guessing Game',
  description: 'Guess the ingredients in delicious recipes! A Wordle-inspired food guessing game.',
  keywords: ['foodle', 'wordle', 'food', 'game', 'ingredients', 'recipes', 'guessing'],
  authors: [{ name: 'Foodle Team' }],
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="font-sans antialiased">
        <div className="arcade-banner">🍔 FOODLE ARCADE EDITION 🍔</div>
        {children}
        <div className="scanlines" />
      </body>
    </html>
  );
} 
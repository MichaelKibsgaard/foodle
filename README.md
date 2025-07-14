# 🍽️ Foodle - Food Ingredient Guessing Game

A fun and modern web-based word-guessing game similar to Wordle, but instead of guessing 5-letter words, you guess the ingredients needed to make delicious dishes!

## 🎮 How to Play

1. **See the Food**: A food emoji and name will be displayed at the top
2. **Guess Ingredients**: Type in ingredient names and click "Guess" or press Enter
3. **5 Chances**: You have 5 attempts to find all the ingredients
4. **Get Hints**: Use the "Get Hint" button for help when stuck
5. **Build Your Collection**: Successfully complete recipes to add them to your collection

## ✨ Features

### Core Gameplay
- **Variable Ingredient Count**: Each recipe has different numbers of ingredients (3-7 ingredients)
- **5 Guesses**: Limited attempts to find all ingredients
- **Real-time Feedback**: Immediate feedback on correct/incorrect guesses
- **Progress Tracking**: See how many ingredients you've found
- **Difficulty Levels**: Easy, Medium, and Hard recipes with visual indicators
- **Advanced Scoring**: Score based on speed, efficiency, and hint usage

### Hint System
- **First Hint**: Reveals the number of letters in an ingredient
- **Second Hint**: Reveals the first letter of an ingredient
- **Third Hint**: Reveals the complete ingredient name
- **Visual Indicators**: Pulsing lightbulb icons show hint usage

### Social Features
- **Share Results**: Share your game results in Wordle-style format
- **Social Media Integration**: Share on Twitter and WhatsApp
- **Copy to Clipboard**: Easy sharing of results

### Accessibility & Polish
- **Keyboard Shortcuts**: Full keyboard navigation support
- **Sound Effects**: Optional audio feedback for game events
- **Offline Support**: Service worker for offline play
- **Achievement System**: Unlock badges for special accomplishments
- **Dark Mode Support**: Automatic dark mode detection

### Player Progress
- **Recipe Collection**: Track all recipes you've successfully completed
- **Persistent Storage**: Your progress is saved locally in your browser
- **Statistics**: View total games played and recipes learned
- **Collection View**: Browse all your learned recipes with ingredients

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS with custom glass morphism design
- **Backend**: Supabase (PostgreSQL + Real-time subscriptions)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Deployment**: Vercel (recommended)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (for backend features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd foodle-game
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Set up the database tables**
   Run the following SQL in your Supabase SQL editor:

   ```sql
   -- Create recipes table
   CREATE TABLE recipes (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     name TEXT NOT NULL,
     emoji TEXT NOT NULL,
     ingredients TEXT[] NOT NULL,
     difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')) NOT NULL,
     category TEXT NOT NULL,
     description TEXT,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Create game_results table
   CREATE TABLE game_results (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id),
     recipe_id UUID REFERENCES recipes(id),
     recipe_name TEXT NOT NULL,
     attempts INTEGER NOT NULL,
     hints_used INTEGER NOT NULL,
     time_spent INTEGER NOT NULL,
     won BOOLEAN NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );

   -- Enable Row Level Security
   ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;
   ALTER TABLE game_results ENABLE ROW LEVEL SECURITY;

   -- Create policies
   CREATE POLICY "Recipes are viewable by everyone" ON recipes
     FOR SELECT USING (true);

   CREATE POLICY "Users can insert their own game results" ON game_results
     FOR INSERT WITH CHECK (auth.uid() = user_id);

   CREATE POLICY "Users can view their own game results" ON game_results
     FOR SELECT USING (auth.uid() = user_id);
   ```

3. **Insert sample data**
   ```sql
   INSERT INTO recipes (name, emoji, ingredients, difficulty, category, description) VALUES
   ('Margherita Pizza', '🍕', ARRAY['flour', 'tomato', 'mozzarella', 'basil', 'olive oil'], 'medium', 'Italian', 'Classic Italian pizza with fresh ingredients'),
   ('Chocolate Chip Cookies', '🍪', ARRAY['flour', 'butter', 'sugar', 'eggs', 'chocolate chips', 'vanilla'], 'easy', 'Dessert', 'Soft and chewy chocolate chip cookies'),
   ('Caesar Salad', '🥗', ARRAY['lettuce', 'parmesan', 'croutons', 'lemon', 'garlic', 'anchovies'], 'easy', 'Salad', 'Fresh and tangy Caesar salad');
   ```

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main game page
├── components/         # React components
│   ├── Header.tsx      # Game header with stats
│   ├── RecipeDisplay.tsx # Recipe information display
│   ├── IngredientGrid.tsx # Guessed ingredients grid
│   ├── GameInput.tsx   # Input form for guesses
│   └── GameResult.tsx  # Win/lose result screen
├── hooks/              # Custom React hooks
│   └── useGame.ts      # Game state management
├── lib/                # Utility libraries
│   ├── supabase.ts     # Supabase client configuration
│   └── gameData.ts     # Sample game data
└── types/              # TypeScript type definitions
    └── game.ts         # Game-related types
```

## 🎨 Design System

The game uses a modern glass morphism design with:

- **Glass Cards**: Semi-transparent backgrounds with backdrop blur
- **Gradient Backgrounds**: Beautiful color transitions
- **Smooth Animations**: Hover effects and transitions
- **Responsive Design**: Works on all device sizes
- **Dark Mode**: Automatic dark mode detection and support

### Color Palette
- **Primary**: Orange (#ed7516) - Warm and appetizing
- **Success**: Green (#10b981) - Correct guesses
- **Error**: Red (#ef4444) - Incorrect guesses
- **Warning**: Yellow (#f59e0b) - Hints and warnings

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Connect your GitHub repository to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on push

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by Wordle and similar word-guessing games
- Built with modern web technologies
- Special thanks to the Supabase team for the amazing backend platform

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Check the documentation
- Join our community discussions

---

**Happy cooking and guessing! 🍳✨** 
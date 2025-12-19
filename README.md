# 🃏 Xerekinha - The Ultimate Online Card Game

A real-time multiplayer card game for 2-10 players, built with Next.js and Socket.IO.



## 🎮 Features

- **Real-time Multiplayer**: 2-10 players per room with live synchronization
- **Three Difficulty Levels**: Easy (3 questions), Normal (5 questions), Hard (7 questions)
- **Optional Truco! Rule**: Bet against other players' answers for extra stakes
- **Multilingual**: English, Português (Brasil), Magyar
- **Mobile-First Design**: Optimized for phones but works great on desktop
- **Live Leaderboard**: Track drinks in real-time
- **Sound Effects**: Immersive audio feedback

## 🎯 Game Rules

### Setup Phase
1. Players join a room using a 6-character code
2. The room creator becomes the Dealer
3. Dealer selects difficulty and whether to enable Truco!
4. A card pyramid is built (5-4-3-2-(1+players) cards)

### Question Phase
Each player answers questions about the next card to be drawn:

**Easy Mode:**
1. Is the next card Odd or Even?
2. Is the next card Higher or Lower than your last card?
3. Is the next card Inside or Outside your first two cards' range?

**Normal Mode:** (includes Easy questions +)
4. What is the suit of the next card?
5. Do you already have a card of this suit?

**Hard Mode:** (includes all questions +)
6. What is the number/face of the next card?
7. Do you already have a card of this number?

- **Correct Answer**: All other players take 1 drink
- **Wrong Answer**: You take 1 drink

### Truco! Rule (Optional)
Before a card is revealed, other players can call "Truco!" to bet against the current player:
- If the player was **correct**: Truco callers take 1 additional drink each
- If the player was **wrong**: The player takes 1 additional drink per Truco caller

### Revelation Phase
The Dealer reveals pyramid cards one by one:
- **Row 1**: Matching cards = Take 1 drink each
- **Row 2**: Matching cards = Give 2 drinks each
- **Row 3**: Matching cards = Take 3 drinks each
- **Row 4**: Matching cards = Give 4 drinks each
- **Row 5**: Matching cards = Take 5 drinks each

If no one has a matching card, everyone takes 1 drink!

## 🚀 Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd Card-Game

# Install dependencies
npm install

# Create environment file
# Create a file named .env.local with:
# NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
# PORT=3001
# CLIENT_URL=http://localhost:3000
```

### Development

Run both the Next.js frontend and Socket.IO server:

```bash
# Run both servers concurrently
npm run dev:all

# Or run them separately:
# Terminal 1 - Next.js frontend
npm run dev

# Terminal 2 - Socket.IO server
npm run dev:server
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Sound Files

Place sound files in `public/sounds/`:
- `card-flip.mp3` - Card flip effect
- `card-deal.mp3` - Card deal sound
- `correct.mp3` - Correct answer
- `wrong.mp3` - Wrong answer
- `drink.mp3` - Drink notification
- `truco.mp3` - Truco call
- `bell.mp3` - General notification
- `success.mp3` - Success sound
- `click.mp3` - Button click

You can find free sound effects at [freesound.org](https://freesound.org) or [mixkit.co](https://mixkit.co).

## 🌐 Deployment

### Deploy to Render (Recommended)

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:server & npm run start`
   - **Environment Variables**:
     - `PORT`: 3001
     - `CLIENT_URL`: Your frontend URL
     - `NEXT_PUBLIC_SOCKET_URL`: Your Render service URL

### Separate Frontend and Backend

For production, you may want to deploy:
- Frontend (Next.js) → Vercel
- Backend (Socket.IO) → Render/Railway

Configure environment variables accordingly.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home screen
│   ├── lobby/[roomId]/    # Game lobby
│   ├── game/[roomId]/     # Main game view
│   └── credits/           # Credits page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── Providers.tsx     # Context providers wrapper
├── lib/                   # Core libraries
│   ├── game-engine/      # Card logic, rules, calculations
│   ├── socket/           # Socket.IO client context
│   ├── i18n/             # Internationalization
│   └── sound/            # Sound system
├── messages/             # Translation files
│   ├── en.json
│   ├── pt-BR.json
│   └── hu.json
└── server/               # Socket.IO server
    └── index.ts
```

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, CSS Modules
- **Real-time**: Socket.IO
- **Sound**: Howler.js
- **Internationalization**: Custom i18n context

## 📜 License

MIT License - Feel free to use this for your own projects!

## 🍺 Disclaimer

Please drink responsibly. This game is intended for adults of legal drinking age. Non-alcoholic beverages can be substituted for a fun experience without alcohol.

# Scribble.io Clone

A full-featured, real-time multiplayer drawing and guessing game inspired by skribbl.io! Built with React, TypeScript, Vite, Node.js, Express, and Socket.IO.

## 🎨 Features

### Must Have Features
✅ **Create room with configurable settings**: Customize rounds, time per turn, and max players
✅ **Join room via link or code**: Use room code or invite link to join
✅ **Lobby with player list; host starts game**: See who's in the room before starting
✅ **Turn-based rounds**: One drawer, others guess, automatic turn rotation
✅ **Real-time drawing sync**: All strokes visible to all players instantly
✅ **Word selection for drawer**: 3 word choices for the drawer
✅ **Guessing**: Type to guess, get points for correct guesses
✅ **Scoring and leaderboard**: Points based on guess speed, final leaderboard
✅ **Game end with winner**: Celebrate the winner at the end
✅ **Basic drawing tools**: Brush, colors, undo, clear

### Should Have Features
✅ **Hints**: Reveal letters over time (every 15 seconds)
✅ **Chat**: Real-time chat for guesses and messages
✅ **Draw time countdown**: 60-second timer per turn
✅ **Private rooms**: Invite links with room code in URL

### Additional Features
🎨 **Beautiful UI**: Modern gradient design with smooth animations
🧽 **Eraser tool**: Switch between pen and eraser
🎯 **Round tracking**: See current round and total rounds
🔢 **Word bank**: 60+ words to draw
📋 **One-click invite copy**: Copy invite link to clipboard
🏆 **Winner celebration**: Gold background for the winner

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast dev server and build tool
- **Socket.IO Client** - Real-time communication

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **Socket.IO** - Real-time bidirectional communication
- **CORS** - Cross-origin resource sharing

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or navigate to the project**:
```bash
cd scribble.io
```

2. **Install all dependencies**:
```bash
npm install
cd frontend && npm install && cd ../backend && npm install && cd ..
```

### Running the App

#### Option 1: Run both servers together (recommended)
```bash
npm run dev
```
This will start:
- Frontend at http://localhost:5173
- Backend at http://localhost:3001

#### Option 2: Run separately
```bash
# Frontend only
npm run frontend

# Backend only (in another terminal)
npm run backend
```

## 🎮 How to Play

### Creating a Room
1. Open the app at http://localhost:5173
2. Enter your username
3. Customize room settings (optional):
   - Number of rounds (1-10)
   - Time per turn (30-120 seconds)
   - Max players (2-12)
4. Click **Create Room**
5. Copy the invite link or room code and share it with friends!

### Joining a Room
1. Open the app at http://localhost:5173
2. Enter your username
3. Either:
   - Paste the invite link (the room code will be auto-filled)
   - Or manually enter the room code
4. Click **Join Room**

### Gameplay
1. Once everyone has joined, the host clicks **Start Game**
2. When it's your turn to draw:
   - Choose 1 of 3 word options
   - Use the drawing tools to illustrate the word
   - Use undo to fix mistakes!
3. When you're guessing:
   - Type your guess in the chat box
   - Guess quickly for more points!
   - Watch for hints that reveal letters over time
4. After all rounds are complete, the winner is announced!

### Scoring
- **Guessers**: Points = max(10, time remaining)
  - Faster guesses = more points!
  - Minimum 10 points per correct guess
- **Drawers**: 5 points for each correct guess

## 📦 Deployment

### Backend Deployment (Render/Railway)

1. **Deploy the `backend` folder** to Render or Railway
2. **Set environment variable**: `PORT` (Render/Railway handle this automatically)
3. **Update frontend**: Change the socket URL in `frontend/src/socket.ts` to your deployed backend URL

### Frontend Deployment (Vercel/Netlify)

1. **Deploy the `frontend` folder** to Vercel or Netlify
2. **Build command**: `npm run build`
3. **Output directory**: `dist`
4. **Environment variable**: Set `VITE_SOCKET_URL` (optional) to your deployed backend URL

## 📁 Project Structure

```
scribble.io/
├── frontend/                 # React + TypeScript frontend
│   ├── src/
│   │   ├── App.tsx          # Main app component
│   │   ├── Canvas.tsx       # Drawing canvas with tools
│   │   ├── Game.tsx         # Game screen component
│   │   ├── GameEnd.tsx      # Game end/leaderboard screen
│   │   ├── Lobby.tsx        # Lobby screen with settings
│   │   ├── WordSelection.tsx # Word selection for drawer
│   │   ├── App.css          # All styling
│   │   ├── main.tsx         # React entry point
│   │   ├── socket.ts        # Socket.IO client setup
│   │   └── types.ts         # TypeScript interfaces
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── backend/                  # Node.js + Express backend
│   ├── server.js            # Express server with Socket.IO
│   └── package.json
├── package.json              # Root package.json
└── README.md
```

## 🎯 Future Enhancements

- [ ] Custom word lists
- [ ] Drawing redo
- [ ] Shapes tool (rectangle, circle, line)
- [ ] Fill bucket
- [ ] Sound effects
- [ ] Background music
- [ ] User profiles with avatars
- [ ] Private rooms with passwords
- [ ] Spectator mode
- [ ] Multiple languages
- [ ] Themes/dark mode
- [ ] Chat commands
- [ ] Vote to kick
- [ ] AFK detection

## 📝 License

MIT License - feel free to use this project for learning or building your own games!

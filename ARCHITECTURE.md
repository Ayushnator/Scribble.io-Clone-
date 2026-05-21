# Scribble.io Clone - Architecture Overview & Code Walkthrough

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Tech Stack Explanation](#tech-stack-explanation)
3. [WebSocket Integration](#websocket-integration)
4. [Canvas Implementation](#canvas-implementation)
5. [Game Logic Flow](#game-logic-flow)
6. [Data Flow](#data-flow)
7. [Key Components](#key-components)
8. [Tech Choices](#tech-choices)

---

## Architecture Overview

The Scribble.io Clone is a real-time multiplayer game built with a **client-server architecture** using WebSockets for bidirectional communication.

```
┌─────────────────────────────────────────────────────────────────┐
│                          Frontend (Client)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │    Lobby     │  │     Game     │  │  Game End    │          │
│  │  (React)     │  │  (React)     │  │  (React)     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                      │
│  ┌──────▼──────────────────────────────────▼──────────────────┐  │
│  │                     Socket.IO Client                        │  │
│  │         (Real-time bidirectional communication)            │  │
│  └─────────────────────────────┬──────────────────────────────┘  │
└────────────────────────────────┼──────────────────────────────────┘
                                 │
                         WebSocket (TCP)
                                 │
┌────────────────────────────────┼──────────────────────────────────┐
│  ┌─────────────────────────────▼──────────────────────────────┐  │
│  │                   Socket.IO Server                          │  │
│  │              (Real-time event handling)                    │  │
│  └─────────────────────────────┬──────────────────────────────┘  │
│                                │                                   │
│  ┌─────────────────────────────▼──────────────────────────────┐  │
│  │                    Game Logic Engine                        │  │
│  │  - Room management                                          │  │
│  │  - Turn-based gameplay                                     │  │
│  │  - Scoring system                                          │  │
│  │  - Word selection                                          │  │
│  │  - Timer management                                        │  │
│  └────────────────────────────────────────────────────────────┘  │
│                          Backend (Server)                          │
└──────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack Explanation

### Frontend
- **React 18**: Modern React with hooks (useState, useEffect) for component state management
- **TypeScript**: Type safety for better development experience and fewer bugs
- **Vite**: Lightning-fast dev server and build tool with HMR (Hot Module Replacement)
- **Socket.IO Client**: Real-time communication with the backend
- **HTML5 Canvas**: Native browser API for drawing

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express**: Web framework for serving static files (though we use Socket.IO primarily)
- **Socket.IO**: Real-time bidirectional event-based communication
- **Nodemon**: Auto-reloads server during development
- **CORS**: Cross-origin resource sharing (allows frontend to connect to backend)

---

## WebSocket Integration

### How WebSockets Work in this Project

WebSockets provide a **persistent, full-duplex communication channel** between the client and server, which is perfect for real-time games like Scribble.io!

### Key Socket Events

#### From Client → Server
| Event Name | Purpose |
|------------|---------|
| `create_room` | Create a new game room with settings |
| `join_room` | Join an existing room with a room code |
| `start_game` | Start the game for the room |
| `select_word` | Choose a word to draw |
| `draw_move` | Send drawing stroke data |
| `undo_draw` | Undo last drawing action |
| `clear_canvas` | Clear the entire canvas |
| `guess` | Send a guess for the word |

#### From Server → Client
| Event Name | Purpose |
|------------|---------|
| `room_created` | Confirm room creation, send room ID |
| `room_joined` | Confirm room join, send players list |
| `player_joined` | Notify all players when someone joins |
| `player_left` | Notify all players when someone leaves |
| `choose_word` | Send word options to the drawer |
| `new_turn` | Start a new turn, send drawer and word |
| `timer_update` | Update timer every second |
| `hint_update` | Reveal letters as hints |
| `draw_move` | Broadcast drawing to all players |
| `clear_canvas` | Clear canvas for all players |
| `new_guess` | Broadcast a guess to all players |
| `correct_guess` | Notify when someone guesses correctly |
| `game_ended` | Announce game end and winner |

### Socket.IO Initialization (Frontend)
```typescript
// frontend/src/socket.ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');
export default socket;
```

### Socket.IO Initialization (Backend)
```javascript
// backend/server.js
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  // Event handlers here...
});
```

---

## Canvas Implementation

### How the Canvas Works

The HTML5 Canvas element is used for drawing. We use **immediate-mode rendering**, meaning we draw directly to the canvas and broadcast each stroke to other players.

### Drawing Data Structure
```typescript
interface DrawData {
  x: number;           // X coordinate
  y: number;           // Y coordinate
  isDrawing: boolean;  // true = drawing, false = start new stroke
  color: string;       // Color in hex
  lineWidth: number;   // Brush size in pixels
}
```

### Drawing Logic
1. **Mouse Down**: Start a new stroke, send `draw_move` with `isDrawing: false`
2. **Mouse Move**: Continue the stroke, send `draw_move` with `isDrawing: true`
3. **Mouse Up/Out**: Stop the stroke
4. **Broadcast**: All `draw_move` events are sent to the server and then broadcast to all players

### Canvas Component Key Methods
```typescript
// frontend/src/Canvas.tsx
const startDrawing = (e) => {
  setIsDrawing(true);
  const { x, y } = getCoordinates(e);
  const data = { x, y, isDrawing: false, color, lineWidth };
  drawLine(data);
  socket.emit('draw_move', roomId, data);
};

const draw = (e) => {
  if (!isDrawing) return;
  const { x, y } = getCoordinates(e);
  const data = { x, y, isDrawing: true, color, lineWidth };
  drawLine(data);
  socket.emit('draw_move', roomId, data);
};
```

---

## Game Logic Flow

### Complete Game Flow
```
1. Lobby Phase
   ├─ User enters username
   ├─ User customizes room settings (optional)
   └─ User creates/joins a room

2. Pre-Game Phase
   ├─ Players join the room
   ├─ Player list updates in real-time
   └─ Host clicks "Start Game"

3. Turn Phase (Repeats for each round)
   ├─ New drawer is selected
   ├─ Drawer selects 1 of 3 words
   ├─ Timer starts (60 seconds)
   ├─ Drawer draws on canvas
   ├─ Other players guess
   ├─ Hints are revealed every 15 seconds
   └─ Turn ends (time up or all guessed)

4. Game End Phase
   ├─ All rounds complete
   ├─ Final scores calculated
   ├─ Winner announced
   └─ Leaderboard displayed
```

### Backend Game State
Each room in the backend stores:
```javascript
rooms[roomId] = {
  players: [                  // Array of players
    { id, username, score, isDrawing, hasGuessed }
  ],
  currentDrawer: 0,            // Index of current drawer
  word: 'cat',                 // Current word
  wordOptions: ['cat', 'dog', 'fish'],  // Word choices
  gameStarted: false,          // Is game active?
  timer: 60,                   // Time left in turn
  revealedLetters: 0,          // Number of hints shown
  currentRound: 1,             // Current round number
  settings: {                  // Room configuration
    rounds: 3,
    timePerTurn: 60,
    maxPlayers: 8
  },
  drawHistory: []              // History of all draw moves (for undo)
};
```

---

## Data Flow

### 1. Create Room Flow
```
User clicks "Create Room"
  ↓
Lobby emits "create_room" event with username and settings
  ↓
Backend creates room object
  ↓
Backend emits "room_created" to creator
  ↓
Frontend receives room ID and players list
  ↓
App renders Game component
```

### 2. Drawing Flow
```
Drawer draws on canvas
  ↓
Canvas emits "draw_move" with coordinates
  ↓
Backend receives "draw_move"
  ↓
Backend adds to drawHistory
  ↓
Backend broadcasts "draw_move" to all players in room
  ↓
All players' canvases draw the stroke
```

### 3. Guessing Flow
```
Player types guess and hits send
  ↓
Game component emits "guess" with guess text
  ↓
Backend checks if guess is correct
  ↓
If correct:
  - Add points to guesser
  - Add points to drawer
  - Broadcast "correct_guess"
  - Check if all guessed
If incorrect:
  - Broadcast "new_guess" to all
```

---

## Key Components

### Frontend Components

#### 1. `App.tsx`
- **Purpose**: Root component, manages navigation between screens
- **State**: roomId, players, username, settings, gameEnded
- **Flow**: Lobby → Game → GameEnd

#### 2. `Lobby.tsx`
- **Purpose**: Create/join rooms, customize settings
- **Features**: Username input, room settings sliders, create/join buttons
- **Socket Events**: `create_room`, `join_room`, listens for `room_created`, `room_joined`

#### 3. `Game.tsx`
- **Purpose**: Main game screen
- **Features**: Canvas, player list, chat, word display, timer
- **Socket Events**: Most socket events are handled here

#### 4. `Canvas.tsx`
- **Purpose**: Drawing canvas and tools
- **Features**: Brush, eraser, color picker, undo, clear
- **Socket Events**: `draw_move`, `undo_draw`, `clear_canvas`

#### 5. `WordSelection.tsx`
- **Purpose**: Word selection modal for the drawer
- **Features**: 3 word buttons, smooth animations
- **Socket Events**: Emits `select_word`

#### 6. `GameEnd.tsx`
- **Purpose**: Game end screen and leaderboard
- **Features**: Winner celebration, final leaderboard, play again button

### Backend Components

#### `server.js`
- **Purpose**: Main backend file, contains all game logic
- **Key Functions**:
  - `startTurn()` - Starts a new drawing turn
  - `endGame()` - Ends the game and announces winner
  - `getRandomWords()` - Returns random word options

---

## Tech Choices

### Why React?
- **Component-based architecture**: Perfect for a game with multiple screens (Lobby, Game, GameEnd)
- **Hooks**: useState and useEffect make state management simple
- **Large ecosystem**: Tons of libraries and resources available
- **Performance**: Virtual DOM makes updates efficient

### Why TypeScript?
- **Type safety**: Catches errors before runtime
- **Better IDE support**: Autocomplete, refactoring, etc.
- **Maintainability**: Easier to understand and modify code
- **Scalability**: Great for growing projects

### Why Vite?
- **Lightning fast**: Dev server starts in milliseconds
- **HMR**: Hot Module Replacement for instant updates
- **Optimized builds**: Tree-shaking and code splitting out of the box
- **Simple configuration**: Minimal setup required

### Why Socket.IO?
- **Easy to use**: Simple API for real-time events
- **Fallback mechanisms**: If WebSockets fail, uses long polling
- **Rooms**: Built-in room system (perfect for our game!)
- **Broadcasting**: Easy to send messages to all clients in a room
- **Scalable**: Works with multiple server instances (with adapter)

### Why HTML5 Canvas?
- **Native performance**: Hardware-accelerated drawing
- **Full control**: Draw anything you want pixel by pixel
- **No libraries needed**: Built into all modern browsers
- **Simple API**: Easy to learn and use

---

## Tips for Code Walkthrough

When explaining this project, you can follow this flow:

1. **Start with the architecture**: Show the diagram, explain client-server
2. **Explain WebSockets**: Why we need them, how they work
3. **Walk through the lobby**: Create/join room flow
4. **Demonstrate the canvas**: Drawing, tools, broadcasting
5. **Explain game logic**: Turn system, scoring, rounds
6. **Show the game end**: Leaderboard, winner
7. **Highlight tech choices**: Why we picked each technology
8. **Q&A**: Answer any questions!

---

## Future Improvements
- Add Redis for scaling to multiple server instances
- Add user authentication and profiles
- Add persistent game history
- Add more drawing tools (shapes, fill bucket, etc.)
- Add sound effects and background music
- Add custom word lists
- Add themes and dark mode

---

Made with  using React, TypeScript, Vite, Node.js, Express, and Socket.IO!

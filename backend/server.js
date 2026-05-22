const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);

// Configure CORS for Socket.IO
const corsOrigin = process.env.NODE_ENV === 'production' 
  ? process.env.FRONTEND_URL || '*' 
  : '*';

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    methods: ['GET', 'POST']
  }
});

const AVATARS = [
  { id: 1, emoji: '😊', color: '#FF6B6B' },
  { id: 2, emoji: '🤖', color: '#4ECDC4' },
  { id: 3, emoji: '🐱', color: '#FFE66D' },
  { id: 4, emoji: '🦊', color: '#FF8B6B' },
  { id: 5, emoji: '🐻', color: '#95E1D3' },
  { id: 6, emoji: '🦝', color: '#A8D8EA' },
  { id: 7, emoji: '🐸', color: '#AA96DA' },
  { id: 8, emoji: '🦎', color: '#FCBAD3' },
];

const wordBank = {
  animals: [
    'cat', 'dog', 'bird', 'fish', 'butterfly', 'elephant', 'giraffe',
    'cow', 'pig', 'sheep', 'horse', 'chicken', 'duck', 'goat', 'lion',
    'tiger', 'bear', 'monkey', 'snake', 'frog', 'rabbit', 'penguin',
    'dolphin', 'whale', 'eagle', 'owl', 'squirrel', 'deer', 'fox', 'wolf'
  ],
  food: [
    'pizza', 'burger', 'ice cream', 'apple', 'banana', 'orange', 'grape',
    'watermelon', 'strawberry', 'blueberry', 'pineapple', 'sandwich',
    'spaghetti', 'taco', 'donut', 'cake', 'cookie', 'cheese', 'bread',
    'chicken', 'fish', 'carrot', 'broccoli', 'potato', 'tomato', 'cucumber'
  ],
  objects: [
    'house', 'car', 'tree', 'computer', 'book', 'guitar', 'piano',
    'football', 'basketball', 'phone', 'tv', 'bed', 'cup', 'plate',
    'fork', 'spoon', 'knife', 'chair', 'table', 'door', 'window',
    'lamp', 'pencil', 'pen', 'paper', 'scissors', 'bottle', 'cup'
  ],
  nature: [
    'sun', 'moon', 'star', 'mountain', 'river', 'beach', 'flower',
    'cloud', 'rain', 'snowman', 'rainbow', 'forest', 'lake', 'ocean',
    'volcano', 'waterfall', 'island', 'cave', 'desert', 'cliff', 'valley'
  ],
  fantasy: [
    'dragon', 'unicorn', 'castle', 'spaceship', 'robot', 'alien',
    'wizard', 'witch', 'mermaid', 'ghost', 'vampire', 'phoenix',
    'sphinx', 'kraken', 'yeti', 'cyclops', 'minotaur', 'centaur',
    'pegasus', 'basilisk', 'golem', 'gargoyle', 'troll', 'ogre'
  ],
  sports: [
    'football', 'basketball', 'tennis', 'baseball', 'soccer', 'hockey',
    'volleyball', 'golf', 'cricket', 'badminton', 'surfing', 'skiing',
    'skateboard', 'bicycle', 'swimming', 'boxing', 'wrestling', 'fencing'
  ]
};

const rooms = {};
const roomTimers = {};
const roomHintTimers = {};

function getRandomWords(count) {
  const allWords = [];
  
  // Collect all words from all categories
  Object.values(wordBank).forEach(categoryWords => {
    allWords.push(...categoryWords);
  });
  
  const shuffled = [...allWords].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count).map(word => ({
    word,
    category: Object.keys(wordBank).find(cat => wordBank[cat].includes(word))
  }));
}

function endGame(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  // Clear timers
  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }
  if (roomHintTimers[roomId]) {
    clearInterval(roomHintTimers[roomId]);
    delete roomHintTimers[roomId];
  }

  // Sort players by score for final rankings
  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  
  const winner = sortedPlayers[0];
  const runnerUp = sortedPlayers[1] || null;

  console.log(`[${roomId}] Game Over! Final Standings:`);
  sortedPlayers.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.username}: ${p.score} pts`);
  });

  io.to(roomId).emit('game_ended', {
    winner,
    players: sortedPlayers,
    totalRounds: room.currentRound,
    gameStats: {
      totalPlayers: room.players.length,
      averageScore: Math.round(room.players.reduce((sum, p) => sum + p.score, 0) / room.players.length)
    }
  });
}

function startTurn(roomId, selectedWord = null) {
  const room = rooms[roomId];
  if (!room || room.players.length === 0) return;

  let drawerIndex = room.currentDrawer;
  
  if (!selectedWord) {
    // Calculate next drawer index using round-robin - only when starting a new turn (not selecting word)
    room.turnCount = (room.turnCount || 0) + 1;
    drawerIndex = (room.turnCount - 1) % room.players.length;
    room.currentRound = Math.floor((room.turnCount - 1) / room.players.length) + 1;
    
    // Check if game should end
    if (room.currentRound > room.settings.rounds) {
      endGame(roomId);
      return;
    }

    room.currentDrawer = drawerIndex;
  }
  
  const currentDrawerPlayer = room.players[room.currentDrawer];

  // If word hasn't been selected, ask the current drawer to choose
  if (selectedWord) {
    room.word = selectedWord;
  } else {
    room.wordOptions = getRandomWords(3);
    console.log(`[${roomId}] Round ${room.currentRound}: ${currentDrawerPlayer.username} is drawing`);
    io.to(currentDrawerPlayer.id).emit('choose_word', room.wordOptions);
    return;
  }

  // Reset player states for new turn
  room.players.forEach((p, i) => {
    p.isDrawing = i === room.currentDrawer;
    p.hasGuessed = false;
  });
  
  room.timer = room.settings.timePerTurn;
  room.revealedLetters = 0;
  room.drawHistory = [];

  // Emit new turn to all players with turn info
  const turnInfo = {
    drawer: currentDrawerPlayer,
    word: room.word,
    players: room.players,
    timer: room.timer,
    currentRound: room.currentRound,
    totalRounds: room.settings.rounds,
    turnCount: room.turnCount,
    totalTurns: room.players.length * room.settings.rounds
  };

  io.to(roomId).emit('new_turn', turnInfo);
  io.to(roomId).emit('clear_canvas');

  console.log(`[${roomId}] Turn ${room.turnCount}: ${currentDrawerPlayer.username} drawing "${room.word}"`);

  // Clear existing timers
  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
  }
  if (roomHintTimers[roomId]) {
    clearInterval(roomHintTimers[roomId]);
  }

  // Main game timer - counts down for this turn
  roomTimers[roomId] = setInterval(() => {
    room.timer--;
    io.to(roomId).emit('timer_update', room.timer);
    if (room.timer <= 0) {
      clearInterval(roomTimers[roomId]);
      console.log(`[${roomId}] Time's up! Moving to next turn...`);
      startTurn(roomId);
    }
  }, 1000);

  // Hint timer - gradually reveals letters
  roomHintTimers[roomId] = setInterval(() => {
    if (room.revealedLetters < room.word.length - 1) {
      room.revealedLetters++;
      io.to(roomId).emit('hint_update', room.revealedLetters);
    }
  }, 15000);
}

function startGame(roomId) {
  const room = rooms[roomId];
  if (!room || room.gameStarted || room.players.length < 1) return;

  room.gameStarted = true;
  room.turnCount = 0;
  room.currentRound = 1;
  room.currentDrawer = -1;
  
  // Initialize all players' scores to 0 and reset state
  room.players.forEach(player => {
    player.score = 0;
    player.hasGuessed = false;
    player.isDrawing = false;
  });
  
  console.log(`[${roomId}] Game started with ${room.players.length} players`);
  console.log(`[${roomId}] Player 1 (${room.players[0].username}) will draw first`);
  startTurn(roomId);
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create_room', (payload) => {
    const { hostName, settings = {}, avatar } = payload;
    const username = hostName;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    const playerAvatar = avatar || AVATARS[0];
    rooms[roomId] = {
      players: [{ id: socket.id, username, score: 0, isDrawing: false, hasGuessed: false, avatar: playerAvatar }],
      currentDrawer: -1,
      turnCount: 0,
      word: '',
      wordOptions: [],
      gameStarted: false,
      timer: 60,
      revealedLetters: 0,
      currentRound: 1,
      settings: {
        rounds: settings.rounds || 3,
        timePerTurn: settings.timePerTurn || 60,
        maxPlayers: settings.maxPlayers || 8
      },
      drawHistory: []
    };
    socket.join(roomId);
    socket.emit('room_created', roomId, rooms[roomId].players, rooms[roomId].settings);
  });

  socket.on('join_room', (payload) => {
    const { roomId: rawRoomId, playerName, avatar } = payload;
    const roomId = rawRoomId.trim().toUpperCase();
    const username = playerName;
    if (rooms[roomId]) {
      if (rooms[roomId].players.length >= rooms[roomId].settings.maxPlayers) {
        socket.emit('room_full');
        return;
      }
      const playerAvatar = avatar || AVATARS[0];
      const player = { id: socket.id, username, score: 0, isDrawing: false, hasGuessed: false, avatar: playerAvatar };
      rooms[roomId].players.push(player);
      socket.join(roomId);
      io.to(roomId).emit('player_joined', { player, players: rooms[roomId].players });
      socket.emit('room_joined', roomId, rooms[roomId].players, rooms[roomId].gameStarted, rooms[roomId].word, rooms[roomId].timer, rooms[roomId].settings, rooms[roomId].currentRound);
    } else {
      socket.emit('room_not_found');
    }
  });

  socket.on('select_word', (roomId, word) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players[room.currentDrawer]?.id !== socket.id) return;
    startTurn(roomId, word);
  });

  socket.on('start_game', (payload) => {
    const { roomId } = payload || {};
    if (!roomId) return;
    startGame(roomId);
  });

  socket.on('draw_move', (roomId, data) => {
    const room = rooms[roomId];
    if (!room || !room.players[room.currentDrawer]) return;
    
    // Verify the sender is the current drawer
    const currentDrawerSocket = room.players[room.currentDrawer].id;
    if (currentDrawerSocket !== socket.id) {
      console.log(`[${roomId}] Unauthorized draw attempt from ${socket.id}`);
      return;
    }
    
    if (data && typeof data.x === 'number' && typeof data.y === 'number') {
      room.drawHistory.push(data);
      socket.to(roomId).emit('draw_move', data);
    }
  });

  socket.on('undo_draw', (roomId) => {
    const room = rooms[roomId];
    if (!room || !room.players[room.currentDrawer]) return;
    
    // Verify the sender is the current drawer
    if (room.players[room.currentDrawer].id !== socket.id) {
      console.log(`[${roomId}] Unauthorized undo attempt from ${socket.id}`);
      return;
    }
    
    if (room.drawHistory.length === 0) return;
    
    room.drawHistory.pop();
    io.to(roomId).emit('clear_canvas');
    room.drawHistory.forEach(drawData => {
      io.to(roomId).emit('draw_move', drawData);
    });
  });

  socket.on('clear_canvas', (roomId) => {
    const room = rooms[roomId];
    if (!room || !room.players[room.currentDrawer]) return;
    
    // Verify the sender is the current drawer
    if (room.players[room.currentDrawer].id !== socket.id) {
      console.log(`[${roomId}] Unauthorized clear attempt from ${socket.id}`);
      return;
    }
    
    room.drawHistory = [];
    socket.to(roomId).emit('clear_canvas');
  });

  socket.on('guess', (roomId, guess) => {
    if (!rooms[roomId]) return;
    
    const room = rooms[roomId];
    const player = room.players.find(p => p.id === socket.id);
    
    if (!player || player.isDrawing || player.hasGuessed) return;

    // Broadcast the guess to all players
    io.to(roomId).emit('new_guess', { username: player.username, guess, correct: false });

    if (guess.toLowerCase().trim() === room.word.toLowerCase().trim()) {
      player.hasGuessed = true;
      
      // Calculate points based on time remaining (more time = more points)
      const pointsPerSecond = 10;
      const basePoints = Math.max(50, room.timer * pointsPerSecond);
      player.score += basePoints;
      
      // Drawer gets bonus points for correct guess
      const drawer = room.players[room.currentDrawer];
      const drawerBonus = 25;
      drawer.score += drawerBonus;

      console.log(`[${roomId}] ${player.username} guessed correctly! +${basePoints} pts (Drawer +${drawerBonus} pts)`);

      io.to(roomId).emit('correct_guess', {
        username: player.username,
        points: basePoints,
        players: room.players
      });

      // Check if all players have guessed correctly or timer reached
      const allGuessed = room.players.every(p => p.isDrawing || p.hasGuessed);
      if (allGuessed) {
        clearInterval(roomTimers[roomId]);
        clearInterval(roomHintTimers[roomId]);
        console.log(`[${roomId}] All players guessed! Moving to next turn...`);
        setTimeout(() => startTurn(roomId), 2000);
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
      const index = rooms[roomId].players.findIndex(p => p.id === socket.id);
      if (index !== -1) {
        rooms[roomId].players.splice(index, 1);
        if (rooms[roomId].players.length === 0) {
          delete rooms[roomId];
          if (roomTimers[roomId]) {
            clearInterval(roomTimers[roomId]);
            delete roomTimers[roomId];
          }
          if (roomHintTimers[roomId]) {
            clearInterval(roomHintTimers[roomId]);
            delete roomHintTimers[roomId];
          }
        } else {
          const playerId = rooms[roomId].players[index]?.id || socket.id;
          io.to(roomId).emit('player_left', { playerId, players: rooms[roomId].players });
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

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

  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
    delete roomTimers[roomId];
  }
  if (roomHintTimers[roomId]) {
    clearInterval(roomHintTimers[roomId]);
    delete roomHintTimers[roomId];
  }

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  io.to(roomId).emit('game_ended', {
    winner: sortedPlayers[0],
    players: sortedPlayers
  });
}

function startTurn(roomId, selectedWord = null) {
  const room = rooms[roomId];
  if (!room || room.players.length === 0) return;

  room.currentRound = room.currentRound || 1;
  room.currentDrawer = (room.currentDrawer + 1) % room.players.length;
  
  if (room.currentDrawer === 0 && room.currentRound > 1) {
    room.currentRound++;
    if (room.currentRound > room.settings.rounds) {
      endGame(roomId);
      return;
    }
  }

  if (selectedWord) {
    room.word = selectedWord;
  } else {
    room.wordOptions = getRandomWords(3);
    io.to(room.players[room.currentDrawer].id).emit('choose_word', room.wordOptions);
    return;
  }

  room.players.forEach((p, i) => {
    p.isDrawing = i === room.currentDrawer;
    p.hasGuessed = false;
  });
  room.timer = room.settings.timePerTurn;
  room.revealedLetters = 0;
  room.drawHistory = [];

  io.to(roomId).emit('new_turn', {
    drawer: room.players[room.currentDrawer],
    word: room.word,
    players: room.players,
    timer: room.timer,
    currentRound: room.currentRound,
    totalRounds: room.settings.rounds
  });

  io.to(roomId).emit('clear_canvas');

  if (roomTimers[roomId]) {
    clearInterval(roomTimers[roomId]);
  }
  if (roomHintTimers[roomId]) {
    clearInterval(roomHintTimers[roomId]);
  }

  roomTimers[roomId] = setInterval(() => {
    room.timer--;
    io.to(roomId).emit('timer_update', room.timer);
    if (room.timer <= 0) {
      clearInterval(roomTimers[roomId]);
      startTurn(roomId, wordBank[Math.floor(Math.random() * wordBank.length)]);
    }
  }, 1000);

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
  room.currentRound = 1;
  startTurn(roomId);
}

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('create_room', (payload) => {
    const { hostName, settings = {} } = payload;
    const username = hostName;
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    rooms[roomId] = {
      players: [{ id: socket.id, username, score: 0, isDrawing: false, hasGuessed: false }],
      currentDrawer: -1,
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
    const { roomId: rawRoomId, playerName } = payload;
    const roomId = rawRoomId.trim().toUpperCase();
    const username = playerName;
    if (rooms[roomId]) {
      if (rooms[roomId].players.length >= rooms[roomId].settings.maxPlayers) {
        socket.emit('room_full');
        return;
      }
      const player = { id: socket.id, username, score: 0, isDrawing: false, hasGuessed: false };
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
    if (!room) return;
    if (room.players[room.currentDrawer]?.id !== socket.id) return;
    
    room.drawHistory.push(data);
    socket.to(roomId).emit('draw_move', data);
  });

  socket.on('undo_draw', (roomId) => {
    const room = rooms[roomId];
    if (!room || room.drawHistory.length === 0) return;
    if (room.players[room.currentDrawer]?.id !== socket.id) return;
    
    room.drawHistory.pop();
    io.to(roomId).emit('clear_canvas');
    room.drawHistory.forEach(data => {
      io.to(roomId).emit('draw_move', data);
    });
  });

  socket.on('clear_canvas', (roomId) => {
    const room = rooms[roomId];
    if (!room) return;
    if (room.players[room.currentDrawer]?.id !== socket.id) return;
    
    room.drawHistory = [];
    socket.to(roomId).emit('clear_canvas');
  });

  socket.on('guess', (roomId, guess) => {
    if (!rooms[roomId]) return;
    
    const room = rooms[roomId];
    const player = room.players.find(p => p.id === socket.id);
    
    if (!player || player.isDrawing || player.hasGuessed) return;

    io.to(roomId).emit('new_guess', { username: player.username, guess, correct: false });

    if (guess.toLowerCase().trim() === room.word.toLowerCase().trim()) {
      player.hasGuessed = true;
      const points = Math.max(10, room.timer);
      player.score += points;
      
      const drawer = room.players[room.currentDrawer];
      drawer.score += 5;

      io.to(roomId).emit('correct_guess', {
        username: player.username,
        points,
        players: room.players
      });

      const allGuessed = room.players.every(p => p.isDrawing || p.hasGuessed);
      if (allGuessed) {
        clearInterval(roomTimers[roomId]);
        clearInterval(roomHintTimers[roomId]);
        setTimeout(() => startTurn(roomId, wordBank[Math.floor(Math.random() * wordBank.length)]), 2000);
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

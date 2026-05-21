import { useState, useEffect } from 'react';
import socket from './socket';
import { Player } from './types';
import Canvas from './Canvas';
import WordSelection from './WordSelection';
import './App.css';

interface WordOption {
  word: string;
  category: string;
}

interface GameProps {
  roomId: string;
  players: Player[];
  username: string;
  settings: any;
  setGameEnded: (ended: boolean) => void;
  setWinner: (winner: Player) => void;
  setFinalPlayers: (players: Player[]) => void;
}

function Game({ roomId, players: initialPlayers, username, settings, setGameEnded, setWinner, setFinalPlayers }: GameProps) {
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [guesses, setGuesses] = useState<{ username: string; guess: string; correct: boolean }[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStarted, setGameStarted] = useState(false);
  const [word, setWord] = useState('');
  const [timer, setTimer] = useState(settings.timePerTurn || 60);
  const [isDrawer, setIsDrawer] = useState(false);
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(settings.rounds || 3);
  const [showWordSelection, setShowWordSelection] = useState(false);
  const [wordOptions, setWordOptions] = useState<WordOption[]>([]);
  const [revealedLetters, setRevealedLetters] = useState(0);

  useEffect(() => {
    const handlePlayerJoined = (data: { player: Player; players: Player[] }) => {
      setPlayers(data.players);
    };

    const handlePlayerLeft = (data: { playerId: string; players: Player[] }) => {
      setPlayers(data.players);
    };

    const handleNewGuess = (data: { username: string; guess: string; correct: boolean }) => {
      setGuesses(prev => [...prev, data]);
    };

    const handleNewTurn = (data: { drawer: Player; word: string; players: Player[]; timer: number; currentRound: number; totalRounds: number }) => {
      setGameStarted(true);
      setWord(data.word);
      setTimer(data.timer);
      setPlayers(data.players);
      setIsDrawer(data.drawer.username === username);
      setCurrentRound(data.currentRound);
      setTotalRounds(data.totalRounds);
      setRevealedLetters(0);
      setShowWordSelection(false);
    };

    const handleTimerUpdate = (newTimer: number) => {
      setTimer(newTimer);
    };

    const handleHintUpdate = (count: number) => {
      setRevealedLetters(count);
    };

    const handleCorrectGuess = (data: { username: string; points: number; players: Player[] }) => {
      setPlayers(data.players);
      setGuesses(prev => [...prev, { username: 'System', guess: `${data.username} guessed correctly! +${data.points} pts`, correct: true }]);
    };

    const handleChooseWord = (words: WordOption[]) => {
      setWordOptions(words);
      setShowWordSelection(true);
    };

    const handleGameEnded = (data: { winner: Player; players: Player[] }) => {
      setWinner(data.winner);
      setFinalPlayers(data.players);
      setGameEnded(true);
    };

    socket.on('player_joined', handlePlayerJoined);
    socket.on('player_left', handlePlayerLeft);
    socket.on('new_guess', handleNewGuess);
    socket.on('new_turn', handleNewTurn);
    socket.on('timer_update', handleTimerUpdate);
    socket.on('hint_update', handleHintUpdate);
    socket.on('correct_guess', handleCorrectGuess);
    socket.on('choose_word', handleChooseWord);
    socket.on('game_ended', handleGameEnded);

    return () => {
      socket.off('player_joined', handlePlayerJoined);
      socket.off('player_left', handlePlayerLeft);
      socket.off('new_guess', handleNewGuess);
      socket.off('new_turn', handleNewTurn);
      socket.off('timer_update', handleTimerUpdate);
      socket.off('hint_update', handleHintUpdate);
      socket.off('correct_guess', handleCorrectGuess);
      socket.off('choose_word', handleChooseWord);
      socket.off('game_ended', handleGameEnded);
    };
  }, [username, setGameEnded, setWinner, setFinalPlayers]);

  const handleStartGame = () => {
    socket.emit('start_game', { roomId });
  };

  const handleSendGuess = () => {
    if (!currentGuess.trim() || isDrawer) return;
    socket.emit('guess', roomId, currentGuess);
    setCurrentGuess('');
  };

  const handleSelectWord = (selectedWord: string) => {
    socket.emit('select_word', roomId, selectedWord);
  };

  const copyRoomCode = () => {
    const inviteLink = `${window.location.origin}?room=${roomId}`;
    navigator.clipboard.writeText(inviteLink);
    alert('Invite link copied to clipboard!');
  };

  const getDisplayWord = () => {
    if (isDrawer) return word;
    return word.split('').map((char, index) => {
      if (char === ' ' || index < revealedLetters) return char;
      return '_';
    }).join(' ');
  };

  return (
    <div className="game">
      {showWordSelection && (
        <WordSelection
          options={wordOptions}
          onSelect={handleSelectWord}
        />
      )}
      <div className="game-left">
        <div className="game-header">
          <div>
            <h2>
              Room: {roomId} <button onClick={copyRoomCode} className="copy-btn">📋 Invite</button>
            </h2>
            <div className="round-info">
              Round {currentRound} of {totalRounds}
            </div>
          </div>
          <div className="timer">⏱️ {timer}s</div>
        </div>
        {!gameStarted ? (
          <div className="start-game-container">
            <h3>Waiting for players...</h3>
            <p>Players in room: {players.length} / {settings.maxPlayers}</p>
            <button 
              className="start-btn" 
              onClick={handleStartGame}
              disabled={players.length < 1}
              title={players.length < 1 ? "Need at least 1 player to start" : "Ready to start!"}
            >
              {players.length >= 1 ? 'Start Game' : 'Waiting for players...'}
            </button>
          </div>
        ) : (
          <>
            <div className="turn-info-banner">
              <span className="drawer-name">
                🎨 {players.find(p => p.isDrawing)?.username || 'Drawing'} is drawing!
              </span>
            </div>
            <div className="word-display">
              {isDrawer ? (
                <div className="drawer-word">Your word: <span className="word">{word}</span></div>
              ) : (
                <div className="guess-word">
                  <span className="hint-label">Word:</span> {getDisplayWord()}
                </div>
              )}
            </div>
            <Canvas roomId={roomId} isDrawingAllowed={isDrawer} />
          </>
        )}
      </div>
      <div className="game-right">
        <div className="player-list">
          <h3>Players</h3>
          {players.map(player => (
            <div key={player.id} className={`player-item ${player.isDrawing ? 'drawing' : ''} ${player.hasGuessed ? 'guessed' : ''}`}>
              <div className="player-avatar" style={{ backgroundColor: player.avatar.color }}>
                <span>{player.avatar.emoji}</span>
              </div>
              <div className="player-info">
                <div className="player-name">{player.username}</div>
                <div className="player-score">{player.score} pts</div>
              </div>
              {player.isDrawing && <span className="badge">🎨 Drawing</span>}
              {player.hasGuessed && <span className="badge">✅ Guessed</span>}
            </div>
          ))}
        </div>
        <div className="chat">
          <h3>Chat</h3>
          <div className="chat-messages">
            {guesses.map((g, i) => (
              <div key={i} className={`chat-message ${g.correct ? 'correct' : ''}`}>
                <strong>{g.username}:</strong> {g.guess}
              </div>
            ))}
          </div>
          <div className="chat-input">
            <input
              type="text"
              placeholder="Guess the word..."
              value={currentGuess}
              onChange={(e) => setCurrentGuess(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendGuess()}
              disabled={!gameStarted || isDrawer}
            />
            <button onClick={handleSendGuess} disabled={!gameStarted || isDrawer}>Send</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Game;

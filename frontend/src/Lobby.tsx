import { useState, useEffect } from 'react';
import socket from './socket';
import { Player } from './types';
import './App.css';
import './Lobby.css';

interface LobbyProps {
  setRoomId: (id: string) => void;
  setPlayers: (players: Player[]) => void;
  setUsername: (name: string) => void;
  setSettings: (settings: any) => void;
}

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

function Lobby({ setRoomId, setPlayers, setUsername, setSettings }: LobbyProps) {
  const [name, setName] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [rounds, setRounds] = useState(3);
  const [timePerTurn, setTimePerTurn] = useState(60);
  const [maxPlayers, setMaxPlayers] = useState(8);
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const room = urlParams.get('room');
    if (room) {
      setJoinRoomId(room);
    }
  }, []);

  useEffect(() => {
    const handleRoomCreated = (roomId: string, players: Player[], settings: any) => {
      setSettings(settings);
      setRoomId(roomId);
      setPlayers(players);
    };

    const handleRoomJoined = (roomId: string, players: Player[], _gameStarted: boolean, _word: string, _timer: number, settings: any, _currentRound: number) => {
      setSettings(settings);
      setRoomId(roomId);
      setPlayers(players);
    };

    const handleRoomNotFound = () => {
      alert('Room not found!');
    };

    const handleRoomFull = () => {
      alert('Room is full!');
    };

    socket.on('room_created', handleRoomCreated);
    socket.on('room_joined', handleRoomJoined);
    socket.on('room_not_found', handleRoomNotFound);
    socket.on('room_full', handleRoomFull);

    return () => {
      socket.off('room_created', handleRoomCreated);
      socket.off('room_joined', handleRoomJoined);
      socket.off('room_not_found', handleRoomNotFound);
      socket.off('room_full', handleRoomFull);
    };
  }, [setRoomId, setPlayers, setSettings]);

  const handleCreateRoom = () => {
    if (!name.trim()) return;
    setUsername(name);
    const settings = { rounds, timePerTurn, maxPlayers };
    setSettings(settings);
    socket.emit('create_room', { hostName: name, settings, avatar: selectedAvatar });
  };

  const handleJoinRoom = () => {
    if (!name.trim() || !joinRoomId.trim()) return;
    setUsername(name);
    socket.emit('join_room', { roomId: joinRoomId.trim().toUpperCase(), playerName: name, avatar: selectedAvatar });
  };

  return (
    <div className="lobby-container">
      <div className="lobby-background">
        <div className="background-animation"></div>
        <div className="background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
          <div className="shape shape-4"></div>
          <div className="shape shape-5"></div>
        </div>
      </div>

      <div className="lobby">
        <div className="lobby-header">
          <h1>🎨 Scribble.io</h1>
          <p className="tagline">Draw. Guess. Win!</p>
        </div>

        <div className="lobby-main">
          <div className="avatar-section">
            <div className="avatar-display">
              <div 
                className="avatar-circle" 
                style={{ backgroundColor: selectedAvatar.color }}
              >
                <span className="avatar-emoji">{selectedAvatar.emoji}</span>
              </div>
              <div className="avatar-decorations">
                <span className="decoration">✨</span>
                <span className="decoration">⭐</span>
                <span className="decoration">✨</span>
              </div>
            </div>

            <h3 className="avatar-title">Choose Your Avatar</h3>
            <div className="avatar-grid">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  className={`avatar-option ${selectedAvatar.id === avatar.id ? 'selected' : ''}`}
                  onClick={() => setSelectedAvatar(avatar)}
                  style={{ '--avatar-color': avatar.color } as any}
                >
                  <span className="avatar-option-emoji">{avatar.emoji}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="lobby-form">
            <input
              type="text"
              placeholder="Enter your username"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCreateRoom()}
            />

            <div className="button-group">
              <button 
                className="btn btn-primary" 
                onClick={handleCreateRoom}
                disabled={!name.trim()}
              >
                <span className="btn-icon">🎮</span>
                Play Now
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => document.querySelector('.join-section')?.classList.toggle('show')}
              >
                <span className="btn-icon">🔗</span>
                Join Room
              </button>
            </div>

            <div className="room-settings-compact">
              <h3>Quick Settings</h3>
              <div className="settings-grid">
                <div className="setting-item-compact">
                  <label>🎯 Rounds</label>
                  <div className="setting-value-display">{rounds}</div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={rounds}
                    onChange={(e) => setRounds(parseInt(e.target.value))}
                    className="slider"
                  />
                </div>
                <div className="setting-item-compact">
                  <label>⏱️ Time/Turn</label>
                  <div className="setting-value-display">{timePerTurn}s</div>
                  <input
                    type="range"
                    min="30"
                    max="120"
                    value={timePerTurn}
                    onChange={(e) => setTimePerTurn(parseInt(e.target.value))}
                    className="slider"
                  />
                </div>
                <div className="setting-item-compact">
                  <label>👥 Max Players</label>
                  <div className="setting-value-display">{maxPlayers}</div>
                  <input
                    type="range"
                    min="2"
                    max="12"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(parseInt(e.target.value))}
                    className="slider"
                  />
                </div>
              </div>
            </div>

            <div className="join-section">
              <h3>Join Existing Room</h3>
              <input
                type="text"
                placeholder="Enter room code"
                className="input-field"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
              <button 
                className="btn btn-tertiary" 
                onClick={handleJoinRoom}
                disabled={!name.trim() || !joinRoomId.trim()}
              >
                <span className="btn-icon">✅</span>
                Join
              </button>
            </div>
          </div>
        </div>

        <div className="lobby-footer">
          <p>💡 Tip: Share your room code to invite friends!</p>
        </div>
      </div>
    </div>
  );
}

export default Lobby;

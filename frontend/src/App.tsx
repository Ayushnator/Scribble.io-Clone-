import { useState } from 'react';
import Lobby from './Lobby';
import Game from './Game';
import GameEnd from './GameEnd';
import Footer from './Footer';
import { Player } from './types';
import './App.css';

function App() {
  const [roomId, setRoomId] = useState<string>('');
  const [players, setPlayers] = useState<Player[]>([]);
  const [username, setUsername] = useState<string>('');
  const [settings, setSettings] = useState<any>({});
  const [gameEnded, setGameEnded] = useState(false);
  const [winner, setWinner] = useState<Player | null>(null);
  const [finalPlayers, setFinalPlayers] = useState<Player[]>([]);

  return (
    <div className="app-wrapper">
      <div className="app">
        {!roomId ? (
          <Lobby
            setRoomId={setRoomId}
            setPlayers={setPlayers}
            setUsername={setUsername}
            setSettings={setSettings}
          />
        ) : gameEnded ? (
          <GameEnd
            winner={winner}
            players={finalPlayers}
            setRoomId={setRoomId}
            setGameEnded={setGameEnded}
          />
        ) : (
          <Game
            roomId={roomId}
            players={players}
            username={username}
            settings={settings}
            setGameEnded={setGameEnded}
            setWinner={setWinner}
            setFinalPlayers={setFinalPlayers}
          />
        )}
      </div>
      <Footer />
    </div>
  );
}

export default App;

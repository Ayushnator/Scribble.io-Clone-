import { Player } from './types';
import './App.css';

interface GameEndProps {
  winner: Player | null;
  players: Player[];
  setRoomId: (id: string) => void;
  setGameEnded: (ended: boolean) => void;
}

function GameEnd({ winner, players, setRoomId, setGameEnded }: GameEndProps) {
  const handlePlayAgain = () => {
    setRoomId('');
    setGameEnded(false);
  };

  return (
    <div className="game-end">
      <div className="game-end-content">
        <h1>🎉 Game Over!</h1>
        {winner && (
          <div className="winner">
            <h2>🏆 Winner: {winner.username}</h2>
            <p className="winner-score">Score: {winner.score} points</p>
          </div>
        )}
        <div className="leaderboard">
          <h3>Final Leaderboard</h3>
          {players.map((player, index) => (
            <div key={player.id} className="leaderboard-item">
              <span className="rank">#{index + 1}</span>
              <span className="name">{player.username}</span>
              <span className="score">{player.score} pts</span>
            </div>
          ))}
        </div>
        <button className="play-again-btn" onClick={handlePlayAgain}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameEnd;

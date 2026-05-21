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

  const totalScore = players.reduce((sum, p) => sum + p.score, 0);
  const averageScore = players.length > 0 ? Math.round(totalScore / players.length) : 0;

  return (
    <div className="game-end">
      <div className="game-end-content">
        <h1 className="game-title">🎉 Game Over!</h1>
        
        {winner && (
          <div className="winner-section">
            <div className="winner">
              <h2>🏆 Winner: <span className="winner-name">{winner.username}</span></h2>
              <p className="winner-score">Score: <span className="score-value">{winner.score}</span> points</p>
            </div>
          </div>
        )}

        <div className="game-stats">
          <h3>Game Statistics</h3>
          <div className="stats-row">
            <span>Total Players:</span>
            <span className="stat-value">{players.length}</span>
          </div>
          <div className="stats-row">
            <span>Total Points:</span>
            <span className="stat-value">{totalScore}</span>
          </div>
          <div className="stats-row">
            <span>Average Score:</span>
            <span className="stat-value">{averageScore}</span>
          </div>
        </div>

        <div className="leaderboard">
          <h3>Final Leaderboard</h3>
          <div className="leaderboard-list">
            {players.map((player, index) => (
              <div key={player.id} className={`leaderboard-item ${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}`}>
                <span className="rank">
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                </span>
                <div className="leaderboard-avatar" style={{ backgroundColor: player.avatar.color }}>
                  <span>{player.avatar.emoji}</span>
                </div>
                <span className="name">{player.username}</span>
                <span className="score">{player.score} pts</span>
              </div>
            ))}
          </div>
        </div>

        <button className="play-again-btn" onClick={handlePlayAgain}>
          🎮 Play Again
        </button>
      </div>
    </div>
  );
}

export default GameEnd;

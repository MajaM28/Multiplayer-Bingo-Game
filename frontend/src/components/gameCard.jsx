export default function GameCard({ game }) {
  return (
    <div className="gamecardContainer">
      <h3>{game.name}</h3>
      <p>
        Players: {game.players.length}/{game.maxPlayers}
      </p>
      <p>Status: {game.status}</p>
      <button>Join Game</button>
    </div>
  );
}

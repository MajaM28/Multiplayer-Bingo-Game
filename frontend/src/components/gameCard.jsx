export default function GameCard({ game }) {
  return (
    <div className="gamecardContainer">
      <div className="gameInfo">
        <h3>{game.name}</h3>
        <p>
          Players: {game.players.length}/{game.maxPlayers}
        </p>
        <p>Status: {game.status}</p>
      </div>
      <div className="buttonRight">
        <button className="gameCardButton">Join Game</button>
      </div>
    </div>
  );
}

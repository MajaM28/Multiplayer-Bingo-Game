import { useNavigate } from "react-router-dom";

export default function GameCard({ game }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  function handleJoin() {
    if (!user) {
      alert("Must be logged in to join game");
      navigate("/login");
    }

    const fetchCard = async () => {};
  }

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

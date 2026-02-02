import { useState } from "react";
import GameCard from "../components/gameCard";
import { useEffect } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  async function getGames() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/games");
      const data = await res.json();
      setGames(data);
    } catch (err) {
      console.log("Error:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getGames();
  }, []);

  return (
    <div className="lobbyContainer">
      <Navbar />
      <div className="bottomLobbyWrapper">
        <div className="leftSideLobby">
          <div className="gameListContainer">
            {games.map((g) => {
              return <GameCard key={g.id} game={g} />;
            })}
          </div>
        </div>
        <div className="rightSideLobby">
          <button
            className="newGameButton"
            onClick={() => navigate("/creategame")}
          >
            CREATE NEW GAME
          </button>
          <div className="instructions">
            <h1>HOW TO PLAY BINGO</h1>
            <ol>
              <li>blah blah blah</li>
              <li>blah blah blah</li>
              <li>blah blah blah</li>
              <li>blah blah blah</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

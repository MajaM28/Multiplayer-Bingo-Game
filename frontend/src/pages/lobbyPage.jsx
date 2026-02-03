import { useState } from "react";
import GameCard from "../components/gameCard";
import { useEffect } from "react";
import Navbar from "../components/navbar";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";

export default function LobbyPage() {
  const navigate = useNavigate();
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  async function getGames() {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:3000/api/games", {
        credentials: "include",
      });
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
    const socket = io("http://localhost:3000");

    socket.on("gameCreated", (newGame) => {
      console.log("New game created:", newGame);
      setGames((prev) => [...prev, newGame]);
    });

    socket.on("gameDeleted", (gameId) => {
      console.log("Game deleted:", gameId);
      setGames((prev) => prev.filter((g) => g.id !== gameId));
    });

    socket.on("gameUpdated", (updatedGame) => {
      console.log("Game updated:", updatedGame);
      setGames((prev) =>
        prev.map((g) => {
          if (String(g.id) === String(updatedGame.id)) {
            return updatedGame;
          } else {
            return g;
          }
        }),
      );
    });

    socket.on("gameStats", (data) => {
      setStats(data);
    });

    return () => {
      socket.disconnect();
    };
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
          {stats && (
            <div className="instructions">
              <h1>STATS (LIVE)</h1>
              <p>Total Games: {stats.total}</p>
              <p>Active: {stats.active}</p>
              <p>Waiting: {stats.waiting}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

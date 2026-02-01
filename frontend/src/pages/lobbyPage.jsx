import { useState } from "react";
import GameCard from "../components/gameCard";
import { useEffect } from "react";

export default function LobbyPage() {
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
      <div className="gameListContainer">
        {games.map((g) => {
          return <GameCard key={g.id} game={g} />;
        })}
      </div>
    </div>
  );
}

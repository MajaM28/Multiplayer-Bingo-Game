import { useNavigate, useParams } from "react-router-dom";

export default function GameCard({ game }) {
  const navigate = useNavigate();
  const { gameId } = useParams();

  const handleJoin = async (gameId) => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user) {
      alert("Must be logged in to join game");
      navigate("/login");
      return;
    }
    try {
      const res = await fetch(
        `http://localhost:3000/api/cards?gameId=${gameId}&userId=${user.id}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        },
      );
      const cardData = await res.json();
      if (cardData.length > 0) {
        navigate(`/game/${gameId}`);
        return;
      }

      const res2 = await fetch(`http://localhost:3000/api/cards`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          gameId: gameId,
          userId: user.id,
        }),
      });
      const newCardData = await res2.json();

      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error("Join error:", error);
      alert("Failed to join game");
    }
  };

  return (
    <div className="gamecardContainer">
      <div className="gameInfo">
        <h3>{game.name}</h3>

        <p>Status: {game.status}</p>
      </div>
      <div className="buttonRight">
        <button className="gameCardButton" onClick={() => handleJoin(game.id)}>
          Join Game
        </button>
      </div>
    </div>
  );
}

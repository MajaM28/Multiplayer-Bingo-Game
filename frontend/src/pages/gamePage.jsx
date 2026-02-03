import { useEffect } from "react";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";

export default function GamePage() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState(null);
  const [card, setCard] = useState(null);
  const [drawnNumbers, setDrawnNumbers] = useState(null);
  const [markedPositions, setMarkedPositions] = useState([[2, 2]]);
  const [isWinner, setIsWinner] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [latestNumber, setLatestNumber] = useState(null);

  let isHost = false;
  if (currentUser?.id === game?.hostId) {
    isHost = true;
  }

  let canStartGame = false;
  if (isHost && game?.status === "waiting") {
    canStartGame = true;
  }

  useEffect(() => {
    const socket = io("http://localhost:3000"); //łaczenie sie z serwerm

    socket.emit("join-game", gameId); //dołaczenie do gry

    socket.on("number-drawn", (data) => {
      console.log("New number drawn:", data.number); // listening na nowe numery
      setDrawnNumbers(data.allDrawn);
      setLatestNumber(data.number);
      setTimeout(() => setLatestNumber(null), 3000);
    });

    socket.on(`gameStarted:${gameId}`, (data) => {
      console.log("Game started!", data);
      setGame((prev) => ({ ...prev, status: "in_progress" }));
    });

    socket.on("gameUpdated", (updatedGame) => {
      if (updatedGame.id === gameId) {
        console.log("Game updated!", updatedGame);
        setGame(updatedGame);
      }
    });

    socket.on("bingoWinner", (data) => {
      const user = JSON.parse(localStorage.getItem("user"));

      if (data.winnerId !== user.id) {
        alert(`${data.winner} has won!`);
      }
    });

    return () => {
      socket.disconnect(); //disconnect jak sie wychodzi
    };
  }, [gameId]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    setCurrentUser(user);
    const fetchGameData = async () => {
      const res = await fetch(`http://localhost:3000/api/games/${gameId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const gameData = await res.json();

      setGame(gameData);
      setDrawnNumbers(gameData.drawnNumbers || []);
      return gameData;
    };

    const fetchUserCardData = async () => {
      const user = JSON.parse(localStorage.getItem("user"));
      const userId = user.id;
      const res = await fetch(
        `http://localhost:3000/api/cards?gameId=${gameId}&userId=${userId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const cardData = await res.json();
      setCard(cardData[0]);
    };
    fetchGameData();
    fetchUserCardData();
  }, [gameId]);

  useEffect(() => {
    if (!gameId || game?.status !== "in_progress" || !isHost) return;
    const interval = setInterval(() => {
      const postNumber = async () => {
        const resGame = await fetch(
          `http://localhost:3000/api/games/${gameId}`,
        );
        const currentGame = await resGame.json();
        if (currentGame.status !== "in_progress") {
          clearInterval(interval);
          return;
        }

        const res = await fetch(
          `http://localhost:3000/api/games/${gameId}/draw`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );
        const data = await res.json(); // np data = { number: 42, allDrawn: [5, 12, 42] }
        setDrawnNumbers(data.allDrawn || []);
      };
      postNumber();
    }, 5000);

    return () => clearInterval(interval);
  }, [gameId, game?.status, isHost]);

  const handleStartGame = async () => {
    try {
      const res = await fetch(
        `http://localhost:3000/api/games/${gameId}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (res.ok) {
        const data = await res.json();
        setGame((prev) => ({ ...prev, status: "in_progress" }));
      } else {
        const error = await res.json();
        alert(error.error);
      }
    } catch (error) {
      console.error("Failed to start game:", error);
    }
  };

  function bgColor(num, row, col) {
    if (num === "FREE SPACE") {
      return "#008000";
    }

    let isMarked = false;
    for (let i = 0; i < markedPositions.length; i++) {
      const pos = markedPositions[i];

      if (pos[0] === row && pos[1] === col) {
        isMarked = true;
        break;
      }
    }

    if (isMarked) {
      return "#008000";
    }

    if (drawnNumbers?.includes(num)) {
      return "#FFDE21";
    }
    return "white";
  }

  function handleNumClick(num, row, col) {
    if (num === "FREE SPACE") {
      return;
    }
    if (!drawnNumbers?.includes(num)) {
      alert("This number hasn't been drawn yet!");
      return;
    }

    let alreadyMarked = false;
    for (let i = 0; i < markedPositions.length; i++) {
      const pos = markedPositions[i];
      if (pos[0] === row && pos[1] === col) {
        alreadyMarked = true;
        break;
      }
    }

    if (alreadyMarked) {
      alert("You've already marked this number!");
      return;
    }

    const newMarked = [...markedPositions, [row, col]];
    setMarkedPositions(newMarked);
    checkBingo(newMarked);
  }

  function checkBingo(marked) {
    if (!card) return;
    const numbers = card.numbers;

    const isPosMarked = (row, col) => {
      return marked.some((pos) => pos[0] === row && pos[1] === col);
    };

    for (let row = 0; row < 5; row++) {
      let rowComplete = true;
      for (let col = 0; col < 5; col++) {
        if (!isPosMarked(row, col)) {
          rowComplete = false;
          break;
        }
      }
      if (rowComplete) {
        declareWinner();
        return;
      }
    }

    for (let col = 0; col < 5; col++) {
      let colComplete = true;
      for (let row = 0; row < 5; row++) {
        if (!isPosMarked(row, col)) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) {
        declareWinner();
        return;
      }
    }

    let diag1Complete = true;
    for (let i = 0; i < 5; i++) {
      if (!isPosMarked(i, i)) {
        diag1Complete = false;
        break;
      }
    }
    if (diag1Complete) {
      declareWinner();
      return;
    }

    let diag2Complete = true;
    for (let i = 0; i < 5; i++) {
      if (!isPosMarked(i, 4 - i)) {
        diag2Complete = false;
        break;
      }
    }
    if (diag2Complete) {
      declareWinner();
      return;
    }
  }

  async function declareWinner() {
    setIsWinner(true);

    const user = JSON.parse(localStorage.getItem("user"));

    try {
      await fetch("http://localhost:3000/api/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gameId: parseInt(gameId),
          winnerId: user.id,
        }),
      });

      const gameRes = await fetch(`http://localhost:3000/api/games/${gameId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "finished",
        }),
      });

      if (!gameRes.ok) {
        throw new Error("Failed to finish game");
      }

      alert("BINGO! WINNER");
    } catch (error) {
      console.error("Winner save error:", error);
    }
  }

  const handleClose = async () => {
    try {
      const res = await fetch(`http://localhost:3000/api/games/${gameId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        alert("Game deleted!");
        navigate("/lobby");
      } else {
        alert("Failed to delete game");
      }
    } catch (error) {
      console.error("Failed to delete game:", error);
      alert("Error deleting game");
    }
  };

  return (
    <div className="gameContainer">
      {}
      {!game || !card ? (
        <div>Loading...</div>
      ) : (
        <div className="div">
          <div className="gameHeader">
            <h1>{game.name}</h1>
            {canStartGame && (
              <button onClick={handleStartGame}>Start game!</button>
            )}
            {isHost && <button onClick={handleClose}>Close Game</button>}
          </div>
          <div className="drawnNumbersContainer">
            <h3>Drawn Numbers:</h3>
            <div className="drawnNumbersList">
              {drawnNumbers === null ? (
                <div>Loading numbers...</div>
              ) : drawnNumbers.length === 0 ? (
                <div>No numbers yet...</div>
              ) : (
                <div>{drawnNumbers.join(", ")}</div>
              )}
            </div>
          </div>

          <div className="cardContainer">
            <h3>Your Card:</h3>
            <div className="bingoGrid">
              {card.numbers.flat().map((num, index) => {
                const row = Math.floor(index / 5);
                const col = index % 5;
                return (
                  <div
                    key={index}
                    className={`bingoCell`}
                    onClick={() => handleNumClick(num, row, col)}
                    style={{ backgroundColor: bgColor(num, row, col) }}
                  >
                    {num === "FREE SPACE" ? "☆" : num}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const express = require("express");
const router = express.Router();
const { dbRun, dbGet, dbAll } = require("../database/db");

//post(create), read(get), put(update), delete(delete)

router.post("/", async (req, res) => {
  try {
    const { name, hostId } = req.body;
    const newGame = {
      id: Date.now().toString(),
      name,
      hostId,
      players: [],
      status: "waiting", // status gry
      drawnNumbers: [], // te wylosowane liczby w JSON array
      createdAt: Date.now(),
    };

    //zapisywanie do bazy
    await dbRun(
      "INSERT INTO games (id, name, hostId, players, status, drawnNumbers, createdAt ) VALUES (?, ?, ?, ?, ?,?,?)",
      [
        newGame.id,
        newGame.name,
        newGame.hostId,
        JSON.stringify(newGame.players),
        newGame.status,
        JSON.stringify(newGame.drawnNumbers),
        newGame.createdAt,
      ],
    );

    // wyslanie do wsyztkich przez web socket info o nowej grze
    req.app.get("io").emit("gameCreated", newGame);
    return res.status(201).json(newGame);
  } catch (err) {
    console.error("Game error:", err);
    return res.status(500).json("Server error");
  }
});

router.get("/", async (req, res) => {
  try {
    const allGames = await dbAll("SELECT * FROM games");

    //paroswanie stringow z bazy
    const reworkData = allGames.map((g) => {
      return {
        ...g,
        players: JSON.parse(g.players),
        drawnNumbers: JSON.parse(g.drawnNumbers), //pamiętaj o parsowaniu danych w tablicy!!!!! bo inaczej zwrócisz stringi !!! lol
      };
    });

    return res.json(reworkData);
  } catch (err) {
    console.error("Get all games error:", err);
    return res.status(500).json("Server error");
  }
});

// pozwala na wyszukiwanie gry po nazwie
router.get("/search/:pattern", async (req, res) => {
  try {
    const pattern = req.params.pattern.toLowerCase();
    const matchedGames = await dbAll(
      "SELECT * FROM games WHERE LOWER(name) LIKE ?", // LIKE w sql - % czyli dowolny znak
      [`%${pattern}%`],
    );

    const reworkMatch = matchedGames.map((g) => ({
      ...g,
      players: JSON.parse(g.players),
      drawnNumbers: JSON.parse(g.drawnNumbers),
    }));

    return res.status(200).json(reworkMatch);
  } catch (err) {
    console.error("Search games error:", err);
    return res.status(500).json("Server error");
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id; // id nie przychodzi z posta (body) -> pochoddzi z params (dane z url)

    const found = await dbGet("SELECT * FROM games WHERE id = ?", [id]);

    if (!found) {
      return res.status(404).json("No such game found");
    }

    const reworkfind = {
      ...found,
      players: JSON.parse(found.players),
      drawnNumbers: JSON.parse(found.drawnNumbers),
    };

    return res.status(200).json(reworkfind);
  } catch (err) {
    console.error("Get one game error:", err);
    return res.status(500).json("Server error");
  }
});

router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const exists = await dbGet("SELECT * FROM games WHERE id = ?", [id]);
    if (!exists) {
      return res.status(404).json("No such game found");
    }
    const { name, status, players, drawnNumbers } = req.body;

    // aktualizujemy tylko wybrane pola
    await dbRun(
      "UPDATE games SET name = ?, status = ?, players = ?, drawnNumbers = ? WHERE id = ?",
      [
        name || exists.name,
        status || exists.status,
        players ? JSON.stringify(players) : exists.players,
        drawnNumbers ? JSON.stringify(drawnNumbers) : exists.drawnNumbers,
        id,
      ],
    ); //updatujemy dane , jak nie zosatły podane to są undefined wiec zosatja te co byly oryginalnie (w exists), nic to nie zwraca (bo to run)
    const updated = await dbGet("SELECT * FROM games WHERE id = ?", [id]); // trzeba pobrac dane jeszcze raz zeby je zwrocic juz z nowymi wartosciami
    const reworkUpdate = {
      ...updated,
      players: JSON.parse(updated.players),
      drawnNumbers: JSON.parse(updated.drawnNumbers),
    };

    // web socket informujemy, ze gra zostala zaktualizowana (np zmiana statusu)
    req.app.get("io").emit("gameUpdated", reworkUpdate);

    return res.status(200).json(reworkUpdate);
  } catch (err) {
    console.error("Update user error:", err);
    return res.status(500).json("Server error");
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const exists = await dbGet("SELECT * FROM games WHERE id = ?", [id]);
    if (!exists) {
      return res.status(404).json("No such game found");
    }

    await dbRun("DELETE FROM games WHERE id = ?", [id]);

    // informujemy wsyztskich ze gra zostala usunieta (zmaknieta przez hosta w moim przypadku)
    req.app.get("io").emit("gameDeleted", id);

    return res.status(200).json("Game deleted");
  } catch (err) {
    console.error("Delete game error:", err);
    return res.status(500).json("Server error");
  }
});

// losowanie liczb do gry
router.post("/:id/draw", async (req, res) => {
  try {
    const id = req.params.id;
    const game = await dbGet("SELECT * FROM games WHERE id = ?", [id]);

    if (!game) {
      return res.status(404).json("No such game found!");
    }

    const drawnNumbers = game.drawnNumbers ? JSON.parse(game.drawnNumbers) : [];

    // sparwdzanie czy wsyztskie liczby nie zostaly przypadkiem juz wyslowowane
    if (drawnNumbers.length >= 75) {
      return res.status(400).json("All numbers already drawn!");
    }

    // losowanie nowego unikalnego numeru
    let newNum;
    let isUnique = false;

    while (!isUnique) {
      newNum = Math.floor(Math.random() * 75) + 1;
      if (!drawnNumbers.includes(newNum)) {
        isUnique = true;
      }
    }

    drawnNumbers.push(newNum);

    // zapisanie go do bazy -> wiadomo jako string
    await dbRun("UPDATE games SET drawnNumbers = ? WHERE id = ?", [
      JSON.stringify(drawnNumbers),
      id,
    ]);

    // wysyłanie nowego numery do WSZYTSKICH graczy w grze
    const io = req.app.get("io");
    io.to(`game-${id}`).emit("number-drawn", {
      number: newNum,
      allDrawn: drawnNumbers,
    });

    return res.status(200).json({
      number: newNum,
      allDrawn: drawnNumbers,
    });
  } catch (err) {
    console.error("Error with drawinf number:", err);
    return res.status(500).json("Server error");
  }
});

router.post("/:id/start", async (req, res) => {
  try {
    const gameId = req.params.id;

    const game = await dbGet("SELECT * FROM games WHERE id = ?", [gameId]);

    if (!game) {
      return res.status(404).json({ error: "Game not found" });
    }

    // tylko gry w stanie czekania moga start zrobic
    if (game.status !== "waiting") {
      return res.status(400).json({ error: "Game already going" });
    }

    // aktualizacja statusu
    await dbRun("UPDATE games SET status = ? WHERE id = ?", [
      "in_progress",
      gameId,
    ]);

    // pobranie zaktualizowanej
    const updatedGame = await dbGet("SELECT * FROM games WHERE id = ?", [
      gameId,
    ]);
    const reworked = {
      ...updatedGame,
      players: JSON.parse(updatedGame.players),
      drawnNumbers: JSON.parse(updatedGame.drawnNumbers),
    };

    // powiadomienie graczy o startcie (ws)
    req.app
      .get("io")
      .emit(`gameStarted:${gameId}`, { gameId, status: "in_progress" });

    // powiadomie graczy o aktualizavji (ws)
    req.app.get("io").emit("gameUpdated", reworked);

    res.json({
      message: "Game started successfully",
      gameId,
      status: "in_progress",
    });
  } catch (err) {
    console.error("Error starting game:", err);
    res.status(500).json({ error: "Failed to start game" });
  }
});

module.exports = router;

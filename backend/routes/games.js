const express = require("express");
const router = express.Router();
const { dbRun, dbGet, dbAll } = require("../database/db");

//post(create), read(get), put(update), delete(delete)

router.post("/", async (req, res) => {
  try {
    const { name, hostId, maxPlayers } = req.body;
    const newGame = {
      id: Date.now().toString(),
      name,
      hostId,
      maxPlayers: maxPlayers || 10,
      players: [],
      status: "waiting",
      drawnNumbers: [],
      createdAt: Date.now(),
    };

    await dbRun(
      "INSERT INTO games (id, name, hostId, maxPlayers, players, status, drawnNumbers, createdAt ) VALUES (?, ?, ?, ?, ?,?,?,?)",
      [
        newGame.id,
        newGame.name,
        newGame.hostId,
        newGame.maxPlayers,
        JSON.stringify(newGame.players),
        newGame.status,
        JSON.stringify(newGame.drawnNumbers),
        newGame.createdAt,
      ],
    );
    return res.status(201).json(newGame);
  } catch (err) {
    console.error("Game error:", err);
    return res.status(500).json("Server error");
  }
});

router.get("/", async (req, res) => {
  try {
    const allGames = await dbAll("SELECT * FROM games");

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

router.get("/search/:pattern", async (req, res) => {
  try {
    const pattern = req.params.pattern.toLowerCase();
    const matchedGames = await dbAll(
      "SELECT * FROM games WHERE LOWER(name) LIKE ?",
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
    const { name, status, maxPlayers, players, drawnNumbers } = req.body;
    await dbRun(
      "UPDATE games SET name = ?, status = ?,maxPlayers = ?, players = ?, drawnNumbers = ? WHERE id = ?",
      [
        name || exists.name,
        status || exists.status,
        maxPlayers || exists.maxPlayers,
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

    if (drawnNumbers.length >= 75) {
      return res.status(400).json("All numbers already drawn!");
    }

    let newNum;
    let isUnique = false;

    while (!isUnique) {
      newNum = Math.floor(Math.random() * 75) + 1;
      if (!drawnNumbers.includes(newNum)) {
        isUnique = true;
      }
    }

    drawnNumbers.push(newNum);

    await dbRun("UPDATE games SET drawnNumbers = ? WHERE id = ?", [
      JSON.stringify(drawnNumbers),
      id,
    ]);

    return res.status(200).json({
      number: newNum,
      allDrawn: drawnNumbers,
    });
  } catch (err) {
    console.error("Error with drawinf number:", err);
    return res.status(500).json("Server error");
  }
});

module.exports = router;

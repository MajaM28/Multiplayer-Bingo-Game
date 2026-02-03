const express = require("express");
const router = express.Router();
const { dbRun, dbGet, dbAll } = require("../database/db");

//post(create), read(get), put(update), delete(delete)

// POST - CREATE result
router.post("/", async (req, res) => {
  try {
    const { gameId, winnerId } = req.body;

    //pobieranie danych zwyciezcy z users
    const user = await dbGet("SELECT * FROM users WHERE id = ?", [winnerId]);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const newWin = {
      id: Date.now().toString(),
      gameId,
      winnerId,
      winnerName: user.username,
      wonAt: Date.now(),
    };

    //zapis zwyciestwa do bazy
    await dbRun(
      "INSERT INTO winners (id, gameId, winnerId, winnerName, wonAt) VALUES (?, ?, ?, ?, ?)",
      [
        newWin.id,
        newWin.gameId,
        newWin.winnerId,
        newWin.winnerName,
        newWin.wonAt,
      ],
    );

    // mowimy wszytskim gracza w grze o zwyciezcy
    req.app.get("io").to(`game-${gameId}`).emit("bingoWinner", {
      winnerId: winnerId,
      winner: user.username,
      gameId: gameId,
    });

    return res.status(201).json(newWin);
  } catch (err) {
    console.error("Winner error:", err);
    return res.status(500).json("Server error");
  }
});

// GET all - READ all results (z filtrowaniem!)
router.get("/", async (req, res) => {
  try {
    const { gameId, winnerId, roundNumber } = req.query;

    let query = "SELECT * FROM winners WHERE 1=1"; // znowu trick 1=1
    const params = [];
    if (winnerId) {
      query += " AND winnerId = ?";
      params.push(winnerId);
    }

    if (gameId) {
      query += " AND gameId = ?";
      params.push(gameId);
    }

    if (roundNumber) {
      query += " AND roundNumber = ?";
      params.push(roundNumber);
    }
    const winners = await dbAll(query, params);
    return res.status(200).json(winners);
  } catch (err) {
    console.error("Get winners error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

// GET :id - READ one result
router.get("/:id", async (req, res) => {
  try {
    const id = req.params.id; // id nie przychodzi z posta (body) -> pochoddzi z params (dane z url)

    const found = await dbGet("SELECT * FROM winners WHERE id = ?", [id]);

    if (!found) {
      return res.status(404).json("No such winner found");
    }

    return res.status(200).json(found);
  } catch (err) {
    console.error("Get one winner error:", err);
    return res.status(500).json("Server error");
  }
});

// PUT :id - UPDATE result
router.put("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const exists = await dbGet("SELECT * FROM winners WHERE id = ?", [id]);
    if (!exists) {
      return res.status(404).json("No such winner found");
    }
    const { winnerPattern } = req.body;
    await dbRun("UPDATE winners SET winnerPattern = ? WHERE id = ?", [
      winnerPattern || exists.winnerPattern,
      id,
    ]); //updatujemy dane , jak nie zosatły podane to są undefined wiec zosatja te co byly oryginalnie (w exists), nic to nie zwraca (bo to run)
    const updated = await dbGet("SELECT * FROM winners WHERE id = ?", [id]); // trzeba pobrac dane jeszcze raz zeby je zwrocic juz z nowymi wartosciami
    return res.status(200).json(updated);
  } catch (err) {
    console.error("Update winner error:", err);
    return res.status(500).json("Server error");
  }
});

// DELETE :id - DELETE result
router.delete("/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const exists = await dbGet("SELECT * FROM winners WHERE id = ?", [id]);
    if (!exists) {
      return res.status(404).json("No such winner found");
    }

    await dbRun("DELETE FROM winners WHERE id = ?", [id]);
    return res.status(200).json("Winner deleted");
  } catch (err) {
    console.error("Delete winner error:", err);
    return res.status(500).json("Server error");
  }
});

module.exports = router;

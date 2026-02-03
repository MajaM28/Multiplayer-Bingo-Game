const express = require("express");
const router = express.Router();

//do publikowania chat messages z mqtt
router.post("/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { username, message } = req.body;

    // sprawdzanie czy jest co wysłac i od kogo
    if (!message || !username) {
      return res.status(400).json({ error: "no username/message" });
    }

    //ogolna struktura wiadomosci
    const chatMessage = {
      username,
      message,
      gameId,
      createdAt: Date.now(),
    };

    // publikujemy w topicu SPECYFICZNEJ gry , Topic: bingo/game/{gameId}/chat
    const mqttClient = req.app.get("mqtt");
    mqttClient.publish(
      `bingo/game/${gameId}/chat`,
      JSON.stringify(chatMessage),
    );

    res.status(200).json(chatMessage);
  } catch (err) {
    console.error("Chat error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

module.exports = router;

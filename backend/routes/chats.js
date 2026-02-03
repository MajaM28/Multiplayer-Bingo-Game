const express = require("express");
const router = express.Router();

router.post("/:gameId", async (req, res) => {
  try {
    const { gameId } = req.params;
    const { username, message } = req.body;

    if (!message || !username) {
      return res.status(400).json({ error: "no username/message" });
    }

    const chatMessage = {
      username,
      message,
      gameId,
      createdAt: Date.now(),
    };

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

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

const mqttClient = mqtt.connect("mqtt://localhost:1883");

const PORT = 3000;

app.use(cors());
app.use(express.json());

const userRoutes = require("./routes/users");
app.use("/api/users", userRoutes);

const gameRoutes = require("./routes/games");
app.use("/api/games", gameRoutes);

const cardRoutes = require("./routes/cards");
app.use("/api/cards", cardRoutes);

const winnerRoutes = require("./routes/winners");
app.use("/api/winners", winnerRoutes);

const chatRoutes = require("./routes/chats");
app.use("/api/chats", chatRoutes);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-game", (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

mqttClient.on("connect", () => {
  console.log("Connected to broker");

  mqttClient.subscribe("bingo/game/+/chat", (err) => {
    console.log("sub ok");
    // + to jest wildcard, czyli wszytsko tam moze byc
    if (!err) {
      console.log("Subbed to game chats");
    }
  });
});

mqttClient.on("message", (topic, message) => {
  const linkParts = topic.split("/");
  const gameId = linkParts[2];

  const chatMess = JSON.parse(message.toString());

  io.to(`game-${gameId}`).emit("chatMessage", chatMess);
});

app.set("io", io);
app.set("mqtt", mqttClient);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

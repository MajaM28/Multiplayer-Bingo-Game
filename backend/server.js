const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const mqtt = require("mqtt");
const cookieParser = require("cookie-parser");
const { dbAll } = require("./database/db");

const app = express();
const server = http.createServer(app);

// socket io do web socketu
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// klient do protokolu mqtt
const mqttClient = mqtt.connect("mqtt://localhost:1883");

const PORT = 3000;

// pozwala na komunikacje frontendu z backendem
app.use(
  cors({
    origin: "http://localhost:5173", // poniewaz blokowal ciasteczka
    credentials: true,
  }),
);

//do parsowania
app.use(express.json());
app.use(cookieParser());

// sciezki
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

  // gracz dolacza -> broadcast do uzytkownikow
  socket.on("join-game", (gameId) => {
    socket.join(`game-${gameId}`);
    console.log(`User ${socket.id} joined game ${gameId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

async function publishStats() {
  try {
    // pobiera wszystkie gry z bazy
    const games = await dbAll("SELECT * FROM games");

    const stats = {
      total: games.length,
      active: games.filter((g) => g.status === "in_progress").length,
      waiting: games.filter((g) => g.status === "waiting").length,
      finished: games.filter((g) => g.status === "finished").length,
    };
    // Publikuj przez MQTT na topic 'bingo/stats/games'
    mqttClient.publish("bingo/stats/games", JSON.stringify(stats));
  } catch (err) {
    console.error("Error publishing stats:", err);
  }
}

mqttClient.on("connect", () => {
  console.log("Connected to broker");

  // subuj czaty wszystkich gier
  mqttClient.subscribe("bingo/game/+/chat", (err) => {
    console.log("sub ok");
    // + to jest wildcard, czyli wszytsko tam moze byc
    if (!err) {
      console.log("Subbed to game chats");
    }
  });

  // subuj statystyki gier
  mqttClient.subscribe("bingo/stats/games", (err) => {
    console.log("stats ok");
    if (!err) {
      console.log("subbed to stats");
    }
  });
  // publikuj statystyki natychmiast po polaczeniu
  publishStats();
});

mqttClient.on("message", (topic, message) => {
  // handler do czatu
  if (topic.startsWith("bingo/game/") && topic.endsWith("/chat")) {
    const linkParts = topic.split("/");
    const gameId = linkParts[2];

    const chatMess = JSON.parse(message.toString());

    io.to(`game-${gameId}`).emit("chatMessage", chatMess);
  }

  // handler do statystyk
  if (topic === "bingo/stats/games") {
    const stats = JSON.parse(message.toString());
    io.emit("gameStats", stats);
  }
});

// to publisher do statsow
setInterval(publishStats, 5000);

app.set("io", io);
app.set("mqtt", mqttClient);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

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

app.set("io", io);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

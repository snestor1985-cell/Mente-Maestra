import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
import path from "path";
import { fileURLToPath } from 'url';
import archiver from 'archiver';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer);
  const PORT = process.env.PORT || 3000;

  // In-memory room state
  const rooms = new Map();

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("create_room", (data) => {
      const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
      rooms.set(roomId, {
        id: roomId,
        players: [{ id: socket.id, name: data.userName || "Player 1" }],
        gameType: null,
        gameState: null,
        reservations: {} // { cellId: { userId, timestamp } }
      });
      socket.join(roomId);
      socket.emit("room_created", { roomId });
      io.to(roomId).emit("room_update", rooms.get(roomId));
    });

    socket.on("join_room", (data) => {
      const { roomId, userName } = data;
      const room = rooms.get(roomId);
      if (room) {
        room.players.push({ id: socket.id, name: userName || `Player ${room.players.length + 1}` });
        socket.join(roomId);
        io.to(roomId).emit("room_update", room);
      } else {
        socket.emit("error", { message: "Room not found" });
      }
    });

    socket.on("select_game", (data) => {
      const { roomId, gameType } = data;
      const room = rooms.get(roomId);
      if (room) {
        room.gameType = gameType;
        // Reset game state for new game
        room.gameState = null; 
        room.reservations = {};
        io.to(roomId).emit("room_update", room);
      }
    });

    socket.on("start_game", (data) => {
      const { roomId, initialGameState } = data;
      const room = rooms.get(roomId);
      if (room) {
        room.gameState = initialGameState;
        io.to(roomId).emit("game_started", { 
          roomId: room.id,
          gameType: room.gameType,
          gameData: room.gameState 
        });
      }
    });

    socket.on("game_action", (data) => {
      const { roomId, action, payload } = data;
      // Broadcast action to others in room
      socket.to(roomId).emit("game_action", { action, payload });
      
      // Update server state if needed (for simple synchronization)
      // For now, we trust clients to sync via actions
    });

    // Reservation System
    socket.on("reserve_slot", (data) => {
      const { roomId, slotId } = data;
      const room = rooms.get(roomId);
      if (room) {
        const now = Date.now();
        // Check if reserved by someone else
        const currentReservation = room.reservations[slotId];
        if (currentReservation && currentReservation.userId !== socket.id && now - currentReservation.timestamp < 15000) {
          // Still reserved by someone else
          socket.emit("reservation_failed", { slotId });
          return;
        }

        // Reserve it
        room.reservations[slotId] = { userId: socket.id, timestamp: now };
        io.to(roomId).emit("slot_reserved", { slotId, userId: socket.id });

        // Auto-release after 15s
        setTimeout(() => {
          const r = rooms.get(roomId);
          if (r && r.reservations[slotId]?.userId === socket.id) {
            delete r.reservations[slotId];
            io.to(roomId).emit("slot_released", { slotId });
          }
        }, 15000);
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
      // Remove player from rooms
      rooms.forEach((room, roomId) => {
        const index = room.players.findIndex((p: any) => p.id === socket.id);
        if (index !== -1) {
          room.players.splice(index, 1);
          if (room.players.length === 0) {
            rooms.delete(roomId);
          } else {
            io.to(roomId).emit("room_update", room);
          }
        }
      });
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.get('/download-source', (req, res) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    res.attachment('mente-maestra-source.zip');

    archive.pipe(res);

    archive.glob('**/*', {
      cwd: __dirname,
      ignore: ['node_modules/**', '.git/**', 'dist/**', '.env', '.DS_Store']
    });

    archive.finalize();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

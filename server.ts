import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";

const db = new Database("votes.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS votes (
    username TEXT PRIMARY KEY,
    dates TEXT NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  const PORT = 3000;

  // Socket.io logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Send initial data
    const allVotes = db.prepare("SELECT * FROM votes").all();
    socket.emit("init_votes", allVotes.map((v: any) => ({
      username: v.username,
      dates: JSON.parse(v.dates)
    })));

    // Handle vote submission
    socket.on("submit_vote", (data: { username: string; dates: string[] }) => {
      const { username, dates } = data;
      if (!username || !Array.isArray(dates)) return;

      const stmt = db.prepare("INSERT OR REPLACE INTO votes (username, dates, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)");
      stmt.run(username, JSON.stringify(dates));

      // Broadcast updated data to all clients
      const updatedVotes = db.prepare("SELECT * FROM votes").all();
      io.emit("update_votes", updatedVotes.map((v: any) => ({
        username: v.username,
        dates: JSON.parse(v.dates)
      })));
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

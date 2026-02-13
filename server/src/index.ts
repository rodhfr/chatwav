import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import authRoutes from "./routes/auth";
import roomRoutes from "./routes/rooms";
import messageRoutes from "./routes/messages";
import { initializeSocket } from "./socket";

const PORT = parseInt(process.env.PORT || "3001", 10);
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors({ origin: CLIENT_URL, credentials: true }));
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api/auth", authRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/messages", messageRoutes);

// Initialize Socket.io
initializeSocket(server, CLIENT_URL);

server.listen(PORT, () => {
  console.log(`ChatWav server running on http://localhost:${PORT}`);
});

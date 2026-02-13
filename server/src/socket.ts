import { Server as HttpServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./lib/prisma";
import {
  AuthPayload,
  ServerToClientEvents,
  ClientToServerEvents,
  SocketUser,
} from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-do-not-use-in-prod";

// Track online users: Map<userId, SocketUser>
const onlineUsers = new Map<string, SocketUser>();
// Track which rooms each socket is in: Map<socketId, Set<roomId>>
const socketRooms = new Map<string, Set<string>>();

export function initializeSocket(httpServer: HttpServer, clientUrl: string): Server {
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: clientUrl,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const user = socket.data.user as AuthPayload;
    console.log(`User connected: ${user.username} (${socket.id})`);

    // Register online user
    onlineUsers.set(user.userId, {
      userId: user.userId,
      username: user.username,
      socketId: socket.id,
    });
    socketRooms.set(socket.id, new Set());

    // Broadcast that user came online
    io.emit("user-online", { userId: user.userId, username: user.username });

    // --- Join Room ---
    socket.on("join-room", async ({ roomId }) => {
      try {
        // Verify membership
        const membership = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId: user.userId, roomId } },
        });

        if (!membership) {
          socket.emit("error", { message: "You are not a member of this room" });
          return;
        }

        socket.join(roomId);
        socketRooms.get(socket.id)?.add(roomId);

        // Send current room users to the joining user
        const roomUserList = getRoomOnlineUsers(io, roomId);
        io.to(roomId).emit("room-users", { roomId, users: roomUserList });

        console.log(`${user.username} joined room ${roomId}`);
      } catch (error) {
        console.error("Join room socket error:", error);
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    // --- Leave Room ---
    socket.on("leave-room", ({ roomId }) => {
      socket.leave(roomId);
      socketRooms.get(socket.id)?.delete(roomId);

      // Update room users list
      const roomUserList = getRoomOnlineUsers(io, roomId);
      io.to(roomId).emit("room-users", { roomId, users: roomUserList });

      console.log(`${user.username} left room ${roomId}`);
    });

    // --- Send Message ---
    socket.on("send-message", async ({ roomId, content }) => {
      try {
        if (!content || content.trim().length === 0) {
          socket.emit("error", { message: "Message content cannot be empty" });
          return;
        }

        // Verify membership
        const membership = await prisma.roomMember.findUnique({
          where: { userId_roomId: { userId: user.userId, roomId } },
        });

        if (!membership) {
          socket.emit("error", { message: "You are not a member of this room" });
          return;
        }

        // Persist message
        const message = await prisma.message.create({
          data: {
            content: content.trim(),
            userId: user.userId,
            roomId,
          },
          include: {
            user: { select: { id: true, username: true } },
          },
        });

        // Update room timestamp
        await prisma.room.update({
          where: { id: roomId },
          data: { updatedAt: new Date() },
        });

        const payload = {
          id: message.id,
          content: message.content,
          createdAt: message.createdAt.toISOString(),
          roomId: message.roomId,
          user: { id: message.user.id, username: message.user.username },
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomId).emit("new-message", payload);
      } catch (error) {
        console.error("Send message socket error:", error);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // --- Typing ---
    socket.on("typing", ({ roomId }) => {
      socket.to(roomId).emit("user-typing", {
        userId: user.userId,
        username: user.username,
        roomId,
      });
    });

    socket.on("stop-typing", ({ roomId }) => {
      socket.to(roomId).emit("stop-typing", {
        userId: user.userId,
        roomId,
      });
    });

    // --- Disconnect ---
    socket.on("disconnect", () => {
      console.log(`User disconnected: ${user.username} (${socket.id})`);

      // Clean up online tracking
      onlineUsers.delete(user.userId);

      // Update room-users for every room they were in
      const rooms = socketRooms.get(socket.id);
      if (rooms) {
        for (const roomId of rooms) {
          const roomUserList = getRoomOnlineUsers(io, roomId);
          io.to(roomId).emit("room-users", { roomId, users: roomUserList });
        }
      }
      socketRooms.delete(socket.id);

      // Broadcast that user went offline
      io.emit("user-offline", { userId: user.userId, username: user.username });
    });
  });

  return io;
}

function getRoomOnlineUsers(
  io: Server<ClientToServerEvents, ServerToClientEvents>,
  roomId: string
): { userId: string; username: string }[] {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  if (!roomSockets) return [];

  const users: { userId: string; username: string }[] = [];
  const seen = new Set<string>();

  for (const socketId of roomSockets) {
    const socketUser = [...onlineUsers.values()].find((u) => u.socketId === socketId);
    if (socketUser && !seen.has(socketUser.userId)) {
      seen.add(socketUser.userId);
      users.push({ userId: socketUser.userId, username: socketUser.username });
    }
  }

  return users;
}

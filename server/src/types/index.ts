import { Request } from "express";

export interface AuthPayload {
  userId: string;
  email: string;
  username: string;
}

export interface AuthRequest extends Request {
  user?: AuthPayload;
}

export interface SocketUser {
  userId: string;
  username: string;
  socketId: string;
}

export interface ServerToClientEvents {
  "new-message": (message: MessagePayload) => void;
  "user-typing": (data: { userId: string; username: string; roomId: string }) => void;
  "stop-typing": (data: { userId: string; roomId: string }) => void;
  "user-online": (data: { userId: string; username: string }) => void;
  "user-offline": (data: { userId: string; username: string }) => void;
  "room-users": (data: { roomId: string; users: { userId: string; username: string }[] }) => void;
  error: (data: { message: string }) => void;
}

export interface ClientToServerEvents {
  "join-room": (data: { roomId: string }) => void;
  "leave-room": (data: { roomId: string }) => void;
  "send-message": (data: { roomId: string; content: string }) => void;
  typing: (data: { roomId: string }) => void;
  "stop-typing": (data: { roomId: string }) => void;
}

export interface MessagePayload {
  id: string;
  content: string;
  createdAt: string;
  roomId: string;
  user: {
    id: string;
    username: string;
  };
}

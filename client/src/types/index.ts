export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: string;
}

export interface Room {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  messageCount: number;
  isMember: boolean;
}

export interface RoomDetail {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  memberCount: number;
  messageCount: number;
  members: { id: string; username: string; joinedAt: string }[];
}

export interface Message {
  id: string;
  content: string;
  createdAt: string;
  roomId: string;
  user: {
    id: string;
    username: string;
  };
}

export interface OnlineUser {
  userId: string;
  username: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

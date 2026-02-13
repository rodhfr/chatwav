import { useState, useCallback, useEffect, useRef } from "react";
import { getSocket } from "../socket";
import { useSocketEvent } from "./useSocket";
import api from "../api/client";
import type { Message, OnlineUser } from "../types";

export function useChat(roomId: string | null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [typingUsers, setTypingUsers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load messages when room changes
  useEffect(() => {
    if (!roomId) {
      setMessages([]);
      setOnlineUsers([]);
      setTypingUsers(new Map());
      setHasMore(false);
      setNextCursor(null);
      return;
    }

    const socket = getSocket();
    if (socket) {
      socket.emit("join-room", { roomId });
    }

    setLoading(true);
    api
      .get<{ messages: Message[]; nextCursor: string | null; hasMore: boolean }>(
        `/messages/${roomId}`
      )
      .then((res) => {
        // Messages come newest-first from API, reverse for display
        setMessages(res.data.messages.reverse());
        setNextCursor(res.data.nextCursor);
        setHasMore(res.data.hasMore);
      })
      .catch((err) => {
        console.error("Failed to load messages:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    return () => {
      if (socket) {
        socket.emit("leave-room", { roomId });
      }
      setTypingUsers(new Map());
    };
  }, [roomId]);

  // Load older messages (pagination)
  const loadMore = useCallback(async () => {
    if (!roomId || !nextCursor || loading) return;

    setLoading(true);
    try {
      const res = await api.get<{
        messages: Message[];
        nextCursor: string | null;
        hasMore: boolean;
      }>(`/messages/${roomId}?cursor=${nextCursor}`);

      setMessages((prev) => [...res.data.messages.reverse(), ...prev]);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    } catch (err) {
      console.error("Failed to load more messages:", err);
    } finally {
      setLoading(false);
    }
  }, [roomId, nextCursor, loading]);

  // Listen for new messages
  useSocketEvent<Message>("new-message", (message) => {
    if (message.roomId === roomId) {
      setMessages((prev) => [...prev, message]);
    }
  });

  // Listen for room users
  useSocketEvent<{ roomId: string; users: OnlineUser[] }>("room-users", (data) => {
    if (data.roomId === roomId) {
      setOnlineUsers(data.users);
    }
  });

  // Listen for typing indicators
  useSocketEvent<{ userId: string; username: string; roomId: string }>(
    "user-typing",
    (data) => {
      if (data.roomId === roomId) {
        setTypingUsers((prev) => {
          const next = new Map(prev);
          next.set(data.userId, data.username);
          return next;
        });
      }
    }
  );

  useSocketEvent<{ userId: string; roomId: string }>("stop-typing", (data) => {
    if (data.roomId === roomId) {
      setTypingUsers((prev) => {
        const next = new Map(prev);
        next.delete(data.userId);
        return next;
      });
    }
  });

  const sendMessage = useCallback(
    (content: string) => {
      if (!roomId) return;
      const socket = getSocket();
      if (socket) {
        socket.emit("send-message", { roomId, content });
        // Stop typing when sending
        socket.emit("stop-typing", { roomId });
      }
    },
    [roomId]
  );

  const emitTyping = useCallback(() => {
    if (!roomId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit("typing", { roomId });

    // Auto-stop typing after 2 seconds of inactivity
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop-typing", { roomId });
    }, 2000);
  }, [roomId]);

  return {
    messages,
    onlineUsers,
    typingUsers,
    loading,
    hasMore,
    sendMessage,
    emitTyping,
    loadMore,
  };
}

import { Response } from "express";
import prisma from "../lib/prisma";
import { AuthRequest } from "../types";

const PAGE_SIZE = 50;

export async function getMessages(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { roomId } = req.params;
    const cursor = req.query.cursor as string | undefined;

    const room = await prisma.room.findUnique({ where: { id: roomId } });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const membership = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: req.user.userId, roomId } },
    });

    if (!membership) {
      res.status(403).json({ error: "You must be a member of this room to view messages" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: { roomId },
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor
        ? {
            cursor: { id: cursor },
            skip: 1,
          }
        : {}),
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    const hasMore = messages.length > PAGE_SIZE;
    const result = hasMore ? messages.slice(0, PAGE_SIZE) : messages;
    const nextCursor = hasMore ? result[result.length - 1].id : null;

    res.json({
      messages: result.map((m) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        roomId: m.roomId,
        user: { id: m.user.id, username: m.user.username },
      })),
      nextCursor,
      hasMore,
    });
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

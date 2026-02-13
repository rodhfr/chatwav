import { Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { AuthRequest } from "../types";

const createRoomSchema = z.object({
  name: z
    .string()
    .min(2, "Room name must be at least 2 characters")
    .max(50, "Room name must be at most 50 characters"),
  description: z.string().max(200, "Description must be at most 200 characters").optional(),
});

export async function createRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const parsed = createRoomSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.errors[0].message });
      return;
    }

    const { name, description } = parsed.data;

    const existing = await prisma.room.findUnique({ where: { name } });
    if (existing) {
      res.status(409).json({ error: "A room with this name already exists" });
      return;
    }

    const room = await prisma.room.create({
      data: {
        name,
        description,
        members: {
          create: { userId: req.user.userId },
        },
      },
      include: {
        _count: { select: { members: true, messages: true } },
      },
    });

    res.status(201).json({ room });
  } catch (error) {
    console.error("Create room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function listRooms(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const rooms = await prisma.room.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { members: true, messages: true } },
        members: {
          where: { userId: req.user.userId },
          select: { id: true },
        },
      },
    });

    const result = rooms.map((room) => ({
      id: room.id,
      name: room.name,
      description: room.description,
      createdAt: room.createdAt,
      memberCount: room._count.members,
      messageCount: room._count.messages,
      isMember: room.members.length > 0,
    }));

    res.json({ rooms: result });
  } catch (error) {
    console.error("List rooms error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function getRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true, messages: true } },
        members: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
      },
    });

    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    res.json({
      room: {
        id: room.id,
        name: room.name,
        description: room.description,
        createdAt: room.createdAt,
        memberCount: room._count.members,
        messageCount: room._count.messages,
        members: room.members.map((m) => ({
          id: m.user.id,
          username: m.user.username,
          joinedAt: m.joinedAt,
        })),
      },
    });
  } catch (error) {
    console.error("Get room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function joinRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { id } = req.params;

    const room = await prisma.room.findUnique({ where: { id } });
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }

    const existing = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: req.user.userId, roomId: id } },
    });

    if (existing) {
      res.json({ message: "Already a member of this room" });
      return;
    }

    await prisma.roomMember.create({
      data: { userId: req.user.userId, roomId: id },
    });

    res.json({ message: "Joined room successfully" });
  } catch (error) {
    console.error("Join room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

export async function leaveRoom(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    const { id } = req.params;

    const membership = await prisma.roomMember.findUnique({
      where: { userId_roomId: { userId: req.user.userId, roomId: id } },
    });

    if (!membership) {
      res.status(400).json({ error: "Not a member of this room" });
      return;
    }

    await prisma.roomMember.delete({ where: { id: membership.id } });

    res.json({ message: "Left room successfully" });
  } catch (error) {
    console.error("Leave room error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

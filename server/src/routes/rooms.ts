import { Router } from "express";
import {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  leaveRoom,
} from "../controllers/rooms.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.post("/", createRoom);
router.get("/", listRooms);
router.get("/:id", getRoom);
router.post("/:id/join", joinRoom);
router.post("/:id/leave", leaveRoom);

export default router;

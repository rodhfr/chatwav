import { Router } from "express";
import { getMessages } from "../controllers/messages.controller";
import { authenticate } from "../middleware/auth";

const router = Router();

router.use(authenticate);

router.get("/:roomId", getMessages);

export default router;

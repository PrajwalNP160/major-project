import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  getChatHistory,
  deleteMessage,
} from "../controllers/groupChat.controller.js";

const router = express.Router();

// All routes require authentication
router.use(clerkAuthMiddleware, requireAuth());

// Get chat history for a study group
router.get("/:groupId/messages", getChatHistory);

// Delete a message
router.delete("/:groupId/messages/:messageId", deleteMessage);

export default router;

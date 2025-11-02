import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  getAIMatches,
  analyzeMatch,
  getSkillBasedSuggestions
} from "../controllers/aiMatching.controller.js";

const router = express.Router();

// All routes require authentication
router.use(clerkAuthMiddleware, requireAuth());

// Get AI-powered matches for current user
router.get("/matches", getAIMatches);

// Analyze match compatibility with a specific user
router.get("/analyze/:targetUserId", analyzeMatch);

// Get suggestions for a specific skill
router.get("/suggest/:skill", getSkillBasedSuggestions);

export default router;

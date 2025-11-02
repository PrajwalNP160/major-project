import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import { getMyExchanges, getMyMatches } from "../controllers/exchange.controller.js";

const router = express.Router();

// Legacy endpoint - maintains backward compatibility
router.get("/my-exchanges", clerkAuthMiddleware, requireAuth(), getMyExchanges);

// New improved endpoint - returns only matched users for dashboard
router.get("/my-matches", clerkAuthMiddleware, requireAuth(), getMyMatches);

export default router;

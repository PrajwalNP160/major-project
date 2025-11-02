import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  submitRating,
  getUserRatings,
  getUserRatingStats,
  canRateExchange,
  markExchangeRatable,
} from "../controllers/rating.controller.js";

const router = express.Router();

// Public routes (no auth required)
router.get("/user/:userId", getUserRatings);
router.get("/stats/:userId", getUserRatingStats);

// Protected routes
router.use(clerkAuthMiddleware, requireAuth());

router.post("/submit", submitRating);
router.get("/can-rate/:exchangeId", canRateExchange);
router.post("/mark-ratable/:exchangeId", markExchangeRatable);

export default router;

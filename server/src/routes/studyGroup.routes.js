import express from "express";
import { clerkAuthMiddleware } from "../middlewares/clerkAuth.js";
import { requireAuth } from "@clerk/express";
import {
  getStudyGroups,
  getStudyGroupById,
  createStudyGroup,
  joinStudyGroup,
  leaveStudyGroup,
  updateStudyGroup,
  getUserStudyGroups,
  addResource,
} from "../controllers/studyGroup.controller.js";

const router = express.Router();

// Apply clerk middleware to all routes (makes getAuth available)
router.use(clerkAuthMiddleware);

// Public routes (no authentication required, but auth is optional)
router.get("/", getStudyGroups); // Browse study groups
router.get("/:id", getStudyGroupById); // View specific study group

// Protected routes (authentication required)
router.use(requireAuth());

// User's study groups
router.get("/user/my-groups", getUserStudyGroups);

// Create study group
router.post("/create", createStudyGroup);

// Join/leave study group
router.post("/:id/join", joinStudyGroup);
router.post("/:id/leave", leaveStudyGroup);

// Update study group (creator/moderator only)
router.put("/:id", updateStudyGroup);

// Add resources
router.post("/:id/resources", addResource);

export default router;

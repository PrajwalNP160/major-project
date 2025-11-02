import { getAuth } from "@clerk/express";
import { Exchange } from "../models/exchange.model.js";
import { User } from "../models/user.model.js";

// Legacy endpoint - maintains backward compatibility
export const getMyExchanges = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exchanges = await Exchange.find({
      "participants.userId": user._id,
    }).populate("participants.userId", "firstName lastName avatar");

    return res.status(200).json({ exchanges });
  } catch (error) {
    console.error("GetMyExchanges error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

// New improved endpoint - returns only matched users
export const getMyMatches = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const exchanges = await Exchange.find({
      "participants.userId": user._id,
    }).populate("participants.userId", "firstName lastName avatar email location skills experience experienceType");

    // Filter out current user and return only matched users with exchange details
    const matchedUsers = exchanges.map(exchange => {
      // Find the current user's participant data
      const currentUserParticipant = exchange.participants.find(
        p => p.userId && p.userId._id && p.userId._id.toString() === user._id.toString()
      );
      
      // Find the other user's participant data
      const otherUserParticipant = exchange.participants.find(
        p => p.userId && p.userId._id && p.userId._id.toString() !== user._id.toString()
      );

      // Skip if data is incomplete or userId is null
      if (!otherUserParticipant || !currentUserParticipant || !otherUserParticipant.userId || !currentUserParticipant.userId) {
        console.log("Skipping exchange due to missing user data:", exchange._id);
        return null;
      }

      return {
        exchangeId: exchange._id,
        matchedUser: {
          _id: otherUserParticipant.userId._id,
          firstName: otherUserParticipant.userId.firstName,
          lastName: otherUserParticipant.userId.lastName,
          avatar: otherUserParticipant.userId.avatar,
          email: otherUserParticipant.userId.email,
          location: otherUserParticipant.userId.location,
          skills: otherUserParticipant.userId.skills,
          experience: otherUserParticipant.userId.experience,
          experienceType: otherUserParticipant.userId.experienceType,
        },
        skillExchange: {
          youTeach: currentUserParticipant.teaches,
          youLearn: currentUserParticipant.learns,
          theyTeach: otherUserParticipant.teaches,
          theyLearn: otherUserParticipant.learns,
        },
        status: exchange.status,
        nextSession: exchange.nextSession,
        createdAt: exchange.createdAt,
        // Rating-related fields
        canBeRated: exchange.canBeRated || false,
        sessionsCompleted: exchange.sessionsCompleted || 0,
        hasRated: currentUserParticipant.hasRated || false,
      };
    }).filter(Boolean); // Remove null entries

    return res.status(200).json({ 
      matches: matchedUsers,
      count: matchedUsers.length 
    });
  } catch (error) {
    console.error("GetMyMatches error:", error);
    console.error("Error stack:", error.stack);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

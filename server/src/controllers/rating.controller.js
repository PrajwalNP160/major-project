import { getAuth } from "@clerk/express";
import Rating from "../models/rating.model.js";
import { Exchange } from "../models/exchange.model.js";
import { User } from "../models/user.model.js";

/**
 * Submit a rating for a completed exchange
 * @route POST /api/ratings/submit
 */
export const submitRating = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const {
      exchangeId,
      ratedUserId,
      ratings,
      feedback,
      skillTaught,
      skillLearned,
      wouldRecommend,
      tags,
    } = req.body;
    
    // Validate required fields
    if (!exchangeId || !ratedUserId || !ratings) {
      return res.status(400).json({ message: "Missing required fields" });
    }
    
    // Get current user
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get the exchange
    const exchange = await Exchange.findById(exchangeId);
    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" });
    }
    
    // Verify user is part of this exchange
    const isParticipant = exchange.participants.some(
      (p) => p.userId.toString() === currentUser._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ 
        message: "You can only rate users you've exchanged skills with" 
      });
    }
    
    // Verify the rated user is the other participant
    const otherParticipant = exchange.participants.find(
      (p) => p.userId.toString() !== currentUser._id.toString()
    );
    
    if (!otherParticipant || otherParticipant.userId.toString() !== ratedUserId) {
      return res.status(400).json({ message: "Invalid rated user" });
    }
    
    // Check if user has already rated this exchange
    const existingRating = await Rating.findOne({
      exchangeId,
      ratedBy: currentUser._id,
    });
    
    if (existingRating) {
      return res.status(409).json({ 
        message: "You have already rated this exchange",
        rating: existingRating
      });
    }
    
    // Create the rating
    const rating = await Rating.create({
      exchangeId,
      ratedBy: currentUser._id,
      ratedUser: ratedUserId,
      ratings,
      feedback,
      skillTaught,
      skillLearned,
      wouldRecommend,
      tags: tags || [],
    });
    
    // Update exchange to mark user has rated
    const participantIndex = exchange.participants.findIndex(
      (p) => p.userId.toString() === currentUser._id.toString()
    );
    
    if (participantIndex !== -1) {
      exchange.participants[participantIndex].hasRated = true;
      await exchange.save();
    }
    
    // Update rated user's rating statistics
    await updateUserRatingStats(ratedUserId);
    
    return res.status(201).json({
      message: "Rating submitted successfully",
      rating,
    });
    
  } catch (error) {
    console.error("Submit rating error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get ratings for a specific user
 * @route GET /api/ratings/user/:userId
 */
export const getUserRatings = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, skip = 0, publicOnly = true } = req.query;
    
    const query = {
      ratedUser: userId,
    };
    
    if (publicOnly === 'true') {
      query.isPublic = true;
    }
    
    const ratings = await Rating.find(query)
      .populate("ratedBy", "firstName lastName avatar")
      .populate("exchangeId", "createdAt completedAt")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();
    
    const total = await Rating.countDocuments(query);
    
    return res.status(200).json({
      ratings,
      total,
      hasMore: total > parseInt(skip) + parseInt(limit),
    });
    
  } catch (error) {
    console.error("Get user ratings error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Get rating statistics for a user
 * @route GET /api/ratings/stats/:userId
 */
export const getUserRatingStats = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId).select("ratingStats firstName lastName").lean();
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Get distribution of ratings
    const ratings = await Rating.find({ ratedUser: userId, isPublic: true }).lean();
    
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };
    
    ratings.forEach((rating) => {
      const overall = Math.round(rating.ratings.overall);
      distribution[overall] = (distribution[overall] || 0) + 1;
    });
    
    // Get most common tags
    const tagCounts = {};
    ratings.forEach((rating) => {
      rating.tags?.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const topTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([tag, count]) => ({ tag, count }));
    
    return res.status(200).json({
      stats: user.ratingStats,
      distribution,
      topTags,
      totalReviews: ratings.length,
    });
    
  } catch (error) {
    console.error("Get rating stats error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Check if user can rate an exchange
 * @route GET /api/ratings/can-rate/:exchangeId
 */
export const canRateExchange = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { exchangeId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const currentUser = await User.findOne({ clerkId: userId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const exchange = await Exchange.findById(exchangeId).populate("participants.userId", "firstName lastName");
    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" });
    }
    
    // Check if user is participant
    const userParticipant = exchange.participants.find(
      (p) => p.userId._id.toString() === currentUser._id.toString()
    );
    
    if (!userParticipant) {
      return res.status(200).json({ canRate: false, reason: "Not a participant" });
    }
    
    // Check if already rated
    if (userParticipant.hasRated) {
      return res.status(200).json({ canRate: false, reason: "Already rated" });
    }
    
    // Check if exchange can be rated (completed or has sessions)
    if (!exchange.canBeRated && exchange.sessionsCompleted < 1) {
      return res.status(200).json({ 
        canRate: false, 
        reason: "Exchange must have at least one completed session" 
      });
    }
    
    // Get the other participant
    const otherParticipant = exchange.participants.find(
      (p) => p.userId._id.toString() !== currentUser._id.toString()
    );
    
    return res.status(200).json({
      canRate: true,
      exchange: {
        _id: exchange._id,
        otherUser: {
          _id: otherParticipant.userId._id,
          firstName: otherParticipant.userId.firstName,
          lastName: otherParticipant.userId.lastName,
        },
        skillTaught: userParticipant.teaches,
        skillLearned: userParticipant.learns,
        sessionsCompleted: exchange.sessionsCompleted,
      },
    });
    
  } catch (error) {
    console.error("Can rate exchange error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Mark exchange as ready to be rated
 * @route POST /api/ratings/mark-ratable/:exchangeId
 */
export const markExchangeRatable = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { exchangeId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const currentUser = await User.findOne({ clerkId: userId });
    const exchange = await Exchange.findById(exchangeId);
    
    if (!exchange) {
      return res.status(404).json({ message: "Exchange not found" });
    }
    
    // Verify user is participant
    const isParticipant = exchange.participants.some(
      (p) => p.userId.toString() === currentUser._id.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({ message: "Not authorized" });
    }
    
    // Increment sessions completed
    exchange.sessionsCompleted += 1;
    exchange.canBeRated = true;
    
    await exchange.save();
    
    return res.status(200).json({
      message: "Exchange marked as ratable",
      sessionsCompleted: exchange.sessionsCompleted,
    });
    
  } catch (error) {
    console.error("Mark ratable error:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Helper function to update user rating statistics
 */
async function updateUserRatingStats(userId) {
  try {
    const ratings = await Rating.find({ ratedUser: userId }).lean();
    
    if (ratings.length === 0) {
      return;
    }
    
    const totalRatings = ratings.length;
    
    // Calculate averages
    const sums = ratings.reduce(
      (acc, rating) => {
        acc.skillKnowledge += rating.ratings.skillKnowledge;
        acc.communication += rating.ratings.communication;
        acc.punctuality += rating.ratings.punctuality;
        acc.helpfulness += rating.ratings.helpfulness;
        acc.overall += rating.ratings.overall;
        if (rating.wouldRecommend) acc.recommendations += 1;
        return acc;
      },
      {
        skillKnowledge: 0,
        communication: 0,
        punctuality: 0,
        helpfulness: 0,
        overall: 0,
        recommendations: 0,
      }
    );
    
    const ratingStats = {
      averageRating: parseFloat((sums.overall / totalRatings).toFixed(2)),
      totalRatings,
      skillKnowledge: parseFloat((sums.skillKnowledge / totalRatings).toFixed(2)),
      communication: parseFloat((sums.communication / totalRatings).toFixed(2)),
      punctuality: parseFloat((sums.punctuality / totalRatings).toFixed(2)),
      helpfulness: parseFloat((sums.helpfulness / totalRatings).toFixed(2)),
      recommendationRate: parseFloat(
        ((sums.recommendations / totalRatings) * 100).toFixed(2)
      ),
    };
    
    await User.findByIdAndUpdate(userId, { ratingStats });
    
  } catch (error) {
    console.error("Update rating stats error:", error);
  }
}

import { getAuth } from "@clerk/express";
import { User } from "../models/user.model.js";
import { findBestMatches, getMatchRecommendations } from "../services/aiMatching.service.js";

/**
 * Get AI-powered matches for the current user
 * 
 * @route GET /api/ai-matching/matches
 * @access Private
 */
export const getAIMatches = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const {
      skill,              // Filter by specific skill
      minScore = 30,      // Minimum match score
      limit = 20,         // Number of results
      requireMutual = false, // Only mutual matches
      sortBy = 'score'    // Sort by: score, mutual, location
    } = req.query;
    
    // Get current user with all details
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Check if user has completed onboarding
    if (!currentUser.isOnBoarded) {
      return res.status(400).json({ 
        message: "Please complete your profile to get AI-powered matches",
        needsOnboarding: true
      });
    }
    
    // Get all potential matches (exclude current user)
    const allUsers = await User.find({
      clerkId: { $ne: userId },
      isOnBoarded: true // Only match with onboarded users
    });
    
    if (allUsers.length === 0) {
      return res.status(200).json({
        matches: [],
        message: "No potential matches found yet. Check back later!",
        stats: {
          totalUsers: 0,
          matchesFound: 0
        }
      });
    }
    
    // Find best matches using AI algorithm
    const matches = findBestMatches(currentUser, allUsers, {
      minScore: parseInt(minScore),
      limit: parseInt(limit),
      requireMutual: requireMutual === 'true',
      skillFilter: skill
    });
    
    // Add recommendations for each match
    const enrichedMatches = matches.map(match => ({
      ...match,
      recommendations: getMatchRecommendations(match)
    }));
    
    // Apply additional sorting if requested
    let sortedMatches = enrichedMatches;
    if (sortBy === 'mutual') {
      sortedMatches = enrichedMatches.sort((a, b) => {
        if (a.isMutualMatch && !b.isMutualMatch) return -1;
        if (!a.isMutualMatch && b.isMutualMatch) return 1;
        return b.matchScore - a.matchScore;
      });
    } else if (sortBy === 'location') {
      sortedMatches = enrichedMatches.sort((a, b) => {
        return b.scoreBreakdown.location - a.scoreBreakdown.location;
      });
    }
    
    // Calculate statistics
    const stats = {
      totalUsers: allUsers.length,
      matchesFound: sortedMatches.length,
      excellentMatches: sortedMatches.filter(m => m.matchQuality === 'Excellent').length,
      highMatches: sortedMatches.filter(m => m.matchQuality === 'High').length,
      mutualMatches: sortedMatches.filter(m => m.isMutualMatch).length,
      averageScore: sortedMatches.length > 0
        ? Math.round(sortedMatches.reduce((sum, m) => sum + m.matchScore, 0) / sortedMatches.length)
        : 0
    };
    
    return res.status(200).json({
      matches: sortedMatches,
      stats,
      currentUser: {
        skills: currentUser.skills,
        skillsToLearn: currentUser.skillsToLearn,
        location: currentUser.location,
        experience: currentUser.experience
      }
    });
    
  } catch (error) {
    console.error("AI Matching error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

/**
 * Get detailed match analysis for a specific user
 * 
 * @route GET /api/ai-matching/analyze/:targetUserId
 * @access Private
 */
export const analyzeMatch = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { targetUserId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const currentUser = await User.findOne({ clerkId: userId });
    const targetUser = await User.findById(targetUserId);
    
    if (!currentUser || !targetUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Import the calculateMatchScore function
    const { calculateMatchScore } = await import("../services/aiMatching.service.js");
    
    const analysis = calculateMatchScore(currentUser, targetUser);
    const recommendations = getMatchRecommendations({
      ...targetUser.toObject(),
      ...analysis
    });
    
    return res.status(200).json({
      analysis: {
        ...analysis,
        recommendations
      },
      targetUser: {
        _id: targetUser._id,
        firstName: targetUser.firstName,
        lastName: targetUser.lastName,
        avatar: targetUser.avatar,
        location: targetUser.location,
        skills: targetUser.skills,
        skillsToLearn: targetUser.skillsToLearn,
        experience: targetUser.experience
      }
    });
    
  } catch (error) {
    console.error("Match analysis error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

/**
 * Get match suggestions based on a specific skill
 * 
 * @route GET /api/ai-matching/suggest/:skill
 * @access Private
 */
export const getSkillBasedSuggestions = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { skill } = req.params;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const currentUser = await User.findOne({ clerkId: userId });
    
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Find users who have this skill
    const usersWithSkill = await User.find({
      clerkId: { $ne: userId },
      isOnBoarded: true,
      skills: { $regex: new RegExp(skill, 'i') }
    });
    
    if (usersWithSkill.length === 0) {
      return res.status(200).json({
        suggestions: [],
        message: `No users found with skill: ${skill}`
      });
    }
    
    const matches = findBestMatches(currentUser, usersWithSkill, {
      minScore: 20, // Lower threshold for skill-specific search
      limit: 10
    });
    
    const enrichedMatches = matches.map(match => ({
      ...match,
      recommendations: getMatchRecommendations(match)
    }));
    
    return res.status(200).json({
      skill,
      suggestions: enrichedMatches,
      count: enrichedMatches.length
    });
    
  } catch (error) {
    console.error("Skill suggestion error:", error);
    return res.status(500).json({ 
      message: "Internal server error",
      error: error.message 
    });
  }
};

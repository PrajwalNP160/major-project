/**
 * AI-Powered Matching Service
 * 
 * This service implements an intelligent matching algorithm that considers:
 * 1. Skill Compatibility (what they teach vs what you want to learn)
 * 2. Mutual Learning Potential (bidirectional skill exchange)
 * 3. Experience Level Compatibility
 * 4. Location Proximity
 * 5. Availability Overlap
 * 6. Skill Diversity Score
 */

/**
 * Calculate Jaccard similarity between two arrays
 * @param {Array} arr1 
 * @param {Array} arr2 
 * @returns {number} Similarity score between 0 and 1
 */
const jaccardSimilarity = (arr1, arr2) => {
  if (!arr1?.length || !arr2?.length) return 0;
  
  const set1 = new Set(arr1.map(s => s.toLowerCase()));
  const set2 = new Set(arr2.map(s => s.toLowerCase()));
  
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  
  return intersection.size / union.size;
};

/**
 * Calculate skill match score
 * Measures how well user's skills match what the other user wants to learn
 */
const calculateSkillMatchScore = (userSkills, otherUserWantsToLearn) => {
  if (!userSkills?.length || !otherUserWantsToLearn?.length) return 0;
  
  const userSkillsLower = userSkills.map(s => s.toLowerCase());
  const wantsToLearnLower = otherUserWantsToLearn.map(s => s.toLowerCase());
  
  const matches = wantsToLearnLower.filter(skill => 
    userSkillsLower.includes(skill)
  ).length;
  
  return (matches / wantsToLearnLower.length) * 100;
};

/**
 * Calculate bidirectional learning potential
 * Measures if both users can teach and learn from each other
 */
const calculateMutualLearningScore = (user1, user2) => {
  // What user1 can teach user2
  const user1TeachesUser2 = calculateSkillMatchScore(
    user1.skills,
    user2.skillsToLearn
  );
  
  // What user2 can teach user1
  const user2TeachesUser1 = calculateSkillMatchScore(
    user2.skills,
    user1.skillsToLearn
  );
  
  // Both should benefit for a good match
  return (user1TeachesUser2 + user2TeachesUser1) / 2;
};

/**
 * Calculate experience compatibility
 * Similar experience levels work better together
 */
const calculateExperienceCompatibility = (user1Experience, user2Experience) => {
  if (!user1Experience || !user2Experience) return 50; // Neutral score
  
  const experienceLevels = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'expert': 4
  };
  
  const level1 = experienceLevels[user1Experience.toLowerCase()] || 2;
  const level2 = experienceLevels[user2Experience.toLowerCase()] || 2;
  
  const difference = Math.abs(level1 - level2);
  
  // Perfect match: same level = 100
  // 1 level difference = 75
  // 2 levels difference = 50
  // 3+ levels difference = 25
  return Math.max(25, 100 - (difference * 25));
};

/**
 * Calculate location proximity score
 * Same location = higher score
 */
const calculateLocationScore = (user1Location, user2Location) => {
  if (!user1Location || !user2Location) return 50; // Neutral if unknown
  
  const loc1 = user1Location.toLowerCase().trim();
  const loc2 = user2Location.toLowerCase().trim();
  
  // Exact match
  if (loc1 === loc2) return 100;
  
  // Check if one location contains the other (e.g., "New York" and "New York, NY")
  if (loc1.includes(loc2) || loc2.includes(loc1)) return 80;
  
  // Different locations
  return 30;
};

/**
 * Calculate availability overlap
 * More common availability = better match
 */
const calculateAvailabilityScore = (user1Availability, user2Availability) => {
  if (!user1Availability?.length || !user2Availability?.length) return 50;
  
  const overlap = jaccardSimilarity(user1Availability, user2Availability);
  return overlap * 100;
};

/**
 * Calculate skill diversity bonus
 * Rewards matches where users have complementary skills
 */
const calculateSkillDiversityScore = (user1Skills, user2Skills) => {
  if (!user1Skills?.length || !user2Skills?.length) return 0;
  
  const allSkills = new Set([
    ...user1Skills.map(s => s.toLowerCase()),
    ...user2Skills.map(s => s.toLowerCase())
  ]);
  
  const commonSkills = jaccardSimilarity(user1Skills, user2Skills);
  
  // Reward diversity: more unique skills = higher score
  // But some overlap is good for common ground
  const diversityScore = (1 - commonSkills) * 0.7 + commonSkills * 0.3;
  
  return diversityScore * 100;
};

/**
 * Calculate reputation score based on user ratings
 * Higher ratings = better match potential
 */
const calculateReputationScore = (userRatingStats) => {
  if (!userRatingStats || userRatingStats.totalRatings === 0) {
    return 70; // Neutral score for new users
  }
  
  const { averageRating, totalRatings, recommendationRate } = userRatingStats;
  
  // Base score from average rating (0-5 scale converted to 0-100)
  const ratingScore = (averageRating / 5) * 100;
  
  // Bonus for having multiple ratings (trust factor)
  const trustBonus = Math.min(totalRatings * 2, 15); // Max 15 points bonus
  
  // Bonus for high recommendation rate
  const recommendBonus = (recommendationRate / 100) * 10; // Max 10 points
  
  return Math.min(100, ratingScore + trustBonus + recommendBonus);
};

/**
 * Main AI Matching Algorithm
 * Calculates comprehensive match score between two users
 * 
 * @param {Object} currentUser - The user looking for matches
 * @param {Object} potentialMatch - A potential match user
 * @returns {Object} Match result with score and breakdown
 */
export const calculateMatchScore = (currentUser, potentialMatch) => {
  // Weight factors (total = 100%)
  const weights = {
    mutualLearning: 0.30,      // 30% - Can they help each other?
    skillCompatibility: 0.20,   // 20% - Can they teach what you want?
    reputation: 0.20,           // 20% - User ratings and feedback
    experience: 0.12,           // 12% - Similar experience levels
    location: 0.08,             // 8% - Geographic proximity
    availability: 0.08,         // 8% - Schedule compatibility
    skillDiversity: 0.02        // 2% - Complementary skills bonus
  };
  
  // Calculate individual scores
  const scores = {
    mutualLearning: calculateMutualLearningScore(currentUser, potentialMatch),
    skillCompatibility: calculateSkillMatchScore(
      potentialMatch.skills,
      currentUser.skillsToLearn
    ),
    reputation: calculateReputationScore(potentialMatch.ratingStats),
    experience: calculateExperienceCompatibility(
      currentUser.experience,
      potentialMatch.experience
    ),
    location: calculateLocationScore(
      currentUser.location,
      potentialMatch.location
    ),
    availability: calculateAvailabilityScore(
      currentUser.availability,
      potentialMatch.availability
    ),
    skillDiversity: calculateSkillDiversityScore(
      currentUser.skills,
      potentialMatch.skills
    )
  };
  
  // Calculate weighted total score
  const totalScore = Object.keys(weights).reduce((sum, key) => {
    return sum + (scores[key] * weights[key]);
  }, 0);
  
  // Determine match quality
  let matchQuality = 'Low';
  if (totalScore >= 80) matchQuality = 'Excellent';
  else if (totalScore >= 65) matchQuality = 'High';
  else if (totalScore >= 50) matchQuality = 'Good';
  else if (totalScore >= 35) matchQuality = 'Fair';
  
  // Find top matching skills
  const matchingSkills = potentialMatch.skills?.filter(skill =>
    currentUser.skillsToLearn?.some(learn => 
      learn.toLowerCase() === skill.toLowerCase()
    )
  ) || [];
  
  const reverseMatchingSkills = currentUser.skills?.filter(skill =>
    potentialMatch.skillsToLearn?.some(learn => 
      learn.toLowerCase() === skill.toLowerCase()
    )
  ) || [];
  
  return {
    userId: potentialMatch._id,
    matchScore: Math.round(totalScore),
    matchQuality,
    scoreBreakdown: {
      mutualLearning: Math.round(scores.mutualLearning),
      skillCompatibility: Math.round(scores.skillCompatibility),
      experience: Math.round(scores.experience),
      location: Math.round(scores.location),
      availability: Math.round(scores.availability),
      skillDiversity: Math.round(scores.skillDiversity)
    },
    matchingSkills: {
      theyCanTeachYou: matchingSkills,
      youCanTeachThem: reverseMatchingSkills
    },
    isMutualMatch: matchingSkills.length > 0 && reverseMatchingSkills.length > 0
  };
};

/**
 * Find and rank all potential matches for a user
 * 
 * @param {Object} currentUser - The user looking for matches
 * @param {Array} allUsers - Array of all potential match users
 * @param {Object} options - Filtering options
 * @returns {Array} Sorted array of matches with scores
 */
export const findBestMatches = (currentUser, allUsers, options = {}) => {
  const {
    minScore = 30,           // Minimum match score to include
    limit = 50,              // Maximum number of results
    requireMutual = false,   // Only show mutual matches
    skillFilter = null       // Filter by specific skill
  } = options;
  
  // Calculate scores for all users
  const matches = allUsers
    .filter(user => {
      // Don't match with self
      if (user._id.toString() === currentUser._id.toString()) return false;
      
      // Apply skill filter if provided
      if (skillFilter) {
        const hasSkill = user.skills?.some(skill =>
          skill.toLowerCase().includes(skillFilter.toLowerCase())
        );
        if (!hasSkill) return false;
      }
      
      return true;
    })
    .map(user => {
      const matchResult = calculateMatchScore(currentUser, user);
      return {
        ...user.toObject ? user.toObject() : user,
        matchScore: matchResult.matchScore,
        matchQuality: matchResult.matchQuality,
        scoreBreakdown: matchResult.scoreBreakdown,
        matchingSkills: matchResult.matchingSkills,
        isMutualMatch: matchResult.isMutualMatch
      };
    })
    .filter(match => {
      // Apply minimum score filter
      if (match.matchScore < minScore) return false;
      
      // Apply mutual match filter if required
      if (requireMutual && !match.isMutualMatch) return false;
      
      return true;
    })
    .sort((a, b) => b.matchScore - a.matchScore) // Sort by score descending
    .slice(0, limit); // Limit results
  
  return matches;
};

/**
 * Get match recommendations with explanations
 * 
 * @param {Object} match - Match object with scores
 * @returns {Array} Array of recommendation strings
 */
export const getMatchRecommendations = (match) => {
  const recommendations = [];
  
  if (match.isMutualMatch) {
    recommendations.push('🎯 Perfect mutual match - you can both learn from each other!');
  }
  
  if (match.matchingSkills.theyCanTeachYou.length > 0) {
    recommendations.push(
      `📚 They can teach you: ${match.matchingSkills.theyCanTeachYou.join(', ')}`
    );
  }
  
  if (match.matchingSkills.youCanTeachThem.length > 0) {
    recommendations.push(
      `🎓 You can teach them: ${match.matchingSkills.youCanTeachThem.join(', ')}`
    );
  }
  
  // Reputation-based recommendations
  if (match.scoreBreakdown.reputation >= 90) {
    recommendations.push('⭐ Highly rated by previous learners!');
  } else if (match.scoreBreakdown.reputation >= 80) {
    recommendations.push('✨ Great reviews from past exchanges');
  }
  
  if (match.ratingStats && match.ratingStats.totalRatings > 5) {
    recommendations.push(`💬 ${match.ratingStats.totalRatings} verified reviews`);
  }
  
  if (match.scoreBreakdown.location >= 80) {
    recommendations.push('📍 Same location - easy to meet in person!');
  }
  
  if (match.scoreBreakdown.availability >= 70) {
    recommendations.push('⏰ Great schedule compatibility');
  }
  
  if (match.scoreBreakdown.experience >= 80) {
    recommendations.push('🎯 Similar experience level');
  }
  
  return recommendations;
};

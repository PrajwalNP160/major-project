import React, { useState, useEffect } from "react";
import {
  MapPin,
  ChevronDown,
  ChevronUp,
  Star,
  MessageSquare,
  Clock,
  Sparkles,
  TrendingUp,
  Award
} from "lucide-react";
import { axiosInstance } from "../lib/axiosInstance";
import { useAuth } from "@clerk/clerk-react";

const MatchCard = ({ match, aiMode = false }) => {
  const [expanded, setExpanded] = useState(false);
  const { getToken } = useAuth();

  // Get match quality color
  const getMatchQualityColor = (quality) => {
    switch (quality) {
      case 'Excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'High': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Good': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Fair': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleSkillSwap = async () => {
    try {
      const token = await getToken();
      await axiosInstance.post(
        "/request/send",
        {
          toUserId: match._id,
          skillToLearn: match.skillsWanted?.[0]?.name || "",
          skillToTeach: match.skillsOffered?.[0]?.name || "",
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      alert("Request sent successfully!");
    } catch (err) {
      console.error("Skill swap request failed:", err);
      
      // Handle different error types
      if (err.response?.status === 409) {
        const errorData = err.response.data;
        if (errorData.reverseRequest) {
          alert(`This user has already sent you a request for these skills! Check your pending requests to accept it.`);
        } else if (errorData.existingRequest) {
          alert(`You already have a pending request with this user for these skills. Sent on ${new Date(errorData.existingRequest.createdAt).toLocaleDateString()}.`);
        } else {
          alert(errorData.message || "Request already exists");
        }
      } else if (err.response?.status === 404) {
        alert("User not found. They may have deleted their account.");
      } else if (err.response?.status === 400) {
        alert("Invalid request. Please check the skill information.");
      } else {
        alert("Failed to send request. Please try again later.");
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-300">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4 flex-1">
            <img
              src={match.avatar}
              alt={match.firstName}
              className="w-16 h-16 rounded-full object-cover"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  {match.firstName}
                </h3>
                {aiMode && match.isMutualMatch && (
                  <Award className="h-5 w-5 text-purple-600" title="Mutual Match" />
                )}
              </div>
              <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mt-1">
                <MapPin size={14} className="mr-1" />
                <span>{match.location}</span>
              </div>

              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {aiMode && (
                  <>
                    <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center ${getMatchQualityColor(match.matchQuality)}`}>
                      <Sparkles size={12} className="mr-1" />
                      <span>{match.matchScore}% Match</span>
                    </div>
                    <div className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${getMatchQualityColor(match.matchQuality)}`}>
                      {match.matchQuality}
                    </div>
                  </>
                )}
                {match.ratingStats && match.ratingStats.totalRatings > 0 && (
                  <div className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center">
                    <Star size={12} className="mr-1" fill="currentColor" />
                    <span>{match.ratingStats.averageRating.toFixed(1)} ({match.ratingStats.totalRatings})</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
          >
            {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>

        {expanded && (
          <>
            {/* AI Recommendations */}
            {aiMode && match.recommendations && match.recommendations.length > 0 && (
              <div className="mt-4 bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-teal-900 dark:text-teal-300 mb-2 flex items-center gap-2">
                  <Sparkles size={16} />
                  AI Insights
                </h4>
                <ul className="space-y-1">
                  {match.recommendations.map((rec, index) => (
                    <li key={index} className="text-sm text-teal-800 dark:text-teal-200">
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Score Breakdown for AI Mode */}
            {aiMode && match.scoreBreakdown && (
              <div className="mt-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Match Score Breakdown</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Mutual Learning</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{match.scoreBreakdown.mutualLearning}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Skills Match</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{match.scoreBreakdown.skillCompatibility}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Experience</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{match.scoreBreakdown.experience}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Location</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{match.scoreBreakdown.location}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Availability</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{match.scoreBreakdown.availability}%</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Diversity</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{match.scoreBreakdown.skillDiversity}%</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🛠 Skills Offered
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.skillsOffered?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-300 text-xs px-3 py-1 rounded-full"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  🎯 Skills Wanted
                </h4>
                <div className="flex flex-wrap gap-2">
                  {match.skillsWanted?.map((skill, index) => (
                    <span
                      key={index}
                      className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 text-xs px-3 py-1 rounded-full"
                    >
                      {skill.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  💼 Experience
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  {match.experience || "Not specified"}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs italic">
                  {match.experienceType || ""}
                </p>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={handleSkillSwap}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 transition-colors duration-200"
              >
                <MessageSquare size={16} className="mr-2" />
                Contact for Skill Swap
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MatchCard;

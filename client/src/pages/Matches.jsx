import React, { useEffect, useState } from "react";
import MatchesList from "../components/MatchesList";
import MatchFilters from "../components/MatchFilters";
import { axiosInstance } from "../lib/axiosInstance";
import { useAuth } from "@clerk/clerk-react";
import { Sparkles, Filter as FilterIcon, TrendingUp } from "lucide-react";

const Matches = () => {
  const { getToken } = useAuth();
  const [filters, setFilters] = useState({
    skillCategory: "",
    skillLevel: "",
    location: "",
    matchScore: 0,
  });
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [matchingMode, setMatchingMode] = useState("ai"); // "ai" or "manual"
  const [stats, setStats] = useState(null);

  const fetchAIMatches = async (category = "") => {
    setLoading(true);
    try {
      const token = await getToken();
      const params = new URLSearchParams();
      if (category) params.append("skill", category);
      params.append("limit", "20");
      params.append("minScore", "30");
      
      const res = await axiosInstance.get(
        `/ai-matching/matches?${params}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("AI Matches Response:", res.data);
      
      const aiMatches = res.data.matches || [];
      const formattedMatches = aiMatches.map((user) => ({
        id: user._id,
        firstName: user.firstName || "No Name",
        avatar: user.avatar || "https://via.placeholder.com/150",
        location: user.location || "Unknown",
        skillsOffered:
          user.skills?.map((skill) => ({
            name: skill,
            level: "Intermediate",
          })) || [],
        skillsWanted:
          user.skillsToLearn?.map((skill) => ({
            name: skill,
            level: "Beginner",
          })) || [],
        experience: user.experience || "Not specified",
        experienceType: user.experienceType || "",
        matchScore: user.matchScore,
        matchQuality: user.matchQuality,
        isMutualMatch: user.isMutualMatch,
        recommendations: user.recommendations,
        scoreBreakdown: user.scoreBreakdown,
        _id: user._id,
      }));

      setMatches(formattedMatches);
      setStats(res.data.stats);
    } catch (error) {
      console.error("Failed to fetch AI matches:", error);
      setMatches([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchManualMatches = async (category = "") => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(
        `/user/match-users${category ? `?skill=${category}` : ""}`
      );

      console.log("Manual Matches Response:", res.data);
      const usersArray = Array.isArray(res.data)
        ? res.data
        : res.data.users || [];

      const fetchedUsers = usersArray.map((user) => ({
        id: user._id,
        firstName: user.firstName || user.name || "No Name",
        avatar: user.avatar || "https://via.placeholder.com/150",
        location: user.location || "Unknown",
        skillsOffered:
          user.skills?.map((skill) => ({
            name: skill,
            level: "Intermediate",
          })) || [],
        skillsWanted:
          user.skillsToLearn?.map((skill) => ({
            name: skill,
            level: "Beginner",
          })) || [],
        experience: user.experience || "Not specified",
        experienceType: user.experienceType || "",
        _id: user._id,
      }));

      setMatches(fetchedUsers);
      setStats(null);
    } catch (error) {
      console.error("Failed to fetch manual matches:", error);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = (category = "") => {
    if (matchingMode === "ai") {
      fetchAIMatches(category);
    } else {
      fetchManualMatches(category);
    }
  };

  useEffect(() => {
    fetchMatches();
  }, [matchingMode]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchMatches(newFilters.skillCategory);
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Mode Toggle */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Find Matches
          </h1>
          
          {/* Mode Toggle */}
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => setMatchingMode("ai")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                matchingMode === "ai"
                  ? "bg-teal-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Sparkles className="h-5 w-5" />
              AI-Powered Matching
            </button>
            <button
              onClick={() => setMatchingMode("manual")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                matchingMode === "manual"
                  ? "bg-teal-600 text-white shadow-lg"
                  : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <FilterIcon className="h-5 w-5" />
              Manual Filtering
            </button>
          </div>

          {/* AI Stats */}
          {matchingMode === "ai" && stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Matches</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.matchesFound}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Excellent</p>
                <p className="text-2xl font-bold text-green-600">{stats.excellentMatches}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Mutual Matches</p>
                <p className="text-2xl font-bold text-purple-600">{stats.mutualMatches}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                <p className="text-2xl font-bold text-teal-600">{stats.averageScore}%</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row">
          <div className="md:w-64 flex-shrink-0 md:mr-8">
            <MatchFilters
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </div>

          <div className="flex-1 mt-8 md:mt-0">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                {matchingMode === "ai" ? "AI-Recommended" : "Potential"} Skill Matches
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {matches.length} matches found
              </p>
            </div>
            {loading ? (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 animate-pulse" />
                <p>Finding your best matches...</p>
              </div>
            ) : (
              <MatchesList matches={matches} aiMode={matchingMode === "ai"} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Matches;

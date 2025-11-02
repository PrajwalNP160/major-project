import React, { useState } from "react";
import { X, Star, Send } from "lucide-react";
import { axiosInstance } from "../lib/axiosInstance";
import { useAuth } from "@clerk/clerk-react";

const RatingModal = ({ exchange, onClose, onSuccess }) => {
  const { getToken } = useAuth();
  const [ratings, setRatings] = useState({
    skillKnowledge: 0,
    communication: 0,
    punctuality: 0,
    helpfulness: 0,
    overall: 0,
  });
  const [feedback, setFeedback] = useState("");
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [selectedTags, setSelectedTags] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const availableTags = [
    "Patient",
    "Knowledgeable",
    "Great Communicator",
    "Well Prepared",
    "Flexible",
    "Motivating",
    "Clear Explanations",
    "Practical Examples",
    "Good Listener",
    "Professional",
  ];

  const ratingCategories = [
    { key: "skillKnowledge", label: "Skill Knowledge", icon: "📚" },
    { key: "communication", label: "Communication", icon: "💬" },
    { key: "punctuality", label: "Punctuality", icon: "⏰" },
    { key: "helpfulness", label: "Helpfulness", icon: "🤝" },
    { key: "overall", label: "Overall Experience", icon: "⭐" },
  ];

  const handleRatingChange = (category, value) => {
    setRatings((prev) => ({ ...prev, [category]: value }));
  };

  const toggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all ratings are filled
    const allRated = Object.values(ratings).every((r) => r > 0);
    if (!allRated) {
      alert("⚠️ Please rate all categories before submitting");
      return;
    }

    setSubmitting(true);

    try {
      const token = await getToken();
      await axiosInstance.post(
        "/ratings/submit",
        {
          exchangeId: exchange._id,
          ratedUserId: exchange.otherUser._id,
          ratings,
          feedback,
          skillTaught: exchange.skillTaught,
          skillLearned: exchange.skillLearned,
          wouldRecommend,
          tags: selectedTags,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Show success message
      alert(`✅ Rating submitted successfully! Thank you for your feedback.`);
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Submit rating error:", error);
      const errorMsg = error.response?.data?.message || "Failed to submit rating";
      alert(`❌ ${errorMsg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, category }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(category, star)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 dark:text-gray-600"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-teal-600 text-white p-6 flex items-center justify-between rounded-t-xl">
          <div>
            <h2 className="text-2xl font-bold">
              Rate Your Experience
            </h2>
            <p className="text-sm text-purple-100 mt-1">
              with {exchange.otherUser.firstName} {exchange.otherUser.lastName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-200 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Skills Exchanged */}
          <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-semibold">You taught:</span> {exchange.skillTaught}
            </p>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              <span className="font-semibold">You learned:</span> {exchange.skillLearned}
            </p>
          </div>

          {/* Rating Categories */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rate Each Category
            </h3>
            {ratingCategories.map((category) => (
              <div
                key={category.key}
                className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-700/30 rounded-lg hover:shadow-md transition-all border border-gray-200 dark:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{category.icon}</span>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {category.label}
                  </span>
                </div>
                <StarRating
                  value={ratings[category.key]}
                  onChange={handleRatingChange}
                  category={category.key}
                />
              </div>
            ))}
          </div>

          {/* Tags */}
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              🏷️ Add Tags (Optional)
            </h3>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all transform hover:scale-105 ${
                    selectedTags.includes(tag)
                      ? "bg-gradient-to-r from-teal-600 to-purple-600 text-white shadow-lg"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
            {selectedTags.length > 0 && (
              <p className="text-xs text-teal-600 dark:text-teal-400 mt-2">
                ✓ {selectedTags.length} tag{selectedTags.length > 1 ? 's' : ''} selected
              </p>
            )}
          </div>

          {/* Feedback */}
          <div>
            <label className="block font-semibold text-gray-900 dark:text-white mb-2">
              Written Feedback (Optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={4}
              maxLength={1000}
              placeholder="Share your experience with this skill exchange..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {feedback.length}/1000 characters
            </p>
          </div>

          {/* Would Recommend */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <input
              type="checkbox"
              id="recommend"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
              className="h-5 w-5 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
            />
            <label
              htmlFor="recommend"
              className="text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              I would recommend this person to others
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-teal-600 text-white rounded-lg hover:from-purple-700 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;

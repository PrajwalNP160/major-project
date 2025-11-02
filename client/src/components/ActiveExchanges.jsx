import React, { useEffect, useState } from "react";
import { Calendar, Video, Star, CheckCircle } from "lucide-react";
import { axiosInstance } from "../lib/axiosInstance";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Link } from "react-router-dom";
import RatingModal from "./RatingModal";

const ActiveExchanges = () => {
  const [matches, setMatches] = useState([]);
  const { getToken } = useAuth();
  const { user } = useUser();
  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [selectedExchange, setSelectedExchange] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [successStates, setSuccessStates] = useState({});

  useEffect(() => {
    const fetchExchanges = async () => {
      const token = await getToken();
      
      try {
        // Try the new improved endpoint first
        const res = await axiosInstance.get("/exchange/my-matches", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMatches(res.data.matches);
      } catch (error) {
        console.log("New endpoint not available, falling back to legacy endpoint");
        
        // Fallback to legacy endpoint and filter manually
        const res = await axiosInstance.get("/exchange/my-exchanges", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        // Get current user's MongoDB ID from the first exchange
        const exchanges = res.data.exchanges;
        if (exchanges.length > 0) {
          // Find current user's participant data to get their MongoDB ID
          const currentUserClerkId = user?.id;
          
          const processedMatches = exchanges.map(exchange => {
            // Find current user and partner
            let currentUserParticipant = null;
            let partnerParticipant = null;
            
            // Try to identify current user by comparing some identifier
            // Since we don't have direct access to MongoDB ID mapping, 
            // we'll use a different approach - assume the user is always involved
            // and find the "other" participant
            if (exchange.participants.length === 2) {
              // For now, we'll assume first participant is current user
              // This is a temporary fix - ideally we need user ID mapping
              currentUserParticipant = exchange.participants[0];
              partnerParticipant = exchange.participants[1];
            }
            
            if (!partnerParticipant) return null;
            
            return {
              exchangeId: exchange._id,
              matchedUser: {
                _id: partnerParticipant.userId._id,
                firstName: partnerParticipant.userId.firstName,
                lastName: partnerParticipant.userId.lastName,
                avatar: partnerParticipant.userId.avatar,
              },
              skillExchange: {
                youTeach: currentUserParticipant?.teaches,
                youLearn: currentUserParticipant?.learns,
                theyTeach: partnerParticipant?.teaches,
                theyLearn: partnerParticipant?.learns,
              },
              status: exchange.status,
              nextSession: exchange.nextSession,
              createdAt: exchange.createdAt,
            };
          }).filter(Boolean);
          
          setMatches(processedMatches);
        }
      }
    };

    fetchExchanges();
  }, [user]);

  const formatDate = (date) => {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return "No session scheduled";
    }

    return new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
    }).format(parsedDate);
  };

  const handleMarkSessionComplete = async (exchangeId) => {
    setLoadingStates(prev => ({ ...prev, [`complete_${exchangeId}`]: true }));
    try {
      const token = await getToken();
      const res = await axiosInstance.post(
        `/ratings/mark-ratable/${exchangeId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      // Show success state
      setSuccessStates(prev => ({ ...prev, [`complete_${exchangeId}`]: true }));
      
      // Refresh the list
      await fetchExchanges();
      
      // Clear success state after 3 seconds
      setTimeout(() => {
        setSuccessStates(prev => ({ ...prev, [`complete_${exchangeId}`]: false }));
      }, 3000);
    } catch (error) {
      console.error("Mark complete error:", error);
      alert(error.response?.data?.message || "Failed to mark session as complete");
    } finally {
      setLoadingStates(prev => ({ ...prev, [`complete_${exchangeId}`]: false }));
    }
  };

  const handleRateExchange = async (exchangeId) => {
    setLoadingStates(prev => ({ ...prev, [`rate_${exchangeId}`]: true }));
    try {
      const token = await getToken();
      const res = await axiosInstance.get(`/ratings/can-rate/${exchangeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data.canRate) {
        setSelectedExchange(res.data.exchange);
        setRatingModalOpen(true);
      } else {
        alert(res.data.reason || "Cannot rate this exchange yet. Please complete at least one session first.");
      }
    } catch (error) {
      console.error("Can rate check error:", error);
      alert(error.response?.data?.message || "Failed to check rating eligibility");
    } finally {
      setLoadingStates(prev => ({ ...prev, [`rate_${exchangeId}`]: false }));
    }
  };

  const handleRatingSuccess = () => {
    fetchExchanges(); // Refresh the list
  };

  const fetchExchanges = async () => {
    const token = await getToken();
    
    try {
      const res = await axiosInstance.get("/exchange/my-matches", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMatches(res.data.matches);
    } catch (error) {
      console.log("Fetch exchanges error:", error);
      setMatches([]);
    }
  };

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full mb-4">
          <Video className="h-8 w-8 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          No active exchanges
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Start swapping skills and your exchanges will appear here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
        Your Skill Exchanges
      </h2>
      <div className="space-y-6">
        {matches.map((match) => {
          return (
            <div
              key={match.exchangeId}
              className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-lg p-5 transition-all duration-200 hover:shadow-lg hover:border-teal-500 dark:hover:border-teal-400"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <img
                    src={match.matchedUser.avatar || '/default-avatar.png'}
                    alt={match.matchedUser.firstName}
                    className="w-12 h-12 rounded-full object-cover mr-4 ring-2 ring-gray-200 dark:ring-gray-600"
                  />
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {match.matchedUser.firstName} {match.matchedUser.lastName}
                    </h3>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium text-teal-600 dark:text-teal-400">
                        You teach:
                      </span>{" "}
                      {match.skillExchange.youTeach} •{" "}
                      <span className="font-medium text-purple-600 dark:text-purple-400">
                        They teach:
                      </span>{" "}
                      {match.skillExchange.theyTeach}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                    Active
                  </span>
                  {match.hasRated && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                      <Star size={12} className="mr-1" fill="currentColor" />
                      Rated
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 flex items-start border border-gray-200 dark:border-gray-600">
                  <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Next Session
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(match.nextSession)}
                    </p>
                  </div>
                </div>
                
                <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4 flex items-start border border-teal-200 dark:border-teal-800">
                  <CheckCircle className="h-5 w-5 text-teal-600 dark:text-teal-400 mr-2 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-teal-700 dark:text-teal-300">
                      Sessions Completed
                    </p>
                    <p className="text-sm text-teal-600 dark:text-teal-400 font-semibold">
                      {match.sessionsCompleted || 0} session{match.sessionsCompleted !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Link to={`/join/${match.exchangeId}`}>
                  <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 transition-all">
                    <Video size={16} className="mr-2" />
                    Start Session
                  </button>
                </Link>
                
                <button
                  onClick={() => handleMarkSessionComplete(match.exchangeId)}
                  disabled={
                    match.canBeRated || 
                    loadingStates[`complete_${match.exchangeId}`] || 
                    successStates[`complete_${match.exchangeId}`]
                  }
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md transition-all ${
                    match.canBeRated
                      ? 'bg-green-600 text-white border-green-600 cursor-not-allowed'
                      : successStates[`complete_${match.exchangeId}`]
                      ? 'bg-green-600 text-white border-green-600'
                      : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingStates[`complete_${match.exchangeId}`] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      Marking...
                    </>
                  ) : match.canBeRated || successStates[`complete_${match.exchangeId}`] ? (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Completed ({match.sessionsCompleted})
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Mark Complete
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleRateExchange(match.exchangeId)}
                  disabled={
                    match.hasRated || 
                    !match.canBeRated || 
                    loadingStates[`rate_${match.exchangeId}`]
                  }
                  className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm transition-all ${
                    match.hasRated
                      ? 'bg-gray-400 text-white border-gray-400 cursor-not-allowed'
                      : !match.canBeRated
                      ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed'
                      : 'bg-purple-600 text-white border-transparent hover:bg-purple-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loadingStates[`rate_${match.exchangeId}`] ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Loading...
                    </>
                  ) : match.hasRated ? (
                    <>
                      <CheckCircle size={16} className="mr-2" />
                      Already Rated
                    </>
                  ) : !match.canBeRated ? (
                    <>
                      <Star size={16} className="mr-2" />
                      Complete Session First
                    </>
                  ) : (
                    <>
                      <Star size={16} className="mr-2" />
                      Rate Exchange
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Rating Modal */}
      {ratingModalOpen && selectedExchange && (
        <RatingModal
          exchange={selectedExchange}
          onClose={() => {
            setRatingModalOpen(false);
            setSelectedExchange(null);
          }}
          onSuccess={handleRatingSuccess}
        />
      )}
    </div>
  );
};

export default ActiveExchanges;

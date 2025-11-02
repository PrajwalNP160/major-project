import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import VideoCall from '../components/VideoCall/VideoCall';
import { Video, ArrowLeft, Loader } from 'lucide-react';

const VideoCallPage = () => {
  const { exchangeId } = useParams();
  const navigate = useNavigate();
  const { user } = useUser();
  const [isReady, setIsReady] = useState(false);
  const [channelName, setChannelName] = useState('');
  const [userName, setUserName] = useState('');

  useEffect(() => {
    if (exchangeId && user) {
      // Use exchangeId as channel name for consistency
      setChannelName(`exchange_${exchangeId}`);
      setUserName(`${user.firstName || 'User'} ${user.lastName || ''}`);
      setIsReady(true);
    }
  }, [exchangeId, user]);

  const handleLeave = () => {
    navigate('/dashboard');
  };

  if (!isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-12 w-12 text-teal-500 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Preparing video call...</p>
        </div>
      </div>
    );
  }

  return (
    <VideoCall
      channelName={channelName}
      userName={userName}
      onLeave={handleLeave}
    />
  );
};

export default VideoCallPage;

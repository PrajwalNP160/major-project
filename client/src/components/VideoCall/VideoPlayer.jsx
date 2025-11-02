import React, { useRef, useEffect, useState } from 'react';
import { User, Mic, MicOff, Monitor } from 'lucide-react';

const VideoPlayer = ({ 
  videoTrack, 
  audioTrack, 
  uid, 
  isLocal, 
  userName,
  isVideoEnabled = true,
  isScreenSharing = false
}) => {
  const videoRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (videoTrack && videoRef.current && !videoTrack.isPlaying) {
      videoTrack.play(videoRef.current);
    }

    return () => {
      if (videoTrack && videoTrack.isPlaying) {
        videoTrack.stop();
      }
    };
  }, [videoTrack]);

  // Monitor audio levels for speaking indicator
  useEffect(() => {
    if (audioTrack) {
      const checkAudioLevel = setInterval(() => {
        const level = audioTrack.getVolumeLevel();
        setIsSpeaking(level > 0.1);
      }, 100);

      return () => clearInterval(checkAudioLevel);
    }
  }, [audioTrack]);

  return (
    <div className={`video-player ${isLocal ? 'local' : 'remote'} ${isSpeaking ? 'speaking' : ''}`}>
      {videoTrack && isVideoEnabled ? (
        <div ref={videoRef} className="video-element" />
      ) : (
        <div className="video-placeholder">
          <div className="avatar-placeholder">
            <User size={48} />
          </div>
        </div>
      )}

      {/* User Info Overlay */}
      <div className="user-info">
        <div className="user-name">
          {isScreenSharing && <Monitor size={14} className="mr-1" />}
          {userName || `User ${uid}`}
          {isLocal && <span className="you-badge">You</span>}
        </div>
        <div className="audio-indicator">
          {audioTrack && audioTrack.enabled ? (
            isSpeaking ? (
              <Mic size={14} className="speaking" />
            ) : (
              <Mic size={14} />
            )
          ) : (
            <MicOff size={14} className="muted" />
          )}
        </div>
      </div>

      {/* Speaking Border Animation */}
      {isSpeaking && <div className="speaking-border"></div>}
    </div>
  );
};

export default VideoPlayer;

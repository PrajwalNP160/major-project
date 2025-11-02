import React, { useState, useEffect } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor, 
  MonitorOff,
  Settings,
  Users,
  Maximize2,
  Minimize2
} from 'lucide-react';
import VideoPlayer from './VideoPlayer';
import './VideoCall.css';

const APP_ID = import.meta.env.VITE_AGORA_APP_ID || '7600fc38f08643da9c7d3f336bd46a12';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const VideoCall = ({ channelName, userName, onLeave, embedded = false }) => {
  const [client] = useState(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [localAudioTrack, setLocalAudioTrack] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState([]);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenTrack, setScreenTrack] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [connectionState, setConnectionState] = useState('DISCONNECTED');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setConnectionState('CONNECTING');

        // Handle remote users
        client.on('user-published', async (user, mediaType) => {
          await client.subscribe(user, mediaType);
          
          if (mediaType === 'video') {
            setRemoteUsers(prev => {
              const exists = prev.find(u => u.uid === user.uid);
              if (exists) {
                return prev.map(u => u.uid === user.uid ? user : u);
              }
              return [...prev, user];
            });
          }
          
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          if (mediaType === 'video') {
            setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
          }
        });

        client.on('user-left', (user) => {
          setRemoteUsers(prev => prev.filter(u => u.uid !== user.uid));
        });

        client.on('connection-state-change', (curState) => {
          setConnectionState(curState);
        });

        // Handle token expiration
        client.on('token-privilege-will-expire', async () => {
          console.log('Token will expire, renewing...');
          try {
            const response = await fetch(`${API_URL}/api/agora/token/renew`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ channelName, uid: client.uid })
            });
            const data = await response.json();
            if (data.success) {
              await client.renewToken(data.token);
              console.log('Token renewed successfully');
            }
          } catch (error) {
            console.error('Failed to renew token:', error);
          }
        });

        // Fetch token from backend
        console.log('Fetching Agora token from backend...');
        const tokenResponse = await fetch(`${API_URL}/api/agora/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channelName, uid: 0, role: 'publisher' })
        });
        
        if (!tokenResponse.ok) {
          throw new Error(`Failed to fetch token: ${tokenResponse.status}`);
        }
        
        const tokenData = await tokenResponse.json();
        if (!tokenData.success) {
          throw new Error(tokenData.message || 'Failed to generate token');
        }

        console.log('Token received, joining channel...');
        
        // Join channel with token
        const uid = await client.join(APP_ID, channelName, tokenData.token, null);
        console.log('Joined channel successfully with UID:', uid);

        // Create and publish local tracks
        const [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
        setLocalAudioTrack(audioTrack);
        setLocalVideoTrack(videoTrack);

        await client.publish([audioTrack, videoTrack]);
        setConnectionState('CONNECTED');

      } catch (error) {
        console.error('Failed to initialize video call:', error);
        setConnectionState('FAILED');
      }
    };

    init();

    return () => {
      localAudioTrack?.close();
      localVideoTrack?.close();
      screenTrack?.close();
      client.leave();
    };
  }, [channelName]);

  const toggleVideo = async () => {
    if (localVideoTrack) {
      await localVideoTrack.setEnabled(!isVideoEnabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (localAudioTrack) {
      await localAudioTrack.setEnabled(!isAudioEnabled);
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!isScreenSharing) {
        const screenVideoTrack = await AgoraRTC.createScreenVideoTrack();
        setScreenTrack(screenVideoTrack);
        
        // Unpublish camera and publish screen
        if (localVideoTrack) {
          await client.unpublish([localVideoTrack]);
        }
        await client.publish([screenVideoTrack]);
        setIsScreenSharing(true);

        // Handle screen share stop
        screenVideoTrack.on('track-ended', () => {
          stopScreenShare();
        });
      } else {
        await stopScreenShare();
      }
    } catch (error) {
      console.error('Screen sharing error:', error);
    }
  };

  const stopScreenShare = async () => {
    if (screenTrack) {
      await client.unpublish([screenTrack]);
      screenTrack.close();
      setScreenTrack(null);
      
      // Republish camera
      if (localVideoTrack) {
        await client.publish([localVideoTrack]);
      }
      setIsScreenSharing(false);
    }
  };

  const handleLeave = async () => {
    localAudioTrack?.close();
    localVideoTrack?.close();
    screenTrack?.close();
    await client.leave();
    onLeave();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`video-call-container ${embedded ? 'embedded' : ''}`}>
      {/* Compact Header */}
      {!embedded && (
        <div className="video-call-header">
          <div className="flex items-center gap-3">
            <div className={`status-dot ${connectionState === 'CONNECTED' ? 'connected' : 'connecting'}`}></div>
            <span className="text-sm font-medium text-white">
              {connectionState === 'CONNECTED' ? 'Connected' : 'Connecting...'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-white text-sm">
            <Users size={16} />
            <span>{remoteUsers.length + 1}</span>
          </div>
        </div>
      )}

      {/* Video Grid */}
      <div className="video-grid-wrapper">
        <div className={`video-grid ${remoteUsers.length === 0 ? 'single' : remoteUsers.length === 1 ? 'dual' : 'multi'}`}>
          {/* Remote Users */}
          {remoteUsers.map((user) => (
            <VideoPlayer
              key={user.uid}
              videoTrack={user.videoTrack}
              audioTrack={user.audioTrack}
              uid={user.uid}
              isLocal={false}
            />
          ))}

          {/* Local User */}
          <VideoPlayer
            videoTrack={isScreenSharing ? screenTrack : localVideoTrack}
            audioTrack={localAudioTrack}
            uid="local"
            isLocal={true}
            userName={userName}
            isVideoEnabled={isVideoEnabled}
            isScreenSharing={isScreenSharing}
          />
        </div>
      </div>

      {/* Simplified Controls */}
      <div className="video-controls">
        <div className="controls-group">
          <button
            className={`control-btn ${!isAudioEnabled ? 'muted' : ''}`}
            onClick={toggleAudio}
            title={isAudioEnabled ? 'Mute' : 'Unmute'}
          >
            {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
          </button>

          <button
            className={`control-btn ${!isVideoEnabled ? 'muted' : ''}`}
            onClick={toggleVideo}
            title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
          >
            {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
          </button>

          {!embedded && (
            <button
              className={`control-btn ${isScreenSharing ? 'active' : ''}`}
              onClick={toggleScreenShare}
              title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
            >
              {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
            </button>
          )}

          <button
            className="control-btn leave"
            onClick={handleLeave}
            title="Leave call"
          >
            <PhoneOff size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;

import React, { useEffect, useRef, useState } from "react"
import { PhoneOff, Users, Maximize2 } from "lucide-react"

export default function VideoCall({ roomId }) {
  const jitsiContainerRef = useRef(null)
  const [isCallActive, setIsCallActive] = useState(false)
  const [participantCount, setParticipantCount] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showOverlays, setShowOverlays] = useState(true)
  const jitsiApi = useRef(null)

  useEffect(() => {
    console.log("🎥 Jitsi VideoCall component mounted for room:", roomId)
    setIsCallActive(true)
    
    // Auto-hide overlays after 5 seconds
    const timer = setTimeout(() => {
      setShowOverlays(false)
    }, 5000)
    
    return () => {
      console.log("🧹 Cleaning up Jitsi VideoCall component")
      clearTimeout(timer)
    }
  }, [roomId])

  const toggleFullscreen = () => {
    if (jitsiApi.current) {
      if (isFullscreen) {
        document.exitFullscreen()
      } else {
        jitsiContainerRef.current.requestFullscreen()
      }
      setIsFullscreen(!isFullscreen)
    }
  }

  const endCall = () => {
    console.log("📞 Ending Jitsi call...")
    
    if (jitsiApi.current) {
      jitsiApi.current.executeCommand('hangup')
    }
    
    // Navigate back to dashboard
    setTimeout(() => {
      window.location.href = '/dashboard'
    }, 1000)
  }

  // Create Jitsi Meet URL with room ID
  const jitsiUrl = `https://meet.jit.si/${roomId}#config.startWithAudioMuted=false&config.startWithVideoMuted=false&config.prejoinPageEnabled=false`

  return (
    <div 
      className="relative w-full h-full bg-gray-900"
      onClick={() => setShowOverlays(true)} // Click anywhere to show overlays
    >
      {/* Jitsi Meet Iframe */}
      <iframe
        src={jitsiUrl}
        className="w-full h-full border-0"
        style={{ minHeight: '100vh' }}
        allow="camera; microphone; fullscreen; display-capture"
        title={`Video Call - Room ${roomId}`}
      />
      
      {/* Custom Controls Overlay - Auto-hide */}
      {showOverlays && (
        <div className={`absolute top-4 left-4 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg transition-opacity duration-300 ${showOverlays ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span className="text-sm">Room: {roomId}</span>
            </div>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                endCall()
              }}
              className="p-1 hover:bg-red-600 rounded transition"
              title="End Call & Return to Dashboard"
            >
              <PhoneOff size={16} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                setShowOverlays(false)
              }}
              className="p-1 hover:bg-gray-600 rounded transition text-xs"
              title="Hide Controls"
            >
              ✕
            </button>
          </div>
        </div>
      )}
      
      {/* Instructions - Only show initially */}
      {showOverlays && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-80 text-white px-3 py-2 rounded-lg max-w-xs transition-opacity duration-300">
          <p className="text-xs">
            ✅ <strong>Jitsi Meet</strong> - Professional video calling<br/>
            🎥 Allow camera/microphone when prompted<br/>
            👆 Click anywhere to show/hide controls
          </p>
        </div>
      )}
      
      {/* Show controls hint when hidden */}
      {!showOverlays && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs opacity-50 hover:opacity-100 transition-opacity">
          👆 Click to show controls
        </div>
      )}
      
      {/* Debug Info (development only) */}
      {process.env.NODE_ENV === 'development' && showOverlays && (
        <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs">
          <div className="font-bold mb-2">Jitsi Debug</div>
          <div>Room: {roomId}</div>
          <div>Overlays: {showOverlays ? 'Visible' : 'Hidden'}</div>
        </div>
      )}
    </div>
  )
}
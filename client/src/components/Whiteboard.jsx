import { useState, useEffect, useCallback, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import "@excalidraw/excalidraw/index.css";
import socket from "../socket";
import "./Whiteboard.css";

export default function Whiteboard({ roomId }) {
  const [excalidrawAPI, setExcalidrawAPI] = useState(null);
  const isRemoteUpdateRef = useRef(false);
  const lastEmitTimeRef = useRef(0);
  const throttleDelayMs = 100; // Throttle to max 10 updates per second

  useEffect(() => {
    if (!excalidrawAPI) return;

    console.log('🎨 Initializing whiteboard for room:', roomId);
    console.log('🔌 Socket connected:', socket.connected);

    // Request whiteboard history when joining
    socket.emit("whiteboard_join", { room: roomId });
    console.log('📨 Sent whiteboard_join event');

    // Listen for whiteboard history
    const handleWhiteboardHistory = (data) => {
      console.log('📥 Received whiteboard history:', data);
      if (data && data.elements) {
        isRemoteUpdateRef.current = true;
        excalidrawAPI.updateScene({
          elements: data.elements,
          appState: data.appState || {},
        });
        // Reset flag after a short delay
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }
    };

    // Listen for whiteboard changes from other users
    const handleWhiteboardChange = (data) => {
      console.log('📥 Received whiteboard update from another user:', data);
      if (data && data.elements) {
        isRemoteUpdateRef.current = true;
        excalidrawAPI.updateScene({
          elements: data.elements,
          appState: data.appState || {},
        });
        // Reset flag after a short delay
        setTimeout(() => {
          isRemoteUpdateRef.current = false;
        }, 100);
      }
    };

    socket.on("whiteboard_history", handleWhiteboardHistory);
    socket.on("whiteboard_update", handleWhiteboardChange);

    return () => {
      socket.off("whiteboard_history", handleWhiteboardHistory);
      socket.off("whiteboard_update", handleWhiteboardChange);
    };
  }, [excalidrawAPI, roomId]);

  // Handle changes made by current user
  const handleChange = useCallback(
    (elements, appState, files) => {
      console.log('📝 Whiteboard change detected:', { 
        elementsCount: elements?.length, 
        hasAppState: !!appState,
        isRemoteUpdate: isRemoteUpdateRef.current 
      });

      if (!excalidrawAPI) {
        console.log('⚠️ No excalidrawAPI available');
        return;
      }

      // Don't broadcast if this change came from a remote update
      if (isRemoteUpdateRef.current) {
        console.log('⏭️ Skipping broadcast - remote update');
        return;
      }

      // Throttle updates to prevent flooding
      const now = Date.now();
      if (now - lastEmitTimeRef.current < throttleDelayMs) {
        console.log('⏭️ Skipping broadcast - throttled');
        return;
      }
      lastEmitTimeRef.current = now;

      console.log('📤 Broadcasting whiteboard change to room:', roomId);
      
      // Emit changes to other users
      socket.emit("whiteboard_change", {
        room: roomId,
        elements: elements,
        appState: {
          viewBackgroundColor: appState.viewBackgroundColor,
          currentItemStrokeColor: appState.currentItemStrokeColor,
          currentItemBackgroundColor: appState.currentItemBackgroundColor,
        },
      });
    },
    [excalidrawAPI, roomId]
  );

  return (
    <div className="whiteboard-container">
      <Excalidraw
        excalidrawAPI={(api) => setExcalidrawAPI(api)}
        onChange={handleChange}
        initialData={{
          appState: {
            viewBackgroundColor: "#ffffff",
            currentItemStrokeColor: "#000000",
            viewModeEnabled: false,
          },
        }}
        viewModeEnabled={false}
        zenModeEnabled={false}
        gridModeEnabled={false}
        UIOptions={{
          canvasActions: {
            loadScene: false,
            export: { saveFileToDisk: true },
            toggleTheme: true,
          },
        }}
      />
    </div>
  );
}

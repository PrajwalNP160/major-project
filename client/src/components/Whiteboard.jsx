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

    // Request whiteboard history when joining
    socket.emit("whiteboard_join", { room: roomId });

    // Listen for whiteboard history
    const handleWhiteboardHistory = (data) => {
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
    (elements, appState) => {
      if (!excalidrawAPI) return;

      // Don't broadcast if this change came from a remote update
      if (isRemoteUpdateRef.current) {
        return;
      }

      // Throttle updates to prevent flooding
      const now = Date.now();
      if (now - lastEmitTimeRef.current < throttleDelayMs) {
        return;
      }
      lastEmitTimeRef.current = now;

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
    [excalidrawAPI, roomId, throttleDelayMs]
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
          },
        }}
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
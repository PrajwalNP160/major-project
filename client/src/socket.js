import { io } from "socket.io-client";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? "http://localhost:8000"
    : "https://major-project-verd.onrender.com");

// Debug logs
console.log("🔧 Socket Configuration:", {
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  VITE_SOCKET_URL: import.meta.env.VITE_SOCKET_URL,
  SOCKET_URL: SOCKET_URL,
  MODE: import.meta.env.MODE
});

const socket = io(SOCKET_URL, {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

// Connection logs
socket.on("connect", () => {
  console.log("✅ Connected to server. Socket ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Connection error:", err.message);
});

export default socket;

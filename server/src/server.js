// import express from "express";
// import cors from "cors";
// import dotenv from "dotenv";
// import { connectDb } from "./db/db.js";
// import http from "http";
// import { Server } from "socket.io";
// import userRoutes from "./routes/user.routes.js";
// import requestRoutes from "./routes/request.routes.js";
// import exchangeRoutes from "./routes/exchange.routes.js";

// dotenv.config();

// const PORT = process.env.PORT || 8000;

// const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   origin: "http://localhost:5173",
// });

// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
// app.use(express.json());
// app.use(express.urlencoded());

// app.use("/api/user", userRoutes);
// app.use("/api/request", requestRoutes);
// app.use("/api/exchange", exchangeRoutes);

// io.on("connection", (socket) => {
//   console.log(`user connected: ${socket.id}`);

//   socket.on("join_room", (roomId) => {
//     socket.join(roomId);
//     socket.to(roomId).emit("user_joined", socket.id);
//   });

//   socket.on("offer", ({ offer, roomId }) => {
//     socket.to(roomId).emit("receive_offer", offer);
//   });

//   socket.on("answer", ({ answer, roomId }) => {
//     socket.to(roomId).emit("receive-answer", answer);
//   });

//   socket.on("ice-candidate", ({ candidate, roomId }) => {
//     socket.to(roomId).emit("receive-candidate", candidate);
//   });
// });

// server.listen(PORT, () => {
//   connectDb()
//     .then(() => {
//       console.log(`Server running on port: ${PORT}`);
//     })
//     .catch((err) => console.log(`Error connecting to db ${err}`));
// });
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDb } from "./db/db.js";
import http from "http";
import { Server } from "socket.io";
import userRoutes from "./routes/user.routes.js";
import requestRoutes from "./routes/request.routes.js";
import exchangeRoutes from "./routes/exchange.routes.js";
import toolsRoutes from "./routes/tools.routes.js";
import sessionRoutes from "./routes/session.routes.js";
import assessmentRoutes from "./routes/assessment.routes.js";
import studyGroupRoutes from "./routes/studyGroup.routes.js";
import groupChatRoutes from "./routes/groupChat.routes.js";
import aiMatchingRoutes from "./routes/aiMatching.routes.js";
import ratingRoutes from "./routes/rating.routes.js";
import uploadRoutes from "./routes/upload.routes.js";
import directUploadRoutes from "./routes/directUpload.routes.js";
import mysqlUploadRoutes from "./routes/mysqlUpload.routes.js";
import agoraRoutes from "./routes/agoraRoutes.js";
import { connectMySQL } from "./config/mysql.js";

dotenv.config();

const PORT = process.env.PORT || 8000;

let allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

// If no environment variable set, use defaults based on environment
if (allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === "production") {
    allowedOrigins = ["https://major-project-1-avef.onrender.com"];
  } else {
    allowedOrigins = ["https://major-project-1-avef.onrender.com","http://localhost:5173", "http://127.0.0.1:5173"];
  }
}

const app = express();
const server = http.createServer(app);

// ✅ Socket.io CORS (allow any localhost:* in dev)
const socketCorsOrigin =
  process.env.NODE_ENV !== "production"
    ? [/^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/]
    : allowedOrigins;

const io = new Server(server, {
  cors: {
    origin: socketCorsOrigin,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ✅ Express CORS
app.use(
  cors({
    origin: function (origin, callback) {
      console.log('🔍 CORS request from origin:', origin);
      console.log('📋 Allowed origins:', allowedOrigins);
      
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        console.log('✅ Origin allowed');
        return callback(null, true);
      }
      if (
        process.env.NODE_ENV !== "production" &&
        /^http:\/\/(localhost|127\.0\.0\.1)(:\\d+)?$/.test(origin)
      ) {
        console.log('✅ Localhost origin allowed in development');
        return callback(null, true);
      }
      console.log('❌ Origin not allowed');
      return callback(new Error("CORS not allowed for this origin"));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply Clerk middleware globally to enable getAuth() in all routes
import { clerkAuthMiddleware } from "./middlewares/clerkAuth.js";
app.use(clerkAuthMiddleware);

app.use("/api/user", userRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/exchange", exchangeRoutes);
app.use("/api/tools", toolsRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/assessments", assessmentRoutes);
app.use("/api/study-groups", studyGroupRoutes);
app.use("/api/group-chat", groupChatRoutes);
app.use("/api/ai-matching", aiMatchingRoutes);
app.use("/api/ratings", ratingRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/direct-upload", directUploadRoutes);
app.use("/api/mysql-upload", mysqlUploadRoutes);
app.use("/api/agora", agoraRoutes);

app.get("/health", async (req, res) => {
  try {
    // Check MySQL connection
    let mysqlStatus = false;
    try {
      const { connectMySQL } = await import("./config/mysql.js");
      mysqlStatus = await connectMySQL();
    } catch (error) {
      console.warn("MySQL health check failed:", error.message);
    }

    // Get Socket.io stats
    const connectedSockets = io.sockets.sockets.size;
    const rooms = Array.from(io.sockets.adapter.rooms.keys()).filter(room => 
      !io.sockets.sockets.has(room) // Filter out socket IDs (which are also rooms)
    );

    res.json({ 
      ok: true, 
      env: process.env.NODE_ENV || "development",
      mysql: mysqlStatus ? "connected" : "disconnected",
      socketio: {
        connectedSockets,
        activeRooms: rooms.length,
        rooms: rooms
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      ok: false, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Debug endpoint for room information
app.get("/debug/rooms", (req, res) => {
  const rooms = {};
  
  for (const [roomId, socketSet] of io.sockets.adapter.rooms.entries()) {
    // Skip socket IDs (which are also in rooms)
    if (!io.sockets.sockets.has(roomId)) {
      rooms[roomId] = {
        participants: Array.from(socketSet),
        participantCount: socketSet.size,
        chatHistory: global.__roomChatHistory.get(roomId)?.length || 0,
        presence: global.__roomPresence.get(roomId)?.size || 0
      };
    }
  }
  
  res.json({
    totalRooms: Object.keys(rooms).length,
    rooms,
    timestamp: new Date().toISOString()
  });
});

// Debug endpoint for chat history
app.get("/debug/chat/:roomId", (req, res) => {
  const { roomId } = req.params;
  const history = global.__roomChatHistory.get(roomId) || [];
  
  res.json({
    roomId,
    messageCount: history.length,
    messages: history.slice(-10), // Last 10 messages
    timestamp: new Date().toISOString()
  });
});

// Socket.io events
io.on("connection", (socket) => {
  console.log(`user connected: ${socket.id}`);

  // In-memory chat history per room (dev only). For production, replace with DB.
  if (!global.__roomChatHistory) global.__roomChatHistory = new Map();
  // In-memory presence map: roomId -> Map(socketId -> username)
  if (!global.__roomPresence) global.__roomPresence = new Map();

  socket.on("join_room", (roomId) => {
    console.log(`User ${socket.id} joining room: ${roomId}`);
    socket.join(roomId);
    
    // Get current participants before notifying
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const allParticipants = roomSockets ? Array.from(roomSockets) : [];
    const otherParticipants = allParticipants.filter(id => id !== socket.id);
    
    console.log(`Room ${roomId} participants:`, allParticipants);
    
    // Notify others in the room that a new user joined
    socket.to(roomId).emit("user_joined", { 
      socketId: socket.id,
      roomId: roomId,
      totalParticipants: allParticipants.length
    });
    
    // Send existing chat history to the new socket
    const history = global.__roomChatHistory.get(roomId) || [];
    socket.emit("chat_history", history);
    
    // Ensure presence map exists for room
    if (!global.__roomPresence.has(roomId)) {
      global.__roomPresence.set(roomId, new Map());
    }
    
    // Send current room participants to the new user
    socket.emit("room_participants", {
      participants: otherParticipants,
      totalCount: allParticipants.length
    });
    
    // If there are other participants, trigger WebRTC initiation
    if (otherParticipants.length > 0) {
      console.log(`Triggering WebRTC initiation for ${socket.id} with existing participants:`, otherParticipants);
      
      // Tell the new user to initiate calls to existing participants
      socket.emit("initiate_calls", {
        participants: otherParticipants
      });
      
      // Tell existing participants about the new user
      otherParticipants.forEach(participantId => {
        io.to(participantId).emit("new_participant_ready", {
          newParticipantId: socket.id
        });
      });
    }
    
    console.log(`Room ${roomId} now has ${allParticipants.length} participants`);
  });

  // WebRTC signaling events
  socket.on("offer", ({ offer, roomId, targetSocketId }) => {
    console.log(`Offer from ${socket.id} to room ${roomId}`);
    if (targetSocketId) {
      // Send to specific user
      socket.to(targetSocketId).emit("receive_offer", { 
        offer, 
        fromSocketId: socket.id 
      });
    } else {
      // Broadcast to room
      socket.to(roomId).emit("receive_offer", { 
        offer, 
        fromSocketId: socket.id 
      });
    }
  });

  socket.on("answer", ({ answer, roomId, targetSocketId }) => {
    console.log(`Answer from ${socket.id} to room ${roomId}`);
    if (targetSocketId) {
      // Send to specific user
      socket.to(targetSocketId).emit("receive_answer", { 
        answer, 
        fromSocketId: socket.id 
      });
    } else {
      // Broadcast to room
      socket.to(roomId).emit("receive_answer", { 
        answer, 
        fromSocketId: socket.id 
      });
    }
  });

  socket.on("ice-candidate", ({ candidate, roomId, targetSocketId }) => {
    console.log(`ICE candidate from ${socket.id} to room ${roomId}`);
    if (targetSocketId) {
      // Send to specific user
      socket.to(targetSocketId).emit("receive_candidate", { 
        candidate, 
        fromSocketId: socket.id 
      });
    } else {
      // Broadcast to room
      socket.to(roomId).emit("receive_candidate", { 
        candidate, 
        fromSocketId: socket.id 
      });
    }
  });

  // Video stream control events
  socket.on("toggle_video", ({ roomId, isVideoOn }) => {
    console.log(`${socket.id} toggled video: ${isVideoOn} in room ${roomId}`);
    socket.to(roomId).emit("user_video_toggle", { 
      socketId: socket.id, 
      isVideoOn 
    });
  });

  socket.on("toggle_audio", ({ roomId, isAudioOn }) => {
    console.log(`${socket.id} toggled audio: ${isAudioOn} in room ${roomId}`);
    socket.to(roomId).emit("user_audio_toggle", { 
      socketId: socket.id, 
      isAudioOn 
    });
  });

  // WebRTC connection status events
  socket.on("webrtc_connection_state", ({ roomId, targetSocketId, state }) => {
    console.log(`WebRTC connection state from ${socket.id} to ${targetSocketId}: ${state}`);
    if (targetSocketId) {
      io.to(targetSocketId).emit("peer_connection_state", {
        fromSocketId: socket.id,
        state: state
      });
    }
  });

  // Media stream events
  socket.on("media_stream_ready", ({ roomId }) => {
    console.log(`${socket.id} media stream ready in room ${roomId}`);
    socket.to(roomId).emit("user_media_ready", {
      socketId: socket.id
    });
  });

  socket.on("request_media_status", ({ roomId }) => {
    console.log(`${socket.id} requesting media status for room ${roomId}`);
    socket.to(roomId).emit("media_status_request", {
      fromSocketId: socket.id
    });
  });

  // Collaborative editor events
  socket.on("code_change", ({ room, code }) => {
    socket.to(room).emit("code_change", { code });
  });

  socket.on("stdin_change", ({ room, stdin }) => {
    socket.to(room).emit("stdin_change", { stdin });
  });

  socket.on("language_change", ({ room, language_id }) => {
    socket.to(room).emit("language_change", { language_id });
  });

  // Code execution: Use Judge0 if configured, else stub
  socket.on("execute_code_event", async ({ room, source_code, language_id, stdin }) => {
    try {
      const JUDGE0_URL = process.env.JUDGE0_URL; // e.g., https://judge0-ce.p.rapidapi.com or https://ce.judge0.com
      const JUDGE0_KEY = process.env.JUDGE0_KEY; // optional header key if using RapidAPI

      if (JUDGE0_URL) {
        const payload = {
          source_code,
          language_id,
          stdin,
        };

        // Prefer wait=true for simplicity
        const url = `${JUDGE0_URL.replace(/\/$/, "")}/submissions?base64_encoded=false&wait=true`;
        const headers = {
          "Content-Type": "application/json",
        };
        if (JUDGE0_KEY) headers["X-RapidAPI-Key"] = JUDGE0_KEY;
        if (/rapidapi\.com/i.test(JUDGE0_URL)) {
          headers["X-RapidAPI-Host"] = "judge0-ce.p.rapidapi.com";
        }

        const resp = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
        if (!resp.ok) {
          const text = await resp.text();
          socket.emit("executionResult", { stderr: `Execution error ${resp.status}: ${text}` });
          return;
        }
        const data = await resp.json();
        const stdout = data.stdout || "";
        const stderr = data.stderr || data.compile_output || "";
        socket.emit("executionResult", { stdout, stderr });
      } else {
        const stdout = `Execution service not configured.\nLanguage: ${language_id}\nInput: ${stdin}\nCode length: ${source_code?.length || 0}`;
        socket.emit("executionResult", { stdout });
      }
    } catch (e) {
      socket.emit("executionResult", { stderr: `Execution failed: ${e.message}` });
    }
  });

  // Chat events
  socket.on("chat_send", async ({ room, user, message, userId }) => {
    console.log(`Chat message from ${socket.id} in room ${room}: ${message}`);
    
    if (!room || !message) {
      console.warn(`Invalid chat message: room=${room}, message=${message}`);
      return;
    }
    
    const entry = {
      id: Date.now() + Math.random().toString(36).slice(2),
      user: user || "Anon",
      userId: userId || null,
      socketId: socket.id,
      message: message.trim(),
      ts: Date.now(),
      timestamp: new Date().toISOString(),
    };
    
    // Store in room history (in-memory)
    const history = global.__roomChatHistory.get(room) || [];
    history.push(entry);
    // keep last 100 messages
    const trimmed = history.slice(-100);
    global.__roomChatHistory.set(room, trimmed);
    
    // If this is a study group chat room, save to database
    if (room.startsWith("study-group-")) {
      try {
        const groupId = room.replace("study-group-", "");
        const { saveChatMessage } = await import("./controllers/groupChat.controller.js");
        const { User } = await import("./models/user.model.js");
        
        // Get user's MongoDB ID from Clerk ID
        if (userId) {
          const dbUser = await User.findOne({ clerkId: userId }).lean();
          if (dbUser) {
            await saveChatMessage(groupId, dbUser._id, user, message.trim(), socket.id);
            console.log(`Saved chat message to database for group ${groupId}`);
          }
        }
      } catch (error) {
        console.error("Failed to save chat message to database:", error);
        // Don't fail the chat if DB save fails
      }
    }
    
    // Broadcast to all users in the room (including sender for confirmation)
    io.to(room).emit("chat_message", entry);
    
    console.log(`Message broadcasted to room ${room}, history length: ${trimmed.length}`);
  });

  // Presence: client should call after join with username
  socket.on("presence_identify", ({ roomId, username }) => {
    if (!roomId || !username) return;
    if (!global.__roomPresence.has(roomId)) {
      global.__roomPresence.set(roomId, new Map());
    }
    const roomMap = global.__roomPresence.get(roomId);
    roomMap.set(socket.id, username);
    const users = Array.from(roomMap.values());
    io.to(roomId).emit("presence_update", users);
  });

  // Typing indicators
  socket.on("typing", ({ room, user, isTyping }) => {
    if (!room || !user) return;
    socket.to(room).emit("typing", { user, isTyping: !!isTyping });
  });

  // Whiteboard events
  if (!global.__whiteboardData) global.__whiteboardData = new Map();

  socket.on("whiteboard_join", ({ room }) => {
    console.log(`User ${socket.id} joining whiteboard in room: ${room}`);
    const whiteboardData = global.__whiteboardData.get(room) || { elements: [], appState: {} };
    socket.emit("whiteboard_history", whiteboardData);
  });

  socket.on("whiteboard_change", ({ room, elements, appState }) => {
    if (!room) return;
    
    // Store whiteboard data
    global.__whiteboardData.set(room, { elements, appState });
    
    // Broadcast to others in the room
    socket.to(room).emit("whiteboard_update", { elements, appState });
  });

  // Cleanup on disconnect
  socket.on("disconnecting", () => {
    console.log(`User ${socket.id} disconnecting from rooms:`, Array.from(socket.rooms));
    
    for (const roomId of socket.rooms) {
      if (roomId === socket.id) continue;
      
      // Notify others in the room that user left
      socket.to(roomId).emit("user_left", { 
        socketId: socket.id,
        roomId: roomId 
      });
      
      // Update presence
      const roomMap = global.__roomPresence.get(roomId);
      if (roomMap) {
        roomMap.delete(socket.id);
        const users = Array.from(roomMap.values());
        io.to(roomId).emit("presence_update", users);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User ${socket.id} fully disconnected`);
  });
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

const startServer = async () => {
  try {
    await connectDb();
    
    // Try to connect to MySQL, but don't fail if it's not available
    const mysqlConnected = await connectMySQL();
    if (!mysqlConnected) {
      console.warn("⚠️  MySQL connection failed. File upload features will be unavailable.");
      console.warn("   Please check your MySQL configuration in .env file");
    }
    
    server.listen(PORT, () => {
      console.log(`Server running on port: ${PORT}`);
      console.log(`Allowed Origins: ${allowedOrigins.join(",")}`);
      console.log(`MySQL Status: ${mysqlConnected ? '✅ Connected' : '❌ Disconnected'}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();

import { useEffect, useRef, useState } from "react";
import { Send, Users as UsersIcon } from "lucide-react";
import socket from "../socket";
import { useUser, useAuth } from "@clerk/clerk-react";
import { axiosInstance } from "../lib/axiosInstance";

export default function GroupChat({ groupId, groupTitle }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const listRef = useRef(null);
  const typingTimer = useRef(null);

  const roomId = `study-group-${groupId}`;
  const username = user ? `${user.firstName} ${user.lastName}` : "Anonymous";
  const userId = user?.id;

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      try {
        setLoading(true);
        const token = await getToken();
        const response = await axiosInstance.get(`/group-chat/${groupId}/messages`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(response.data.messages || []);
        scrollToBottom();
      } catch (error) {
        console.error("Failed to load chat history:", error);
        // Fall back to socket history if DB fails
      } finally {
        setLoading(false);
      }
    };

    if (groupId && user) {
      loadChatHistory();
    }
  }, [groupId, user, getToken]);

  useEffect(() => {
    // Join the study group room
    socket.emit("join_room", roomId);
    socket.emit("presence_identify", { roomId, username });

    // Listen for chat history
    const onHistory = (history) => {
      setMessages(history);
      scrollToBottom();
    };

    // Listen for new messages
    const onMessage = (entry) => {
      setMessages((prev) => [...prev, entry]);
      scrollToBottom();
    };

    // Listen for typing indicators
    const onTyping = ({ user, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(user);
        else next.delete(user);
        return next;
      });
    };

    // Listen for presence updates
    const onPresenceUpdate = (users) => {
      setOnlineUsers(users);
    };

    socket.on("chat_history", onHistory);
    socket.on("chat_message", onMessage);
    socket.on("typing", onTyping);
    socket.on("presence_update", onPresenceUpdate);

    return () => {
      socket.off("chat_history", onHistory);
      socket.off("chat_message", onMessage);
      socket.off("typing", onTyping);
      socket.off("presence_update", onPresenceUpdate);
    };
  }, [roomId, username]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (listRef.current) {
        listRef.current.scrollTop = listRef.current.scrollHeight;
      }
    }, 0);
  };

  const send = () => {
    const msg = text.trim();
    if (!msg) return;
    
    socket.emit("chat_send", { 
      room: roomId, 
      user: username, 
      message: msg,
      userId: userId 
    });
    
    setText("");
    socket.emit("typing", { room: roomId, user: username, isTyping: false });
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const onChange = (e) => {
    setText(e.target.value);
    socket.emit("typing", { room: roomId, user: username, isTyping: true });
    
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      socket.emit("typing", { room: roomId, user: username, isTyping: false });
    }, 1200);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + 
             ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Group Chat
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {groupTitle}
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <UsersIcon className="h-4 w-4" />
          <span>{onlineUsers.length} online</span>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={listRef} 
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: "500px" }}
      >
        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-sm">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 py-8">
            <p className="text-sm">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((m) => {
            const isOwnMessage = m.userId === userId || m.socketId === socket.id;
            
            return (
              <div
                key={m.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    isOwnMessage
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  {!isOwnMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-75">
                      {m.user}
                    </p>
                  )}
                  <p className="text-sm break-words whitespace-pre-wrap">
                    {m.message}
                  </p>
                  <p
                    className={`text-xs mt-1 ${
                      isOwnMessage ? 'text-teal-100' : 'text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {formatTime(m.ts || m.timestamp)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        
        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 italic pl-2">
            {Array.from(typingUsers).slice(0, 2).join(", ")}
            {typingUsers.size > 2 ? ` and ${typingUsers.size - 2} others` : ""} typing...
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={text}
            onChange={onChange}
            onKeyDown={onKeyDown}
            rows={2}
            className="flex-1 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            placeholder="Type a message... (Press Enter to send)"
          />
          <button
            onClick={send}
            disabled={!text.trim()}
            className="bg-teal-600 text-white px-4 rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

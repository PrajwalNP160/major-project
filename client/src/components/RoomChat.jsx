import { useEffect, useRef, useState } from "react";
import socket from "../socket";

export default function RoomChat({ roomId, username }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [typingUsers, setTypingUsers] = useState(new Set());
  const listRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    const onHistory = (history) => {
      setMessages(history);
      scrollToBottom();
    };
    const onMessage = (entry) => {
      setMessages((prev) => [...prev, entry]);
      scrollToBottom();
    };
    const onTyping = ({ user, isTyping }) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        if (isTyping) next.add(user);
        else next.delete(user);
        return next;
      });
    };

    socket.on("chat_history", onHistory);
    socket.on("chat_message", onMessage);
    socket.on("typing", onTyping);

    return () => {
      socket.off("chat_history", onHistory);
      socket.off("chat_message", onMessage);
      socket.off("typing", onTyping);
    };
  }, []);

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
    socket.emit("chat_send", { room: roomId, user: username, message: msg });
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

  return (
    <div className="flex flex-col h-80 bg-white rounded-lg">
      <div ref={listRef} className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-teal-600 text-sm">{m.user}</span>
              <span className="text-gray-400 text-xs">{new Date(m.ts).toLocaleTimeString()}</span>
            </div>
            <p className="text-sm text-gray-800 mt-1 break-words">{m.message}</p>
          </div>
        ))}
        {typingUsers.size > 0 && (
          <div className="text-xs text-gray-500 italic">
            {Array.from(typingUsers).slice(0, 2).join(", ")}
            {typingUsers.size > 2 ? ` and ${typingUsers.size - 2} others` : ""} typing...
          </div>
        )}
      </div>
      <div className="p-2 border-t border-gray-200 flex gap-2">
        <textarea
          value={text}
          onChange={onChange}
          onKeyDown={onKeyDown}
          rows={2}
          className="flex-1 border border-gray-300 rounded px-2 py-1 text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          placeholder="Type a message and press Enter"
        />
        <button onClick={send} className="bg-teal-600 hover:bg-teal-700 text-white px-3 rounded transition-colors">
          Send
        </button>
      </div>
    </div>
  );
}

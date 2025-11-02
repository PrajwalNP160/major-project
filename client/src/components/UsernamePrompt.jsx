import { useState } from "react";
import { User, Hash, LogIn } from "lucide-react";

export default function UsernamePrompt({ onJoin, firstName, room }) {
  const [username, setUsername] = useState(firstName || "");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim() && room.trim()) {
      onJoin({ username, room });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-100">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <LogIn size={32} className="text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Join Session</h2>
          <p className="text-gray-600">Enter your details to start collaborating</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all duration-200 text-gray-900 placeholder-gray-400 bg-white"
                required
              />
            </div>
          </div>

          {/* Room Code Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              Room Code
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash size={20} className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Enter room code"
                value={room}
                readOnly
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
              />
            </div>
            <p className="text-xs text-gray-500">Room code is automatically provided</p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!username.trim() || !room.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Join Room
          </button>

          {/* Info */}
          <div className="text-center pt-4">
            <p className="text-sm text-gray-500">
              Make sure your camera and microphone are ready
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

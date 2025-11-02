import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import socket from "../socket"
import CodeEditor from "../components/Editor"
import LanguageSelector from "../components/LanguageSelector"
import OutputConsole from "../components/OutputConsole"
import SaveFileButton from "../components/SaveFileButton"
import VideoCall from "../components/VideoCall/VideoCall" // Import the Agora-based VideoCall component
import RoomChat from "../components/RoomChat"
import Whiteboard from "../components/Whiteboard"

const languages = [
  { id: 45, name: "Assembly (NASM 2.14.02)" },
  { id: 46, name: "Bash (5.0.0)" },
  { id: 47, name: "Basic (FBC 1.07.1)" },
  { id: 75, name: "C (Clang 7.0.1)" },
  { id: 76, name: "C++ (Clang 7.0.1)" },
  { id: 48, name: "C (GCC 7.4.0)" },
  { id: 52, name: "C++ (GCC 7.4.0)" },
  { id: 49, name: "C (GCC 8.3.0)" },
  { id: 53, name: "C++ (GCC 8.3.0)" },
  { id: 50, name: "C (GCC 9.2.0)" },
  { id: 54, name: "C++ (GCC 9.2.0)" },
  { id: 86, name: "Clojure (1.10.1)" },
  { id: 51, name: "C# (Mono 6.6.0.161)" },
  { id: 77, name: "COBOL (GnuCOBOL 2.2)" },
  { id: 55, name: "Common Lisp (SBCL 2.0.0)" },
  { id: 56, name: "D (DMD 2.089.1)" },
  { id: 57, name: "Elixir (1.9.4)" },
  { id: 58, name: "Erlang (OTP 22.2)" },
  { id: 44, name: "Executable" },
  { id: 87, name: "F# (.NET Core SDK 3.1.202)" },
  { id: 59, name: "Fortran (GFortran 9.2.0)" },
  { id: 60, name: "Go (1.13.5)" },
  { id: 88, name: "Groovy (3.0.3)" },
  { id: 61, name: "Haskell (GHC 8.8.1)" },
  { id: 62, name: "Java (OpenJDK 13.0.1)" },
  { id: 63, name: "JavaScript (Node.js 12.14.0)" },
  { id: 78, name: "Kotlin (1.3.70)" },
  { id: 64, name: "Lua (5.3.5)" },
  { id: 89, name: "Multi-file program" },
  { id: 79, name: "Objective-C (Clang 7.0.1)" },
  { id: 65, name: "OCaml (4.09.0)" },
  { id: 66, name: "Octave (5.1.0)" },
  { id: 67, name: "Pascal (FPC 3.0.4)" },
  { id: 85, name: "Perl (5.28.1)" },
  { id: 68, name: "PHP (7.4.1)" },
  { id: 43, name: "Plain Text" },
  { id: 69, name: "Prolog (GNU Prolog 1.4.5)" },
  { id: 70, name: "Python (2.7.17)" },
  { id: 71, name: "Python (3.8.1)" },
  { id: 80, name: "R (4.0.0)" },
  { id: 72, name: "Ruby (2.7.0)" },
  { id: 73, name: "Rust (1.40.0)" },
  { id: 81, name: "Scala (2.13.2)" },
  { id: 82, name: "SQL (SQLite 3.27.2)" },
  { id: 83, name: "Swift (5.2.3)" },
  { id: 74, name: "TypeScript (3.7.4)" },
  { id: 84, name: "Visual Basic.Net (vbnc 0.0.0.5943)" },
]

export default function EditorRoom() {
  const { roomId } = useParams()
  const [username, setUsername] = useState("")
  const [connected, setConnected] = useState(false)
  const [code, setCode] = useState("// Start coding...")
  const [language, setLanguage] = useState(languages[0].id)
  const [stdin, setStdin] = useState("")
  const [output, setOutput] = useState("")
  const [showWhiteboard, setShowWhiteboard] = useState(false) // Toggle between code editor and whiteboard

  const copyLink = async () => {
    const link = `${window.location.origin}/join/${roomId}`
    try {
      await navigator.clipboard.writeText(link)
      alert("Invite link copied to clipboard!")
    } catch {
      prompt("Copy this link:", link)
    }
  }

  useEffect(() => {
    const savedUsername = localStorage.getItem("username")
    if (!savedUsername) {
      alert("No username found! Redirecting to home.")
      window.location.href = "/"
      return
    }

    setUsername(savedUsername)

    socket.emit("join_room", roomId)

    socket.on("executionResult", (result) => {
      setOutput(result.stdout || result.stderr || "No output.")
    })

    socket.on("stdin_change", ({ stdin: incomingStdin }) => {
      setStdin(incomingStdin)
    })

    socket.on("language_change", ({ language_id }) => {
      setLanguage(language_id)
    })

    return () => {
      socket.off("executionResult")
      socket.off("stdin_change")
      socket.off("language_change")
    }
  }, [roomId])

  useEffect(() => {
    socket.on("room_joined", ({ code: incomingCode, stdin: incomingStdin, language_id }) => {
      console.log("Room joined. Incoming code:", incomingCode)
      setConnected(true)
      setCode(incomingCode) // Update the editor with the current code
      setStdin(incomingStdin) // Update the stdin
      setLanguage(language_id) // Update the language
    })

    return () => {
      socket.off("room_joined")
    }
  }, [roomId])

  const handleRunCode = () => {
    setOutput("Running...")
    socket.emit("execute_code_event", {
      room: roomId,
      source_code: code,
      language_id: language,
      stdin,
    })
  }

  const handleStdinChange = (value) => {
    setStdin(value)
    socket.emit("stdin_change", { room: roomId, stdin: value })
  }

  const handleLanguageChange = (languageId) => {
    setLanguage(languageId)
    socket.emit("language_change", { room: roomId, language_id: languageId })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-900">Code Editor Room</h1>
            <div className="text-sm text-gray-600">
              Room: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{roomId}</span>
            </div>
            <div className="text-sm text-gray-600">
              User: <span className="font-semibold text-blue-600">{username}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowWhiteboard(!showWhiteboard)}
              className={`px-4 py-2 rounded-lg transition text-sm font-medium ${
                showWhiteboard
                  ? "bg-purple-600 text-white hover:bg-purple-700"
                  : "bg-blue-600 text-white hover:bg-blue-700"
              }`}
            >
              {showWhiteboard ? "📝 Code Editor" : "🎨 Whiteboard"}
            </button>
            <button
              onClick={copyLink}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition text-sm font-medium"
            >
              📋 Copy Invite Link
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)]">
        {/* Left Panel - Code Editor / Whiteboard */}
        <div className="flex-1 lg:flex-[2] p-4">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-full flex flex-col">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <h2 className="text-sm font-semibold text-gray-700">
                {showWhiteboard ? "🎨 Whiteboard" : "💻 Code Editor"}
              </h2>
              <span className="text-xs text-gray-500">
                {showWhiteboard ? "Draw and explain concepts" : "Write and execute code"}
              </span>
            </div>
            <div className="flex-1 min-h-0">
              {showWhiteboard ? (
                <Whiteboard roomId={roomId} />
              ) : (
                <CodeEditor roomId={roomId} initialCode={code} onCodeChange={setCode} />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Video Call, Language Selector & Chat */}
        <div className="w-full lg:w-96 p-4 space-y-4 overflow-y-auto">
          
          {/* Video Call - Top */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 h-80">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-xl">
              <h3 className="text-sm font-semibold text-gray-700">📹 Video Call</h3>
            </div>
            <div className="h-[calc(100%-48px)]">
              <VideoCall channelName={roomId} userName={username} onLeave={() => window.location.href = '/dashboard'} embedded={true} />
            </div>
          </div>

          {/* Combined Section: Language Selector, Input, Run, Output */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 space-y-3">
            {/* Language Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                🔧 Programming Language
              </label>
              <select
                value={language}
                onChange={(e) => handleLanguageChange(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white text-sm"
              >
                {languages.map((lang) => (
                  <option key={lang.id} value={lang.id} className="py-2">
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Input Section */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📝 Input (stdin)
              </label>
              <textarea
                placeholder="Enter input for your program..."
                value={stdin}
                onChange={(e) => handleStdinChange(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 resize-none"
                rows="3"
              />
            </div>

            {/* Run Button */}
            <button
              onClick={handleRunCode}
              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-2.5 px-4 rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-semibold shadow-lg flex items-center justify-center gap-2"
            >
              ▶️ Run Code
            </button>

            {/* Output Console */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                📊 Output
              </label>
              <div className="border-2 border-gray-200 rounded-lg p-3 bg-gray-50">
                <OutputConsole output={output} />
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 rounded-t-xl">
              <h3 className="text-sm font-semibold text-gray-700">💬 Room Chat</h3>
            </div>
            <div className="p-4">
              <RoomChat roomId={roomId} username={username} />
            </div>
          </div>

          {/* Save File */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
            <SaveFileButton
              code={code}
              stdin={stdin}
              output={output}
              languageId={language}
            />
          </div>

        </div>
      </div>
    </div>
  )
}

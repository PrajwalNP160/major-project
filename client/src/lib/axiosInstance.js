// import axios from "axios";

// const API_BASE_URL = "https://skillswap-h4b-b9s2.onrender.com/api";

// export const axiosInstance = axios.create({
//   baseURL: API_BASE_URL,
//   withCredentials: true,
//   headers: {
//     "Content-Type": "application/json",
//   },
// });
import axios from "axios";

// Ensure API_BASE_URL always includes /api suffix
const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    // If VITE_API_URL is set, ensure it ends with /api
    return envUrl.endsWith('/api') ? envUrl : `${envUrl}/api`;
  }
  
  // Default URLs based on hostname detection
  return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
    ? "http://localhost:8000/api"
    : "https://major-project-f5ir.vercel.app/api";
};

const API_BASE_URL = getApiBaseUrl();

// Debug logs
console.log("🔧 API Configuration:", {
  hostname: typeof window !== 'undefined' ? window.location.hostname : 'server',
  VITE_API_URL: import.meta.env.VITE_API_URL,
  API_BASE_URL: API_BASE_URL,
  MODE: import.meta.env.MODE
});

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // needed if cookies/sessions are used
  headers: {
    "Content-Type": "application/json",
  },
});


import axios from "axios";

const BASE_URL = "https://ai-powered-college-assistant-1.onrender.com";

const API = axios.create({
  baseURL: BASE_URL,
});

// Route-aware token interceptor — sends the correct token based on the API endpoint
API.interceptors.request.use((config) => {
  const url = config.url || "";

  let token = null;

  // Determine which token to use based on the endpoint being called
  if (url.includes("/api/admin") || url.includes("/api/auth/admin")) {
    token = localStorage.getItem("adminToken");
  } else if (
    url.includes("/api/teacher") ||
    url.includes("/api/chat/teacher")
  ) {
    token = localStorage.getItem("teacherToken");
  } else if (
    url.includes("/api/student") ||
    url.includes("/api/chat/student") ||
    url.includes("/api/notes") ||
    url.includes("/api/feedback")
  ) {
    token = localStorage.getItem("studentToken");
  }

  // Fallback: if no route-specific match, try any available token
  if (!token) {
    token =
      localStorage.getItem("adminToken") ||
      localStorage.getItem("teacherToken") ||
      localStorage.getItem("studentToken");
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Clear all role tokens — call this on login to prevent token conflicts
 */
export const clearAllTokens = () => {
  localStorage.removeItem("adminToken");
  localStorage.removeItem("adminData");
  localStorage.removeItem("teacherToken");
  localStorage.removeItem("teacherData");
  localStorage.removeItem("studentToken");
  localStorage.removeItem("studentData");
};

export { BASE_URL };
export default API;

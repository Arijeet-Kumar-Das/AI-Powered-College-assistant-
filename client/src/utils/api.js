

import axios from "axios";


const BASE_URL = "https://ai-powered-college-assistant-1.onrender.com";

const API = axios.create({
  baseURL: BASE_URL,
});

API.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem("adminToken");
  const teacherToken = localStorage.getItem("teacherToken");
  const studentToken = localStorage.getItem("studentToken");

  const token = adminToken || teacherToken || studentToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export { BASE_URL };
export default API;

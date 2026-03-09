import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URI,
});

// Attach JWT automatically to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("jwt");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getEmails = () => API.get("/emails");
export default API;

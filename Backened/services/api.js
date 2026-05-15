import axios from "axios";

// This is the backend server URL
const API_BASE = "http://localhost:5001/api";

// 1. Login (if you have login feature)
export const login = (email, password) => {
  return axios.post(`${API_BASE}/auth/login`, { email, password });
};

// 2. Get interview questions
export const getQuestions = () => {
  return axios.get(`${API_BASE}/interview/questions`);
};

// 3. Export PDF report of your answers
export const exportReport = (answers) => {
  return axios.post(
    `${API_BASE}/export/report`,
    { answers },
    { responseType: "blob" } // So that browser downloads it as a file
  );
};

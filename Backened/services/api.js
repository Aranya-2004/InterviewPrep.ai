import axios from "axios";

// Core Backend Base API Entry Point Configuration
const API_BASE = "http://localhost:5001/api";

// ✅ OPTIMIZED: Create a dedicated axios instance for your application workspace
const apiInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// ✅ FIXED: Global Request Interceptor automatically injects your Bearer JWT Token securely
apiInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`; // Matches backend req.headers.authorization split criteria precisely
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 1. User Authentication Gateway
 * Dispatches raw credentials securely to your database verification layer.
 */
export const login = (email, password) => {
  return apiInstance.post("/auth/login", { email, password });
};

/**
 * 2. Multi-Stage Interview Session Initializer
 * Notifies the backend to compile a new interview trace context reference inside MongoDB.
 * Expects: userId, jobRole, resumeText, and the active interviewStage.
 */
export const startInterviewSession = (userId, jobRole, resumeText, interviewStage) => {
  return apiInstance.post("/interview/start", {
    userId,
    jobRole: jobRole || "Software Engineer",
    resumeText,
    interviewStage // Passes 'projects', 'technical', or 'hr' down to the router
  });
};

/**
 * 3. Contextual Question Generator Layer
 * Requests the backend server to pull or dynamically synthesize the next sequential question node.
 * Expects: userId and the active active tracker sessionId.
 */
export const fetchNextStageQuestion = (userId, sessionId) => {
  return apiInstance.post("/interview/question", {
    userId,
    sessionId
  });
};

/**
 * 4. Multimodal Real-Time Answer Submission
 * Submits transcribed voice text or manually keyed answer blocks to the Groq evaluation engine.
 * Expects: userId, active sessionId, and the candidate's raw answer string.
 */
export const submitStageAnswer = (userId, sessionId, answer) => {
  return apiInstance.post("/interview/answer", {
    userId,
    sessionId,
    answer
  });
};

/**
 * 5. Analytical PDF Summary Exporter
 * Generates and downloads a binary blob file container documenting the multi-stage score criteria.
 */
export const exportReport = (answers) => {
  return apiInstance.post(
    "/export/report",
    { answers },
    { responseType: "blob" } // Forces browser window engine download streams to interpret binary arrays safely
  );
};
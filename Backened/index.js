require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// ================= ROUTES =================
const authRoutes = require("./routes/auth");
const exportRoutes = require("./routes/export");
const resumeRoutes = require("./routes/resume");
const interviewRoutes = require("./routes/interview"); // Handles all /start, /question, /answer, /finalize endpoints
const performanceRoute = require("./routes/performance");
const dashboardRoute = require("./routes/dashboard");
// ================= APP =================
const app = express();
const server = http.createServer(app);

// ================= SOCKET SETUP =================
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ================= MAKE IO GLOBAL =================
global.io = io;

// ================= MIDDLEWARE =================
app.use(cors());
app.use(express.json({ limit: "5mb" })); // Boosted to handle large resume parsing texts seamlessly

// ================= MAKE IO AVAILABLE IN CONTROLLERS =================
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ================= DEBUG ENV =================
console.log("Groq key loaded:", !!process.env.GROQ_API_KEY);

// ================= TEST ROUTE =================
app.post("/api/test", (req, res) => {
  console.log("📩 Data received from frontend:", req.body);
  res.json({ message: "Hello frontend, backend is connected!" });
});

// ================= ROUTES DECLARATIONS =================
app.use("/api/auth", authRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes); 
// ✅ FIXED: Removed the undefined interviewServices route that was breaking compilation
app.use("/api/performance", performanceRoute);
app.use("/api/dashboard", dashboardRoute);
// ================= MONGODB CONNECTION =================
mongoose.connect(process.env.MONGO_URI)
.then(() => {
  console.log("✅ MongoDB connected to production cluster data index records");
})
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1);
});

// ================= SOCKET USER MAP =================
const userSockets = new Map();

// ================= SOCKET EVENTS =================
io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  // ================= USER JOIN =================
  socket.on("userJoin", (userId) => {
    userSockets.set(userId, socket.id);
    socket.join(`user-${userId}`);
    console.log(`✅ User ${userId} joined room`);
  });

  // ================= INTERVIEW COMPLETED =================
  socket.on("interviewCompleted", (data) => {
    console.log("🎤 Interview completed:", data.userId);
    io.to(`user-${data.userId}`).emit("dashboardUpdate", {
      type: "newInterview",
      data
    });
  });

  // ================= RESUME ANALYSIS COMPLETED =================
  socket.on("resumeAnalysed", (data) => {
    console.log("📄 Resume analysed:", data.userId);
    io.to(`user-${data.userId}`).emit("dashboardUpdate", {
      type: "resumeUpdated",
      data
    });
  });

  // ================= PERFORMANCE UPDATED =================
  socket.on("performanceUpdated", (data) => {
    console.log("📊 Performance updated:", data.userId);
    io.to(`user-${data.userId}`).emit("dashboardUpdate", {
      type: "performanceUpdated",
      data
    });
  });

  // ================= DISCONNECT =================
  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
    for (let [userId, sockId] of userSockets.entries()) {
      if (sockId === socket.id) {
        userSockets.delete(userId);
        break;
      }
    }
  });
});

// ================= START SERVER =================
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Production server running beautifully on port ${PORT}`);
});
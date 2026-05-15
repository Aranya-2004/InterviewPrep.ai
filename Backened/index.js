require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// Routes
const authRoutes = require("./routes/auth");
const exportRoutes = require("./routes/export");
const resumeRoutes = require("./routes/resume");
const interviewRoutes = require("./routes/interview");
const performanceRoute = require("./routes/performance");

const app = express();
const server = http.createServer(app);

// Socket setup
const io = new Server(server, {
  cors: { origin: "*" }
});

// Middleware
app.use(cors());
app.use(express.json());

// Debug env
console.log("Groq key loaded:", !!process.env.GROQ_API_KEY);

// Test route
app.post("/api/test", (req, res) => {
  console.log("📩 Data received from frontend:", req.body);
  res.json({ message: "Hello frontend, backend is connected!" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/export", exportRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/interview", interviewRoutes);
app.use("/api/performance", performanceRoute);

// MongoDB connection (FIXED)
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected"))
.catch((err) => {
  console.error("❌ MongoDB connection error:", err.message);
  process.exit(1); // stop server if DB fails
});

// Socket.io
io.on("connection", (socket) => {
  console.log("👤 User connected:", socket.id);

  socket.on("startInterview", (data) => {
    console.log("🎤 Interview started:", data.userId);

    socket.emit("newQuestion", "Tell me about yourself.");
  });

  socket.on("answer", (data) => {
    console.log("📝 User answer:", data);

    socket.emit("feedback", {
      score: 80,
      advice: "Good answer, improve confidence."
    });
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
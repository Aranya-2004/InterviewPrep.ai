// controllers/interviewController.js
const Interview = require("../models/Interview");

// ================= SAVE INTERVIEW =================
exports.saveInterview = async (req, res) => {
  try {
    const {
      topic,
      difficulty,
      score,
      feedback,
      stage // ✅ NEW: Destructure the stage field ('projects', 'technical', or 'hr') from the body request
    } = req.body;

    // Persist full multi-stage evaluation bounds to the database collection layer
    const interview = await Interview.create({
      userId: req.user.id, // Safely extracted from your active auth middleware token injection
      topic: topic || "Software Engineer",
      difficulty,
      score,
      feedback,
      stage: stage || "projects" // ✅ NEW: Mapped straight into your database model structure record
    });

    // 🔥 Real-time event: notify user dashboard graph segments dynamically
    if (global.io) {
      global.io.to(`user-${req.user.id}`).emit("dashboardUpdate", {
        type: "newInterview",
        interview: {
          ...interview._doc,
          stage: interview.stage, // ✅ NEW: Spread the active stage indicator down to real-time socket events
          date: new Date(interview.createdAt).toLocaleDateString()
        }
      });
    }

    res.status(201).json({
      success: true,
      message: "Interview Saved Successfully",
      interview
    });

  } catch (error) {
    console.error("❌ saveInterview Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error saving session evaluation"
    });
  }
};

// ================= GET INTERVIEWS =================
exports.getInterviews = async (req, res) => {
  try {
    // Fetches all historical sessions for the user sorted chronologically
    const interviews = await Interview.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json(interviews);

  } catch (error) {
    console.error("❌ getInterviews Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching past sessions records"
    });
  }
};
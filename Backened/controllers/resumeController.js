// controllers/resumeController.js
const Resume = require("../models/Resume");

// ================= SAVE RESUME =================
exports.saveResumeAnalysis = async (req, res) => {
  try {
    const {
      role,
      atsScore,
      matchedKeywords = [],
      missingKeywords = [],
      aiFeedback // ✅ NEW: Capture the nested feedback block from the request body
    } = req.body;

    // Isolate fallback nested defaults to prevent saving undefined data paths
    const feedbackBlock = aiFeedback || {};

    const resume = await Resume.create({
      userId: req.user.id, // Safely extracted from your active auth middleware token injection
      role: role || "Software Engineer",
      atsScore: atsScore || 0,
      matchedKeywords,
      missingKeywords,
      
      // ✅ NEW: Persist the full nested premium AI feedback matrix fields
      aiFeedback: {
        strengths: feedbackBlock.strengths || [],
        missingSkills: feedbackBlock.missingSkills || [],
        suggestions: feedbackBlock.suggestions || [],
        atsTips: feedbackBlock.atsTips || []
      }
    });

    res.status(201).json({
      success: true,
      message: "Resume Analysis Saved Successfully",
      resume
    });

  } catch (error) {
    console.error("❌ saveResumeAnalysis Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error saving resume analysis matrix"
    });
  }
};

// ================= GET RESUMES =================
exports.getResumeHistory = async (req, res) => {
  try {
    // Fetches all past resume scans sorted chronologically by most recent creation date
    const resumes = await Resume.find({
      userId: req.user.id
    }).sort({ createdAt: -1 });

    res.status(200).json(resumes);

  } catch (error) {
    console.error("❌ getResumeHistory Controller Error:", error);
    res.status(500).json({
      success: false,
      message: "Server Error fetching past scan histories"
    });
  }
};
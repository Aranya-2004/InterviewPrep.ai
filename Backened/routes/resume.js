// routes/resume.js
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { protect } = require("../middleware/authMiddleware");
const {
  uploadAndAnalyzeResume,
  saveResumeAnalysis,
  getResumeHistory
} = require("../controllers/resumeController");

// ================= MULTER SETUP FOR FILE UPLOADS =================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../uploads"));
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are allowed"), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resume - Upload & Analyze Resume
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", protect, upload.single("resume"), uploadAndAnalyzeResume);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/resume/save - Save Resume Analysis
// ─────────────────────────────────────────────────────────────────────────────
router.post("/save", protect, saveResumeAnalysis);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/resume/history - Get Resume Analysis History
// ─────────────────────────────────────────────────────────────────────────────
router.get("/history", protect, getResumeHistory);

module.exports = router;
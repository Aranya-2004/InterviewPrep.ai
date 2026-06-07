// controllers/resumeController.js
const Resume = require("../models/resume");
const { analyzeResume } = require("../services/ai");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const fs = require("fs");

// ================= UPLOAD & ANALYZE RESUME =================
exports.uploadAndAnalyzeResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please select a PDF or DOCX file."
      });
    }

    const { jobRole = "software_engineer" } = req.body;
    const filePath = req.file.path;
    let resumeText = "";

    // ✅ Extract text based on file type
    if (req.file.mimetype === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      resumeText = data.text;
    } else if (
      req.file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const dataBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: dataBuffer });
      resumeText = result.value;
    } else {
      fs.unlinkSync(filePath); // Clean up invalid file
      return res.status(400).json({
        success: false,
        message: "Invalid file type. Please upload PDF or DOCX."
      });
    }

    // ✅ Clean up uploaded file after extraction
    fs.unlinkSync(filePath);

    if (!resumeText.trim()) {
      return res.status(400).json({
        success: false,
        message: "Could not extract text from the resume file."
      });
    }

    // ✅ Analyze resume using AI service
    const analysis = await analyzeResume(resumeText, jobRole);

    // ✅ Save the analysis to database
    const resume = await Resume.create({
      userId: req.user.id,
      role: jobRole,
      atsScore: analysis.atsScore,
      matchedKeywords: analysis.matchedKeywords,
      missingKeywords: analysis.missingKeywords,
      aiFeedback: {
        strengths: analysis.strengths,
        missingSkills: analysis.missingSkills,
        suggestions: analysis.suggestions,
        atsTips: analysis.atsTips
      }
    });

    res.status(200).json({
      score: analysis.score,
      atsScore: analysis.atsScore,
      detailedBreakdown: analysis.detailedBreakdown,
      sectionAnalysis: analysis.sectionAnalysis,
      keywordGaps: analysis.keywordGaps,
      jobDescriptionComparison: analysis.jobDescriptionComparison,
      achievementQualityScore: analysis.achievementQualityScore,
      achievementFeedback: analysis.achievementFeedback,
      recruiterView: analysis.recruiterView,
      readinessMeter: analysis.readinessMeter,
      roadmap: analysis.roadmap,
      strengths: analysis.strengths || [],
      missingSkills: analysis.missingSkills || [],
      suggestions: analysis.suggestions || [],
      atsTips: analysis.atsTips || [],
      matchedKeywords: analysis.matchedKeywords || [],
      missingKeywords: analysis.missingKeywords || [],
      aiFeedback: analysis.summary || `Your resume has a ${analysis.atsScore}% ATS compatibility score for ${jobRole}. Key strengths include your matched keywords. Focus on acquiring the missing skills and implementing the suggested improvements to increase your score.`
    });

  } catch (error) {
    console.error("❌ Resume Upload/Analysis Error:", error);
    
    // Clean up file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Error analyzing resume. Please try again.",
      error: error.message
    });
  }
};

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
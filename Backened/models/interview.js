// models/Interview.js
const mongoose = require("mongoose");

const interviewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true, 
    index: true // Keeps query lookups highly performant
  },
  topic: { 
    type: String, 
    default: "Software Engineer" 
  },
  resumeText: {
    type: String,
    required: true,
    trim: true,
    default: ""
  },
  difficulty: { 
    type: String, 
    default: "Medium" 
  },
  stage: { 
    type: String, 
    enum: ["projects", "technical", "hr"], 
    default: "projects" 
  },
  score: { 
    type: Number, 
    default: 0 
  },
  feedback: {
    strengths: [{ type: String, default: [] }],
    weaknesses: [{ type: String, default: [] }],
    suggestions: [{ type: String, default: [] }]
  },
  questions: [
    {
      question: { type: String, required: true },
      answer: { type: String, default: "" },
      overallScore: { type: Number, default: 0 },
      technicalAccuracy: { type: Number, default: 0 },
      conceptDepth: { type: Number, default: 0 },
      clarity: { type: Number, default: 0 },
      confidence: { type: Number, default: 0 }, // ✅ FIXED: Added missing metric key parameter
      resumeAlignment: { type: Number, default: 0 },
      idealAnswerHint: { type: String, default: "" }
    }
  ]
}, { timestamps: true }); // Automatically maintains createdAt and updatedAt fields natively

module.exports = mongoose.model("Interview", interviewSchema);
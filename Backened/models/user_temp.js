const mongoose = require("mongoose");

// 1. Define the internal Question sub-schema
const QuestionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  answer: { type: String, default: null },
  analysis: { type: mongoose.Schema.Types.Mixed, default: null } // Stores Groq JSON metrics
});

// 2. Define the Interview Session sub-schema
const InterviewSessionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  role: { type: String, default: "Software Engineer" },
  resumeText: { type: String, required: true },
  score: { type: Number, default: 0 },
  questions: [QuestionSchema] // Embedded array of questions
});

// 3. Define the main User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  interviews: [InterviewSessionSchema] // 👈 This makes user.interviews.push() work!
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
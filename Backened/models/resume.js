const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  role: { type: String, default: "Software Engineer" },
  atsScore: { type: Number, default: 0 },
  matchedKeywords: [{ type: String }],
  missingKeywords: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.models.Resume || mongoose.model("Resume", resumeSchema);
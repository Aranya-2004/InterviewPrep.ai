const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");  // ✅ correct import
const mammoth = require("mammoth");
const { analyzeAnswer } = require("../services/ai");

const upload = multer({ storage: multer.memoryStorage() });

const JOB_ROLES = [
  { value: "software_engineer", keywords: ["JavaScript","React","Node.js","REST","Git","Agile"] },
  { value: "data_scientist", keywords: ["Python","Machine Learning","Pandas","SQL","TensorFlow"] },
  { value: "product_manager", keywords: ["Product Roadmap","Stakeholders","Agile","User Stories"] },
  { value: "ux_designer", keywords: ["Figma","Wireframes","User Research","Prototyping"] },
  { value: "devops_engineer", keywords: ["Docker","Kubernetes","CI/CD","AWS"] }
];

router.post("/", upload.single("resume"), async (req, res) => {
  try {

    const { jobRole } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: "Resume file required" });
    }

    let resumeText = "";

    // ✅ Parse PDF
    if (req.file.mimetype === "application/pdf") {

      const data = await pdfParse(req.file.buffer);
      resumeText = data.text;

    }

    // ✅ Parse DOCX
    else if (
      req.file.mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {

      const docData = await mammoth.extractRawText({
        buffer: req.file.buffer
      });

      resumeText = docData.value;

    }

    else {
      return res.status(400).json({ error: "Only PDF or DOCX allowed" });
    }

    console.log("📄 Resume text extracted");

    const roleObj = JOB_ROLES.find(r => r.value === jobRole);

    if (!roleObj) {
      return res.status(400).json({ error: "Invalid job role" });
    }

    const keywordAnalysis = keywordMatch(resumeText, roleObj.keywords);

    const aiAnalysis = "AI analysis disabled (quota exceeded). Showing keyword analysis only.";

    res.json({
      score: keywordAnalysis.score,
      matchedKeywords: keywordAnalysis.matchedKeywords,
      missingKeywords: keywordAnalysis.missingKeywords,
      aiFeedback: aiAnalysis,
      jobRole
    });

  } catch (err) {
    console.error("Resume analysis error:", err);
    res.status(500).json({ error: "Resume analysis failed" });
  }
});

function keywordMatch(resumeText, roleKeywords) {

  const text = resumeText.toLowerCase();

  const matched = roleKeywords.filter(skill =>
    text.includes(skill.toLowerCase())
  );

  const missing = roleKeywords.filter(skill =>
    !text.includes(skill.toLowerCase())
  );

  const score = Math.round((matched.length / roleKeywords.length) * 100);

  return {
    score,
    matchedKeywords: matched,
    missingKeywords: missing
  };
}

module.exports = router;
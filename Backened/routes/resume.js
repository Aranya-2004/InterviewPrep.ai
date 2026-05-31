// routes/interview.js
const express = require("express");
const router  = express.Router();
const Interview = require("../models/Interview");
const { analyzeAnswer } = require("../services/ai"); // Clean relative service file path

// ✅ SECURED: Authenticates incoming JSON web token payloads natively
const { protect } = require("../middleware/authMiddleware");

const JOB_ROLES = [
  { value: "software_engineer", keywords: ["JavaScript","React","Node.js","REST","Git","Agile"] },
  { value: "data_scientist", keywords: ["Python","Machine Learning","Pandas","SQL","TensorFlow"] },
  { value: "product_manager", keywords: ["Product Roadmap","Stakeholders","Agile","User Stories"] },
  { value: "ux_designer", keywords: ["Figma","Wireframes","User Research","Prototyping"] },
  { value: "devops_engineer", keywords: ["Docker","Kubernetes","CI/CD","AWS"] }
];

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/start
// ─────────────────────────────────────────────────────────────────────────────
router.post("/start", protect, async (req, res) => {
  try {
    const { jobRole, resumeText, interviewStage = "projects" } = req.body;
    const userId = req.user.id; // Extracted securely out of your authentication signature token

    if (!resumeText?.trim()) {
      return res.status(400).json({ error: "resumeText context data is required to start a session" });
    }

    // ✅ FIXED: Persist simulation state directly into your cluster index data records
    const newSession = await Interview.create({
      userId,
      topic: jobRole || "Software Engineer",
      difficulty: "Medium",
      resumeText,
      stage: interviewStage,
      score: 0,
      questions: []
    });

    console.log(`🎬 Initialized master trace collection index record: ${newSession._id}`);

    return res.json({ 
      success: true, 
      sessionId: newSession._id,
      stage: interviewStage,
      role: jobRole || "software_engineer"
    });
  } catch (err) {
    console.error("❌ /start route execution failed:", err);
    return res.status(500).json({ error: "Server error initializing session boundaries" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/question
// ─────────────────────────────────────────────────────────────────────────────
router.post("/question", protect, async (req, res) => {
  try {
    const { sessionId } = req.body;

    // ✅ FIXED: Extract state strings accurately out of MongoDB
    const session = await Interview.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Active simulation session tracking context not found." });

    const { resumeText, questions, stage = "projects", topic = "Software Engineer" } = session;
    const previousQuestions = questions.map(q => q.question);
    const questionNumber = previousQuestions.length + 1;

    const alreadyAskedRules = previousQuestions.length > 0
      ? `\nCRITICAL: Do NOT repeat or closely rephrase any of these questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

    let stagePersonaInstructions = "";
    if (stage === "projects") {
      stagePersonaInstructions = `You are a Principal Systems Architect checking code depth. Focus explicitly on deep-diving into architectural details, database decisions, framework interactions, or optimization parameters of the custom projects listed in their resume text.`;
    } else if (stage === "technical") {
      stagePersonaInstructions = `You are a Senior Core Software Engineer conducting a live technical evaluation. Focus strictly on foundational technical concepts matching their role: core languages, runtime loops, state trees, caching layers, and algorithms.`;
    } else if (stage === "hr") {
      stagePersonaInstructions = `You are an Executive Tech Recruiter assessing cultural alignment, leadership tracking, and impact. Focus on behavioral questions following the STAR evaluation methodology.`;
    }

    const systemPrompt = `You are an elite, world-class interviewer conducting a structured technical evaluation workspace.
${stagePersonaInstructions}

Generate exactly ONE focused, highly specific question based on the candidate's profile context.
Never ask generic questions. Do not include introductory text, numbers, markdown styling, or conversational preambles. Return only the raw question string text.`;

    const userPrompt = `Candidate Resume Context Profile Data:\n${resumeText}\n${alreadyAskedRules}
Generate unique interview question #${questionNumber} for segment: "${stage.toUpperCase()}". Target role: "${topic}".`;

    console.log(`🤖 Requesting Llama 3.3 to synthesize question #${questionNumber} for stage: ${stage}...`);
    
    // We import and execute an inline utility instance to keep this controller extremely fast and lightweight
    const GroqSDK = require("groq-sdk");
    const localGroq = new GroqSDK({ apiKey: process.env.GROQ_API_KEY });
    
    const completion = await localGroq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 256,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    });

    const selectedQuestion = completion.choices[0].message.content.trim();

    // Persist question track back down to the database record arrays
    session.questions.push({ question: selectedQuestion, answer: null, overallScore: null });
    await session.save();

    return res.json({ success: true, question: selectedQuestion, questionNumber });

  } catch (err) {
    console.warn("⚠️ AI Question generation dropped. Issuing backup fallback placeholders.");
    const staticFallbacks = [
      "Can you walk me through the architecture and state management mechanics of your main full-stack development project?",
      "How do you handle error handling boundaries and database indexing optimizations inside your application layout?",
      "Describe a challenging technical bottleneck you encountered and the debugging pipeline you deployed to resolve it."
    ];
    return res.json({ success: true, question: staticFallbacks[0], questionNumber: 1 });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/answer
// ─────────────────────────────────────────────────────────────────────────────
router.post("/answer", protect, async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!answer?.trim()) {
      return res.status(400).json({ error: "Candidate answer text string is required." });
    }

    const session = await Interview.findById(sessionId);
    if (!session) return res.status(404).json({ error: "Session template dropped." });

    const currentQ = [...session.questions].reverse().find(q => q.answer === null);
    if (!currentQ) return res.status(400).json({ error: "No pending question awaiting evaluation found." });

    const { resumeText, stage = "projects", topic = "Software Engineer" } = session;
    const roleObj = JOB_ROLES.find(r => r.value === topic.toLowerCase().replace(" ", "_")) || JOB_ROLES[0];
    const keywordAnalysis = keywordMatch(resumeText, roleObj.keywords);

    // ✅ FIXED: analyzeAnswer returns a parsed JavaScript object directly now—no extra JSON.parse() loops required!
    const aiFeedbackData = await analyzeAnswer(resumeText, roleObj.value, currentQ.question, answer, stage);

    // Write metric updates down onto individual array properties natively
    currentQ.answer = answer;
    currentQ.overallScore = aiFeedbackData.overallScore || keywordAnalysis.score;
    currentQ.technicalAccuracy = aiFeedbackData.technicalAccuracy || 50;
    currentQ.conceptDepth = aiFeedbackData.conceptDepth || 50;
    currentQ.clarity = aiFeedbackData.clarity || 50;
    currentQ.confidence = aiFeedbackData.confidence || 50; // ✅ FIXED: Maps confidence metric natively
    currentQ.resumeAlignment = aiFeedbackData.resumeAlignment || 50;
    currentQ.idealAnswerHint = aiFeedbackData.idealAnswerHint || "";

    session.feedback = {
      strengths: aiFeedbackData.strengths || [],
      weaknesses: aiFeedbackData.weaknesses || [],
      suggestions: aiFeedbackData.improvementSuggestions || []
    };

    const answeredList = session.questions.filter(q => q.answer !== null);
    session.score = answeredList.length > 0
      ? Math.round(answeredList.reduce((sum, q) => sum + (q.overallScore || 0), 0) / answeredList.length)
      : 0;

    await session.save();

    return res.json({
      success: true,
      analysis: aiFeedbackData, // Matches frontend card expansion hooks precisely
      technicalAccuracy: currentQ.technicalAccuracy,
      conceptDepth: currentQ.conceptDepth,
      clarity: currentQ.clarity,
      confidence: currentQ.confidence,
      resumeAlignment: currentQ.resumeAlignment,
      overallScore: currentQ.overallScore,
      strengths: session.feedback.strengths,
      weaknesses: session.feedback.weaknesses,
      improvementSuggestions: session.feedback.suggestions,
      idealAnswerHint: currentQ.idealAnswerHint
    });

  } catch (err) {
    console.error("❌ /answer evaluation matrix failure:", err);
    return res.status(500).json({ error: "Answer evaluation mapping pipeline broken." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/finalize
// ─────────────────────────────────────────────────────────────────────────────
router.post("/finalize", protect, async (req, res) => {
  try {
    const { sessionId, finalScore } = req.body;
    console.log(`🏁 Finalizing metrics payload context update loop for session: ${sessionId}`);

    const updatedSession = await Interview.findByIdAndUpdate(
      sessionId,
      { $set: { score: finalScore } },
      { new: true }
    );

    return res.status(200).json({ success: true, message: "Session finalized cleanly.", sessionId: updatedSession?._id });
  } catch (err) {
    return res.status(500).json({ error: "Failed to finalize target trial loop parameters." });
  }
});

function keywordMatch(resumeText, roleKeywords) {
  const text = (resumeText || "").toLowerCase();
  const matched = roleKeywords.filter(skill => text.includes(skill.toLowerCase()));
  const missing = roleKeywords.filter(skill => !text.includes(skill.toLowerCase()));
  const score = Math.round((matched.length / roleKeywords.length) * 100) || 50;
  return { score, matchedKeywords: matched, missingKeywords: missing };
}

module.exports = router;
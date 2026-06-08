// routes/interview.js
const express = require("express");
const router  = express.Router();
const Groq    = require("groq-sdk");
const Interview = require("../models/interview");
const { protect } = require("../middleware/authMiddleware");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Helpers ───────────────────────────────────────────────────────────────────
function safeParseJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("❌ JSON parse failed. Raw:", raw);
    throw e;
  }
}

async function groqChat(systemPrompt, userPrompt, maxTokens = 1024, forceJSON = false) {
  const options = {
    model: "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    temperature: 0.2,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
  };
  if (forceJSON) options.response_format = { type: "json_object" };
  const completion = await groq.chat.completions.create(options);
  return completion.choices[0].message.content.trim();
}

function stagePersona(stage) {
  if (stage === "projects")  return "You are a Principal Systems Architect. Focus on architectural decisions, database choices, scalability, and project trade-offs from the candidate's own builds.";
  if (stage === "technical") return "You are a Senior Software Engineer. Focus on DSA, OOP, MERN stack, algorithms, REST APIs, and core CS fundamentals.";
  if (stage === "hr")        return "You are an Executive Tech Recruiter. Use the STAR framework. Focus on leadership, conflict resolution, teamwork, and cultural alignment.";
  return "You are an elite technical interviewer. Ask targeted questions based on the candidate's role and resume.";
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/start
// ─────────────────────────────────────────────────────────────────────────────
router.post("/start", protect, async (req, res) => {
  try {
    const { jobRole, resumeText, interviewStage = "projects" } = req.body;
    const userId = req.user.id;

    if (!resumeText?.trim()) {
      return res.status(400).json({ message: "resumeText is required to start a session." });
    }

    const newSession = await Interview.create({
      userId,
      topic:      jobRole || "Software Engineer",
      difficulty: "Medium",
      resumeText,
      stage:      interviewStage,
      score:      0,
      questions:  [],
    });

    console.log(`✅ Session started: ${newSession._id} | Stage: ${interviewStage}`);
    return res.json({ success: true, sessionId: newSession._id });

  } catch (err) {
    console.error("❌ /start error:", err.message);
    return res.status(500).json({ message: "Server error starting session." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/question
// ─────────────────────────────────────────────────────────────────────────────
router.post("/question", protect, async (req, res) => {
  try {
    const { sessionId, interviewStage, previousQuestions = [] } = req.body;

    if (!sessionId) {
      return res.status(400).json({ message: "sessionId is required." });
    }

    const session = await Interview.findById(sessionId);
    if (!session) {
      return res.status(404).json({ message: "Session not found." });
    }

    const activeStage    = interviewStage || session.stage || "projects";
    const { resumeText } = session;

    if (!resumeText?.trim()) {
      return res.status(400).json({ message: "No resume text found on this session." });
    }

    const dbQuestions    = session.questions.map(q => q.question);
    const allPrevious    = [...new Set([...dbQuestions, ...previousQuestions])];
    const questionNumber = allPrevious.length + 1;

    const avoidBlock = allPrevious.length > 0
      ? `\nDo NOT repeat or rephrase any of these already-asked questions:\n${allPrevious.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
      : "";

    const systemPrompt = `You are a professional technical interviewer.
${stagePersona(activeStage)}
Generate exactly ONE focused interview question. Output ONLY the raw question text — no numbering, no quotes, no markdown, no preamble.`;

    const userPrompt = `Candidate applying for: ${session.topic}

Resume:
${resumeText.slice(0, 1500)}
${avoidBlock}
Generate question #${questionNumber} for stage: ${activeStage.toUpperCase()}`;

    const question = await groqChat(systemPrompt, userPrompt, 256, false);

    if (!question) {
      return res.status(500).json({ message: "AI did not return a question. Try again." });
    }

    session.questions.push({ question, answer: null, overallScore: null });
    session.stage = activeStage;
    await session.save();

    console.log(`✅ Q${questionNumber} generated | Session: ${sessionId}`);
    return res.json({ success: true, question, questionNumber });

  } catch (err) {
    console.error("❌ /question error:", err.message);
    return res.status(500).json({ message: "Failed to generate question. " + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/answer
// ─────────────────────────────────────────────────────────────────────────────
router.post("/answer", protect, async (req, res) => {
  try {
    const { sessionId, answer } = req.body;

    if (!answer?.trim())  return res.status(400).json({ message: "Answer is required." });
    if (!sessionId)       return res.status(400).json({ message: "sessionId is required." });

    const session = await Interview.findById(sessionId);
    if (!session) return res.status(404).json({ message: "Session not found." });

    // FIX: use findIndex on original array — .reverse() returns a copy so mutations are lost
    const pendingIndex = session.questions.findIndex(q => q.answer === null);
    if (pendingIndex === -1) {
      return res.status(400).json({ message: "No pending question found for this session." });
    }

    const currentQ = session.questions[pendingIndex];
    const { resumeText, stage = "projects", topic = "Software Engineer" } = session;

    const systemPrompt = `You are a technical evaluation engine.
Stage: ${stage.toUpperCase()} | Role: ${topic}
${stagePersona(stage)}
Return ONLY a valid JSON object — no markdown, no text outside the JSON.`;

    const userPrompt = `Resume:
${resumeText.slice(0, 1000)}

Question: ${currentQ.question}

Candidate Answer: ${answer}

Return this exact JSON:
{
  "technicalAccuracy": <0-100>,
  "conceptDepth": <0-100>,
  "clarity": <0-100>,
  "confidence": <0-100>,
  "resumeAlignment": <0-100>,
  "overallScore": <0-100>,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvementSuggestions": ["..."],
  "idealAnswerHint": "..."
}`;

    const raw      = await groqChat(systemPrompt, userPrompt, 1200, true);
    const analysis = safeParseJSON(raw);

    // FIX: mutate by index + markModified so mongoose saves subdoc changes
    session.questions[pendingIndex].answer            = answer;
    session.questions[pendingIndex].overallScore      = analysis.overallScore      || 50;
    session.questions[pendingIndex].technicalAccuracy = analysis.technicalAccuracy || 50;
    session.questions[pendingIndex].conceptDepth      = analysis.conceptDepth      || 50;
    session.questions[pendingIndex].clarity           = analysis.clarity           || 50;
    session.questions[pendingIndex].confidence        = analysis.confidence        || 50;
    session.questions[pendingIndex].resumeAlignment   = analysis.resumeAlignment   || 50;
    session.questions[pendingIndex].idealAnswerHint   = analysis.idealAnswerHint   || "";
    session.markModified("questions");

    session.feedback = {
      strengths:   analysis.strengths              || [],
      weaknesses:  analysis.weaknesses             || [],
      suggestions: analysis.improvementSuggestions || [],
    };

    const answered = session.questions.filter(q => q.answer !== null);
    session.score  = answered.length > 0
      ? Math.round(answered.reduce((sum, q) => sum + (q.overallScore || 0), 0) / answered.length)
      : 0;

    await session.save();
    console.log(`✅ Answer saved | Session: ${sessionId} | Score: ${analysis.overallScore}`);

    // Return fields FLAT — frontend reads them directly off `data`, not `data.analysis`
    return res.json({
      success:               true,
      overallScore:          analysis.overallScore      || 50,
      technicalAccuracy:     analysis.technicalAccuracy || 50,
      conceptDepth:          analysis.conceptDepth      || 50,
      clarity:               analysis.clarity           || 50,
      confidence:            analysis.confidence        || 50,
      resumeAlignment:       analysis.resumeAlignment   || 50,
      strengths:             analysis.strengths              || [],
      weaknesses:            analysis.weaknesses             || [],
      improvementSuggestions: analysis.improvementSuggestions || [],
      idealAnswerHint:       analysis.idealAnswerHint   || "",
      sessionScore:          session.score,
      answeredCount:         answered.length,
    });

  } catch (err) {
    console.error("❌ /answer error:", err.message);
    return res.status(500).json({ message: "Failed to evaluate answer. " + err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/interview/finalize
// ─────────────────────────────────────────────────────────────────────────────
router.post("/finalize", protect, async (req, res) => {
  try {
    const { sessionId, finalScore, feedback = {} } = req.body;

    if (!sessionId) return res.status(400).json({ message: "sessionId is required." });

    const session = await Interview.findById(sessionId);
    if (!session)  return res.status(404).json({ message: "Session not found." });

    session.score = finalScore !== undefined ? finalScore : session.score;
    if (feedback.strengths || feedback.weaknesses || feedback.suggestions) {
      session.feedback = {
        strengths:   feedback.strengths   || [],
        weaknesses:  feedback.weaknesses  || [],
        suggestions: feedback.suggestions || [],
      };
    }

    await session.save();
    console.log(`🏁 Session finalized: ${sessionId} | Score: ${session.score}`);
    return res.json({ success: true, sessionId: session._id, finalScore: session.score });

  } catch (err) {
    console.error("❌ /finalize error:", err.message);
    return res.status(500).json({ message: "Failed to finalize session." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/interview/user/:userId
// ─────────────────────────────────────────────────────────────────────────────
router.get("/user/:userId", protect, async (req, res) => {
  try {
    const interviews = await Interview.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    const history = interviews.map(iv => ({
      _id:           iv._id,
      date:          iv.createdAt,
      role:          iv.topic,
      stage:         iv.stage || "projects",
      score:         iv.score,
      questionCount: iv.questions.length,
      questions:     iv.questions.map(q => ({
        question:     q.question,
        answer:       q.answer,
        overallScore: q.overallScore ?? null,
      })),
    }));

    return res.json({ interviews: history });

  } catch (err) {
    console.error("❌ /user history error:", err.message);
    return res.status(500).json({ message: "Failed to fetch interview history." });
  }
});

module.exports = router;

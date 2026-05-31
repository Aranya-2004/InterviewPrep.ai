// routes/interview.services.js
const express = require("express");
const router  = express.Router();
const Groq    = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ─────────────────────────────────────────────────────────────────────────────
// Shared Helpers (Upgraded with Native JSON Mode support)
// ─────────────────────────────────────────────────────────────────────────────

function safeParseJSON(raw) {
  try {
    // Strips away rogue markdown backticks if any fallback models bypass instructions
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("❌ JSON Parse Failure on Raw String:", raw);
    throw e;
  }
}

async function groqChat(systemPrompt, userPrompt, maxTokens = 1024, forceJSON = false) {
  const options = {
    model: "llama-3.3-70b-versatile",
    max_tokens: maxTokens,
    temperature: 0.2, // Lower temperature enforces strict adherence to data schemas
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt   },
    ],
  };

  // Enforce native JSON containment at the hardware inference layer
  if (forceJSON) {
    options.response_format = { type: "json_object" };
  }

  const completion = await groq.chat.completions.create(options);
  return completion.choices[0].message.content.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/services/question
// Body: { resumeText, previousQuestions?, questionNumber?, interviewStage? }
// Returns: { question }
// ─────────────────────────────────────────────────────────────────────────────

router.post("/question", async (req, res) => {
  const { 
    resumeText = "", 
    previousQuestions = [], 
    questionNumber = 1,
    interviewStage = "projects" // Fallback default stage flag
  } = req.body;

  if (!resumeText.trim()) {
    return res.status(400).json({ error: "resumeText context data is required" });
  }

  const alreadyAsked = previousQuestions.length > 0
    ? `\nCRITICAL: Do NOT repeat or closely rephrase any of these already-asked questions:\n${previousQuestions.map((q, i) => `${i + 1}. ${q}`).join("\n")}\n`
    : "";

  // Dynamic Prompt Routing Matrix based on active Frontend simulation stage
  let stagePersonaInstructions = "";
  
  if (interviewStage === "projects") {
    stagePersonaInstructions = `You are a Principal Systems Architect checking code depth. 
Focus explicitly on deep-diving into the architectural details, database decisions, framework interactions, or optimization parameters of the candidate's custom development scale projects (e.g., their Waterborne Dashboard or AI Interview Platform). Ask about performance metrics or engineering trade-offs.`;
  } else if (interviewStage === "technical") {
    stagePersonaInstructions = `You are a Senior Core Software Engineer conducting a live technical evaluation. 
Focus strictly on foundational technical concepts listed in their profile: C++, Java, Python, SQL, React framework hooks, state management, REST API architecture, and standard core CS concepts (DSA, DBMS schemas, Operating Systems, or Computer Networks).`;
  } else if (interviewStage === "hr") {
    stagePersonaInstructions = `You are an Executive Tech Recruiter assessing cultural alignment, leadership tracking, and impact. 
Focus on behavioral questions following the STAR evaluation methodology. Source your queries directly from their leadership experiences, such as coordinating university hackathons (Binary Hackathon), managing tech fest corporate sponsorships (ESPEKTRO), or hitting rigorous academic milestones (GATE CS).`;
  } else {
    // Catch-all system fallback
    stagePersonaInstructions = `Focus on generating an intelligent, focused software engineering interview question based on the candidate's specialized technical profile data.`;
  }

  const systemPrompt = `You are an elite, world-class interviewer conducting a structured technical evaluation pipeline.
${stagePersonaInstructions}

Generate exactly ONE highly specific, contextual question. 
Never ask generic questions. Do not include introductory text, numbers, markdown styling, or conversational preamble. Return only the question text string.`;

  const userPrompt = `Candidate Resume Context Profile:\n${resumeText}\n${alreadyAsked}
Generate tailored, high-impact interview question #${questionNumber} for the current interview segment: "${interviewStage.toUpperCase()}".`;

  try {
    const question = await groqChat(systemPrompt, userPrompt, 256, false);
    return res.json({ question });
  } catch (err) {
    console.error("❌ /question routing failure:", err.message);
    return res.status(500).json({ error: "Failed to generate context question node" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/services/analyze
// Body: { resumeText?, question, answer }
// Returns: Scored Analysis Object
// ─────────────────────────────────────────────────────────────────────────────

router.post("/analyze", async (req, res) => {
  const { resumeText = "", question, answer } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: "Both question parameter and user answer text are required" });
  }

  const systemPrompt = `You are an expert technical assessor grading candidate interview responses.
Evaluate the candidate's answer meticulously across five granular performance categories on a scale from 0 to 100.
${resumeText ? "Cross-reference their explanation with their claimed resume text parameters to check for accuracy and technical consistency." : ""}

CRITICAL STRUCUTURAL RULES:
- You must return ONLY a clean JSON data object. No explanation text, no markdown block code wraps.
- Ensure lists like strengths and suggestions are populated with actionable, content-specific items. Do not leave fields unassigned.`;

  const userPrompt = `${resumeText ? `Candidate Resume Profile Context:\n${resumeText}\n\n` : ""}Interview Question Provided:\n${question}\n\nCandidate's Transcribed Answer:\n${answer}

Evaluate the text and populate this JSON data schema layout:
{
  "technicalAccuracy": <integer 0-100>,
  "conceptDepth": <integer 0-100>,
  "clarity": <integer 0-100>,
  "confidence": <integer 0-100>,
  "resumeAlignment": <integer 0-100>,
  "overallScore": <integer 0-100>,
  "strengths": ["Explicit sentence detailing what technical parameters they answered well."],
  "weaknesses": ["Explicit sentence detailing what details or engineering parameters they skipped or answered vaguely."],
  "improvementSuggestions": ["A direct, highly actionable suggestion or missing keyword tip to optimize this specific response style next time."],
  "idealAnswerHint": "A clear, concise, actionable summary of what a perfect engineering response to this specific question must incorporate."
}`;

  try {
    // Passing true triggers native JSON output mode configuration
    const raw = await groqChat(systemPrompt, userPrompt, 1200, true);
    const parsed = safeParseJSON(raw);
    return res.json(parsed);
  } catch (err) {
    console.error("❌ /analyze execution tracking exception:", err.message);
    
    // Safety fallback block strictly guarantees frontend maps stay active without crashing layout viewports
    return res.status(200).json({
      technicalAccuracy: 50,
      conceptDepth: 50,
      clarity: 50,
      confidence: 50,
      resumeAlignment: 50,
      overallScore: 50,
      strengths: ["Parsing fallback active. Server encountered processing load threshold conditions."],
      weaknesses: ["Unable to compile granular AI performance criteria metrics at this moment."],
      improvementSuggestions: ["Verify backend server console networking connections and token capacity."],
      idealAnswerHint: "Evaluation engine fallback triggered. Please retry submitting your answer block.",
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/services/resume-summary
// Body: { resumeText }
// Returns: structured resume snapshot shown to candidate before interview
// ─────────────────────────────────────────────────────────────────────────────

router.post("/resume-summary", async (req, res) => {
  const { resumeText = "" } = req.body;

  if (!resumeText.trim()) {
    return res.status(400).json({ error: "resumeText string is mandatory" });
  }

  const systemPrompt = `You are an expert automated resume parsing system. Parse user profile blocks with clean extraction logic.
Return strictly a valid JSON object structure. Do not embed markdown or conversational filler text.`;

  const userPrompt = `Parse the raw text data inside this file and isolate structural indicators matching this exact format schema:
{
  "name": "Candidate full name as string, or null",
  "topSkills": ["up to 8 most prominent technical skills isolated"],
  "experience": "1-2 sentence high impact summary of work experience or internships",
  "education": "Highest degree, field, and college metadata parameters, or null",
  "projects": ["up to 3 notable project names"],
  "yearsOfExp": <estimated integer value years, or null>,
  "seniorityLevel": "Junior | Mid | Senior | Lead | null"
}

Raw Resume Document Input:
${resumeText}`;

  try {
    const raw = await groqChat(systemPrompt, userPrompt, 512, true);
    const parsed = safeParseJSON(raw);
    return res.json(parsed);
  } catch (err) {
    console.error("❌ /resume-summary extraction failure:", err.message);
    return res.status(500).json({ error: "Failed to cleanly compile structured profile summaries" });
  }
});

module.exports = router;
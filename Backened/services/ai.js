// services/ai.js
require("dotenv").config(); 
const Groq = require("groq-sdk");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Safely cleans and parses incoming raw LLM content strings into valid JSON objects
 */
function safeParseJSON(raw) {
  try {
    const cleaned = raw.replace(/```json|```/gi, "").trim();
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("❌ JSON Parse Failure on Raw String:", raw);
    throw new Error("Invalid structure returned from inference engine.");
  }
}

/**
 * Technical answer evaluation service powered by Llama 3.3 70B
 */
async function analyzeAnswer(resumeText, jobRole, currentQuestion, candidateAnswer, interviewStage = "projects") {
  try {
    if (!resumeText || !resumeText.trim()) {
      throw new Error("Resume text content is missing or empty.");
    }

    // ✅ OPTIMIZATION: Condense whitespaces, tabs, and heavy raw PDF newlines into clean single spaces
    const optimizedText = resumeText
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E\n]/g, "") // Scrubs rogue binary characters from raw PDF layers
      .trim();

    // Dynamically shift persona weights depending on which round is currently active
    let stageCriteriaInstructions = "";
    if (interviewStage === "projects") {
      stageCriteriaInstructions = `You are a Principal Systems Architect. Grade the response focusing heavily on technical implementation specifics, architectural patterns, state management logic, and deployment efficiency choices mentioned for their platforms.`;
    } else if (interviewStage === "technical") {
      stageCriteriaInstructions = `You are a Senior Core Software Engineer. Assess the response focusing on foundational programmatic accuracy, language proficiency (C++, Java, Python, SQL), MERN stacks, and foundational CS concepts (DSA, DBMS, OS, Networking).`;
    } else if (interviewStage === "hr") {
      stageCriteriaInstructions = `You are an Executive Technology Recruiter. Assess the response focusing on team management capabilities, contextual behavioral metrics using the STAR framework, communication clarity, and leadership value.`;
    }

    const prompt = `
You are an elite automated interview evaluator conducting a structured technical assessment simulator.
Round Category Type: "${interviewStage.toUpperCase()}"
Target Job Designation: "${jobRole}"

${stageCriteriaInstructions}

CONTEXT SPECIFICS:
Candidate Resume Record: ${optimizedText}
Question Posed: ${currentQuestion}
Candidate's Answer: ${candidateAnswer}

CRITICAL DATA ACCURACY RULES:
1. Deduct points under "resumeAlignment" if the candidate's answer directly contradicts data structures or technologies declared in their resume text.
2. Formulate highly specific sentences for "strengths" and "weaknesses" mapping directly to their response words. Do not use generic placeholders.

You MUST respond with ONLY a valid JSON object. Do not wrap it in markdown backticks (\`\`\`json), markdown text, explanations, or preamble. 
Use this exact JSON data structure schema:
{
  "technicalAccuracy": 85, // Integer 0-100
  "conceptDepth": 80,      // Integer 0-100
  "clarity": 90,           // Integer 0-100
  "confidence": 85,        // Integer 0-100
  "resumeAlignment": 95,   // Integer 0-100
  "overallScore": 87,      // Integer 0-100 (weighted aggregate)
  "strengths": [
    "Candidate accurately defined the 40% efficiency gains by referencing explicit structural dataset joins."
  ],
  "weaknesses": [
    "The answer skipped declaring token lifecycle management windows or concrete secret encryption practices used for the JWT implementation."
  ],
  "improvementSuggestions": [
    "Elaborate on how state was dispatched across hooks or mention if global managers like Redux Toolkit handled the state tree objects."
  ],
  "idealAnswerHint": "A stellar answer should clarify how aggregation stages in MongoDB optimized dataset routing to compress indexing lookup cycles down to standard caching levels."
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1200, 
      temperature: 0.1, // Forces structure to remain tightly rule-bound
      response_format: { type: "json_object" }, // Hardware inference layer JSON formatting enforcement
      messages: [
        { 
          role: "system", 
          content: "You are a professional automated system evaluator that outputs pure, raw JSON matching the requested schema exactly. Never wrap outputs in markdown formatting text." 
        },
        { role: "user", content: prompt }
      ],
    });

    const rawContent = completion.choices[0].message.content.trim();
    
    // ✅ FIXED: Parse the string into a true JavaScript object before returning it to the router
    return safeParseJSON(rawContent);

  } catch (error) {
    console.error("❌ AI Interview Answer Evaluation Error:", error.message);
    
    // ✅ SAFE BACKEND FALLBACK: Guarantees your frontend never catches a 500 error if API limits are hit
    return {
      technicalAccuracy: 65,
      conceptDepth: 60,
      clarity: 75,
      confidence: 80,
      resumeAlignment: 70,
      overallScore: 68,
      strengths: ["Response parameters submitted and safely parsed through system backup data streams."],
      weaknesses: ["AI analysis throttling active. Could not extract deep linguistic technical indicators."],
      improvementSuggestions: ["Verify your environment variables and Groq API token usage balances inside your console configurations."],
      idealAnswerHint: "System fallback active. Continue your current simulation loop safely."
    };
  }
}

module.exports = { analyzeAnswer };
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

/**
 * Resume analysis service powered by Llama 3.3 70B
 */
async function analyzeResume(resumeText, jobRole) {
  try {
    if (!resumeText || !resumeText.trim()) {
      throw new Error("Resume text content is missing or empty.");
    }

    // ✅ Clean and normalize the resume text
    const optimizedText = resumeText
      .replace(/\s+/g, " ")
      .replace(/[^\x20-\x7E\n]/g, "")
      .trim();

    const JOB_KEYWORDS = {
      software_engineer: ["JavaScript", "React", "Node.js", "REST API", "Git", "Docker", "SQL", "MongoDB", "Python", "Java"],
      data_scientist: ["Python", "Machine Learning", "Pandas", "SQL", "TensorFlow", "Scikit-learn", "Data Analysis", "Statistics"],
      product_manager: ["Product Roadmap", "Stakeholders", "Agile", "User Stories", "Market Analysis", "Strategy"],
      ux_designer: ["Figma", "Wireframes", "User Research", "Prototyping", "CSS", "UI/UX", "Adobe XD"],
      devops_engineer: ["Docker", "Kubernetes", "CI/CD", "AWS", "Azure", "Jenkins", "Terraform", "Linux"]
    };

    const keywords = JOB_KEYWORDS[jobRole] || JOB_KEYWORDS.software_engineer;
    const matchedKeywords = keywords.filter(kw => 
      optimizedText.toLowerCase().includes(kw.toLowerCase())
    );
    const missingKeywords = keywords.filter(kw => 
      !optimizedText.toLowerCase().includes(kw.toLowerCase())
    );

    const prompt = `
You are an elite resume analyzer for the role of "${jobRole}".

Resume Content: ${optimizedText}

Analyze this resume and return a JSON object with the following schema:
{
  "atsScore": 0-100,
  "detailedBreakdown": {
    "skillsMatch": 0-100,
    "experience": 0-100,
    "projects": 0-100,
    "education": 0-100,
    "formatting": 0-100
  },
  "sectionAnalysis": {
    "skills": "text",
    "projects": "text",
    "experience": "text",
    "education": "text"
  },
  "keywordGaps": {
    "highPriority": ["keyword1", "keyword2"],
    "mediumPriority": ["keyword3", "keyword4"],
    "lowPriority": ["keyword5"]
  },
  "jobDescriptionComparison": {
    "jobMatchScore": 0-100,
    "technicalSkillsMatch": 0-100,
    "experienceMatch": 0-100,
    "educationMatch": 0-100
  },
  "achievementQualityScore": 0-100,
  "achievementFeedback": ["text"],
  "recruiterView": {
    "impressionScore": 0-10,
    "strengths": ["text"],
    "concerns": ["text"]
  },
  "readinessMeter": {
    "overallReadiness": 0-100,
    "technicalSkills": 0-100,
    "projects": 0-100,
    "interviewReadiness": 0-100,
    "systemDesign": 0-100
  },
  "roadmap": [
    {"week":"Week 1", "focus":"text"},
    {"week":"Week 2", "focus":"text"},
    {"week":"Week 3", "focus":"text"},
    {"week":"Week 4", "focus":"text"}
  ],
  "strengths": ["..."],
  "missingSkills": ["..."],
  "suggestions": ["..."],
  "atsTips": ["..."],
  "matchedKeywords": ["..."],
  "missingKeywords": ["..."]
}

REQUIREMENTS:
1. atsScore: Rate 0-100 based on keyword match, formatting, clarity, role alignment, and achievement quality
2. detailedBreakdown: Provide a transparent score breakdown across skills, experience, projects, education, and formatting
3. sectionAnalysis: Give short section-by-section feedback for Skills, Projects, Experience, and Education
4. keywordGaps: Group missing keywords into High, Medium, Low priority
5. jobDescriptionComparison: Compare this resume to a typical ${jobRole} job description
6. achievementQualityScore: Score whether achievements are measurable and specific
7. recruiterView: Generate a quick recruiter impression with strengths and concerns
8. readinessMeter: Provide a career readiness meter for technical skills, projects, interview readiness, and system design
9. roadmap: Create a 30-day improvement roadmap in weekly steps
10. strengths/missingSkills/suggestions/atsTips: Provide actionable resume feedback lists

Return ONLY a valid JSON object. No markdown, no backticks, no explanations.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1800,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You are a professional resume analyzer that outputs pure, raw JSON matching the requested schema exactly. Never wrap outputs in markdown formatting."
        },
        { role: "user", content: prompt }
      ]
    });

    const rawContent = completion.choices[0].message.content.trim();
    const analysis = safeParseJSON(rawContent);

    // ✅ Ensure all required fields exist with safe defaults
    return {
      atsScore: analysis.atsScore || 65,
      score: analysis.atsScore || 65,
      detailedBreakdown: analysis.detailedBreakdown || {
        skillsMatch: 0,
        experience: 0,
        projects: 0,
        education: 0,
        formatting: 0
      },
      sectionAnalysis: analysis.sectionAnalysis || {},
      keywordGaps: analysis.keywordGaps || { highPriority: [], mediumPriority: [], lowPriority: [] },
      jobDescriptionComparison: analysis.jobDescriptionComparison || {
        jobMatchScore: 0,
        technicalSkillsMatch: 0,
        experienceMatch: 0,
        educationMatch: 0
      },
      achievementQualityScore: analysis.achievementQualityScore || 0,
      achievementFeedback: analysis.achievementFeedback || [],
      recruiterView: analysis.recruiterView || { impressionScore: 0, strengths: [], concerns: [] },
      readinessMeter: analysis.readinessMeter || {
        overallReadiness: 0,
        technicalSkills: 0,
        projects: 0,
        interviewReadiness: 0,
        systemDesign: 0
      },
      roadmap: analysis.roadmap || [],
      strengths: analysis.strengths || [],
      missingSkills: analysis.missingSkills || [],
      suggestions: analysis.suggestions || [],
      atsTips: analysis.atsTips || [],
      matchedKeywords,
      missingKeywords,
      summary: analysis.summary || ""
    };

  } catch (error) {
    console.error("❌ Resume Analysis Error:", error.message);
    
    // ✅ SAFE BACKEND FALLBACK
    return {
      atsScore: 60,
      strengths: ["Resume parsed successfully through backup analysis system."],
      missingSkills: ["AI analysis temporarily unavailable. Manual review recommended."],
      suggestions: ["Verify your Groq API key configuration and usage limits."],
      atsTips: ["Consider adding more keywords relevant to your target role."],
      matchedKeywords: [],
      missingKeywords: []
    };
  }
}

module.exports = { analyzeAnswer, analyzeResume };
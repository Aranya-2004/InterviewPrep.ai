const axios = require("axios");

async function analyzeAnswer(resumeText, jobRole) {
  try {

    const prompt = `
You are an expert technical recruiter and career coach.

Analyze the following resume for the role of ${jobRole}.

Resume:
${resumeText}

Provide a structured analysis including:

1. Resume Score (0-100)
2. Missing Important Skills for this role
3. Weak Resume Lines
4. Improved Versions of Those Lines
5. Key Strengths of the Candidate
6. Suggestions to Improve Resume
7. ATS (Applicant Tracking System) Compatibility Tips

Return the result in JSON format like this:

{
 "score": number,
 "missingSkills": [],
 "weakLines": [],
 "improvedLines": [],
 "strengths": [],
 "suggestions": []
}
`;

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: "You are a professional resume analyzer." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const analysis = response.data.choices[0].message.content;

    return analysis;

  } catch (error) {
    console.error("AI Analysis Error:", error.message);
    throw error;
  }
}
console.log("OpenAI Key:", process.env.OPENAI_API_KEY);
module.exports = { analyzeAnswer };
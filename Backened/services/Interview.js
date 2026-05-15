const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


// ==========================
// GENERATE QUESTION
// ==========================

router.post("/question", async (req, res) => {

  const { topic, difficulty } = req.body;

  try {

    const completion = await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: "You are a professional technical interviewer."
        },
        {
          role: "user",
          content: `Generate ONE ${difficulty} level interview question about ${topic}. Only return the question.`
        }
      ]

    });

    const question =
      completion.choices[0].message.content.trim();

    res.json({ question });

  } catch (err) {

    console.error("Question Error:", err);

    res.json({
      question: "Explain the difference between stack and queue."
    });

  }

});


// ==========================
// AI ANSWER ANALYSIS
// ==========================

router.post("/analyze", async (req, res) => {

  const { question, answer } = req.body;

  try {

    const completion = await groq.chat.completions.create({

      model: "llama-3.3-70b-versatile",

      messages: [
        {
          role: "system",
          content: "You are a senior technical interviewer."
        },
        {
          role: "user",
          content: `
Question:
${question}

Candidate Answer:
${answer}

Evaluate the answer and return ONLY JSON:

{
"technicalAccuracy": score (0-100),
"conceptDepth": score (0-100),
"clarity": score (0-100),
"confidence": score (0-100),
"overallScore": score (0-100),
"strengths": [],
"weaknesses": [],
"improvementSuggestions": []
}
`
        }
      ]

    });

    const response = completion.choices[0].message.content;

    const parsed = JSON.parse(response);

    res.json(parsed);

  } catch (err) {

    console.error("AI Analysis Error:", err);

    res.status(500).json({
      technicalAccuracy: 60,
      conceptDepth: 60,
      clarity: 60,
      confidence: 60,
      overallScore: 60,
      strengths: [],
      weaknesses: [],
      improvementSuggestions: []
    });

  }

});

module.exports = router;

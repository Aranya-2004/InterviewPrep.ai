const express = require("express");
const router = express.Router();
const Groq = require("groq-sdk");
const axios = require("axios");
const User = require("../models/user");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});


// ==========================
// START INTERVIEW SESSION
// ==========================

router.post("/start", async (req, res) => {

  try {

    const { userId, jobRole, topics } = req.body;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const newSession = {
      date: new Date(),
      role: jobRole,
      score: 0,
      topics
    };

    user.interviews.push(newSession);

    await user.save();

    res.json({
      success: true,
      session: newSession
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({ message: "Server error" });

  }

});


// ==========================
// GENERATE AI QUESTION (GROQ)
// ==========================

router.post("/question", async (req, res) => {

  try {

    const { topic, difficulty } = req.body;

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

    const question = completion.choices[0].message.content.trim();

    res.json({ question });

  } catch (error) {

    console.error("AI Question Error:", error);

    res.status(500).json({
      question: "Explain the difference between stack and queue."
    });

  }

});


// ==========================
// SUBMIT ANSWER FOR ANALYSIS
// ==========================

router.post("/answer", async (req, res) => {

  try {

    const { userId, answer, sessionId } = req.body;

    // Send answer to AI analyzer service
    const aiResp = await axios.post(
      "http://localhost:5001/analyze",
      { answer }
    );

    const analysis = aiResp.data.analysis;

    const user = await User.findById(userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    const session = user.interviews.id(sessionId);

    if (!session)
      return res.status(404).json({ message: "Session not found" });

    session.score = Math.floor(Math.random() * 30 + 70);

    await user.save();

    res.json({
      success: true,
      analysis,
      updatedSession: session
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});


// ==========================
// GET USER INTERVIEWS
// ==========================

router.get("/user/:userId", async (req, res) => {

  try {

    const user = await User.findById(req.params.userId);

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json({
      interviews: user.interviews
    });

  } catch (err) {

    console.error(err);

    res.status(500).json({
      message: "Server error"
    });

  }

});

module.exports = router;

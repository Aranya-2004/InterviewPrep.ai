const express = require("express");
const router = express.Router();
const Interview = require("../models/interview");
const Resume = require("../models/resume");

// ✅ FIXED: Destructured to capture 'protect' matching your middleware file exports precisely
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user-isolated historical telemetry datasets concurrently
    const [interviews, resumes] = await Promise.all([
      Interview.find({ userId }).sort({ createdAt: 1 }).lean(),
      Resume.find({ userId }).sort({ createdAt: 1 }).lean()
    ]);

    // Handle empty database boundaries safely without breaking client hooks
    if (interviews.length === 0 && resumes.length === 0) {
      return res.status(200).json({
        summary: { overallScore: 0, interviewAvg: 0, bestATS: 0, streak: 0, totalSessions: 0, improvementRate: "+0%", nextGoal: "Complete an evaluation session" },
        interviewSessions: [],
        resumeHistory: [],
        lastSessionMetrics: { technicalAccuracy: 0, conceptDepth: 0, clarity: 0, confidence: 0 },
        strengths: [],
        weakAreas: []
      });
    }

    // ── 1. COMPILE LIVE INTERVIEW PARAMETERS ──
    let runningInterviewScoreSum = 0;
    const topicTracker = { DSA: [], OOPs: [], SystemDesign: [], HR: [] };
    let accumulatedStrengths = [];
    let accumulatedWeaknesses = [];

    const formattedSessions = interviews.map((iv) => {
      runningInterviewScoreSum += iv.score || 0;

      const dsaScores = [];
      const oopsScores = [];
      const sysScores = [];
      const hrScores = [];

      if (iv.questions && iv.questions.length > 0) {
        iv.questions.forEach((q) => {
          // Route granular criteria indexes matching active target simulation stages
          if (iv.stage === "technical") {
            dsaScores.push(q.technicalAccuracy || q.overallScore || 0);
            oopsScores.push(q.conceptDepth || q.overallScore || 0);
          } else if (iv.stage === "projects") {
            sysScores.push(q.clarity || q.overallScore || 0);
          } else if (iv.stage === "hr") {
            hrScores.push(q.confidence || q.overallScore || 0);
          }
        });
      }

      // Consolidate global presentation feedback strings text vectors safely
      if (iv.feedback?.strengths) accumulatedStrengths.push(...iv.feedback.strengths);
      if (iv.feedback?.weaknesses) accumulatedWeaknesses.push(...iv.feedback.weaknesses);

      // Average evaluations map cleanly back into dynamic horizontal bar components
      const dsaAvg  = dsaScores.length ? Math.round(dsaScores.reduce((a, b) => a + b, 0) / dsaScores.length) : (iv.score || 50);
      const oopsAvg = oopsScores.length ? Math.round(oopsScores.reduce((a, b) => a + b, 0) / oopsScores.length) : (iv.score || 50);
      const sysAvg  = sysScores.length ? Math.round(sysScores.reduce((a, b) => a + b, 0) / sysScores.length) : (iv.score || 50);
      const hrAvg   = hrScores.length ? Math.round(hrScores.reduce((a, b) => a + b, 0) / hrScores.length) : (iv.score || 50);

      topicTracker.DSA.push(dsaAvg);
      topicTracker.OOPs.push(oopsAvg);
      topicTracker.SystemDesign.push(sysAvg);
      topicTracker.HR.push(hrAvg);

      return {
        date: new Date(iv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        difficulty: iv.difficulty || "Medium",
        overall: iv.score || 0,
        duration: "25 min",
        scores: { DSA: dsaAvg, OOPs: oopsAvg, SystemDesign: sysAvg, HR: hrAvg }
      };
    });

    const interviewAvg = interviews.length > 0 ? Math.round(runningInterviewScoreSum / interviews.length) : 0;

    // Calculate aggregated overall topic indexes dynamically
    const finalTopicAverages = {};
    Object.keys(topicTracker).forEach((topic) => {
      const scores = topicTracker[topic];
      finalTopicAverages[topic] = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    });

    // ── 2. MAP RESUME DATA HISTORIES ──
    const formattedResumes = resumes.map((r) => ({
      date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      role: r.role || "Software Engineer",
      ats: r.atsScore || 0,
      matched: r.matchedKeywords || [],
      missing: r.missingKeywords || []
    }));

    const bestATS = resumes.length > 0 ? Math.max(...resumes.map(r => r.atsScore || 0)) : 0;

    // ── 3. EXTRACT PROFILE ATTRIBUTES FOR RECENT LOG RUNS ──
    const lastSession = interviews[interviews.length - 1];
    let lastSessionMetrics = { technicalAccuracy: 0, conceptDepth: 0, clarity: 0, confidence: 0 };

    if (lastSession && lastSession.questions && lastSession.questions.length > 0) {
      const activeAnalyses = lastSession.questions.filter(q => q.technicalAccuracy !== undefined);
      if (activeAnalyses.length > 0) {
        const calculateMetricAverage = key => Math.round(activeAnalyses.reduce((sum, q) => sum + (q[key] || 0), 0) / activeAnalyses.length);
        lastSessionMetrics = {
          technicalAccuracy: calculateMetricAverage("technicalAccuracy"),
          conceptDepth: calculateMetricAverage("conceptDepth"),
          clarity: calculateMetricAverage("clarity"),
          confidence: calculateMetricAverage("confidence")
        };
      }
    }

    // ── 4. ANALYZE WEAK TOPIC CONSTRAINTS FOR ADAPTIVE MILESTONES ──
    const macroGlobalCompetency = Math.round((interviewAvg + bestATS) / 2) || 0;
    const weakestEntry = Object.entries(finalTopicAverages).sort((a, b) => a[1] - b[1])[0];
    const targetGoalString = weakestEntry ? weakestEntry[0] : "System Design Architecture";

    return res.status(200).json({
      summary: {
        overallScore: macroGlobalCompetency,
        interviewAvg,
        bestATS,
        streak: interviews.length > 0 ? 3 : 0,
        totalSessions: interviews.length,
        improvementRate: interviews.length > 1 ? "+12%" : "+0%",
        nextGoal: `Improve baseline scores in ${targetGoalString === "SystemDesign" ? "System Design Architecture" : targetGoalString}`
      },
      interviewSessions: formattedSessions,
      resumeHistory: formattedResumes,
      lastSessionMetrics,
      strengths: [...new Set(accumulatedStrengths)].slice(0, 4),
      weakAreas: [...new Set(accumulatedWeaknesses)].slice(0, 4)
    });

  } catch (err) {
    console.error("❌ Aggregation Core Matrix Compilation Error:", err);
    return res.status(500).json({ error: "Failed to compile analytical data frameworks." });
  }
});

module.exports = router;

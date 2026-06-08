const express = require("express");
const router = express.Router();
const Interview = require("../models/interview");
const Resume = require("../models/resume");
const { protect } = require("../middleware/authMiddleware");

router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user-isolated datasets concurrently
    const [interviews, resumes] = await Promise.all([
      Interview.find({ userId }).sort({ createdAt: 1 }).lean(),
      Resume.find({ userId }).sort({ createdAt: 1 }).lean()
    ]);

    // ── 1. COMPILING TOTAL REVIEWS & AGGREGATES ──
    const interviewCount = interviews.length;
    const resumeCount    = resumes.length;

    const interviewScores = interviewCount > 0 ? interviews.map(i => i.score || 0) : [0];
    const interviewAvg    = interviewCount > 0 ? Math.round(interviewScores.reduce((a, b) => a + b, 0) / interviewCount) : 0;
    const maxATS          = resumeCount > 0 ? Math.max(...resumes.map(r => r.atsScore || 0)) : 0;
    const overallScore    = Math.round((interviewAvg + maxATS) / 2) || 0;

    // ── 2. ISOLATING TOPIC SCORES FIELDS ──
    const topicTracker = { DSA: [], OOPs: [], SystemDesign: [], HR: [] };
    interviews.forEach(iv => {
      if (!iv.questions) return;
      iv.questions.forEach(q => {
        if (iv.stage === "technical") {
          topicTracker.DSA.push(q.technicalAccuracy || q.overallScore || 0);
          topicTracker.OOPs.push(q.conceptDepth || q.overallScore || 0);
        } else if (iv.stage === "projects") {
          topicTracker.SystemDesign.push(q.clarity || q.overallScore || 0);
        } else if (iv.stage === "hr") {
          topicTracker.HR.push(q.confidence || q.overallScore || 0);
        }
      });
    });

    const computeTopicAvg = (arr, fallback) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : fallback;

    const topicScores = [
      { name: "DSA", val: computeTopicAvg(topicTracker.DSA, interviewAvg || 50), color: "#3b82f6" },
      { name: "OOPs", val: computeTopicAvg(topicTracker.OOPs, interviewAvg || 50), color: "#0d9488" },
      { name: "System Design", val: computeTopicAvg(topicTracker.SystemDesign, interviewAvg || 50), color: "#f59e0b" },
      { name: "HR Round", val: computeTopicAvg(topicTracker.HR, interviewAvg || 50), color: "#ec4899" }
    ];

    // ── 3. COMPILING RECENT ACTIVITY TIMELINES ──
    const historyPool = [];
    interviews.forEach(iv => {
      historyPool.push({
        type: "interview",
        label: `Completed ${iv.topic} (${iv.stage})`,
        date: new Date(iv.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: iv.score || 0,
        color: "#0d9488",
        rawDate: iv.createdAt
      });
    });

    resumes.forEach(r => {
      historyPool.push({
        type: "resume",
        label: `Scanned Resume for ${r.role}`,
        date: new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        score: r.atsScore || 0,
        color: "#3b82f6",
        rawDate: r.createdAt
      });
    });

    // Sort recent history pool descending
    const recentActivity = historyPool.sort((a, b) => b.rawDate - a.rawDate).slice(0, 4);

    // ── 4. CHRONOLOGICAL CHART PROJECTIONS ──
    // Build running history metrics nodes matching last 8 updates for Area Chart graphics
    const chartTimeline = interviews.slice(-8).map((iv, idx) => ({
      week: `Session ${idx + 1}`,
      score: iv.score || 0
    }));

    const finalChartTimeline = chartTimeline.length ? chartTimeline : [{ week: "Round 1", score: 0 }];

    return res.status(200).json({
      stats: [
        { label: "Overall Competency", value: overallScore, suffix: "%", color: "#6366f1", delta: "Live Rating" },
        { label: "Interview Average", value: interviewAvg, suffix: "%", color: "#0d9488", delta: `${interviewCount} rounds` },
        { label: "Best ATS Tracker", value: maxATS, suffix: "%", color: "#f59e0b", delta: `${resumeCount} uploads` },
        { label: "Studio Progress", value: interviewCount, suffix: " sessions", color: "#ec4899", delta: "Active practice" }
      ],
      recentActivity,
      topicScores,
      chartTimeline: finalChartTimeline
    });

  } catch (err) {
    console.error("❌ Dashboard Compilation Pipeline Exception:", err.message);
    return res.status(500).json({ error: "Failed to cleanly gather dashboard telemetry." });
  }
});

module.exports = router;
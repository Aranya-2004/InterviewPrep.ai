import React, { useState, useEffect, useRef } from "react";

const TOPICS = [
  { id: "DSA", label: "Data Structures & Algorithms", icon: "⚡", color: "#6ee7b7" },
  { id: "OOPs", label: "Object Oriented Programming", icon: "🧩", color: "#93c5fd" },
  { id: "SystemDesign", label: "System Design", icon: "🏗️", color: "#fca5a5" },
  { id: "HR", label: "HR & Behavioral", icon: "🤝", color: "#fde68a" },
];

const DIFFICULTY_CONFIG = {
  Easy:   { time: 120, label: "Easy",   color: "#6ee7b7", bg: "#064e3b" },
  Medium: { time: 180, label: "Medium", color: "#fde68a", bg: "#78350f" },
  Hard:   { time: 300, label: "Hard",   color: "#fca5a5", bg: "#7f1d1d" },
};

const PHASES = { SETUP: "setup", INTERVIEW: "interview", ANALYZING: "analyzing", RESULT: "result" };

const MOCK_QUESTIONS = {
  DSA:          { Easy: "What is a stack and how does it differ from a queue?", Medium: "Explain how you would find the longest common subsequence of two strings.", Hard: "Design an algorithm to solve the travelling salesman problem with optimization." },
  OOPs:         { Easy: "What are the four pillars of Object-Oriented Programming?", Medium: "Explain the difference between abstract classes and interfaces with examples.", Hard: "How would you design a plugin architecture using OOP principles like open/closed principle?" },
  SystemDesign: { Easy: "What is the difference between SQL and NoSQL databases?", Medium: "Design a URL shortener service like bit.ly at scale.", Hard: "Design a distributed message queue system like Kafka, handling millions of messages per second." },
  HR:           { Easy: "Tell me about yourself and why you are interested in this role.", Medium: "Describe a time you faced a conflict in a team and how you resolved it.", Hard: "Tell me about a time you had to make a critical decision with incomplete information under pressure." },
};

export default function Interview() {
  const [difficulty, setDifficulty] = useState("Medium");
  const [phase, setPhase] = useState(PHASES.SETUP);
  const [currentStep, setCurrentStep] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState(Array(4).fill(""));
  const [submitted, setSubmitted] = useState(Array(4).fill(false));
  const [timer, setTimer] = useState(0);
  const [summary, setSummary] = useState(null);
  const [animIn, setAnimIn] = useState(true);
  const answerRefs = useRef([]);
  const timerRef = useRef(null);
  const maxTime = DIFFICULTY_CONFIG[difficulty].time;

  // Timer
  useEffect(() => {
    if (phase === PHASES.INTERVIEW) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [phase]);

  // Reset timer when step changes
  useEffect(() => {
    setTimer(0);
  }, [currentStep]);

  const fetchQuestion = async (topic, diff) => {
    try {
      const res = await fetch("http://localhost:5001/api/interview/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, difficulty: diff }),
      });
      const data = await res.json();
      return data.question;
    } catch {
      return MOCK_QUESTIONS[topic][diff];
    }
  };

  const startInterview = async () => {
    setPhase(PHASES.INTERVIEW);
    setCurrentStep(0);
    setSubmitted(Array(4).fill(false));
    setAnswers(Array(4).fill(""));
    setSummary(null);

    const qs = await Promise.all(
      TOPICS.map(t => fetchQuestion(t.id, difficulty))
    );
    setQuestions(qs);
    setAnimIn(true);
  };

  const handleAnswerChange = (i, val) => {
    const updated = [...answers];
    updated[i] = val;
    setAnswers(updated);
  };

  const handleSubmit = (i) => {
    if (!answers[i].trim()) return;
    const updated = [...submitted];
    updated[i] = true;
    setSubmitted(updated);
  };

  const canEndInterview = submitted.some(Boolean);

  const endInterview = async () => {
    clearInterval(timerRef.current);
    setPhase(PHASES.ANALYZING);

    const payload = {
      questions: TOPICS.map((t, i) => ({ topic: t.id, question: questions[i], answer: answers[i] })),
    };

    try {
      const res = await fetch("http://localhost:5001/api/interview/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setSummary(data);
    } catch {
      // Mock analysis for demonstration
      setSummary({
        technicalAccuracy: 78,
        conceptDepth: 65,
        clarity: 82,
        confidence: 70,
        overallScore: 74,
        strengths: ["Good grasp of core concepts", "Clear communication style", "Structured problem-solving approach"],
        weaknesses: ["Needs more depth on system scalability", "Could improve on edge case handling"],
        improvementSuggestions: ["Practice LeetCode hard problems daily", "Read 'Designing Data-Intensive Applications'", "Mock interview with peers weekly"],
        topicScores: { DSA: 80, OOPs: 75, SystemDesign: 65, HR: 85 },
      });
    }
    setPhase(PHASES.RESULT);
  };

  const formatTime = (t) => {
    const m = Math.floor(t / 60);
    const s = t % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const timerPct = Math.min((timer / maxTime) * 100, 100);
  const timerColor = timerPct > 80 ? "#fca5a5" : timerPct > 50 ? "#fde68a" : "#6ee7b7";

  // ─── Styles ────────────────────────────────────────────────────────────────
  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }

    body { background: #f0f4ff; }

    .iv-root {
      min-height: 100vh;
      background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #fce8f3 100%);
      font-family: 'Syne', sans-serif;
      color: #1e293b;
      padding: 2rem 1rem;
    }

    .iv-wrap {
      max-width: 820px;
      margin: 0 auto;
    }

    .iv-header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    .iv-header h1 {
      font-size: 2.6rem;
      font-weight: 800;
      letter-spacing: -1px;
      background: linear-gradient(135deg, #0ea5e9, #6366f1, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .iv-header p {
      color: #94a3b8;
      font-family: 'Space Mono', monospace;
      font-size: 0.78rem;
      margin-top: 0.4rem;
      letter-spacing: 2px;
      text-transform: uppercase;
    }

    /* CARD */
    .iv-card {
      background: #ffffff;
      border: 1px solid #dde4f5;
      border-radius: 20px;
      padding: 2rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 24px rgba(99,120,220,.08);
    }

    /* SETUP */
    .diff-row {
      display: flex;
      gap: 1rem;
      margin-top: 1rem;
    }
    .diff-btn {
      flex: 1;
      padding: 1rem;
      border-radius: 12px;
      border: 2px solid transparent;
      background: #f1f5f9;
      cursor: pointer;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      transition: all 0.2s;
      text-align: center;
      color: #1e293b;
    }
    .diff-btn:hover { transform: translateY(-2px); }
    .diff-btn.active-easy   { border-color: #10b981; color: #059669; background: rgba(16,185,129,.08); }
    .diff-btn.active-medium { border-color: #f59e0b; color: #d97706; background: rgba(245,158,11,.08); }
    .diff-btn.active-hard   { border-color: #ef4444; color: #dc2626; background: rgba(239,68,68,.08); }
    .diff-btn.inactive      { color: #94a3b8; }
    .diff-time {
      font-family: 'Space Mono', monospace;
      font-size: 0.7rem;
      margin-top: 0.25rem;
      opacity: 0.7;
    }

    .topics-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .topic-chip {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      background: #f1f5f9;
      border-radius: 10px;
      padding: 0.75rem 1rem;
      font-size: 0.88rem;
      font-weight: 600;
      color: #1e293b;
    }
    .topic-dot { width: 8px; height: 8px; border-radius: 50%; }

    .start-btn {
      width: 100%;
      margin-top: 1.75rem;
      padding: 1.1rem;
      border-radius: 14px;
      border: none;
      background: linear-gradient(135deg, #6ee7b7 0%, #93c5fd 100%);
      color: #0a0a0f;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      font-size: 1.1rem;
      cursor: pointer;
      letter-spacing: 1px;
      transition: all 0.2s;
    }
    .start-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(110,231,183,.3); }

    /* INTERVIEW */
    .iv-progress-bar {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
    }
    .iv-prog-seg {
      height: 4px;
      flex: 1;
      border-radius: 4px;
      background: #e2e8f0;
      transition: background 0.4s;
    }
    .iv-prog-seg.done { background: #10b981; }
    .iv-prog-seg.active { background: #6366f1; }

    .iv-topic-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.4rem 1rem;
      border-radius: 999px;
      font-family: 'Space Mono', monospace;
      font-size: 0.72rem;
      font-weight: 700;
      letter-spacing: 1px;
      margin-bottom: 1rem;
    }

    .iv-timer-wrap {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 1.5rem;
    }
    .iv-timer-track {
      flex: 1;
      height: 6px;
      background: #e2e8f0;
      border-radius: 6px;
      overflow: hidden;
    }
    .iv-timer-fill {
      height: 100%;
      border-radius: 6px;
      transition: width 1s linear, background 0.5s;
    }
    .iv-timer-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.85rem;
      min-width: 44px;
      text-align: right;
    }

    .question-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .q-tab {
      padding: 0.5rem 1rem;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      color: #94a3b8;
      font-family: 'Space Mono', monospace;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;
    }
    .q-tab.active { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,.07); }
    .q-tab.done   { border-color: #10b981; color: #059669; background: rgba(16,185,129,.07); }

    .question-block {
      background: #f8faff;
      border-left: 3px solid #6366f1;
      border-radius: 0 12px 12px 0;
      padding: 1.25rem 1.5rem;
      margin-bottom: 1.25rem;
    }
    .question-block p {
      font-size: 1.05rem;
      line-height: 1.65;
      color: #1e293b;
    }

    .answer-area {
      width: 100%;
      background: #f8fafc;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      color: #1e293b;
      font-family: 'Syne', sans-serif;
      font-size: 0.95rem;
      padding: 1rem 1.25rem;
      resize: vertical;
      min-height: 130px;
      outline: none;
      transition: border-color 0.2s;
    }
    .answer-area:focus { border-color: #6366f1; }
    .answer-area:disabled { opacity: 0.6; cursor: not-allowed; }

    .action-row {
      display: flex;
      gap: 0.75rem;
      margin-top: 1rem;
      align-items: center;
    }
    .submit-btn {
      padding: 0.75rem 1.75rem;
      border-radius: 10px;
      border: none;
      background: linear-gradient(135deg, #6ee7b7, #34d399);
      color: #0a0a0f;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(110,231,183,.3); }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .submitted-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: #6ee7b7;
      font-family: 'Space Mono', monospace;
      font-size: 0.8rem;
    }

    .nav-row {
      display: flex;
      gap: 0.75rem;
      margin-top: 1.5rem;
    }
    .nav-btn {
      flex: 1;
      padding: 0.85rem;
      border-radius: 12px;
      border: 1.5px solid #e2e8f0;
      background: #f8fafc;
      color: #1e293b;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      cursor: pointer;
      font-size: 0.92rem;
      transition: all 0.2s;
    }
    .nav-btn:hover:not(:disabled) { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,.05); }
    .nav-btn:disabled { opacity: 0.35; cursor: not-allowed; }
    .end-btn {
      flex: 1;
      padding: 0.85rem;
      border-radius: 12px;
      border: none;
      background: linear-gradient(135deg, #fca5a5, #f87171);
      color: #0a0a0f;
      font-family: 'Syne', sans-serif;
      font-weight: 800;
      cursor: pointer;
      font-size: 0.92rem;
      transition: all 0.2s;
    }
    .end-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(252,165,165,.3); }
    .end-btn:disabled { opacity: 0.35; cursor: not-allowed; }

    /* ANALYZING */
    .analyzing-wrap {
      text-align: center;
      padding: 3rem 1rem;
    }
    .pulse-ring {
      width: 80px; height: 80px;
      border-radius: 50%;
      border: 3px solid #6366f1;
      margin: 0 auto 1.5rem;
      animation: pulse 1.4s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.15); opacity: 0.5; }
    }
    .analyzing-wrap h3 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #6366f1;
    }
    .analyzing-wrap p {
      color: #94a3b8;
      font-family: 'Space Mono', monospace;
      font-size: 0.78rem;
      margin-top: 0.5rem;
      letter-spacing: 1px;
    }

    /* RESULT */
    .result-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .score-circle {
      width: 110px; height: 110px;
      border-radius: 50%;
      border: 5px solid #10b981;
      margin: 0 auto 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      background: rgba(16,185,129,.06);
    }
    .score-circle .big-score {
      font-size: 2rem;
      font-weight: 800;
      color: #059669;
      line-height: 1;
    }
    .score-circle .score-label {
      font-family: 'Space Mono', monospace;
      font-size: 0.6rem;
      color: #94a3b8;
      letter-spacing: 1px;
    }

    .metric-row {
      margin-bottom: 1rem;
    }
    .metric-label {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }
    .metric-track {
      height: 8px;
      background: #e2e8f0;
      border-radius: 8px;
      overflow: hidden;
    }
    .metric-fill {
      height: 100%;
      border-radius: 8px;
      transition: width 1.2s cubic-bezier(.22,1,.36,1);
    }

    .topic-scores-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 1.25rem;
    }
    .topic-score-card {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
    }
    .topic-score-card .t-name {
      font-size: 0.72rem;
      font-family: 'Space Mono', monospace;
      color: #94a3b8;
      letter-spacing: 1px;
      margin-bottom: 0.5rem;
    }
    .topic-score-card .t-score {
      font-size: 1.6rem;
      font-weight: 800;
    }

    .feedback-section h5 {
      font-size: 0.78rem;
      font-family: 'Space Mono', monospace;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 0.75rem;
    }
    .feedback-section ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .feedback-section li {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      font-size: 0.9rem;
      line-height: 1.5;
    }
    .feedback-section li::before {
      content: '';
      width: 6px; height: 6px;
      border-radius: 50%;
      margin-top: 0.45rem;
      flex-shrink: 0;
    }
    .strength li::before  { background: #6ee7b7; }
    .weakness li::before  { background: #fca5a5; }
    .suggest li::before   { background: #93c5fd; }

    .restart-btn {
      width: 100%;
      padding: 1rem;
      border-radius: 12px;
      border: 1.5px solid #1e1e2e;
      background: transparent;
      color: #e2e8f0;
      font-family: 'Syne', sans-serif;
      font-weight: 700;
      font-size: 1rem;
      cursor: pointer;
      margin-top: 1.5rem;
      transition: all 0.2s;
    }
    .restart-btn:hover { border-color: #6ee7b7; color: #6ee7b7; }

    .section-title {
      font-size: 0.7rem;
      font-family: 'Space Mono', monospace;
      letter-spacing: 2px;
      text-transform: uppercase;
      color: #4a5568;
      margin-bottom: 1rem;
    }
    .divider {
      height: 1px;
      background: #1e1e2e;
      margin: 1.5rem 0;
    }

    @media (max-width: 560px) {
      .topics-grid { grid-template-columns: 1fr; }
      .topic-scores-grid { grid-template-columns: 1fr 1fr; }
      .iv-header h1 { font-size: 2rem; }
    }
  `;

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{css}</style>
      <div className="iv-root">
        <div className="iv-wrap">

          <div className="iv-header">
            <h1> Interview Studio</h1>
            <p>Adaptive · Analytical · Real-time Feedback</p>
          </div>

          {/* ── SETUP ────────────────────────────────────── */}
          {phase === PHASES.SETUP && (
            <div className="iv-card">
              <p className="section-title">Select Difficulty</p>
              <div className="diff-row">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                  <div
                    key={key}
                    className={`diff-btn ${difficulty === key ? `active-${key.toLowerCase()}` : "inactive"}`}
                    onClick={() => setDifficulty(key)}
                  >
                    {key}
                    <div className="diff-time">⏱ {cfg.time / 60} min / question</div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              <p className="section-title">Topics Covered</p>
              <div className="topics-grid">
                {TOPICS.map(t => (
                  <div className="topic-chip" key={t.id}>
                    <div className="topic-dot" style={{ background: t.color }} />
                    <span>{t.icon} {t.label}</span>
                  </div>
                ))}
              </div>

              <button className="start-btn" onClick={startInterview}>
                Begin Interview →
              </button>
            </div>
          )}

          {/* ── INTERVIEW ────────────────────────────────── */}
          {phase === PHASES.INTERVIEW && questions.length > 0 && (
            <div className="iv-card">
              {/* Progress segments */}
              <div className="iv-progress-bar">
                {TOPICS.map((_, i) => (
                  <div
                    key={i}
                    className={`iv-prog-seg ${i < currentStep ? "done" : i === currentStep ? "active" : ""}`}
                  />
                ))}
              </div>

              {/* Topic badge */}
              <div
                className="iv-topic-badge"
                style={{ background: `${TOPICS[currentStep].color}15`, color: TOPICS[currentStep].color, border: `1px solid ${TOPICS[currentStep].color}40` }}
              >
                {TOPICS[currentStep].icon} {TOPICS[currentStep].label}
                <span style={{ background: DIFFICULTY_CONFIG[difficulty].color, color: "#0a0a0f", borderRadius: 6, padding: "1px 7px", marginLeft: 6 }}>
                  {difficulty}
                </span>
              </div>

              {/* Timer */}
              <div className="iv-timer-wrap">
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.72rem", color: "#4a5568", letterSpacing: 1 }}>TIME</span>
                <div className="iv-timer-track">
                  <div
                    className="iv-timer-fill"
                    style={{ width: `${timerPct}%`, background: timerColor }}
                  />
                </div>
                <span className="iv-timer-label" style={{ color: timerColor }}>{formatTime(timer)}</span>
              </div>

              {/* Question tabs */}
              <div className="question-tabs">
                {TOPICS.map((t, i) => (
                  <button
                    key={i}
                    className={`q-tab ${i === currentStep ? "active" : submitted[i] ? "done" : ""}`}
                    onClick={() => setCurrentStep(i)}
                  >
                    {submitted[i] ? "✓ " : ""}{t.id}
                  </button>
                ))}
              </div>

              {/* Question display */}
              <div className="question-block">
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", color: "#4a5568", marginBottom: "0.6rem", letterSpacing: 1 }}>
                  Q{currentStep + 1} / 4
                </p>
                <p>{questions[currentStep] || "Loading question..."}</p>
              </div>

              {/* Answer */}
              <textarea
                className="answer-area"
                rows={5}
                value={answers[currentStep]}
                placeholder={submitted[currentStep] ? "Answer submitted ✓" : "Type your answer here..."}
                onChange={e => handleAnswerChange(currentStep, e.target.value)}
                disabled={submitted[currentStep]}
              />

              <div className="action-row">
                {submitted[currentStep] ? (
                  <div className="submitted-badge">
                    <span style={{ fontSize: "1.1rem" }}>✅</span> Answer submitted
                  </div>
                ) : (
                  <button
                    className="submit-btn"
                    onClick={() => handleSubmit(currentStep)}
                    disabled={!answers[currentStep].trim()}
                  >
                    Submit Answer
                  </button>
                )}
              </div>

              {/* Navigation */}
              <div className="nav-row">
                <button
                  className="nav-btn"
                  onClick={() => setCurrentStep(s => Math.max(0, s - 1))}
                  disabled={currentStep === 0}
                >
                  ← Prev
                </button>
                <button
                  className="nav-btn"
                  onClick={() => setCurrentStep(s => Math.min(3, s + 1))}
                  disabled={currentStep === 3}
                >
                  Next →
                </button>
                <button
                  className="end-btn"
                  onClick={endInterview}
                  disabled={!canEndInterview}
                >
                  End Interview
                </button>
              </div>

              {!canEndInterview && (
                <p style={{ textAlign: "center", color: "#4a5568", fontFamily: "'Space Mono', monospace", fontSize: "0.7rem", marginTop: "0.75rem" }}>
                  Submit at least one answer to end
                </p>
              )}
            </div>
          )}

          {/* Loading questions */}
          {phase === PHASES.INTERVIEW && questions.length === 0 && (
            <div className="iv-card analyzing-wrap">
              <div className="pulse-ring" />
              <h3>Generating Questions</h3>
              <p>PREPARING YOUR INTERVIEW...</p>
            </div>
          )}

          {/* ── ANALYZING ────────────────────────────────── */}
          {phase === PHASES.ANALYZING && (
            <div className="iv-card analyzing-wrap">
              <div className="pulse-ring" />
              <h3>Analysing Responses</h3>
              <p>AI IS EVALUATING YOUR ANSWERS...</p>
            </div>
          )}

          {/* ── RESULT ───────────────────────────────────── */}
          {phase === PHASES.RESULT && summary && (
            <div className="iv-card">
              <div className="result-header">
                <div className="score-circle">
                  <span className="big-score">{summary.overallScore}</span>
                  <span className="score-label">OVERALL</span>
                </div>
                <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Interview Complete</h2>
                <p style={{ color: "#4a5568", fontFamily: "'Space Mono', monospace", fontSize: "0.75rem", marginTop: "0.25rem" }}>
                  {difficulty.toUpperCase()} · 4 QUESTIONS
                </p>
              </div>

              {/* Per-topic scores */}
              <p className="section-title">Topic Breakdown</p>
              <div className="topic-scores-grid">
                {TOPICS.map(t => (
                  <div className="topic-score-card" key={t.id} style={{ borderTop: `3px solid ${t.color}` }}>
                    <div className="t-name">{t.id}</div>
                    <div className="t-score" style={{ color: t.color }}>{summary.topicScores?.[t.id] ?? "—"}%</div>
                  </div>
                ))}
              </div>

              <div className="divider" />

              {/* Metrics */}
              <p className="section-title">Performance Metrics</p>
              {[
                { key: "technicalAccuracy", label: "Technical Accuracy", color: "#93c5fd" },
                { key: "conceptDepth",      label: "Concept Depth",      color: "#a78bfa" },
                { key: "clarity",           label: "Clarity",            color: "#fde68a" },
                { key: "confidence",        label: "Confidence",         color: "#6ee7b7" },
              ].map(m => (
                <div className="metric-row" key={m.key}>
                  <div className="metric-label">
                    <span>{m.label}</span>
                    <span style={{ color: m.color, fontFamily: "'Space Mono', monospace" }}>{summary[m.key]}%</span>
                  </div>
                  <div className="metric-track">
                    <div className="metric-fill" style={{ width: `${summary[m.key]}%`, background: m.color }} />
                  </div>
                </div>
              ))}

              <div className="divider" />

              {/* Feedback */}
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div className="feedback-section strength">
                  <h5 style={{ color: "#6ee7b7" }}>✦ Strengths</h5>
                  <ul>{summary.strengths?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="feedback-section weakness">
                  <h5 style={{ color: "#fca5a5" }}>✦ Weaknesses</h5>
                  <ul>{summary.weaknesses?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
                <div className="feedback-section suggest">
                  <h5 style={{ color: "#93c5fd" }}>✦ Suggestions</h5>
                  <ul>{summary.improvementSuggestions?.map((s, i) => <li key={i}>{s}</li>)}</ul>
                </div>
              </div>

              <button className="restart-btn" onClick={() => setPhase(PHASES.SETUP)}>
                ↩ Start New Interview
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
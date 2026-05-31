import React, { useState, useEffect, useRef, useCallback } from "react";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const API = `${BASE_URL}/api/interview`;

const DIFFICULTY_CONFIG = {
  Easy:   { time: 120, label: "Easy",   color: "#6ee7b7" },
  Medium: { time: 180, label: "Medium", color: "#fde68a" },
  Hard:   { time: 300, label: "Hard",   color: "#fca5a5" },
};

const PHASES = {
  SETUP:      "setup",
  STARTING:   "starting",
  INTERVIEW:  "interview",
  SUBMITTING: "submitting",
  ANALYZING:  "analyzing",
  RESULT:     "result",
};

const STAGES = [
  { id: "projects",  label: "1. Project Deep-Dive",    icon: "🚀", desc: "Architecture evaluations on custom platform builds." },
  { id: "technical", label: "2. Technical Skill Drill", icon: "⚙️", desc: "MERN, structural languages, core algorithms, and data structures." },
  { id: "hr",        label: "3. HR Behavioral Round",   icon: "👔", desc: "Leadership tracking, STAR format questions, and background audits." },
];

const METRIC_KEYS = [
  { key: "technicalAccuracy", label: "Technical Accuracy", color: "#93c5fd" },
  { key: "conceptDepth",      label: "Concept Depth",      color: "#a78bfa" },
  { key: "clarity",           label: "Clarity",            color: "#fde68a" },
  { key: "confidence",        label: "Confidence",         color: "#6ee7b7" },
  { key: "resumeAlignment",   label: "Resume Alignment",   color: "#fb923c" },
];

export default function Interview() {
  const [userId, setUserId]             = useState(null);
  const [difficulty, setDifficulty]     = useState("Medium");
  const [jobRole, setJobRole]           = useState("");
  const [resumeText, setResumeText]     = useState("");
  const [resumeFile, setResumeFile]     = useState(null);
  const [extracting, setExtracting]     = useState(false);
  const [dragOver, setDragOver]         = useState(false);
  const fileInputRef                    = useRef(null);
  const [currentStage, setCurrentStage] = useState("projects");
  const [isListening, setIsListening]   = useState(false);
  const [isSpeaking, setIsSpeaking]     = useState(false);
  // FIX: never access window.* at module scope — init lazily in useEffect
  const synthRef                        = useRef(null);
  const recognitionRef                  = useRef(null);
  const [phase, setPhase]               = useState(PHASES.SETUP);
  const [sessionId, setSessionId]       = useState(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions]                = useState(4);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [answer, setAnswer]             = useState("");
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [allResults, setAllResults]     = useState([]);
  const [sessionScore, setSessionScore] = useState(0);
  const [summary, setSummary]           = useState(null);
  const [timer, setTimer]               = useState(0);
  const timerRef                        = useRef(null);
  const [error, setError]               = useState("");

  // Computed — defined before return (no ReferenceError)
  const wordCount  = answer.trim() ? answer.trim().split(/\s+/).length : 0;
  const maxTime    = DIFFICULTY_CONFIG[difficulty].time;
  const timerPct   = Math.min((timer / maxTime) * 100, 100);
  const timerColor = timerPct > 80 ? "#fca5a5" : timerPct > 50 ? "#fde68a" : "#6ee7b7";
  const resumeOk   = resumeText.trim().length >= 100 && !extracting;

  // ── Init speechSynthesis safely after mount ──
  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // ── Get userId from localStorage ──
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        const id = parsed?._id || parsed?.id;
        if (id) setUserId(id);
        else setError("User identity missing. Please log in again.");
      } else {
        setError("No active session. Please log in.");
      }
    } catch {
      setError("Failed to read user session.");
    }
  }, []);

  // ── Speech recognition ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const t = e.results[e.results.length - 1][0].transcript;
      setAnswer(prev => (prev + " " + t).trim());
    };
    rec.onend  = () => setIsListening(false);
    rec.onerror = () => setIsListening(false);
    recognitionRef.current = rec;
  }, [questionNumber]);

  // ── Timer ──
  useEffect(() => {
    if (phase === PHASES.INTERVIEW) {
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [phase, questionNumber]);

  useEffect(() => {
    setTimer(0);
    if (synthRef.current) { synthRef.current.cancel(); setIsSpeaking(false); }
  }, [questionNumber]);

  const formatTime = t => {
    const m = Math.floor(t / 60), s = t % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const toggleVoiceCapture = () => {
    if (!recognitionRef.current) { setError("Speech recognition not supported in this browser."); return; }
    if (isListening) { recognitionRef.current.stop(); }
    else { setIsListening(true); recognitionRef.current.start(); }
  };

  const handleReadAloud = (text) => {
    if (!synthRef.current) return;
    if (isSpeaking) { synthRef.current.cancel(); setIsSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    synthRef.current.speak(u);
  };

  // ── File extraction ──
  const extractText = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    setExtracting(true); setError(""); setResumeText("");
    setResumeFile({ name: file.name, size: file.size });
    try {
      if (["txt", "md", "rtf"].includes(ext)) {
        setResumeText(await file.text());
      } else if (ext === "pdf") {
        if (!window.pdfjsLib) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
            s.onload = res; s.onerror = rej; document.head.appendChild(s);
          });
          window.pdfjsLib.GlobalWorkerOptions.workerSrc =
            "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        }
        const pdf = await window.pdfjsLib.getDocument({ data: await file.arrayBuffer() }).promise;
        let text = "";
        for (let p = 1; p <= pdf.numPages; p++) {
          const content = await (await pdf.getPage(p)).getTextContent();
          text += content.items.map(i => i.str).join(" ") + "\n";
        }
        setResumeText(text.trim());
      } else if (ext === "docx") {
        if (!window.mammoth) {
          await new Promise((res, rej) => {
            const s = document.createElement("script");
            s.src = "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js";
            s.onload = res; s.onerror = rej; document.head.appendChild(s);
          });
        }
        const result = await window.mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
        setResumeText(result.value.trim());
      } else {
        setError("Unsupported file type. Use PDF, DOCX, or TXT.");
        setResumeFile(null);
      }
    } catch (err) {
      setError("Could not read file: " + err.message);
      setResumeFile(null);
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleFileInput = e => extractText(e.target.files[0]);
  const handleDrop = e => { e.preventDefault(); setDragOver(false); extractText(e.dataTransfer.files[0]); };

  const getToken = () => localStorage.getItem("token");

  // ── API calls ──
  const startInterview = async () => {
    setError("");
    const token = getToken();
    if (!token)  { setError("Authentication token missing. Please log in."); return; }
    if (!userId) { setError("Cannot start without a User ID. Please log in."); return; }
    if (!resumeText.trim()) { setError("Please upload your resume first."); return; }

    setPhase(PHASES.STARTING);
    try {
      const res  = await fetch(`${API}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ userId, jobRole: jobRole || "Software Engineer", resumeText, interviewStage: currentStage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to start session.");
      setSessionId(data.sessionId);
      setAllResults([]);
      setQuestionNumber(0);
      setPhase(PHASES.INTERVIEW);
      await fetchNextQuestion(data.sessionId, 1, []);
    } catch (err) {
      setError(err.message);
      setPhase(PHASES.SETUP);
    }
  };

  const fetchNextQuestion = async (sid, qNum, previousQuestions = []) => {
    setLoadingQuestion(true); setAnswer(""); setCurrentQuestion("");
    try {
      const res  = await fetch(`${API}/question`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, sessionId: sid, resumeText, questionNumber: qNum, interviewStage: currentStage, previousQuestions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to get question.");
      setCurrentQuestion(data.question);
      setQuestionNumber(qNum);
    } catch (err) {
      setError("Could not load question: " + err.message);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const submitAnswer = async () => {
    if (!answer.trim()) return;
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    setError("");
    setPhase(PHASES.SUBMITTING);
    try {
      const res  = await fetch(`${API}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, sessionId, question: currentQuestion, answer, resumeText }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to submit answer.");

      // FIX: backend now returns fields flat (not nested under data.analysis)
      const updatedResults = [...allResults, {
        question:          currentQuestion,
        answer,
        overallScore:      data.overallScore      || 50,
        technicalAccuracy: data.technicalAccuracy || 50,
        conceptDepth:      data.conceptDepth      || 50,
        clarity:           data.clarity           || 50,
        confidence:        data.confidence        || 50,
        resumeAlignment:   data.resumeAlignment   || 50,
        strengths:         data.strengths              || [],
        weaknesses:        data.weaknesses             || [],
        improvementSuggestions: data.improvementSuggestions || [],
        idealAnswerHint:   data.idealAnswerHint   || "",
      }];

      setAllResults(updatedResults);
      setSessionScore(data.sessionScore || 50);

      if (questionNumber >= totalQuestions) {
        setPhase(PHASES.ANALYZING);
        setTimeout(() => { buildSummary(updatedResults, data.sessionScore || 50); setPhase(PHASES.RESULT); }, 1800);
      } else {
        setPhase(PHASES.INTERVIEW);
        await fetchNextQuestion(sessionId, questionNumber + 1, updatedResults.map(r => r.question));
      }
    } catch (err) {
      setError(err.message);
      setPhase(PHASES.INTERVIEW);
    }
  };

  const skipQuestion = async () => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    if (questionNumber >= totalQuestions) {
      if (allResults.length === 0) { setError("Answer at least one question before ending."); return; }
      setPhase(PHASES.ANALYZING);
      setTimeout(() => { buildSummary(allResults, sessionScore); setPhase(PHASES.RESULT); }, 1800);
    } else {
      setPhase(PHASES.INTERVIEW);
      await fetchNextQuestion(sessionId, questionNumber + 1, allResults.map(r => r.question));
    }
  };

  const endEarly = () => {
    if (recognitionRef.current && isListening) recognitionRef.current.stop();
    if (allResults.length === 0) { setError("Answer at least one question before ending."); return; }
    setPhase(PHASES.ANALYZING);
    setTimeout(() => { buildSummary(allResults, sessionScore); setPhase(PHASES.RESULT); }, 1800);
  };

  const buildSummary = async (results, score) => {
    if (!results.length) return;
    const avg     = key => Math.round(results.reduce((s, r) => s + (r[key] || 0), 0) / results.length);
    const flatten = key => results.flatMap(r => r[key] || []);
    const compiled = {
      overallScore:           score || avg("overallScore"),
      technicalAccuracy:      avg("technicalAccuracy"),
      conceptDepth:           avg("conceptDepth"),
      clarity:                avg("clarity"),
      confidence:             avg("confidence"),
      resumeAlignment:        avg("resumeAlignment"),
      strengths:              [...new Set(flatten("strengths"))].slice(0, 4),
      weaknesses:             [...new Set(flatten("weaknesses"))].slice(0, 4),
      improvementSuggestions: [...new Set(flatten("improvementSuggestions"))].slice(0, 4),
      perQuestion:            results,
    };
    setSummary(compiled);
    try {
      const res = await fetch(`${API}/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${getToken()}` },
        body: JSON.stringify({ userId, sessionId, finalScore: compiled.overallScore, feedback: { strengths: compiled.strengths, weaknesses: compiled.weaknesses, suggestions: compiled.improvementSuggestions } }),
      });
      if (!res.ok) throw new Error("Finalize failed.");
    } catch (err) {
      console.error("❌ Finalize error:", err.message);
    }
  };

  const resetAll = () => {
    setPhase(PHASES.SETUP); setSessionId(null); setCurrentQuestion(""); setAnswer("");
    setAllResults([]); setSummary(null); setQuestionNumber(0); setError("");
    setTimer(0); setResumeText(""); setResumeFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4ff; }
    .iv-root { min-height: 100vh; background: linear-gradient(135deg, #f0f4ff 0%, #e8f0fe 50%, #fce8f3 100%); font-family: 'Syne', sans-serif; color: #1e293b; padding: 2rem 1rem 4rem; }
    .iv-wrap { max-width: 860px; margin: 0 auto; }
    .iv-header { text-align: center; margin-bottom: 2.5rem; }
    .iv-header h1 { font-size: 2.6rem; font-weight: 800; letter-spacing: -1px; background: linear-gradient(135deg, #0ea5e9, #6366f1, #ec4899); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .iv-header p { color: #94a3b8; font-family: 'Space Mono', monospace; font-size: 0.78rem; margin-top: 0.4rem; letter-spacing: 2px; text-transform: uppercase; }
    .iv-card { background: #fff; border: 1px solid #dde4f5; border-radius: 20px; padding: 2rem; margin-bottom: 1.5rem; box-shadow: 0 4px 24px rgba(99,120,220,.08); }
    .section-title { font-size: 0.68rem; font-family: 'Space Mono', monospace; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 0.85rem; }
    .divider { height: 1px; background: #e8eef8; margin: 1.5rem 0; }
    .matrix-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem; }
    .matrix-card { border: 1.5px solid #dde4f5; border-radius: 14px; padding: 1.1rem; cursor: pointer; background: #f8fafc; transition: all 0.25s; text-align: left; width: 100%; }
    .matrix-card:hover { transform: translateY(-2px); border-color: #6366f1; background: #fff; }
    .matrix-card.active { border-color: #6366f1; background: rgba(99,102,241,0.05); box-shadow: 0 4px 14px rgba(99,102,241,0.1); }
    .matrix-title { font-weight: 700; font-size: 0.95rem; color: #0f172a; display: flex; align-items: center; gap: 0.4rem; }
    .matrix-card.active .matrix-title { color: #4f46e5; }
    .matrix-desc { font-size: 0.75rem; color: #64748b; line-height: 1.5; margin-top: 0.4rem; }
    .diff-row { display: flex; gap: 0.75rem; margin-top: 0.5rem; }
    .diff-btn { flex: 1; padding: 0.9rem 0.5rem; border-radius: 12px; border: 2px solid transparent; background: #f1f5f9; cursor: pointer; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 0.95rem; transition: all 0.2s; text-align: center; color: #1e293b; }
    .diff-btn:hover { transform: translateY(-2px); }
    .diff-btn.active-easy   { border-color: #10b981; color: #059669; background: rgba(16,185,129,.08); }
    .diff-btn.active-medium { border-color: #f59e0b; color: #d97706; background: rgba(245,158,11,.08); }
    .diff-btn.active-hard   { border-color: #ef4444; color: #dc2626; background: rgba(239,68,68,.08); }
    .diff-btn.inactive { color: #94a3b8; }
    .diff-time { font-family: 'Space Mono', monospace; font-size: 0.68rem; margin-top: 0.25rem; opacity: 0.7; }
    .field-input { width: 100%; padding: 0.85rem 1rem; border: 1.5px solid #dde4f5; border-radius: 12px; font-family: 'Syne', sans-serif; font-size: 0.92rem; color: #1e293b; background: #f8fafc; outline: none; transition: border-color 0.2s; }
    .field-input:focus { border-color: #6366f1; background: #fff; }
    .upload-zone { border: 2px dashed #c7d2fe; border-radius: 16px; padding: 2.5rem 2rem; text-align: center; cursor: pointer; background: #f8faff; transition: all 0.25s; display: block; }
    .upload-zone:hover, .upload-zone.drag-over { border-color: #6366f1; background: #eef0ff; transform: translateY(-2px); }
    .upload-zone input { display: none; }
    .upload-icon-wrap { width: 64px; height: 64px; border-radius: 16px; background: linear-gradient(135deg, #e0e7ff, #c7d2fe); display: flex; align-items: center; justify-content: center; margin: 0 auto 1rem; font-size: 1.75rem; }
    .upload-zone h4 { font-size: 1rem; font-weight: 700; color: #1e293b; margin-bottom: 0.4rem; }
    .upload-zone p { font-size: 0.82rem; color: #94a3b8; line-height: 1.5; }
    .formats { display: flex; gap: 0.4rem; justify-content: center; margin-top: 0.85rem; flex-wrap: wrap; }
    .format-pill { padding: 0.2rem 0.65rem; border-radius: 999px; font-family: 'Space Mono', monospace; font-size: 0.65rem; font-weight: 700; border: 1px solid; }
    .file-uploaded { display: flex; align-items: center; gap: 1rem; background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 1rem 1.25rem; margin-bottom: 0.75rem; }
    .file-icon { font-size: 2rem; }
    .file-info { flex: 1; }
    .file-name { font-weight: 700; font-size: 0.92rem; color: #1e293b; }
    .file-meta { font-family: 'Space Mono', monospace; font-size: 0.68rem; color: #059669; margin-top: 0.2rem; }
    .file-remove { padding: 0.4rem 0.85rem; border-radius: 8px; border: 1px solid #fca5a5; background: transparent; color: #dc2626; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 0.8rem; cursor: pointer; }
    .file-remove:hover { background: #fee2e2; }
    .resume-preview { background: #f8fafc; border-radius: 10px; padding: 1rem; font-size: 0.78rem; color: #64748b; line-height: 1.6; max-height: 100px; overflow: hidden; }
    .preview-label { font-family: 'Space Mono', monospace; font-size: 0.62rem; color: #94a3b8; letter-spacing: 1px; margin-bottom: 0.4rem; }
    .extracting-bar { display: flex; align-items: center; gap: 0.75rem; background: #eff6ff; border: 1px solid #93c5fd; border-radius: 10px; padding: 1rem 1.25rem; font-size: 0.88rem; color: #1d4ed8; }
    .extract-spinner { width: 18px; height: 18px; border: 2px solid #93c5fd; border-top-color: #2563eb; border-radius: 50%; animation: spin 0.7s linear infinite; flex-shrink: 0; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .start-btn { width: 100%; margin-top: 1.75rem; padding: 1.1rem; border-radius: 14px; border: none; background: linear-gradient(135deg, #6ee7b7 0%, #93c5fd 100%); color: #0a0a0f; font-family: 'Syne', sans-serif; font-weight: 800; font-size: 1.05rem; cursor: pointer; letter-spacing: 1px; transition: all 0.2s; }
    .start-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(110,231,183,.3); }
    .start-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .error-bar { background: rgba(252,165,165,.15); border: 1px solid #fca5a5; border-radius: 10px; padding: 0.75rem 1rem; font-family: 'Space Mono', monospace; font-size: 0.78rem; color: #dc2626; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem; }
    .iv-progress-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
    .iv-prog-label { font-family: 'Space Mono', monospace; font-size: 0.72rem; color: #94a3b8; }
    .iv-progress-dots { display: flex; gap: 0.4rem; }
    .iv-dot { width: 28px; height: 6px; border-radius: 6px; background: #e2e8f0; }
    .iv-dot.done { background: #10b981; }
    .iv-dot.active { background: #6366f1; }
    .iv-timer-wrap { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .iv-timer-track { flex: 1; height: 5px; background: #e2e8f0; border-radius: 6px; overflow: hidden; }
    .iv-timer-fill { height: 100%; border-radius: 6px; transition: width 1s linear, background 0.5s; }
    .iv-timer-label { font-family: 'Space Mono', monospace; font-size: 0.82rem; min-width: 40px; text-align: right; }
    .question-block { background: linear-gradient(135deg, #f8faff, #f0f4ff); border-left: 3px solid #6366f1; border-radius: 0 14px 14px 0; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; position: relative; }
    .q-number { font-family: 'Space Mono', monospace; font-size: 0.68rem; color: #6366f1; letter-spacing: 1px; margin-bottom: 0.6rem; }
    .question-text { font-size: 1.05rem; line-height: 1.7; color: #1e293b; padding-right: 5rem; }
    .audio-inline-group { position: absolute; top: 1.1rem; right: 1.25rem; display: flex; gap: 0.4rem; }
    .audio-trigger-btn { display: inline-flex; align-items: center; justify-content: center; width: 34px; height: 34px; border-radius: 8px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-size: 0.95rem; transition: all 0.2s; }
    .audio-trigger-btn:hover { background: #f1f5f9; }
    .audio-trigger-btn.active-speaking, .audio-trigger-btn.active-listening { border-color: #ef4444; background: #fee2e2; }
    @keyframes audio-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }
    .audio-trigger-btn.active-listening { animation: audio-pulse 1.6s infinite; }
    .answer-label { font-family: 'Space Mono', monospace; font-size: 0.62rem; color: #94a3b8; letter-spacing: 1px; margin-bottom: 0.5rem; text-transform: uppercase; }
    .answer-area { width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; color: #1e293b; font-family: 'Syne', sans-serif; font-size: 0.95rem; padding: 1rem 1.25rem; resize: vertical; min-height: 140px; outline: none; transition: border-color 0.2s; line-height: 1.65; }
    .answer-area:focus { border-color: #6366f1; background: #fff; }
    .word-count { font-family: 'Space Mono', monospace; font-size: 0.68rem; color: #94a3b8; text-align: right; margin-top: 0.4rem; }
    .action-row { display: flex; gap: 0.75rem; margin-top: 1.25rem; align-items: center; flex-wrap: wrap; }
    .submit-btn { padding: 0.8rem 2rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #6ee7b7, #34d399); color: #0a0a0f; font-family: 'Syne', sans-serif; font-weight: 700; cursor: pointer; font-size: 0.92rem; transition: all 0.2s; }
    .submit-btn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 4px 20px rgba(110,231,183,.35); }
    .submit-btn:disabled { opacity: 0.4; cursor: not-allowed; }
    .skip-btn { padding: 0.8rem 1.25rem; border-radius: 10px; border: 1.5px solid #e2e8f0; background: transparent; color: #94a3b8; font-family: 'Syne', sans-serif; font-weight: 600; cursor: pointer; font-size: 0.88rem; transition: all 0.2s; }
    .skip-btn:hover { border-color: #94a3b8; color: #64748b; }
    .end-btn { margin-left: auto; padding: 0.8rem 1.5rem; border-radius: 10px; border: none; background: linear-gradient(135deg, #fca5a5, #f87171); color: #0a0a0f; font-family: 'Syne', sans-serif; font-weight: 700; cursor: pointer; font-size: 0.88rem; }
    .user-bubble-container { background: #f8fafc; border-left: 3px solid #cbd5e1; border-radius: 4px 12px 12px 4px; padding: 1.1rem; margin: 0.75rem 0 1.25rem; }
    .user-bubble-title { font-family: 'Space Mono', monospace; font-size: 0.65rem; color: #94a3b8; letter-spacing: 1px; margin-bottom: 0.35rem; }
    .user-bubble-body { font-size: 0.9rem; color: #475569; line-height: 1.6; font-style: italic; }
    .answered-list { margin-top: 1.5rem; }
    .answered-item { background: #f8fafc; border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 0.6rem; border-left: 3px solid #10b981; display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .answered-q { font-size: 0.82rem; color: #475569; flex: 1; }
    .answered-score { font-family: 'Space Mono', monospace; font-size: 0.8rem; color: #10b981; font-weight: 700; }
    .analyzing-wrap { text-align: center; padding: 3rem 1rem; }
    .pulse-ring { width: 80px; height: 80px; border-radius: 50%; border: 3px solid #6366f1; margin: 0 auto 1.5rem; animation: pulse 1.4s infinite; }
    @keyframes pulse { 0%,100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.5; } }
    .analyzing-wrap h3 { font-size: 1.4rem; font-weight: 700; color: #6366f1; }
    .analyzing-wrap p { color: #94a3b8; font-family: 'Space Mono', monospace; font-size: 0.78rem; margin-top: 0.5rem; letter-spacing: 1px; }
    .result-header { text-align: center; margin-bottom: 2rem; }
    .score-circle { width: 116px; height: 116px; border-radius: 50%; border: 5px solid #10b981; margin: 0 auto 1rem; display: flex; align-items: center; justify-content: center; flex-direction: column; background: rgba(16,185,129,.06); }
    .score-circle .big-score { font-size: 2.2rem; font-weight: 800; color: #059669; line-height: 1; }
    .score-circle .score-label { font-family: 'Space Mono', monospace; font-size: 0.6rem; color: #94a3b8; }
    .metric-row { margin-bottom: 1rem; }
    .metric-label { display: flex; justify-content: space-between; font-size: 0.84rem; font-weight: 600; margin-bottom: 0.4rem; }
    .metric-track { height: 8px; background: #e2e8f0; border-radius: 8px; overflow: hidden; }
    .metric-fill { height: 100%; border-radius: 8px; transition: width 1.2s cubic-bezier(.22,1,.36,1); }
    .qa-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; margin-bottom: 1rem; border-left: 4px solid #6366f1; position: relative; }
    .qa-card .qa-q { font-size: 0.95rem; font-weight: 700; color: #1e293b; line-height: 1.5; margin-bottom: 0.6rem; padding-right: 3rem; }
    .qa-scores { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
    .qa-score-pill { padding: 0.25rem 0.65rem; border-radius: 999px; font-family: 'Space Mono', monospace; font-size: 0.68rem; font-weight: 700; }
    .qa-hint { font-size: 0.85rem; color: #475569; border-top: 1px solid #e8eef8; padding-top: 0.75rem; margin-top: 0.75rem; line-height: 1.6; }
    .feedback-section { background: rgba(248,250,252,0.6); border: 1px solid #e2e8f0; border-radius: 16px; padding: 1.5rem; }
    .feedback-section h5 { font-size: 0.72rem; font-family: 'Space Mono', monospace; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 0.85rem; }
    .feedback-section ul { list-style: none; display: flex; flex-direction: column; gap: 0.65rem; padding-left: 0; }
    .feedback-section li { position: relative; padding-left: 1.5rem; font-size: 0.88rem; line-height: 1.6; color: #475569; }
    .strength h5 { color: #059669; }
    .strength li::before { content: "✓"; position: absolute; left: 0; color: #059669; font-weight: 700; }
    .weakness h5 { color: #dc2626; }
    .weakness li::before { content: "✕"; position: absolute; left: 0; color: #dc2626; font-weight: 700; }
    .suggest h5 { color: #2563eb; }
    .suggest li::before { content: "✦"; position: absolute; left: 0; color: #4f46e5; font-weight: 600; }
    .restart-btn { width: 100%; padding: 1rem; border-radius: 12px; border: 1.5px solid #dde4f5; background: transparent; color: #475569; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 1.5rem; transition: all 0.2s; }
    .restart-btn:hover { border-color: #6366f1; color: #6366f1; background: rgba(99,102,241,.04); }
    .skeleton { background: linear-gradient(90deg, #f1f5f9 25%, #e8eef8 50%, #f1f5f9 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 8px; }
    @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
    .qa-toggle-btn { position: absolute; top: 1.1rem; right: 1.25rem; border: none; background: none; font-size: 1.2rem; color: #94a3b8; cursor: pointer; padding: 0.2rem; }
    @media (max-width: 560px) {
      .iv-header h1 { font-size: 2rem; }
      .matrix-grid { grid-template-columns: 1fr; }
      .diff-row { flex-direction: column; }
      .action-row { flex-direction: column; align-items: stretch; }
      .end-btn { margin-left: 0; }
    }
  `;

  const QuestionResultCard = ({ resultItem }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="qa-card">
        <div className="qa-q">{resultItem.question}</div>
        <button className="qa-toggle-btn" type="button" onClick={() => setIsOpen(!isOpen)}
          style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▾</button>
        <div className="qa-scores">
          {[
            { label: "Overall",   val: resultItem.overallScore,     color: "#6ee7b7" },
            { label: "Technical", val: resultItem.technicalAccuracy, color: "#93c5fd" },
            { label: "Depth",     val: resultItem.conceptDepth,      color: "#a78bfa" },
            { label: "Clarity",   val: resultItem.clarity,           color: "#fde68a" },
            { label: "Resume ✓",  val: resultItem.resumeAlignment,   color: "#fb923c" },
          ].map(s => (
            <span key={s.label} className="qa-score-pill"
              style={{ background: `${s.color}20`, color: s.color, border: `1px solid ${s.color}40` }}>
              {s.label}: {s.val}%
            </span>
          ))}
        </div>
        {isOpen && (
          <div style={{ marginTop: "1rem" }}>
            <div className="user-bubble-container">
              <div className="user-bubble-title">YOUR ANSWER</div>
              <div className="user-bubble-body">"{resultItem.answer || "No response provided."}"</div>
            </div>
            {resultItem.idealAnswerHint && (
              <div className="qa-hint">💡 <strong>Suggestion:</strong> {resultItem.idealAnswerHint}</div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{css}</style>
      <div className="iv-root">
        <div className="iv-wrap">
          <div className="iv-header">
            <h1>Interview Studio</h1>
            <p>Resume-powered · Real-time AI Feedback</p>
          </div>

          {error && <div className="error-bar"><span>⚠</span> {error}</div>}

          {/* ── SETUP ── */}
          {(phase === PHASES.SETUP || phase === PHASES.STARTING) && (
            <div className="iv-card">
              <p className="section-title">Select Simulation Stage</p>
              <div className="matrix-grid">
                {STAGES.map(stg => (
                  <button key={stg.id} type="button"
                    className={`matrix-card ${currentStage === stg.id ? "active" : ""}`}
                    onClick={() => phase === PHASES.SETUP && setCurrentStage(stg.id)}>
                    <div className="matrix-title">{stg.icon} {stg.label}</div>
                    <div className="matrix-desc">{stg.desc}</div>
                  </button>
                ))}
              </div>
              <div className="divider" />
              <p className="section-title">Target Job Role</p>
              <input className="field-input" placeholder="e.g. Backend Engineer, Full Stack Developer…"
                value={jobRole} onChange={e => setJobRole(e.target.value)} disabled={phase === PHASES.STARTING} />
              <div className="divider" />
              <p className="section-title">Select Difficulty</p>
              <div className="diff-row">
                {Object.entries(DIFFICULTY_CONFIG).map(([key, cfg]) => (
                  <div key={key}
                    className={`diff-btn ${difficulty === key ? `active-${key.toLowerCase()}` : "inactive"}`}
                    onClick={() => phase === PHASES.SETUP && setDifficulty(key)}>
                    {key}
                    <div className="diff-time">⏱ {cfg.time / 60} min / question</div>
                  </div>
                ))}
              </div>
              <div className="divider" />
              <p className="section-title">Upload Your Resume</p>
              {extracting ? (
                <div className="extracting-bar">
                  <div className="extract-spinner" />
                  <span>Extracting text from {resumeFile?.name}…</span>
                </div>
              ) : resumeFile && resumeText ? (
                <>
                  <div className="file-uploaded">
                    <div className="file-icon">{resumeFile.name.endsWith(".pdf") ? "📄" : resumeFile.name.endsWith(".docx") ? "📝" : "📃"}</div>
                    <div className="file-info">
                      <div className="file-name">{resumeFile.name}</div>
                      <div className="file-meta">✓ {resumeText.split(/\s+/).length} words · {(resumeFile.size / 1024).toFixed(1)} KB</div>
                    </div>
                    <button type="button" className="file-remove"
                      onClick={() => { setResumeFile(null); setResumeText(""); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                      Remove
                    </button>
                  </div>
                  <div className="resume-preview">
                    <div className="preview-label">PREVIEW</div>
                    <p>{resumeText.slice(0, 400)}</p>
                  </div>
                </>
              ) : (
                <label className={`upload-zone ${dragOver ? "drag-over" : ""}`}
                  onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)} onDrop={handleDrop}>
                  <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md"
                    onChange={handleFileInput} disabled={phase === PHASES.STARTING} />
                  <div className="upload-icon-wrap">📎</div>
                  <h4>Drop your resume here</h4>
                  <p>or click to browse files</p>
                  <div className="formats">
                    {[
                      { ext: "PDF",  bg: "#fee2e2", color: "#dc2626", border: "#fca5a5" },
                      { ext: "DOCX", bg: "#dbeafe", color: "#1d4ed8", border: "#93c5fd" },
                      { ext: "TXT",  bg: "#d1fae5", color: "#065f46", border: "#6ee7b7" },
                      { ext: "MD",   bg: "#f3e8ff", color: "#7e22ce", border: "#d8b4fe" },
                    ].map(f => (
                      <span key={f.ext} className="format-pill" style={{ background: f.bg, color: f.color, borderColor: f.border }}>{f.ext}</span>
                    ))}
                  </div>
                </label>
              )}
              <button type="button" className="start-btn" onClick={startInterview}
                disabled={phase === PHASES.STARTING || !resumeOk || !userId}>
                {phase === PHASES.STARTING ? "Starting…" : `Begin ${STAGES.find(s => s.id === currentStage)?.label.slice(3)} Round →`}
              </button>
            </div>
          )}

          {/* ── INTERVIEW ── */}
          {(phase === PHASES.INTERVIEW || phase === PHASES.SUBMITTING) && (
            <div className="iv-card">
              <div className="iv-progress-header">
                <span className="iv-prog-label">{STAGES.find(s => s.id === currentStage)?.label.toUpperCase()} · Q{questionNumber}/{totalQuestions}</span>
                <div className="iv-progress-dots">
                  {Array.from({ length: totalQuestions }).map((_, i) => (
                    <div key={i} className={`iv-dot ${i < questionNumber - 1 ? "done" : i === questionNumber - 1 ? "active" : ""}`} />
                  ))}
                </div>
              </div>
              <div className="iv-timer-wrap">
                <span style={{ fontFamily: "'Space Mono',monospace", fontSize: "0.68rem", color: "#94a3b8" }}>TIME</span>
                <div className="iv-timer-track"><div className="iv-timer-fill" style={{ width: `${timerPct}%`, background: timerColor }} /></div>
                <span className="iv-timer-label" style={{ color: timerColor }}>{formatTime(timer)}</span>
              </div>
              <div className="question-block">
                <div className="q-number">Q{questionNumber} · {difficulty.toUpperCase()}</div>
                {loadingQuestion ? (
                  <>
                    <div className="skeleton" style={{ height: 18, marginBottom: 8, width: "90%" }} />
                    <div className="skeleton" style={{ height: 18, width: "70%" }} />
                  </>
                ) : (
                  <>
                    <div className="question-text">{currentQuestion}</div>
                    <div className="audio-inline-group">
                      <button type="button" className={`audio-trigger-btn ${isSpeaking ? "active-speaking" : ""}`}
                        onClick={() => handleReadAloud(currentQuestion)} disabled={loadingQuestion}>
                        {isSpeaking ? "🛑" : "🔊"}
                      </button>
                      <button type="button" className={`audio-trigger-btn ${isListening ? "active-listening" : ""}`}
                        onClick={toggleVoiceCapture} disabled={loadingQuestion || phase === PHASES.SUBMITTING}>
                        {isListening ? "⏹" : "🎤"}
                      </button>
                    </div>
                  </>
                )}
              </div>
              <div className="answer-label">YOUR ANSWER</div>
              <textarea className="answer-area" rows={6} value={answer}
                placeholder={isListening ? "Listening… speak your answer." : "Type your answer or use the mic above."}
                onChange={e => setAnswer(e.target.value)}
                disabled={phase === PHASES.SUBMITTING || loadingQuestion} />
              <div className="word-count">{wordCount} words</div>
              <div className="action-row">
                <button type="button" className="submit-btn" onClick={submitAnswer}
                  disabled={!answer.trim() || phase === PHASES.SUBMITTING || loadingQuestion}>
                  {phase === PHASES.SUBMITTING ? "Evaluating…" : questionNumber >= totalQuestions ? "Submit & Finish" : "Submit Answer →"}
                </button>
                <button type="button" className="skip-btn" onClick={skipQuestion}
                  disabled={phase === PHASES.SUBMITTING || loadingQuestion}>
                  {questionNumber >= totalQuestions ? "Finish without answer" : "Skip →"}
                </button>
                {allResults.length > 0 && questionNumber < totalQuestions && (
                  <button type="button" className="end-btn" onClick={endEarly} disabled={phase === PHASES.SUBMITTING}>End Early</button>
                )}
              </div>
              {allResults.length > 0 && (
                <div className="answered-list">
                  <div className="divider" />
                  <p className="section-title">Answered ({allResults.length})</p>
                  {allResults.map((r, i) => (
                    <div className="answered-item" key={i}>
                      <div className="answered-q">{r.question}</div>
                      <div className="answered-score">{r.overallScore}%</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── ANALYZING ── */}
          {phase === PHASES.ANALYZING && (
            <div className="iv-card analyzing-wrap">
              <div className="pulse-ring" />
              <h3>Assembling Performance Matrix</h3>
              <p>AI ENGINE IS COMPILING YOUR RESULTS…</p>
            </div>
          )}

          {/* ── RESULT ── */}
          {phase === PHASES.RESULT && summary && (
            <div className="iv-card">
              <div className="result-header">
                <div className="score-circle">
                  <span className="big-score">{summary.overallScore}</span>
                  <span className="score-label">OVERALL</span>
                </div>
                <h2 style={{ fontWeight: 800, fontSize: "1.5rem" }}>Round Complete</h2>
                <p style={{ color: "#94a3b8", fontFamily: "'Space Mono',monospace", fontSize: "0.72rem", marginTop: "0.25rem" }}>
                  {STAGES.find(s => s.id === currentStage)?.label.toUpperCase()} · {allResults.length} QUESTIONS
                </p>
              </div>
              <p className="section-title">Performance Metrics</p>
              {METRIC_KEYS.map(m => (
                <div className="metric-row" key={m.key}>
                  <div className="metric-label">
                    <span>{m.label}</span>
                    <span style={{ color: m.color, fontFamily: "'Space Mono',monospace" }}>{summary[m.key]}%</span>
                  </div>
                  <div className="metric-track"><div className="metric-fill" style={{ width: `${summary[m.key]}%`, background: m.color }} /></div>
                </div>
              ))}
              <div className="divider" />
              <p className="section-title">Answer Breakdown (click to expand)</p>
              {summary.perQuestion.map((r, i) => <QuestionResultCard key={i} resultItem={r} />)}
              <div className="divider" />
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {summary.strengths?.length > 0 && (
                  <div className="feedback-section strength">
                    <h5>Strengths</h5>
                    <ul>{summary.strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {summary.weaknesses?.length > 0 && (
                  <div className="feedback-section weakness">
                    <h5>Identified Gaps</h5>
                    <ul>{summary.weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
                {summary.improvementSuggestions?.length > 0 && (
                  <div className="feedback-section suggest">
                    <h5>Actionable Suggestions</h5>
                    <ul>{summary.improvementSuggestions.map((s, i) => <li key={i}>{s}</li>)}</ul>
                  </div>
                )}
              </div>
              <button type="button" className="restart-btn" onClick={resetAll}>↩ Start New Session</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
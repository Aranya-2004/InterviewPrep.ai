import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

const JOB_ROLES = [
  { value: "software_engineer",  label: "Software Engineer",  icon: "⚙️" },
  { value: "data_scientist",     label: "Data Scientist",     icon: "📊" },
  { value: "product_manager",    label: "Product Manager",    icon: "🗂️" },
  { value: "ux_designer",        label: "UX Designer",        icon: "🎨" },
  { value: "devops_engineer",    label: "DevOps Engineer",    icon: "🚀" },
];

// ✅ ENV SYNCHRONIZATION: Dynamic cloud address routing fallback configurations
const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

function Orb({ style }) {
  return <div className="ru-orb" style={style} />;
}

export default function ResumeUpload() {
  const [file,           setFile]           = useState(null);
  const [uploading,      setUploading]      = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message,        setMessage]        = useState("");
  const [msgType,        setMsgType]        = useState("info");
  const [analysis,       setAnalysis]       = useState(null);
  const [jobRole,        setJobRole]        = useState(JOB_ROLES[0].value);
  const [isDragOver,     setIsDragOver]     = useState(false);
  const [mounted,        setMounted]        = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const handleDragOver  = e => { e.preventDefault(); setIsDragOver(true);  };
  const handleDragLeave = e => { e.preventDefault(); setIsDragOver(false); };
  const handleDrop = e => {
    e.preventDefault(); setIsDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f && (f.type === "application/pdf" || f.type.includes("wordprocessingml"))) {
      setFile(f); setMessage("");
    } else {
      setMessage("Please upload a valid PDF or DOCX file."); setMsgType("warn");
    }
  };
  const handleFileSelect = e => {
    if (e.target.files[0]) { setFile(e.target.files[0]); setMessage(""); }
  };

  const handleUpload = async e => {
    e.preventDefault();
    if (!file) { setMessage("Please select a file first."); setMsgType("warn"); return; }
    setUploading(true); setUploadProgress(0); setMessage(""); setAnalysis(null);
    
    try {
      const fd = new FormData();
      fd.append("resume", file);
      fd.append("jobRole", jobRole);
      
      // ✅ SECURED: Safely retrieve the user authentication token out of browser memory
      const token = localStorage.getItem("token");

      console.log(`📡 Dispatching secure telemetry payload stack to: ${BASE_URL}/api/resume`);

      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await axios.post(`${BASE_URL}/api/resume`, fd, {
        headers,
        onUploadProgress: ev => setUploadProgress(Math.round((ev.loaded * 100) / ev.total)),
      });

      console.log("RESUME API RESPONSE:", res.data);
      setAnalysis(res.data);
      setMessage(`"${file.name}" analysed successfully!`); setMsgType("ok");
      setFile(null); fileInputRef.current.value = "";
    } catch (err) {
      console.error("Upload error details:", err);
      const s = err.response?.status;
      const serverMessage = err.response?.data?.message;
      if (s === 429) {
        setMessage(serverMessage || "AI quota exceeded. Showing keyword analysis only.");
      } else if (s === 401) {
        setMessage(serverMessage || "Session authentication failed. Please re-login.");
      } else if (s === 404) {
        setMessage(serverMessage || "Target deployment endpoint path not found (404). Check route configurations.");
      } else if (err.response) {
        setMessage(serverMessage || "Server error while analysing resume context records.");
      } else {
        setMessage("Backend application server not responding.");
      }
      setMsgType("error");
    } finally { setUploading(false); setUploadProgress(0); }
  };

  const fmt = bytes => {
    if (!bytes) return "0B";
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return (bytes / Math.pow(1024, i)).toFixed(1) + ["B","KB","MB"][i];
  };

  const scoreColor  = s => s >= 75 ? "#059669" : s >= 50 ? "#d97706" : "#dc2626";
  const selectedRole = JOB_ROLES.find(r => r.value === jobRole);
  const rawScore = analysis ? (analysis.atsScore ?? analysis.score ?? 0) : 0;
  const score = Math.max(0, Math.min(100, Number(rawScore) || 0));
  const detailedBreakdown = analysis?.detailedBreakdown || {};
  const sectionAnalysis = analysis?.sectionAnalysis || {};
  const keywordGaps = analysis?.keywordGaps || { highPriority: [], mediumPriority: [], lowPriority: [] };
  const comparison = analysis?.jobDescriptionComparison || {};
  const recruiterView = analysis?.recruiterView || { impressionScore: 0, strengths: [], concerns: [] };
  const readinessMeter = analysis?.readinessMeter || {
    overallReadiness: 0,
    technicalSkills: 0,
    projects: 0,
    interviewReadiness: 0,
    systemDesign: 0
  };
  const roadmap = analysis?.roadmap || [];
  const aiFeedback = analysis?.aiFeedback;

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,300;0,700;0,900;1,300&family=DM+Mono:wght@400;500&family=Outfit:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #f0f4ff; }

    .ru-root {
      min-height: 100vh;
      font-family: 'Outfit', sans-serif;
      color: #1e293b;
      overflow-x: hidden;
      position: relative;
      background: linear-gradient(135deg, #eef2ff 0%, #f0fdf9 50%, #fff7ed 100%);
    }
    .ru-bg {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background:
        radial-gradient(ellipse 70% 60% at 15% 20%, rgba(99,102,241,.07) 0%, transparent 70%),
        radial-gradient(ellipse 60% 50% at 85% 70%, rgba(16,185,129,.07) 0%, transparent 70%),
        radial-gradient(ellipse 40% 40% at 50% 50%, rgba(249,115,22,.04) 0%, transparent 70%);
    }
    .ru-grid {
      position: fixed; inset: 0; pointer-events: none; z-index: 0;
      background-image:
        linear-gradient(rgba(99,102,241,.04) 1px, transparent 1px),
        linear-gradient(90deg, rgba(99,102,241,.04) 1px, transparent 1px);
      background-size: 60px 60px;
    }
    .ru-orb {
      position: absolute; border-radius: 50%;
      opacity: .22; animation: ru-float 8s ease-in-out infinite;
      pointer-events: none;
    }
    @keyframes ru-float {
      0%, 100% { transform: translateY(0) scale(1); }
      50%       { transform: translateY(-22px) scale(1.08); }
    }
    .ru-back-btn {
      position: fixed; top: 1.25rem; left: 1.25rem; z-index: 200;
      display: inline-flex; align-items: center; gap: .45rem;
      padding: .48rem 1rem; border-radius: 999px;
      border: 1.5px solid rgba(99,102,241,.25); background: rgba(255,255,255,.75);
      backdrop-filter: blur(12px); color: #4f46e5;
      font-family: 'DM Mono', monospace; font-size: .72rem; font-weight: 500;
      letter-spacing: .5px; cursor: pointer; transition: all .2s;
      box-shadow: 0 2px 12px rgba(99,102,241,.1); text-decoration: none;
    }
    .ru-back-btn:hover {
      background: #4f46e5; color: #fff; border-color: #4f46e5;
      transform: translateX(-2px); box-shadow: 0 4px 18px rgba(99,102,241,.28);
    }
    .ru-back-arrow { font-size: .9rem; transition: transform .2s; }
    .ru-back-btn:hover .ru-back-arrow { transform: translateX(-3px); }

    .ru-page {
      position: relative; z-index: 1; min-height: 100vh;
      display: grid; grid-template-columns: 1fr 1fr;
      max-width: 1200px; margin: 0 auto; padding: 3rem 2rem;
      gap: 3rem; align-items: start;
    }
    @media (max-width: 860px) {
      .ru-page { grid-template-columns: 1fr; padding: 5rem 1.2rem 2rem; }
    }
    .ru-hero {
      position: sticky; top: 3rem; opacity: 0; transform: translateX(-32px);
      transition: opacity .7s ease, transform .7s ease;
    }
    .ru-hero.in { opacity: 1; transform: none; }
    .ru-eyebrow {
      display: inline-flex; align-items: center; gap: .5rem;
      padding: .3rem .9rem; border: 1.5px solid rgba(99,102,241,.3);
      border-radius: 999px; font-family: 'DM Mono', monospace;
      font-size: .68rem; letter-spacing: 2px; color: #4f46e5;
      text-transform: uppercase; margin-bottom: 1.5rem; background: rgba(99,102,241,.06);
    }
    .ru-eyebrow::before {
      content: ''; width: 6px; height: 6px; border-radius: 50%;
      background: #4f46e5; animation: ru-blink 1.6s ease-in-out infinite;
    }
    @keyframes ru-blink { 0%,100%{opacity:1} 50%{opacity:.25} }

    .ru-h1 {
      font-family: 'Fraunces', serif; font-size: clamp(2.8rem, 5vw, 4.2rem);
      font-weight: 900; line-height: 1.05; letter-spacing: -1px; color: #0f172a; margin-bottom: 1.5rem;
    }
    .ru-h1 em {
      font-style: italic; font-weight: 300; background: linear-gradient(135deg, #4f46e5, #7c3aed);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    }
    .ru-tagline { font-size: 1rem; color: #64748b; line-height: 1.7; max-width: 380px; margin-bottom: 2.5rem; }
    .ru-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
    .ru-stat-num { font-family: 'Fraunces', serif; font-size: 2rem; font-weight: 900; color: #4f46e5; line-height: 1; }
    .ru-stat-lbl { font-size: .72rem; color: #94a3b8; font-family: 'DM Mono', monospace; letter-spacing: 1px; text-transform: uppercase; margin-top: .2rem; }

    .ru-panel { opacity: 0; transform: translateY(28px); transition: opacity .7s .15s ease, transform .7s .15s ease; }
    .ru-panel.in { opacity: 1; transform: none; }
    .ru-card {
      background: rgba(255,255,255,.82); border: 1.5px solid rgba(99,102,241,.12);
      border-radius: 24px; padding: 2rem; backdrop-filter: blur(18px);
      box-shadow: 0 0 0 1px rgba(255,255,255,.6), 0 20px 60px rgba(99,102,241,.1), 0 4px 16px rgba(0,0,0,.04);
    }
    .ru-role-label { font-size: .68rem; font-family: 'DM Mono', monospace; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: .75rem; }
    .ru-roles { display: flex; flex-wrap: wrap; gap: .5rem; margin-bottom: 1.75rem; }
    .ru-role-chip {
      display: flex; align-items: center; gap: .4rem; padding: .45rem .9rem; border-radius: 999px;
      border: 1.5px solid #e2e8f0; background: #f8fafc; font-size: .8rem; color: #64748b;
      cursor: pointer; transition: all .2s; font-family: 'Outfit', sans-serif;
    }
    .ru-role-chip:hover { border-color: rgba(99,102,241,.4); color: #1e293b; background: #fff; }
    .ru-role-chip.active { border-color: #4f46e5; background: rgba(99,102,241,.07); color: #4f46e5; font-weight: 600; }

    .ru-dropzone {
      border: 2px dashed rgba(99,102,241,.25); border-radius: 18px; padding: 2.5rem 1.5rem;
      text-align: center; cursor: pointer; transition: all .25s; position: relative;
      overflow: hidden; background: rgba(99,102,241,.02); margin-bottom: 1.25rem;
    }
    .ru-dropzone:hover, .ru-dropzone.over { border-color: #4f46e5; background: rgba(99,102,241,.05); transform: scale(1.01); }
    .ru-dropzone.has-file { border-color: #059669; background: rgba(5,150,105,.04); border-style: solid; }
    .ru-dz-icon {
      width: 64px; height: 64px; border-radius: 18px; background: rgba(99,102,241,.08);
      border: 1.5px solid rgba(99,102,241,.2); display: flex; align-items: center;
      justify-content: center; margin: 0 auto 1rem; font-size: 1.7rem; transition: transform .3s;
    }
    .ru-dropzone:hover .ru-dz-icon { transform: translateY(-4px) rotate(-4deg); }
    .ru-dz-title { font-size: 1rem; font-weight: 600; margin-bottom: .35rem; color: #1e293b; }
    .ru-dz-sub   { font-size: .78rem; color: #94a3b8; font-family: 'DM Mono', monospace; }
    .ru-file-info { display: flex; align-items: center; justify-content: center; gap: .75rem; }
    .ru-file-icon-wrap {
      width: 42px; height: 42px; border-radius: 10px; background: rgba(5,150,105,.1);
      border: 1px solid rgba(5,150,105,.25); display: flex; align-items: center; justify-content: center; font-size: 1.2rem;
    }
    .ru-file-name { font-weight: 600; font-size: .92rem; color: #1e293b; }
    .ru-file-size { font-size: .72rem; color: #94a3b8; font-family: 'DM Mono', monospace; margin-top: .15rem; }

    .ru-submit {
      width: 100%; padding: 1rem; border-radius: 14px; border: none;
      background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); color: #fff;
      font-family: 'Outfit', sans-serif; font-weight: 700; font-size: 1rem; cursor: pointer; transition: all .25s; position: relative; overflow: hidden;
    }
    .ru-submit::after {
      content: ''; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(255,255,255,.18), transparent); opacity: 0; transition: opacity .2s;
    }
    .ru-submit:hover:not(:disabled)::after { opacity: 1; }
    .ru-submit:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,102,241,.35); }
    .ru-submit:disabled { opacity: .4; cursor: not-allowed; }

    .ru-progress-wrap { margin-top: 1rem; background: #e2e8f0; border-radius: 999px; height: 6px; overflow: hidden; }
    .ru-progress-fill { height: 100%; background: linear-gradient(90deg, #4f46e5, #7c3aed); border-radius: 999px; transition: width .3s ease; position: relative; overflow: hidden; }
    .ru-progress-fill::after { content: ''; position: absolute; inset: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,.4), transparent); animation: ru-shimmer 1.2s infinite; }
    @keyframes ru-shimmer { from{transform:translateX(-100%)} to{transform:translateX(200%)} }

    .ru-alert { display: flex; align-items: center; gap: .6rem; margin-top: 1rem; padding: .75rem 1rem; border-radius: 12px; font-size: .85rem; font-family: 'DM Mono', monospace; }
    .ru-alert.ok    { background: rgba(5,150,105,.08);   border:1px solid rgba(5,150,105,.2);   color:#059669; }
    .ru-alert.warn  { background: rgba(217,119,6,.08);   border:1px solid rgba(217,119,6,.2);   color:#d97706; }
    .ru-alert.error { background: rgba(220,38,38,.08);   border:1px solid rgba(220,38,38,.2);   color:#dc2626; }
    .ru-alert.info  { background: rgba(99,102,241,.08);  border:1px solid rgba(99,102,241,.2);  color:#4f46e5; }

    .ru-results { margin-top: 1.5rem; animation: ru-fadein .5s ease; }
    @keyframes ru-fadein { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }

    .ru-score-row { display: flex; align-items: center; gap: 1.25rem; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 1.25rem 1.5rem; margin-bottom: 1.25rem; }
    .ru-score-ring { width: 72px; height: 72px; flex-shrink: 0; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-direction: column; font-family: 'Fraunces', serif; }
    .ru-score-num  { font-size: 1.5rem; font-weight: 900; line-height: 1; }
    .ru-score-pct  { font-size: .65rem; opacity: .55; font-family: 'DM Mono', monospace; }
    .ru-score-info h4 { font-size: 1rem; font-weight: 700; margin-bottom: .25rem; color: #1e293b; }
    .ru-score-info p  { font-size: .78rem; color: #94a3b8; font-family: 'DM Mono', monospace; }
    .ru-ats-track  { height: 8px; background: #e2e8f0; border-radius: 999px; overflow: hidden; margin-top: .5rem; }
    .ru-ats-fill   { height: 100%; border-radius: 999px; transition: width 1.2s cubic-bezier(.22,1,.36,1); }

    .ru-kw-section { margin-bottom: 1.25rem; }
    .ru-kw-title { font-size: .65rem; font-family: 'DM Mono', monospace; letter-spacing: 2px; text-transform: uppercase; margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
    .ru-kw-title::before { content: ''; display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
    .ru-kw-title.matched { color: #059669; } .ru-kw-title.matched::before { background: #059669; }
    .ru-kw-title.missing  { color: #dc2626; } .ru-kw-title.missing::before  { background: #dc2626; }
    .ru-kw-chips { display: flex; flex-wrap: wrap; gap: .45rem; }
    .ru-kw-chip { padding: .3rem .75rem; border-radius: 999px; font-size: .75rem; font-family: 'DM Mono', monospace; font-weight: 500; }
    .ru-kw-chip.matched { background: rgba(5,150,105,.08);  border:1px solid rgba(5,150,105,.22); color:#059669; }
    .ru-kw-chip.missing  { background: rgba(220,38,38,.06);  border:1px solid rgba(220,38,38,.2);  color:#dc2626; }

    .ru-score-breakdown { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
    @media (max-width: 760px) { .ru-score-breakdown { grid-template-columns: 1fr; } }
    .ru-breakdown-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1rem; }
    .ru-breakdown-title { font-size: .78rem; font-weight: 700; color: #475569; margin-bottom: .5rem; }
    .ru-breakdown-value { font-size: 1.3rem; font-weight: 800; color: #111827; }

    .ru-section-analysis { display: grid; gap: 1rem; margin-bottom: 1.25rem; }
    .ru-section-row { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; }
    @media (max-width: 760px) { .ru-section-row { grid-template-columns: 1fr; } }
    .ru-section-analysis p { color: #64748b; margin-top: .5rem; line-height: 1.75; }

    .ru-keyword-gap { display: grid; gap: 1rem; margin-bottom: 1.25rem; }
    .ru-keyword-group { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1rem; }
    .ru-keyword-group-title { font-size: .8rem; font-weight: 700; color: #334155; margin-bottom: .75rem; }

    .ru-comparison-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin-bottom: 1.25rem; }
    @media (max-width: 760px) { .ru-comparison-grid { grid-template-columns: 1fr; } }
    .ru-comparison-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1rem; }
    .ru-comparison-title { font-size: .75rem; color: #64748b; margin-bottom: .55rem; text-transform: uppercase; letter-spacing: 1px; }

    .ru-achievement-card,
    .ru-recruiter-card,
    .ru-readiness-meter,
    .ru-roadmap,
    .ru-feedback-section { background: #fff; border: 1px solid #e2e8f0; border-radius: 18px; padding: 1rem; margin-bottom: 1.25rem; }
    .ru-score-big { font-size: 2rem; font-weight: 800; color: #111827; margin-top: .5rem; }
    .ru-score-small { font-size: .95rem; font-weight: 700; margin: .6rem 0; color: #334155; }
    .ru-mini-list strong { display: block; margin-top: .8rem; color: #0f172a; }
    .ru-mini-list ul { margin: .6rem 0 0 1.3rem; color: #475569; }
    .ru-readiness-meter .ru-meter-row { display: flex; justify-content: space-between; gap: 1rem; padding: .75rem 0; border-bottom: 1px solid #e2e8f0; color: #334155; }
    .ru-readiness-meter .ru-meter-row:last-child { border-bottom: none; }
    .ru-roadmap ol { padding-left: 1.2rem; color: #475569; }
    .ru-roadmap li { margin-bottom: .75rem; }

    .ru-feedback { background: rgba(99,102,241,.05); border: 1.5px solid rgba(99,102,241,.15); border-radius: 14px; padding: 1.25rem; }
    .ru-feedback-title { font-size: .65rem; font-family: 'DM Mono', monospace; letter-spacing: 2px; text-transform: uppercase; color: #4f46e5; margin-bottom: .75rem; display: flex; align-items: center; gap: .5rem; }
    .ru-feedback-title::before { content: '✦'; font-size: .8rem; }
    .ru-feedback p { font-size: .88rem; color: #475569; line-height: 1.75; white-space: pre-line; }

    .ru-feedback ul { list-style: none; padding-left: 0; margin: 0; }
    .ru-feedback li { position: relative; padding-left: 1.5rem; margin-bottom: 0.65rem; font-size: 0.88rem; line-height: 1.6; color: #475569; }
    .ru-fb-strengths li::before { content: "✓"; position: absolute; left: 0; color: #059669; font-weight: 700; }
    .ru-fb-missing li::before { content: "✕"; position: absolute; left: 0; color: #dc2626; font-weight: 700; }
    .ru-fb-suggestions li::before { content: "✦"; position: absolute; left: 0; color: #4f46e5; font-weight: 600; }
    .ru-fb-tips li::before { content: "⚡"; position: absolute; left: 0; color: #d97706; }

    .ru-divider { height: 1px; background: #e2e8f0; margin: 1.25rem 0; }
  `;

  return (
    <>
      <style>{css}</style>
      <div className="ru-root">
        <div className="ru-bg" />
        <div className="ru-grid" />

        <Orb style={{ width:320, height:320, background:"radial-gradient(rgba(99,102,241,.18),transparent 70%)",  top:"8%",  left:"3%",  animationDelay:"0s"  }} />
        <Orb style={{ width:420, height:420, background:"radial-gradient(rgba(16,185,129,.14),transparent 70%)",  bottom:"12%", right:"5%", animationDelay:"3s"  }} />
        <Orb style={{ width:220, height:220, background:"radial-gradient(rgba(249,115,22,.12),transparent 70%)",  top:"55%", left:"28%", animationDelay:"5s"  }} />

        <button className="ru-back-btn" onClick={() => window.history.back()} type="button">
          <span className="ru-back-arrow">←</span>
          Back
        </button>

        <div className="ru-page">
          {/* ── LEFT: hero ── */}
          <div className={`ru-hero ${mounted ? "in" : ""}`}>
            <div className="ru-eyebrow">AI-Powered · ATS Optimised</div>
            <h1 className="ru-h1">
              Get your<br/>
              resume <em>noticed</em><br/>
              instantly.
            </h1>
            <p className="ru-tagline">
              Upload your resume and our AI scans it against real ATS systems, surfacing
              skill gaps, matched keywords, and personalised feedback — in seconds.
            </p>
            <div className="ru-stats">
              <div className="ru-stat">
                <div className="ru-stat-num">98%</div>
                <div className="ru-stat-lbl">ATS accuracy</div>
              </div>
              <div className="ru-stat">
                <div className="ru-stat-num">4s</div>
                <div className="ru-stat-lbl">Avg. analysis</div>
              </div>
              <div className="ru-stat">
                <div className="ru-stat-num">12k+</div>
                <div className="ru-stat-lbl">Resumes scanned</div>
              </div>
            </div>
          </div>

          {/* ── RIGHT: upload panel ── */}
          <div className={`ru-panel ${mounted ? "in" : ""}`}>
            <div className="ru-card">
              <p className="ru-role-label">Target Role</p>
              <div className="ru-roles">
                {JOB_ROLES.map(r => (
                  <button
                    key={r.value}
                    className={`ru-role-chip ${jobRole === r.value ? "active" : ""}`}
                    onClick={() => setJobRole(r.value)}
                    type="button"
                  >
                    {r.icon} {r.label}
                  </button>
                ))}
              </div>

              <div
                className={`ru-dropzone ${isDragOver ? "over" : ""} ${file ? "has-file" : ""}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  style={{ display: "none" }}
                  onChange={handleFileSelect}
                />
                {file ? (
                  <div className="ru-file-info">
                    <div className="ru-file-icon-wrap">📄</div>
                    <div>
                      <div className="ru-file-name">{file.name}</div>
                      <div className="ru-file-size">{fmt(file.size)}</div>
                    </div>
                    <div style={{ marginLeft:"auto", color:"#059669", fontSize:"1.4rem" }}>✓</div>
                  </div>
                ) : (
                  <>
                    <div className="ru-dz-icon">{isDragOver ? "📂" : "📋"}</div>
                    <div className="ru-dz-title">{isDragOver ? "Release to upload" : "Drop your resume here"}</div>
                    <div className="ru-dz-sub">PDF or DOCX · Click to browse</div>
                  </>
                )}
              </div>

              <button
                className="ru-submit"
                onClick={handleUpload}
                disabled={uploading || !file}
                type="button"
              >
                {uploading
                  ? `Analysing your resume… ${uploadProgress}%`
                  : `Analyse for ${selectedRole?.label}`}
              </button>

              {uploading && (
                <div className="ru-progress-wrap">
                  <div className="ru-progress-fill" style={{ width:`${uploadProgress}%` }} />
                </div>
              )}

              {message && (
                <div className={`ru-alert ${msgType}`}>
                  {msgType==="ok"?"✅":msgType==="warn"?"⚠️":msgType==="error"?"❌":"ℹ️"}
                  {message}
                </div>
              )}

              {/* ── RESULTS ── */}
              {analysis && (
                <div className="ru-results">
                  <div className="ru-divider" />

                  <div className="ru-score-row">
                    <div
                      className="ru-score-ring"
                      style={{
                        border:`4px solid ${scoreColor(score)}`,
                        background:`${scoreColor(score)}12`,
                      }}
                    >
                      <span className="ru-score-num" style={{ color:scoreColor(score) }}>{score}</span>
                      <span className="ru-score-pct">ATS</span>
                    </div>
                    <div className="ru-score-info" style={{ flex:1 }}>
                      <h4>ATS Compatibility Score</h4>
                      <p>vs. {selectedRole?.label} requirements</p>
                      <div className="ru-ats-track">
                        <div
                          className="ru-ats-fill"
                          style={{
                            width:`${score}%`,
                            background:`linear-gradient(90deg,${scoreColor(score)},${scoreColor(score)}99)`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ru-score-breakdown">
                    <div className="ru-breakdown-card">
                      <div className="ru-breakdown-title">Skills Match</div>
                      <div className="ru-breakdown-value">{detailedBreakdown.skillsMatch ?? 0}/100</div>
                    </div>
                    <div className="ru-breakdown-card">
                      <div className="ru-breakdown-title">Experience</div>
                      <div className="ru-breakdown-value">{detailedBreakdown.experience ?? 0}/100</div>
                    </div>
                    <div className="ru-breakdown-card">
                      <div className="ru-breakdown-title">Projects</div>
                      <div className="ru-breakdown-value">{detailedBreakdown.projects ?? 0}/100</div>
                    </div>
                    <div className="ru-breakdown-card">
                      <div className="ru-breakdown-title">Education</div>
                      <div className="ru-breakdown-value">{detailedBreakdown.education ?? 0}/100</div>
                    </div>
                    <div className="ru-breakdown-card">
                      <div className="ru-breakdown-title">Formatting</div>
                      <div className="ru-breakdown-value">{detailedBreakdown.formatting ?? 0}/100</div>
                    </div>
                  </div>

                  <div className="ru-section-analysis">
                    <h5>Section-by-Section Analysis</h5>
                    <div className="ru-section-row">
                      <div>
                        <strong>Skills</strong>
                        <p>{sectionAnalysis.skills || "No specific skills section feedback available."}</p>
                      </div>
                      <div>
                        <strong>Projects</strong>
                        <p>{sectionAnalysis.projects || "No specific projects section feedback available."}</p>
                      </div>
                    </div>
                    <div className="ru-section-row">
                      <div>
                        <strong>Experience</strong>
                        <p>{sectionAnalysis.experience || "No specific experience section feedback available."}</p>
                      </div>
                      <div>
                        <strong>Education</strong>
                        <p>{sectionAnalysis.education || "No specific education section feedback available."}</p>
                      </div>
                    </div>
                  </div>

                  <div className="ru-keyword-gap">
                    <h5>Keyword Gap Analysis</h5>
                    <div className="ru-keyword-group">
                      <div className="ru-keyword-group-title">High Priority Missing</div>
                      {keywordGaps.highPriority.length > 0 ? (
                        <ul>{keywordGaps.highPriority.map((k,i) => <li key={i}>{k}</li>)}</ul>
                      ) : <p className="ru-muted">Nothing critical missing.</p>}
                    </div>
                    <div className="ru-keyword-group">
                      <div className="ru-keyword-group-title">Medium Priority</div>
                      {keywordGaps.mediumPriority.length > 0 ? (
                        <ul>{keywordGaps.mediumPriority.map((k,i) => <li key={i}>{k}</li>)}</ul>
                      ) : <p className="ru-muted">No medium priority gaps.</p>}
                    </div>
                    <div className="ru-keyword-group">
                      <div className="ru-keyword-group-title">Low Priority</div>
                      {keywordGaps.lowPriority.length > 0 ? (
                        <ul>{keywordGaps.lowPriority.map((k,i) => <li key={i}>{k}</li>)}</ul>
                      ) : <p className="ru-muted">No low priority gaps.</p>}
                    </div>
                  </div>

                  <div className="ru-comparison-grid">
                    <div className="ru-comparison-card">
                      <div className="ru-comparison-title">Job Match Score</div>
                      <div>{comparison.jobMatchScore ?? 0}%</div>
                    </div>
                    <div className="ru-comparison-card">
                      <div className="ru-comparison-title">Technical Skills Match</div>
                      <div>{comparison.technicalSkillsMatch ?? 0}%</div>
                    </div>
                    <div className="ru-comparison-card">
                      <div className="ru-comparison-title">Experience Match</div>
                      <div>{comparison.experienceMatch ?? 0}%</div>
                    </div>
                    <div className="ru-comparison-card">
                      <div className="ru-comparison-title">Education Match</div>
                      <div>{comparison.educationMatch ?? 0}%</div>
                    </div>
                  </div>

                  <div className="ru-achievement-card">
                    <div className="ru-feedback-title">Achievement Quality Score</div>
                    <div className="ru-score-big">{analysis.achievementQualityScore ?? 0}/100</div>
                    {analysis.achievementFeedback?.length > 0 && (
                      <ul>{analysis.achievementFeedback.map((item,i) => <li key={i}>{item}</li>)}</ul>
                    )}
                  </div>

                  <div className="ru-recruiter-card">
                    <div className="ru-feedback-title">Recruiter View Simulation</div>
                    <div className="ru-score-small">Recruiter Impression: {recruiterView.impressionScore ?? 0}/10</div>
                    <div className="ru-mini-list">
                      <strong>Strengths:</strong>
                      <ul>{recruiterView.strengths.map((item,i) => <li key={i}>{item}</li>)}</ul>
                      <strong>Concerns:</strong>
                      <ul>{recruiterView.concerns.map((item,i) => <li key={i}>{item}</li>)}</ul>
                    </div>
                  </div>

                  <div className="ru-readiness-meter">
                    <div className="ru-feedback-title">Career Readiness Meter</div>
                    <div className="ru-meter-row"><span>Overall</span><span>{readinessMeter.overallReadiness ?? 0}%</span></div>
                    <div className="ru-meter-row"><span>Technical Skills</span><span>{readinessMeter.technicalSkills ?? 0}%</span></div>
                    <div className="ru-meter-row"><span>Projects</span><span>{readinessMeter.projects ?? 0}%</span></div>
                    <div className="ru-meter-row"><span>Interview Readiness</span><span>{readinessMeter.interviewReadiness ?? 0}%</span></div>
                    <div className="ru-meter-row"><span>System Design</span><span>{readinessMeter.systemDesign ?? 0}%</span></div>
                  </div>

                  {roadmap.length > 0 && (
                    <div className="ru-roadmap">
                      <div className="ru-feedback-title">30-Day Learning Roadmap</div>
                      <ol>
                        {roadmap.map((item,i) => (
                          <li key={i}><strong>{item.week}:</strong> {item.focus}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {analysis.matchedKeywords?.length > 0 && (
                    <div className="ru-kw-section">
                      <div className="ru-kw-title matched">Matched Skills ({analysis.matchedKeywords.length})</div>
                      <div className="ru-kw-chips">
                        {analysis.matchedKeywords.map((k,i) => <span key={i} className="ru-kw-chip matched">{k}</span>)}
                      </div>
                    </div>
                  )}

                  {analysis.missingKeywords?.length > 0 && (
                    <div className="ru-kw-section">
                      <div className="ru-kw-title missing">Missing Skills ({analysis.missingKeywords.length})</div>
                      <div className="ru-kw-chips">
                        {analysis.missingKeywords.map((k,i) => <span key={i} className="ru-kw-chip missing">{k}</span>)}
                      </div>
                    </div>
                  )}

                  {analysis.strengths?.length > 0 && (
                    <div className="ru-feedback-section">
                      <div className="ru-feedback-title" style={{ color: "#059669" }}>💪 Strengths on Your Resume</div>
                      <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                        {analysis.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.missingSkills?.length > 0 && (
                    <div className="ru-feedback-section">
                      <div className="ru-feedback-title" style={{ color: "#dc2626" }}>⚠️ Weaknesses / Skills to Add</div>
                      <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                        {analysis.missingSkills.map((w,i) => <li key={i}>{w}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.suggestions?.length > 0 && (
                    <div className="ru-feedback-section">
                      <div className="ru-feedback-title" style={{ color: "#d97706" }}>🚀 How to Improve Your Resume</div>
                      <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                        {analysis.suggestions.map((s,i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.atsTips?.length > 0 && (
                    <div className="ru-feedback-section">
                      <div className="ru-feedback-title" style={{ color: "#0891b2" }}>🎯 ATS Optimization Tips</div>
                      <ul style={{ paddingLeft: "20px", lineHeight: "1.8" }}>
                        {analysis.atsTips.map((t,i) => <li key={i}>{t}</li>)}</ul>
                    </div>
                  )}

                  <div className="ru-feedback">
                    <div className="ru-feedback-title">AI Summary</div>
                    {typeof aiFeedback === "string" ? (
                      <p>{aiFeedback}</p>
                    ) : aiFeedback ? (
                      <>
                        {aiFeedback.summary && <p>{aiFeedback.summary}</p>}
                        {aiFeedback.keyTakeaways?.length > 0 && (
                          <ul>{aiFeedback.keyTakeaways.map((item, i) => <li key={i}>{item}</li>)}</ul>
                        )}
                      </>
                    ) : (
                      <p>AI feedback unavailable.</p>
                    )}
                  </div>

                  <button
                    type="button"
                    className="ru-submit"
                    style={{
                      marginTop: "1.5rem",
                      background: "#f1f5f9",
                      color: "#475569",
                      border: "1.5px solid #cbd5e1",
                      boxShadow: "none"
                    }}
                    onClick={() => {
                      setAnalysis(null);
                      setFile(null);
                      setMessage("");
                      setUploadProgress(0);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                  >
                    🔄 Analyse Another Resume
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
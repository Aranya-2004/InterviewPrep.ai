import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const stats = [
  { label: "Sessions Done",  value: "7",  suffix: "",  color: "#3b82f6", icon: "🎙", delta: "+2 this week"  },
  { label: "Average Score",  value: "74", suffix: "%", color: "#0d9488", icon: "📊", delta: "↑ from 68%"    },
  { label: "Best ATS Score", value: "81", suffix: "%", color: "#7c3aed", icon: "📋", delta: "Software Eng." },
  { label: "Day Streak",     value: "5",  suffix: "",  color: "#f59e0b", icon: "🔥", delta: "Keep going!"   },
];

// ✅ REMOVED: const { user } = useAuth();  ← was here at module level (WRONG)

const quickActions = [
  {
    icon: "📄", title: "Resume Upload",
    desc: "Upload your resume and get a real-time ATS compatibility score with keyword feedback.",
    cta: "Analyse Resume", path: "/app/resume",
    accent: "#3b82f6", bg: "rgba(59,130,246,.06)", border: "rgba(59,130,246,.18)",
  },
  {
    icon: "🎙", title: "Mock Interview",
    desc: "Practice DSA, OOPs, System Design & HR with AI questions. Get scored instantly.",
    cta: "Start Interview", path: "/app/interview",
    accent: "#0d9488", bg: "rgba(13,148,136,.06)", border: "rgba(13,148,136,.18)",
  },
  {
    icon: "📊", title: "Performance",
    desc: "See your score trends, topic breakdowns, and a personalised improvement plan.",
    cta: "View Analytics", path: "/app/performance",
    accent: "#7c3aed", bg: "rgba(124,58,237,.06)", border: "rgba(124,58,237,.18)",
  },
];

const recentActivity = [
  { type: "interview", label: "Hard Interview", score: 79, date: "Mar 17", color: "#3b82f6" },
  { type: "resume",    label: "Resume — SWE",   score: 81, date: "Mar 14", color: "#0d9488" },
  { type: "interview", label: "Hard Interview", score: 76, date: "Mar 15", color: "#3b82f6" },
  { type: "resume",    label: "Resume — SWE",   score: 75, date: "Mar 5",  color: "#0d9488" },
];

function gradeColor(s) {
  if (s >= 80) return "#0d9488";
  if (s >= 65) return "#d97706";
  if (s >= 50) return "#ea580c";
  return "#dc2626";
}

function useCounter(target, duration = 1000) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      start = Math.min(start + step, target);
      setVal(Math.floor(start));
      if (start >= target) clearInterval(t);
    }, 16);
    return () => clearInterval(t);
  }, [target]);
  return val;
}

function AnimStat({ value, suffix }) {
  const v = useCounter(Number(value));
  return <span>{v}{suffix}</span>;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
.db-wrap { padding: 2rem 2rem 3rem; max-width: 1100px; font-family: 'Plus Jakarta Sans', sans-serif; color: #0f172a; }
.db-hdr { margin-bottom: 2rem; opacity: 0; transform: translateY(12px); transition: opacity .5s, transform .5s; }
.db-hdr.in { opacity: 1; transform: none; }
.db-tag { display: inline-flex; align-items: center; gap: .4rem; padding: .2rem .75rem; border-radius: 999px; border: 1px solid #dbeafe; background: #eff6ff; font-family: 'DM Mono', monospace; font-size: .62rem; letter-spacing: 2px; color: #3b82f6; text-transform: uppercase; margin-bottom: .65rem; }
.db-tag::before { content: ''; width: 5px; height: 5px; border-radius: 50%; background: #3b82f6; animation: db-blink 1.6s ease-in-out infinite; }
@keyframes db-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
.db-title { font-family: 'Instrument Serif', serif; font-size: 2rem; font-weight: 400; color: #0f172a; line-height: 1.1; letter-spacing: -.3px; }
.db-title em { font-style: italic; color: #3b82f6; }
.db-sub { font-size: .88rem; color: #64748b; margin-top: .3rem; }
.db-banner { display: flex; align-items: center; gap: 1rem; background: linear-gradient(135deg, #eff6ff, #f0f9ff); border: 1px solid #bfdbfe; border-radius: 14px; padding: 1rem 1.4rem; margin-bottom: 1.75rem; opacity: 0; transform: translateY(10px); transition: opacity .5s .06s, transform .5s .06s; }
.db-banner.in { opacity: 1; transform: none; }
.db-banner-ico { font-size: 1.6rem; flex-shrink: 0; }
.db-banner-body h4 { font-size: .9rem; font-weight: 700; color: #1e3a5f; margin-bottom: .15rem; }
.db-banner-body p  { font-size: .78rem; color: #64748b; }
.db-banner-streak { margin-left: auto; font-family: 'Instrument Serif', serif; font-size: 1.8rem; color: #3b82f6; flex-shrink: 0; }
.db-kpis { display: grid; grid-template-columns: repeat(4,1fr); gap: 1rem; margin-bottom: 1.75rem; opacity: 0; transform: translateY(14px); transition: opacity .55s .05s, transform .55s .05s; }
.db-kpis.in { opacity: 1; transform: none; }
.db-kpi { background: #fff; border: 1px solid #e8edf5; border-radius: 16px; padding: 1.2rem 1.3rem; position: relative; overflow: hidden; transition: box-shadow .18s, transform .18s; cursor: default; }
.db-kpi:hover { box-shadow: 0 8px 28px rgba(15,23,42,.08); transform: translateY(-2px); }
.db-kpi-bar { position: absolute; top: 0; left: 0; right: 0; height: 3px; border-radius: 16px 16px 0 0; }
.db-kpi-icon { font-size: 1.3rem; margin-bottom: .5rem; }
.db-kpi-val { font-family: 'Instrument Serif', serif; font-size: 2rem; font-weight: 400; line-height: 1; color: #0f172a; margin-bottom: .3rem; }
.db-kpi-lbl { font-size: .67rem; font-family: 'DM Mono', monospace; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; margin-bottom: .3rem; }
.db-kpi-delta { font-size: .7rem; font-family: 'DM Mono', monospace; color: #0d9488; font-weight: 600; }
.db-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem; opacity: 0; transform: translateY(14px); transition: opacity .55s .12s, transform .55s .12s; }
.db-row.in { opacity: 1; transform: none; }
.db-card { background: #fff; border: 1px solid #e8edf5; border-radius: 16px; padding: 1.35rem 1.5rem; transition: box-shadow .18s; }
.db-card:hover { box-shadow: 0 4px 18px rgba(15,23,42,.06); }
.db-ctitle { font-size: .65rem; font-family: 'DM Mono', monospace; letter-spacing: 1.5px; text-transform: uppercase; color: #94a3b8; display: flex; align-items: center; gap: .4rem; margin-bottom: 1rem; }
.db-ctitle::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; }
.db-actions { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; opacity: 0; transform: translateY(14px); transition: opacity .55s .18s, transform .55s .18s; }
.db-actions.in { opacity: 1; transform: none; }
.db-action { border-radius: 16px; padding: 1.5rem 1.4rem; border: 1.5px solid; cursor: pointer; transition: all .2s; display: flex; flex-direction: column; gap: .5rem; }
.db-action:hover { transform: translateY(-3px); box-shadow: 0 10px 30px rgba(15,23,42,.09); }
.db-action-ico { font-size: 1.8rem; margin-bottom: .25rem; }
.db-action-title { font-size: .95rem; font-weight: 700; color: #0f172a; }
.db-action-desc  { font-size: .8rem; color: #64748b; line-height: 1.55; flex: 1; }
.db-action-cta { display: inline-flex; align-items: center; gap: .4rem; font-size: .8rem; font-weight: 700; margin-top: .4rem; transition: gap .18s; }
.db-action:hover .db-action-cta { gap: .65rem; }
.db-activity { display: flex; flex-direction: column; gap: 0; }
.db-arow { display: flex; align-items: center; gap: .85rem; padding: .7rem .5rem; border-bottom: 1px solid #f8fafc; transition: background .15s; }
.db-arow:last-child { border-bottom: none; }
.db-arow:hover { background: #fafbfd; border-radius: 8px; }
.db-arow-ico { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: .95rem; flex-shrink: 0; }
.db-arow-label { font-size: .84rem; font-weight: 600; color: #1e293b; flex: 1; }
.db-arow-date  { font-size: .7rem; font-family: 'DM Mono', monospace; color: #94a3b8; margin-right: .5rem; }
.db-score { padding: .18rem .55rem; border-radius: 999px; font-family: 'DM Mono', monospace; font-size: .7rem; font-weight: 700; }
.db-mbar-list { display: flex; flex-direction: column; gap: .85rem; }
.db-mbar-top  { display: flex; justify-content: space-between; align-items: center; margin-bottom: .3rem; }
.db-mbar-name { font-size: .82rem; font-weight: 600; color: #334155; }
.db-mbar-pct  { font-family: 'DM Mono', monospace; font-size: .73rem; }
.db-mbar-track{ height: 6px; background: #f1f5f9; border-radius: 999px; overflow: hidden; }
.db-mbar-fill { height: 100%; border-radius: 999px; transition: width 1.1s cubic-bezier(.22,1,.36,1); }
@media(max-width:900px){ .db-kpis{grid-template-columns:1fr 1fr} .db-row{grid-template-columns:1fr} .db-actions{grid-template-columns:1fr} }
@media(max-width:640px){ .db-kpis{grid-template-columns:1fr 1fr} .db-wrap{padding:1.25rem 1rem 2.5rem} }
`;

export default function Dashboard() {
  const [mounted, setMounted] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth(); // ✅ CORRECT: inside the component

  useEffect(() => { setTimeout(() => setMounted(true), 60); }, []);

  const topicScores = [
    { name: "DSA",           val: 76, color: "#3b82f6" },
    { name: "OOPs",          val: 72, color: "#0d9488" },
    { name: "System Design", val: 64, color: "#f59e0b" },
    { name: "HR",            val: 88, color: "#ec4899" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="db-wrap">

        {/* Header */}
        <div className={`db-hdr ${mounted ? "in" : ""}`}>
          <div className="db-tag">Home · Overview</div>
          <h1 className="db-title">Welcome back, <em>{user?.name || "there"}</em> 👋</h1>
          <p className="db-sub">Here's a summary of your interview preparation progress.</p>
        </div>

        {/* Milestone banner */}
        <div className={`db-banner ${mounted ? "in" : ""}`}>
          <div className="db-banner-ico">🔥</div>
          <div className="db-banner-body">
            <h4>You're on a 5-day streak — personal best!</h4>
            <p>Your last interview scored 79% — your highest yet. Next goal: Score 80+ in System Design.</p>
          </div>
          <div className="db-banner-streak">+18%</div>
        </div>

        {/* KPI Strip */}
        <div className={`db-kpis ${mounted ? "in" : ""}`}>
          {stats.map((s, i) => (
            <div className="db-kpi" key={i}>
              <div className="db-kpi-bar" style={{ background: s.color }} />
              <div className="db-kpi-icon">{s.icon}</div>
              <div className="db-kpi-val" style={{ color: s.color }}>
                <AnimStat value={s.value} suffix={s.suffix} />
              </div>
              <div className="db-kpi-lbl">{s.label}</div>
              <div className="db-kpi-delta">{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className={`db-actions ${mounted ? "in" : ""}`} style={{ marginBottom: "1.25rem" }}>
          {quickActions.map((a, i) => (
            <div
              key={i}
              className="db-action"
              style={{ background: a.bg, borderColor: a.border }}
              onClick={() => navigate(a.path)}
            >
              <div className="db-action-ico">{a.icon}</div>
              <div className="db-action-title">{a.title}</div>
              <div className="db-action-desc">{a.desc}</div>
              <div className="db-action-cta" style={{ color: a.accent }}>{a.cta} →</div>
            </div>
          ))}
        </div>

        {/* Bottom row: activity + topic scores */}
        <div className={`db-row ${mounted ? "in" : ""}`}>

          {/* Recent Activity */}
          <div className="db-card">
            <div className="db-ctitle">Recent Activity</div>
            <div className="db-activity">
              {recentActivity.map((a, i) => {
                const gc = gradeColor(a.score);
                return (
                  <div className="db-arow" key={i}>
                    <div className="db-arow-ico" style={{ background: `${a.color}12`, border: `1px solid ${a.color}25` }}>
                      {a.type === "interview" ? "🎙" : "📄"}
                    </div>
                    <span className="db-arow-label">{a.label}</span>
                    <span className="db-arow-date">{a.date}</span>
                    <span className="db-score" style={{ background: `${gc}12`, color: gc, border: `1px solid ${gc}28` }}>
                      {a.score}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Topic breakdown */}
          <div className="db-card">
            <div className="db-ctitle">Interview Topic Avg</div>
            <div className="db-mbar-list">
              {topicScores.map((t, i) => (
                <div key={i}>
                  <div className="db-mbar-top">
                    <span className="db-mbar-name">{t.name}</span>
                    <span className="db-mbar-pct" style={{ color: t.color }}>{t.val}%</span>
                  </div>
                  <div className="db-mbar-track">
                    <div className="db-mbar-fill" style={{ width: `${t.val}%`, background: t.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
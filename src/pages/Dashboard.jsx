import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getSocket } from "../services/socket";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// ================= STYLES =================
// Scoped entirely to .db-wrap — does NOT override body, html, or use
// fixed/absolute positioning outside the component. Your sidebar is safe.

const scopedStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

  .db-wrap {
    position: relative;
    padding: 2rem 2rem 3rem;
    overflow: hidden;
    font-family: 'DM Sans', sans-serif;
  }

  /* Soft radial glows contained inside the component */
  .db-wrap::before {
    content: '';
    position: absolute;
    top: -100px; right: -60px;
    width: 480px; height: 380px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(99,102,241,.11) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .db-wrap::after {
    content: '';
    position: absolute;
    bottom: 0; left: 5%;
    width: 360px; height: 260px;
    border-radius: 50%;
    background: radial-gradient(ellipse, rgba(13,148,136,.08) 0%, transparent 70%);
    pointer-events: none;
    z-index: 0;
  }

  .db-wrap > * { position: relative; z-index: 1; }

  /* ===== HEADER ===== */
  .db-hdr { margin-bottom: 2.25rem; }

  .db-tag {
    font-size: .68rem;
    letter-spacing: .18em;
    text-transform: uppercase;
    color: rgba(99,102,241,.75);
    margin-bottom: .6rem;
    font-weight: 500;
  }

  .db-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.55rem, 2.8vw, 2.3rem);
    font-weight: 800;
    line-height: 1.15;
    background: linear-gradient(125deg, var(--text-primary, #1e293b) 15%, #6366f1 55%, #0d9488 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: .4rem;
  }

  .db-title em { font-style: normal; }

  .db-sub {
    font-size: .87rem;
    opacity: .5;
    font-weight: 300;
  }

  .db-hdr-line {
    margin-top: 1.2rem;
    height: 1px;
    background: linear-gradient(90deg, rgba(99,102,241,.35) 0%, rgba(13,148,136,.2) 50%, transparent 100%);
    border-radius: 1px;
    transform-origin: left;
  }

  /* ===== GLASS — works over your existing card/bg colour ===== */
  .glass {
    background: rgba(255,255,255,.05);
    backdrop-filter: blur(14px) saturate(140%);
    -webkit-backdrop-filter: blur(14px) saturate(140%);
    border: 1px solid rgba(255,255,255,.09);
    border-radius: 16px;
  }

  /* ===== KPI STRIP ===== */
  .db-kpis {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(165px, 1fr));
    gap: 1rem;
    margin-bottom: 1.4rem;
  }

  .db-kpi {
    padding: 1.25rem 1.2rem 1.1rem;
    position: relative;
    overflow: hidden;
    cursor: default;
  }

  .db-kpi-bar {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    border-radius: 16px 16px 0 0;
  }

  .db-kpi-icon { font-size: 1.3rem; margin-bottom: .7rem; }

  .db-kpi-val {
    font-family: 'Syne', sans-serif;
    font-size: 1.8rem;
    font-weight: 800;
    line-height: 1;
    margin-bottom: .22rem;
  }

  .db-kpi-lbl {
    font-size: .72rem;
    opacity: .48;
    letter-spacing: .04em;
    margin-bottom: .28rem;
  }

  .db-kpi-delta {
    font-size: .68rem;
    color: #0d9488;
    font-weight: 500;
  }

  /* ===== QUICK ACTIONS ===== */
  .db-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1.4rem;
  }

  .db-action {
    padding: 1.35rem 1.25rem;
    border-radius: 16px;
    border: 1px solid transparent;
    cursor: pointer;
    position: relative;
    overflow: hidden;
  }

  .db-action-ico { font-size: 1.75rem; margin-bottom: .8rem; }

  .db-action-title {
    font-family: 'Syne', sans-serif;
    font-size: .97rem;
    font-weight: 700;
    margin-bottom: .32rem;
  }

  .db-action-desc {
    font-size: .77rem;
    opacity: .48;
    line-height: 1.5;
    margin-bottom: .8rem;
    font-weight: 300;
  }

  .db-action-cta {
    font-size: .77rem;
    font-weight: 600;
    letter-spacing: .02em;
    display: inline-flex;
    align-items: center;
    gap: .26rem;
    transition: gap .16s ease;
  }

  .db-action:hover .db-action-cta { gap: .48rem; }

  /* ===== CHART ROW ===== */
  .db-chart-row {
    display: grid;
    grid-template-columns: 1.35fr 1fr;
    gap: 1rem;
    margin-bottom: 1.4rem;
  }

  @media (max-width: 860px) { .db-chart-row { grid-template-columns: 1fr; } }

  /* ===== BOTTOM ROW ===== */
  .db-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  @media (max-width: 760px) { .db-row { grid-template-columns: 1fr; } }

  .db-card { padding: 1.35rem 1.25rem; }

  .db-ctitle {
    font-family: 'Syne', sans-serif;
    font-size: .62rem;
    font-weight: 700;
    opacity: .5;
    margin-bottom: 1rem;
    letter-spacing: .14em;
    text-transform: uppercase;
  }

  /* ===== ACTIVITY ===== */
  .db-activity { display: flex; flex-direction: column; gap: .55rem; }

  .db-arow {
    display: flex;
    align-items: center;
    gap: .75rem;
    padding: .55rem .75rem;
    border-radius: 10px;
    background: rgba(255,255,255,.03);
    border: 1px solid rgba(255,255,255,.055);
    transition: background .15s;
    cursor: default;
  }

  .db-arow:hover { background: rgba(255,255,255,.06); }

  .db-arow-ico {
    width: 30px; height: 30px;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    font-size: .85rem;
    flex-shrink: 0;
  }

  .db-arow-label { flex: 1; font-size: .78rem; opacity: .72; }
  .db-arow-date  { font-size: .68rem; opacity: .33; }

  .db-score {
    font-size: .68rem;
    font-weight: 600;
    padding: .16rem .46rem;
    border-radius: 5px;
    letter-spacing: .02em;
  }

  /* ===== MINI BARS ===== */
  .db-mbar-list { display: flex; flex-direction: column; gap: .85rem; }

  .db-mbar-top { display: flex; justify-content: space-between; margin-bottom: .3rem; }
  .db-mbar-name { font-size: .77rem; opacity: .58; }
  .db-mbar-pct  { font-size: .77rem; font-weight: 600; }

  .db-mbar-track {
    height: 5px;
    background: rgba(255,255,255,.07);
    border-radius: 99px;
    overflow: hidden;
  }

  .db-mbar-fill { height: 100%; border-radius: 99px; }

  /* ===== RECHARTS ===== */
  .recharts-text { fill: rgba(150,160,180,.55) !important; font-size: .67rem !important; }
  .recharts-cartesian-grid-horizontal line,
  .recharts-cartesian-grid-vertical line { stroke: rgba(255,255,255,.05) !important; }

  .db-tooltip {
    background: rgba(15,20,40,.88);
    border: 1px solid rgba(255,255,255,.1);
    border-radius: 8px;
    padding: .45rem .75rem;
    font-size: .73rem;
    color: #e2e8f0;
    backdrop-filter: blur(10px);
  }
`;

if (typeof document !== "undefined" && !document.getElementById("db-scoped-styles")) {
  const tag = document.createElement("style");
  tag.id = "db-scoped-styles";
  tag.textContent = scopedStyles;
  document.head.appendChild(tag);
}

// ================= QUICK ACTIONS =================

const quickActions = [
  {
    icon: "📄",
    title: "Resume Upload",
    desc: "Upload your resume and get ATS compatibility score.",
    cta: "Analyse Resume",
    path: "/app/resume",
    accent: "#3b82f6",
    bg: "rgba(59,130,246,.06)",
    border: "rgba(59,130,246,.18)",
  },
  {
    icon: "🎙",
    title: "Mock Interview",
    desc: "Practice AI interviews with realtime feedback.",
    cta: "Start Interview",
    path: "/app/interview",
    accent: "#0d9488",
    bg: "rgba(13,148,136,.06)",
    border: "rgba(13,148,136,.18)",
  },
  {
    icon: "📊",
    title: "Performance",
    desc: "Track your interview growth and analytics.",
    cta: "View Analytics",
    path: "/app/performance",
    accent: "#7c3aed",
    bg: "rgba(124,58,237,.06)",
    border: "rgba(124,58,237,.18)",
  },
];

// ================= HELPERS =================

function gradeColor(s) {
  if (s >= 80) return "#0d9488";
  if (s >= 65) return "#d97706";
  if (s >= 50) return "#ea580c";
  return "#dc2626";
}

// ================= COUNTER =================

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

// ================= CUSTOM TOOLTIP =================

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="db-tooltip">
        <div style={{ opacity: .45, marginBottom: ".12rem" }}>{label}</div>
        <div style={{ fontWeight: 600, color: payload[0].color }}>{payload[0].value}%</div>
      </div>
    );
  }
  return null;
};

// ================= MOTION VARIANTS =================

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.46, delay: i * 0.07, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

// Sample area data — swap with real API data when available
const areaData = [
  { week: "W1", score: 42 }, { week: "W2", score: 55 },
  { week: "W3", score: 61 }, { week: "W4", score: 58 },
  { week: "W5", score: 72 }, { week: "W6", score: 80 },
  { week: "W7", score: 76 }, { week: "W8", score: 88 },
];

// ================= DASHBOARD =================

export default function Dashboard() {

  const navigate = useNavigate();

  const { user } = useAuth();

  const [mounted, setMounted] = useState(false);

  // ================= REALTIME STATES =================

  const [stats, setStats] = useState([]);

  const [recentActivity, setRecentActivity] =
    useState([]);

  const [topicScores, setTopicScores] =
    useState([]);

  const [loading, setLoading] =
    useState(true);


  // ================= FETCH DASHBOARD =================

  const fetchDashboardData = async () => {

    try {

      const token =
        localStorage.getItem("token");

      const response = await fetch(
        "`${import.meta.env.VITE_API_URL}/api/dashboard`",
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      console.log("Dashboard Data:", data);

      setStats(data.stats || []);

      setRecentActivity(
        data.recentActivity || []
      );

      setTopicScores(
        data.topicScores || []
      );

    } catch (error) {

      console.log(error);

    } finally {

      setLoading(false);

    }
  };

  useEffect(() => {

    const socket = getSocket();

    if (!socket) return;

    socket.on(
      "dashboardUpdated",
      (data) => {

        console.log(
          "Realtime Dashboard Update:",
          data
        );

        fetchDashboardData();

      }
    );

    return () => {

      socket.off("dashboardUpdated");

    };

  }, []);

  // ================= INITIAL LOAD =================

  useEffect(() => {

    setTimeout(() => setMounted(true), 60);

    fetchDashboardData();

  }, []);


  // ================= REALTIME EVENT LISTENER =================

  useEffect(() => {

    const handleDashboardUpdate = (event) => {

      const { detail } = event;

      console.log("Dashboard Update:", detail);

      if (detail?.type === "newInterview") {

        fetchDashboardData();

      }
    };

    window.addEventListener(
      "dashboardUpdate",
      handleDashboardUpdate
    );

    return () => {

      window.removeEventListener(
        "dashboardUpdate",
        handleDashboardUpdate
      );

    };

  }, []);


  // ================= LOADING =================

  if (loading) {

    return (
      <div style={{ padding: "2rem" }}>
        Loading Dashboard...
      </div>
    );
  }

  const radarData = topicScores.map((t) => ({ subject: t.name, A: t.val }));

  return (

    <div className="db-wrap">

      {/* ================= HEADER ================= */}

      <motion.div
        className="db-hdr"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        <motion.div className="db-tag" variants={fadeUp} custom={0}>
          Home · Overview
        </motion.div>

        <motion.h1 className="db-title" variants={fadeUp} custom={1}>
          Welcome back,
          <em> {user?.name || "there"}</em>{" "}👋
        </motion.h1>

        <motion.p className="db-sub" variants={fadeUp} custom={2}>
          Here's a summary of your interview
          preparation progress.
        </motion.p>

        <motion.div
          className="db-hdr-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.32, duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>


      {/* ================= KPI STRIP ================= */}

      <motion.div
        className="db-kpis"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {stats.map((s, i) => (

          <motion.div
            className="db-kpi glass"
            key={i}
            variants={fadeUp}
            custom={i}
            whileHover={{ y: -5, boxShadow: "0 16px 44px rgba(0,0,0,.22)" }}
            transition={{ type: "spring", stiffness: 300, damping: 22 }}
          >

            <div
              className="db-kpi-bar"
              style={{ background: s.color }}
            />

            <div className="db-kpi-icon">
              {s.icon}
            </div>

            <div
              className="db-kpi-val"
              style={{ color: s.color }}
            >
              <AnimStat
                value={s.value}
                suffix={s.suffix}
              />
            </div>

            <div className="db-kpi-lbl">
              {s.label}
            </div>

            <div className="db-kpi-delta">
              {s.delta}
            </div>

          </motion.div>

        ))}
      </motion.div>


      {/* ================= QUICK ACTIONS ================= */}

      <motion.div
        className="db-actions"
        initial="hidden"
        animate="show"
        variants={stagger}
      >
        {quickActions.map((a, i) => (

          <motion.div
            key={i}
            className="db-action"
            style={{
              background: a.bg,
              borderColor: a.border
            }}
            onClick={() => navigate(a.path)}
            variants={fadeUp}
            custom={i}
            whileHover={{ y: -5, scale: 1.012 }}
            whileTap={{ scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 20 }}
          >

            <motion.div
              className="db-action-ico"
              animate={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4 + i, repeat: Infinity, ease: "easeInOut" }}
            >
              {a.icon}
            </motion.div>

            <div className="db-action-title">
              {a.title}
            </div>

            <div className="db-action-desc">
              {a.desc}
            </div>

            <div
              className="db-action-cta"
              style={{ color: a.accent }}
            >
              {a.cta} →
            </div>

          </motion.div>

        ))}
      </motion.div>


      {/* ================= CHARTS ROW ================= */}

      <motion.div
        className="db-chart-row"
        initial="hidden"
        animate="show"
        variants={stagger}
      >

        {/* Area Chart */}
        <motion.div className="db-card glass" variants={fadeUp} custom={0}>
          <div className="db-ctitle">Score Progression</div>
          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={areaData} margin={{ top: 8, right: 6, left: -22, bottom: 0 }}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6366f1" stopOpacity={0.28} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="week" tick={{ fill: "rgba(150,160,180,.5)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "rgba(150,160,180,.5)", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#6366f1"
                strokeWidth={2}
                fill="url(#scoreGrad)"
                dot={false}
                activeDot={{ r: 4, fill: "#6366f1", stroke: "#fff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        {radarData.length > 0 && (
          <motion.div className="db-card glass" variants={fadeUp} custom={1}>
            <div className="db-ctitle">Topic Radar</div>
            <ResponsiveContainer width="100%" height={185}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,.07)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(150,160,180,.5)", fontSize: 9 }} />
                <Radar
                  name="Score"
                  dataKey="A"
                  stroke="#0d9488"
                  strokeWidth={1.8}
                  fill="rgba(13,148,136,.14)"
                  dot={{ fill: "#0d9488", r: 2.5 }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

      </motion.div>


      {/* ================= BOTTOM SECTION ================= */}

      <motion.div
        className="db-row"
        initial="hidden"
        animate="show"
        variants={stagger}
      >

        {/* ================= RECENT ACTIVITY ================= */}

        <motion.div className="db-card glass" variants={fadeUp} custom={0}>

          <div className="db-ctitle">
            Recent Activity
          </div>

          <div className="db-activity">

            <AnimatePresence>
              {recentActivity.map((a, i) => {

                const gc = gradeColor(a.score);

                return (

                  <motion.div
                    className="db-arow"
                    key={i}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.065, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
                    whileHover={{ x: 3 }}
                  >

                    <div
                      className="db-arow-ico"
                      style={{
                        background: `${a.color}12`,
                        border: `1px solid ${a.color}25`
                      }}
                    >
                      {a.type === "interview" ? "🎙" : "📄"}
                    </div>

                    <span className="db-arow-label">
                      {a.label}
                    </span>

                    <span className="db-arow-date">
                      {a.date}
                    </span>

                    <span
                      className="db-score"
                      style={{
                        background: `${gc}12`,
                        color: gc,
                        border: `1px solid ${gc}28`
                      }}
                    >
                      {a.score}%
                    </span>

                  </motion.div>

                );
              })}
            </AnimatePresence>

          </div>

        </motion.div>


        {/* ================= TOPIC BREAKDOWN ================= */}

        <motion.div className="db-card glass" variants={fadeUp} custom={1}>

          <div className="db-ctitle">
            Interview Topic Avg
          </div>

          <div className="db-mbar-list">

            {topicScores.map((t, i) => (

              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24 + i * 0.07, duration: 0.36 }}
              >

                <div className="db-mbar-top">

                  <span className="db-mbar-name">
                    {t.name}
                  </span>

                  <span
                    className="db-mbar-pct"
                    style={{ color: t.color }}
                  >
                    {t.val}%
                  </span>

                </div>

                <div className="db-mbar-track">

                  <motion.div
                    className="db-mbar-fill"
                    style={{ background: t.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${t.val}%` }}
                    transition={{ delay: 0.3 + i * 0.07, duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  />

                </div>

              </motion.div>

            ))}

          </div>

        </motion.div>

      </motion.div>

    </div>
  );
}
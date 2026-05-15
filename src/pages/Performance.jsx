/**
 * Performance.jsx — content only
 * Rendered inside AppShell which already provides Sidebar + Navbar.
 * NO sidebar, NO full-page shell here — just the content panel.
 *
 * Drop this into src/pages/Performance.jsx and you're done.
 */

import React, { useEffect, useState } from "react";
import axios from "axios";
import { Line, Bar, Radar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement, BarElement, PointElement,
  CategoryScale, LinearScale, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler,
} from "chart.js";

ChartJS.register(
  LineElement, BarElement, PointElement,
  CategoryScale, LinearScale, RadialLinearScale, ArcElement,
  Title, Tooltip, Legend, Filler
);

// ── Mock (used when backend isn't available) ──────────────────────────────────
const MOCK = {
  summary: {
    overallScore: 74, interviewAvg: 68, bestATS: 81,
    streak: 5, totalSessions: 7, improvementRate: "+18%",
    resumeUploads: 4, nextGoal: "Score 80+ in System Design",
  },
  interviewSessions: [
    { date:"Feb 28", difficulty:"Easy",   scores:{DSA:60,OOPs:72,SystemDesign:50,HR:80}, overall:66, duration:"18 min" },
    { date:"Mar 3",  difficulty:"Medium", scores:{DSA:68,OOPs:70,SystemDesign:55,HR:82}, overall:69, duration:"22 min" },
    { date:"Mar 6",  difficulty:"Medium", scores:{DSA:65,OOPs:68,SystemDesign:52,HR:79}, overall:66, duration:"20 min" },
    { date:"Mar 9",  difficulty:"Hard",   scores:{DSA:74,OOPs:75,SystemDesign:60,HR:85}, overall:74, duration:"28 min" },
    { date:"Mar 12", difficulty:"Hard",   scores:{DSA:78,OOPs:72,SystemDesign:62,HR:88}, overall:75, duration:"26 min" },
    { date:"Mar 15", difficulty:"Hard",   scores:{DSA:76,OOPs:74,SystemDesign:65,HR:87}, overall:76, duration:"30 min" },
    { date:"Mar 17", difficulty:"Hard",   scores:{DSA:80,OOPs:78,SystemDesign:68,HR:90}, overall:79, duration:"29 min" },
  ],
  resumeHistory: [
    { date:"Mar 1",  role:"Software Engineer", ats:68, matched:["React","Node.js","REST APIs","Git"],                        missing:["Docker","Kubernetes","System Design"] },
    { date:"Mar 5",  role:"Software Engineer", ats:75, matched:["React","Node.js","REST APIs","Git","TypeScript","AWS"],     missing:["Docker","Kubernetes"] },
    { date:"Mar 10", role:"Data Scientist",    ats:55, matched:["Python","SQL","Pandas"],                                   missing:["TensorFlow","PyTorch","MLOps","Spark"] },
    { date:"Mar 14", role:"Software Engineer", ats:81, matched:["React","Node.js","REST APIs","Git","TypeScript","AWS","Docker"], missing:["Kubernetes"] },
  ],
  lastSessionMetrics: { technicalAccuracy:78, conceptDepth:65, clarity:82, confidence:70 },
  weakAreas:  ["System Design scalability","Dynamic programming","OOP design patterns","Concurrency"],
  strengths:  ["HR communication","Explanation clarity","DSA fundamentals","Resume keywords"],
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function grade(s) {
  if (s>=80) return { label:"Excellent", color:"#0d9488", bg:"rgba(13,148,136,.1)",  border:"rgba(13,148,136,.25)" };
  if (s>=65) return { label:"Good",      color:"#d97706", bg:"rgba(217,119,6,.1)",   border:"rgba(217,119,6,.25)"  };
  if (s>=50) return { label:"Fair",      color:"#ea580c", bg:"rgba(234,88,12,.1)",   border:"rgba(234,88,12,.25)"  };
  return           { label:"Needs Work", color:"#dc2626", bg:"rgba(220,38,38,.08)", border:"rgba(220,38,38,.2)"   };
}

function useCounter(target, dur=1100) {
  const [v,setV]=useState(0);
  useEffect(()=>{
    let s=0; const step=target/(dur/16);
    const t=setInterval(()=>{ s=Math.min(s+step,target); setV(Math.floor(s)); if(s>=target)clearInterval(t); },16);
    return ()=>clearInterval(t);
  },[target]);
  return v;
}
function AnimNum({value,suffix=""}){ const v=useCounter(value); return <span>{v}{suffix}</span>; }

function Pill({score,md}){
  const g=grade(score);
  return <span style={{padding:md?".25rem .72rem":".15rem .52rem",borderRadius:999,background:g.bg,color:g.color,border:`1px solid ${g.border}`,fontFamily:"'DM Mono',monospace",fontSize:md?".76rem":".68rem",fontWeight:600,whiteSpace:"nowrap"}}>{score}% · {g.label}</span>;
}

// ── Chart base options ────────────────────────────────────────────────────────
const M={family:"'DM Mono',monospace",size:11};
const GC="rgba(15,23,42,.055)";
const TC="#94a3b8";
const BASE={
  responsive:true, maintainAspectRatio:false,
  plugins:{
    legend:{labels:{color:TC,font:M,boxWidth:10,padding:12}},
    tooltip:{backgroundColor:"rgba(15,23,42,.9)",titleColor:"#f8fafc",bodyColor:"#cbd5e1",cornerRadius:10,padding:10},
  },
};

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
.pf-wrap { padding:1.75rem 2rem 3rem; max-width:1100px; font-family:'Plus Jakarta Sans',sans-serif; color:#0f172a; }

/* header */
.pf-hdr{margin-bottom:1.5rem;opacity:0;transform:translateY(12px);transition:opacity .5s,transform .5s}
.pf-hdr.in{opacity:1;transform:none}
.pf-tag{display:inline-flex;align-items:center;gap:.4rem;padding:.2rem .7rem;border-radius:999px;border:1px solid #dbeafe;background:#eff6ff;font-family:'DM Mono',monospace;font-size:.6rem;letter-spacing:2px;color:#3b82f6;text-transform:uppercase;margin-bottom:.6rem}
.pf-tag::before{content:'';width:5px;height:5px;border-radius:50%;background:#3b82f6;animation:pf-blink 1.6s ease-in-out infinite}
@keyframes pf-blink{0%,100%{opacity:1}50%{opacity:.2}}
.pf-h1{font-family:'Instrument Serif',serif;font-size:2rem;font-weight:400;color:#0f172a;line-height:1.1;letter-spacing:-.3px}
.pf-h1 em{font-style:italic;color:#3b82f6}
.pf-sub{font-size:.87rem;color:#64748b;margin-top:.3rem}

/* milestone */
.pf-ms{display:flex;align-items:center;gap:1rem;background:linear-gradient(135deg,#eff6ff,#f0f9ff);border:1px solid #bfdbfe;border-radius:14px;padding:1rem 1.35rem;margin-bottom:1.5rem;opacity:0;transform:translateY(10px);transition:opacity .5s .06s,transform .5s .06s}
.pf-ms.in{opacity:1;transform:none}
.pf-ms-ico{font-size:1.6rem;flex-shrink:0}
.pf-ms-body h4{font-size:.9rem;font-weight:700;color:#1e3a5f;margin-bottom:.15rem}
.pf-ms-body p{font-size:.77rem;color:#64748b}
.pf-ms-rate{margin-left:auto;font-family:'Instrument Serif',serif;font-size:1.75rem;color:#3b82f6;flex-shrink:0}

/* tabs */
.pf-tabs{display:flex;gap:.35rem;margin-bottom:1.4rem;border-bottom:1px solid #e8edf5}
.pf-tab{padding:.58rem 1rem;border-radius:8px 8px 0 0;border:1px solid transparent;background:transparent;color:#64748b;font-size:.82rem;font-weight:500;cursor:pointer;transition:all .18s;border-bottom:none;margin-bottom:-1px;font-family:'Plus Jakarta Sans',sans-serif}
.pf-tab:hover{color:#0f172a;background:#f8fafc}
.pf-tab.act{color:#1d4ed8;background:#fff;border-color:#e8edf5 #e8edf5 #fff;font-weight:600}

/* KPI row */
.pf-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1rem;margin-bottom:1.4rem;opacity:0;transform:translateY(14px);transition:opacity .5s .05s,transform .5s .05s}
.pf-kpis.in{opacity:1;transform:none}
.pf-kpi{background:#fff;border:1px solid #e8edf5;border-radius:16px;padding:1.2rem 1.3rem;position:relative;overflow:hidden;transition:box-shadow .18s,transform .18s}
.pf-kpi:hover{box-shadow:0 8px 28px rgba(15,23,42,.07);transform:translateY(-2px)}
.pf-kpi-bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:16px 16px 0 0}
.pf-kpi-lbl{font-size:.67rem;font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:.5rem}
.pf-kpi-val{font-family:'Instrument Serif',serif;font-size:2.1rem;font-weight:400;line-height:1;color:#0f172a;margin-bottom:.35rem}
.pf-kpi-foot{display:flex;align-items:center;gap:.45rem;flex-wrap:wrap}
.pf-delta{font-size:.7rem;font-family:'DM Mono',monospace;font-weight:600}
.pf-delta.up{color:#0d9488} .pf-delta.neu{color:#3b82f6}

/* grid rows */
.pf-r2{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-bottom:1rem;opacity:0;transform:translateY(14px);transition:opacity .5s .1s,transform .5s .1s}
.pf-r2.in{opacity:1;transform:none}
.pf-r1{display:grid;gap:1rem;margin-bottom:1rem;opacity:0;transform:translateY(14px);transition:opacity .5s .12s,transform .5s .12s}
.pf-r1.in{opacity:1;transform:none}

/* card */
.pf-card{background:#fff;border:1px solid #e8edf5;border-radius:16px;padding:1.35rem 1.5rem;transition:box-shadow .18s}
.pf-card:hover{box-shadow:0 4px 18px rgba(15,23,42,.06)}
.pf-ctop{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem}
.pf-ctitle{font-size:.65rem;font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;display:flex;align-items:center;gap:.4rem}
.pf-ctitle::before{content:'';width:6px;height:6px;border-radius:50%;background:#3b82f6;flex-shrink:0}
.pf-cval{font-size:.76rem;font-family:'DM Mono',monospace;color:#475569}
.pf-cw{position:relative}
.pf-cw.h180{height:180px} .pf-cw.h220{height:220px} .pf-cw.h260{height:260px} .pf-cw.h300{height:300px}

/* metric bars */
.pf-mbars{display:flex;flex-direction:column;gap:.82rem}
.pf-mb-top{display:flex;justify-content:space-between;align-items:center;margin-bottom:.28rem}
.pf-mb-name{font-size:.82rem;font-weight:600;color:#334155}
.pf-mb-pct{font-family:'DM Mono',monospace;font-size:.73rem}
.pf-mb-track{height:6px;background:#f1f5f9;border-radius:999px;overflow:hidden}
.pf-mb-fill{height:100%;border-radius:999px;transition:width 1.1s cubic-bezier(.22,1,.36,1)}

/* table */
.pf-tbl-wrap{overflow-x:auto}
.pf-tbl{width:100%;border-collapse:collapse}
.pf-tbl th{font-size:.62rem;font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;padding:.6rem .75rem;text-align:left;background:#f8fafc;border-bottom:1px solid #e8edf5}
.pf-tbl td{padding:.76rem .75rem;font-size:.83rem;border-bottom:1px solid #f8fafc;color:#334155;vertical-align:middle}
.pf-tbl tr:last-child td{border-bottom:none}
.pf-tbl tr:hover td{background:#fafbfd}

/* badges */
.pf-diff{display:inline-block;padding:.14rem .52rem;border-radius:999px;font-size:.65rem;font-family:'DM Mono',monospace;font-weight:600}
.pf-diff.easy{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.pf-diff.medium{background:#fffbeb;color:#d97706;border:1px solid #fde68a}
.pf-diff.hard{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}

/* keyword chips */
.pf-kws{display:flex;flex-wrap:wrap;gap:.28rem;margin-top:.3rem}
.pf-kw{padding:.14rem .48rem;border-radius:6px;font-size:.65rem;font-family:'DM Mono',monospace;font-weight:500}
.pf-kw.m{background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0}
.pf-kw.x{background:#fef2f2;color:#dc2626;border:1px solid #fecaca}

/* sw grid */
.pf-sw{display:grid;grid-template-columns:1fr 1fr;gap:1rem}
.pf-swc{border-radius:12px;padding:1rem 1.1rem}
.pf-swc.str{background:#f0fdf4;border:1px solid #bbf7d0}
.pf-swc.wk{background:#fef2f2;border:1px solid #fecaca}
.pf-swh{font-size:.63rem;font-family:'DM Mono',monospace;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:.65rem;display:flex;align-items:center;gap:.4rem}
.pf-swh.str{color:#16a34a} .pf-swh.wk{color:#dc2626}
.pf-swl{list-style:none;display:flex;flex-direction:column;gap:.4rem}
.pf-swl li{font-size:.82rem;color:#334155;display:flex;align-items:flex-start;gap:.42rem;line-height:1.45}
.pf-swl li::before{content:'';width:6px;height:6px;border-radius:50%;flex-shrink:0;margin-top:.36rem}
.str .pf-swl li::before{background:#16a34a} .wk .pf-swl li::before{background:#dc2626}

/* action plan */
.pf-acts{display:grid;grid-template-columns:repeat(4,1fr);gap:.85rem}
.pf-act{background:#fff;border:1px solid #e8edf5;border-radius:14px;padding:1.1rem;transition:all .18s}
.pf-act:hover{box-shadow:0 6px 18px rgba(15,23,42,.07);transform:translateY(-2px)}
.pf-act-ico{font-size:1.45rem;margin-bottom:.55rem}
.pf-act-title{font-size:.85rem;font-weight:700;color:#0f172a;margin-bottom:.28rem}
.pf-act-desc{font-size:.75rem;color:#64748b;line-height:1.55;margin-bottom:.65rem}
.pf-act-tag{display:inline-block;padding:.17rem .52rem;border-radius:999px;font-size:.62rem;font-family:'DM Mono',monospace;font-weight:600}

.pf-divl{height:1px;background:#f1f5f9;margin:.85rem 0}

@media(max-width:1024px){.pf-acts{grid-template-columns:1fr 1fr}}
@media(max-width:900px){.pf-r2{grid-template-columns:1fr}.pf-kpis{grid-template-columns:1fr 1fr}.pf-sw{grid-template-columns:1fr}}
@media(max-width:640px){.pf-acts{grid-template-columns:1fr}.pf-wrap{padding:1.25rem 1rem 2.5rem}}
`;

// ── Component ─────────────────────────────────────────────────────────────────
export default function Performance() {
  const [d,       setD]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [tab,     setTab]     = useState("overview");

  useEffect(() => {
    axios.get("http://localhost:5001/api/performance")
      .then(r => setD(r.data))
      .catch(() => setD(MOCK))
      .finally(() => { setLoading(false); setTimeout(() => setMounted(true), 80); });
  }, []);

  if (loading || !d) return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"60vh",flexDirection:"column",gap:"1rem",fontFamily:"'Plus Jakarta Sans',sans-serif"}}>
      <div style={{width:36,height:36,border:"3px solid #3b82f6",borderTopColor:"transparent",borderRadius:"50%",animation:"pf-spin .7s linear infinite"}}/>
      <span style={{color:"#64748b",fontSize:".86rem"}}>Loading performance data…</span>
      <style>{`@keyframes pf-spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const S        = d.summary           || MOCK.summary;
  const sessions = d.interviewSessions || MOCK.interviewSessions;
  const resumes  = d.resumeHistory     || MOCK.resumeHistory;
  const metrics  = d.lastSessionMetrics|| MOCK.lastSessionMetrics;

  // derived
  const ss   = sessions.map(s => s.overall);
  const avg  = Math.round(ss.reduce((a,b)=>a+b,0)/ss.length);
  const tAvg = ["DSA","OOPs","SystemDesign","HR"].reduce((acc,t)=>{
    acc[t] = Math.round(sessions.reduce((s,ss)=>s+(ss.scores[t]||0),0)/sessions.length);
    return acc;
  },{});

  const tcols = ["#3b82f6","#0d9488","#f59e0b","#ec4899"];

  // chart data
  const lineData={labels:sessions.map(s=>s.date),datasets:[
    {label:"Score",data:ss,borderColor:"#3b82f6",backgroundColor:"rgba(59,130,246,.06)",tension:.45,fill:true,pointBackgroundColor:"#3b82f6",pointRadius:5,pointHoverRadius:7},
    {label:"Avg",data:Array(sessions.length).fill(avg),borderColor:"#94a3b8",borderDash:[5,4],pointRadius:0},
  ]};
  const lineOpts={...BASE,scales:{x:{grid:{color:GC},ticks:{color:TC,font:M}},y:{min:0,max:100,grid:{color:GC},ticks:{color:TC,font:M,callback:v=>v+"%"}}}};

  const barData={labels:["DSA","OOPs","Sys Design","HR"],datasets:[{label:"Avg Score",data:Object.values(tAvg),
    backgroundColor:tcols.map(c=>c+"BF"),borderColor:tcols,borderWidth:2,borderRadius:8}]};
  const barOpts={...BASE,scales:{x:{grid:{display:false},ticks:{color:TC,font:M}},y:{min:0,max:100,grid:{color:GC},ticks:{color:TC,font:M,callback:v=>v+"%"}}}};

  const radarData={labels:["DSA","OOPs","Sys Design","HR","Clarity","Confidence"],datasets:[{label:"You",
    data:[tAvg.DSA,tAvg.OOPs,tAvg.SystemDesign,tAvg.HR,metrics.clarity,metrics.confidence],
    backgroundColor:"rgba(59,130,246,.1)",borderColor:"#3b82f6",pointBackgroundColor:"#3b82f6",pointRadius:4}]};
  const radarOpts={...BASE,scales:{r:{min:0,max:100,grid:{color:GC},angleLines:{color:GC},pointLabels:{color:"#475569",font:M},ticks:{display:false}}}};

  const donutData={labels:["Technical","Concept","Clarity","Confidence"],datasets:[{
    data:[metrics.technicalAccuracy,metrics.conceptDepth,metrics.clarity,metrics.confidence],
    backgroundColor:tcols.map(c=>c+"CC"),borderColor:tcols,borderWidth:2}]};

  const atsLine={labels:resumes.map(r=>r.date),datasets:[{label:"ATS",data:resumes.map(r=>r.ats),
    borderColor:"#0d9488",backgroundColor:"rgba(13,148,136,.07)",tension:.4,fill:true,pointBackgroundColor:"#0d9488",pointRadius:5}]};

  const mList=[
    {label:"Technical Accuracy",val:metrics.technicalAccuracy,color:"#3b82f6"},
    {label:"Concept Depth",     val:metrics.conceptDepth,     color:"#0d9488"},
    {label:"Clarity",           val:metrics.clarity,          color:"#f59e0b"},
    {label:"Confidence",        val:metrics.confidence,       color:"#ec4899"},
  ];
  const acts=[
    {ico:"📚",title:"System Design Deep Dive",desc:"Study distributed systems, CAP theorem and caching.",tag:"High Priority",tc:"#dc2626"},
    {ico:"💻",title:"LeetCode Hard Practice",  desc:"Solve DP and graph problems daily.",               tag:"Medium",       tc:"#d97706"},
    {ico:"🗣",title:"Mock Interview Booking",  desc:"Peer mock to build real-time confidence.",         tag:"Recommended",  tc:"#3b82f6"},
    {ico:"📄",title:"Resume Keyword Update",   desc:"Add missing skills from your last ATS scan.",      tag:"Quick Win",    tc:"#0d9488"},
  ];
  const ovG = grade(S.overallScore);

  return (
    <>
      <style>{CSS}</style>
      <div className="pf-wrap">

        {/* Header */}
        <div className={`pf-hdr ${mounted?"in":""}`}>
          <div className="pf-tag">Analytics · All Time</div>
          <h1 className="pf-h1">Your <em>performance</em> at a glance</h1>
          <p className="pf-sub">Unified insights from all your interview sessions and resume uploads.</p>
        </div>

        {/* Milestone */}
        <div className={`pf-ms ${mounted?"in":""}`}>
          <div className="pf-ms-ico">🎯</div>
          <div className="pf-ms-body">
            <h4>Next Milestone — {S.nextGoal}</h4>
            <p>Your last 3 sessions show consistent improvement across all topics.</p>
          </div>
          <div className="pf-ms-rate">{S.improvementRate}</div>
        </div>

        {/* Tabs */}
        <div className="pf-tabs">
          {[["overview","Overview"],["interview","Interview"],["resume","Resume"],["skills","Skills"]].map(([id,lbl])=>(
            <button key={id} className={`pf-tab ${tab===id?"act":""}`} onClick={()=>setTab(id)}>{lbl}</button>
          ))}
        </div>

        {/* ══ OVERVIEW ══ */}
        {tab==="overview" && (<>
          <div className={`pf-kpis ${mounted?"in":""}`}>
            {[
              {lbl:"Overall Score",  val:S.overallScore,  sfx:"%",     ac:ovG.color,   delta:S.improvementRate,       dt:"up",  pill:true  },
              {lbl:"Interview Avg",  val:S.interviewAvg,  sfx:"%",     ac:"#3b82f6",   delta:S.totalSessions+" sessions", dt:"neu", pill:false },
              {lbl:"Best ATS Score", val:S.bestATS,       sfx:"%",     ac:"#0d9488",   delta:"↑ Improving",           dt:"up",  pill:true  },
              {lbl:"Day Streak",     val:S.streak,        sfx:" days", ac:"#f59e0b",   delta:"Keep going!",           dt:"up",  pill:false },
            ].map((k,i)=>(
              <div className="pf-kpi" key={i}>
                <div className="pf-kpi-bar" style={{background:k.ac}}/>
                <div className="pf-kpi-lbl">{k.lbl}</div>
                <div className="pf-kpi-val"><AnimNum value={k.val} suffix={k.sfx}/></div>
                <div className="pf-kpi-foot">
                  <span className={`pf-delta ${k.dt}`}>{k.delta}</span>
                  {k.pill && <Pill score={k.val}/>}
                </div>
              </div>
            ))}
          </div>

          <div className={`pf-r2 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Score Trend</span><span className="pf-cval">Avg {avg}%</span></div>
              <div className="pf-cw h220"><Line data={lineData} options={lineOpts}/></div>
            </div>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Skill Radar</span></div>
              <div className="pf-cw h220"><Radar data={radarData} options={radarOpts}/></div>
            </div>
          </div>

          <div className={`pf-r2 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Strengths &amp; Weak Areas</span></div>
              <div className="pf-sw">
                <div className="pf-swc str">
                  <div className="pf-swh str">✦ Strengths</div>
                  <ul className="pf-swl str">{(d.strengths||MOCK.strengths).map((s,i)=><li key={i}>{s}</li>)}</ul>
                </div>
                <div className="pf-swc wk">
                  <div className="pf-swh wk">✦ Weak Areas</div>
                  <ul className="pf-swl wk">{(d.weakAreas||MOCK.weakAreas).map((w,i)=><li key={i}>{w}</li>)}</ul>
                </div>
              </div>
            </div>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Topic Avg Scores</span></div>
              <div className="pf-cw h220"><Bar data={barData} options={barOpts}/></div>
            </div>
          </div>
        </>)}

        {/* ══ INTERVIEW ══ */}
        {tab==="interview" && (<>
          <div className={`pf-r2 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Session Score Trend</span><span className="pf-cval">{sessions.length} sessions</span></div>
              <div className="pf-cw h260"><Line data={lineData} options={lineOpts}/></div>
            </div>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Last Session Metrics</span></div>
              <div style={{display:"flex",gap:"1rem",alignItems:"flex-start"}}>
                <div style={{flex:1}}>
                  <div className="pf-mbars">
                    {mList.map(m=>(
                      <div key={m.label}>
                        <div className="pf-mb-top"><span className="pf-mb-name">{m.label}</span><span className="pf-mb-pct" style={{color:m.color}}>{m.val}%</span></div>
                        <div className="pf-mb-track"><div className="pf-mb-fill" style={{width:m.val+"%",background:m.color}}/></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{flexShrink:0,width:110,height:110}}>
                  <Doughnut data={donutData} options={{...BASE,cutout:"68%",plugins:{...BASE.plugins,legend:{display:false}}}}/>
                </div>
              </div>
            </div>
          </div>

          <div className={`pf-r1 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">All Sessions</span><span className="pf-cval">{sessions.length} total</span></div>
              <div className="pf-tbl-wrap">
                <table className="pf-tbl">
                  <thead><tr><th>Date</th><th>Difficulty</th><th>Score</th><th>Duration</th><th>DSA</th><th>OOPs</th><th>Sys Design</th><th>HR</th></tr></thead>
                  <tbody>
                    {[...sessions].reverse().map((s,i)=>{
                      const g=grade(s.overall);
                      return(
                        <tr key={i}>
                          <td style={{fontFamily:"'DM Mono',monospace",fontSize:".72rem",color:"#94a3b8"}}>{s.date}</td>
                          <td><span className={`pf-diff ${s.difficulty.toLowerCase()}`}>{s.difficulty}</span></td>
                          <td><span style={{fontFamily:"'DM Mono',monospace",fontWeight:700,color:g.color}}>{s.overall}%</span></td>
                          <td style={{fontFamily:"'DM Mono',monospace",fontSize:".72rem",color:"#94a3b8"}}>{s.duration}</td>
                          <td style={{fontFamily:"'DM Mono',monospace",fontSize:".75rem"}}>{s.scores.DSA}%</td>
                          <td style={{fontFamily:"'DM Mono',monospace",fontSize:".75rem"}}>{s.scores.OOPs}%</td>
                          <td style={{fontFamily:"'DM Mono',monospace",fontSize:".75rem"}}>{s.scores.SystemDesign}%</td>
                          <td style={{fontFamily:"'DM Mono',monospace",fontSize:".75rem"}}>{s.scores.HR}%</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>)}

        {/* ══ RESUME ══ */}
        {tab==="resume" && (<>
          <div className={`pf-r2 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">ATS Score History</span><span className="pf-cval">Best: {Math.max(...resumes.map(r=>r.ats))}%</span></div>
              <div className="pf-cw h260"><Line data={atsLine} options={lineOpts}/></div>
            </div>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">ATS Per Upload</span></div>
              <div className="pf-mbars">
                {resumes.map((r,i)=>{const g=grade(r.ats); return(
                  <div key={i}>
                    <div className="pf-mb-top"><span className="pf-mb-name" style={{fontSize:".78rem"}}>{r.date} · {r.role}</span><span className="pf-mb-pct" style={{color:g.color}}>{r.ats}%</span></div>
                    <div className="pf-mb-track"><div className="pf-mb-fill" style={{width:r.ats+"%",background:g.color}}/></div>
                  </div>
                );})}
              </div>
            </div>
          </div>

          <div className={`pf-r1 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Upload History &amp; Keyword Analysis</span></div>
              <div className="pf-tbl-wrap">
                <table className="pf-tbl">
                  <thead><tr><th>Date</th><th>Target Role</th><th>ATS Score</th><th>Matched Skills</th><th>Missing Skills</th></tr></thead>
                  <tbody>
                    {[...resumes].reverse().map((r,i)=>(
                      <tr key={i}>
                        <td style={{fontFamily:"'DM Mono',monospace",fontSize:".72rem",color:"#94a3b8",whiteSpace:"nowrap"}}>{r.date}</td>
                        <td style={{fontWeight:600}}>{r.role}</td>
                        <td><Pill score={r.ats} md/></td>
                        <td><div className="pf-kws">{r.matched.map((k,j)=><span key={j} className="pf-kw m">{k}</span>)}</div></td>
                        <td><div className="pf-kws">{r.missing.map((k,j)=><span key={j} className="pf-kw x">{k}</span>)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>)}

        {/* ══ SKILLS ══ */}
        {tab==="skills" && (<>
          <div className={`pf-r2 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Topic Performance</span></div>
              <div className="pf-mbars">
                {Object.entries(tAvg).map(([t,v],i)=>(
                  <div key={t}>
                    <div className="pf-mb-top"><span className="pf-mb-name">{t==="SystemDesign"?"System Design":t}</span><Pill score={v}/></div>
                    <div className="pf-mb-track"><div className="pf-mb-fill" style={{width:v+"%",background:tcols[i%4]}}/></div>
                  </div>
                ))}
                <div className="pf-divl"/>
                {mList.slice(2).map(m=>(
                  <div key={m.label}>
                    <div className="pf-mb-top"><span className="pf-mb-name">{m.label}</span><span className="pf-mb-pct" style={{color:m.color}}>{m.val}%</span></div>
                    <div className="pf-mb-track"><div className="pf-mb-fill" style={{width:m.val+"%",background:m.color}}/></div>
                  </div>
                ))}
              </div>
            </div>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Full Skill Radar</span></div>
              <div className="pf-cw h300"><Radar data={radarData} options={radarOpts}/></div>
            </div>
          </div>

          <div className={`pf-r1 ${mounted?"in":""}`}>
            <div className="pf-card">
              <div className="pf-ctop"><span className="pf-ctitle">Personalised Action Plan</span></div>
              <div className="pf-acts">
                {acts.map((a,i)=>(
                  <div className="pf-act" key={i}>
                    <div className="pf-act-ico">{a.ico}</div>
                    <div className="pf-act-title">{a.title}</div>
                    <div className="pf-act-desc">{a.desc}</div>
                    <span className="pf-act-tag" style={{background:`${a.tc}10`,color:a.tc,border:`1px solid ${a.tc}25`}}>{a.tag}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>)}

      </div>
    </>
  );
}
/**
 * pages/Login.jsx
 */

import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import axios from "axios";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body { background: #0c1220; font-family: 'Plus Jakarta Sans', sans-serif; }

.lg-root { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; overflow:hidden; }

/* ── LEFT ── */
.lg-left { position:relative; background:#0c1220; display:flex; flex-direction:column; justify-content:space-between; padding:3rem; overflow:hidden; min-height:100vh; }
.lg-left::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(59,130,246,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.06) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; }
.lg-orb { position:absolute; border-radius:50%; pointer-events:none; animation:lg-float ease-in-out infinite; }
@keyframes lg-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-22px) scale(1.06)} }

.lg-brand { position:relative; z-index:2; display:flex; align-items:center; gap:.85rem; }
.lg-brand-mark { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#3b82f6,#6366f1); display:flex; align-items:center; justify-content:center; font-family:'Instrument Serif',serif; font-size:1.2rem; color:#fff; box-shadow:0 4px 20px rgba(59,130,246,.4); }
.lg-brand-name { font-family:'Instrument Serif',serif; font-size:1.3rem; color:#fff; letter-spacing:-.3px; }

.lg-hero { position:relative; z-index:2; flex:1; display:flex; flex-direction:column; justify-content:center; padding:2rem 0; }
.lg-hero-tag { display:inline-flex; align-items:center; gap:.45rem; padding:.28rem .85rem; border-radius:999px; border:1px solid rgba(59,130,246,.35); background:rgba(59,130,246,.1); font-family:'DM Mono',monospace; font-size:.65rem; letter-spacing:2px; color:#93c5fd; text-transform:uppercase; margin-bottom:1.5rem; width:fit-content; }
.lg-hero-tag::before { content:''; width:5px; height:5px; border-radius:50%; background:#3b82f6; animation:lg-blink 1.6s ease-in-out infinite; }
@keyframes lg-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
.lg-h1 { font-family:'Instrument Serif',serif; font-size:clamp(2.4rem,4vw,3.4rem); font-weight:400; line-height:1.1; letter-spacing:-.5px; color:#fff; margin-bottom:1.25rem; }
.lg-h1 em { font-style:italic; color:#60a5fa; }
.lg-desc { font-size:.92rem; color:#64748b; line-height:1.7; max-width:380px; margin-bottom:2.5rem; }
.lg-features { display:flex; flex-direction:column; gap:.75rem; }
.lg-feat { display:flex; align-items:center; gap:.75rem; font-size:.85rem; color:#94a3b8; }
.lg-feat-dot { width:28px; height:28px; border-radius:8px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-size:.9rem; }

.lg-stats { position:relative; z-index:2; display:flex; gap:2rem; border-top:1px solid rgba(255,255,255,.07); padding-top:1.75rem; }
.lg-stat-num { font-family:'Instrument Serif',serif; font-size:1.8rem; color:#fff; line-height:1; }
.lg-stat-lbl { font-size:.65rem; font-family:'DM Mono',monospace; letter-spacing:1.5px; text-transform:uppercase; color:#475569; margin-top:.2rem; }

/* ── RIGHT ── */
.lg-right { display:flex; align-items:center; justify-content:center; padding:3rem 2rem; background:#f8f9fc; }
.lg-form-wrap { width:100%; max-width:420px; opacity:0; transform:translateY(20px); animation:lg-fadein .6s .1s ease forwards; }
@keyframes lg-fadein { to { opacity:1; transform:none; } }

.lg-form-header { margin-bottom:2rem; }
.lg-form-title { font-family:'Instrument Serif',serif; font-size:1.85rem; font-weight:400; color:#0f172a; line-height:1.2; letter-spacing:-.3px; margin-bottom:.4rem; }
.lg-form-title em { font-style:italic; color:#3b82f6; }
.lg-form-sub { font-size:.85rem; color:#64748b; }

.lg-error { display:flex; align-items:flex-start; gap:.55rem; background:rgba(220,38,38,.07); border:1px solid rgba(220,38,38,.2); border-radius:10px; padding:.75rem 1rem; margin-bottom:1.1rem; font-size:.82rem; color:#dc2626; font-family:'DM Mono',monospace; animation:lg-fadein .25s ease; line-height:1.5; }

.lg-field { margin-bottom:1.1rem; }
.lg-label { display:block; font-size:.72rem; font-family:'DM Mono',monospace; letter-spacing:1.5px; text-transform:uppercase; color:#64748b; margin-bottom:.45rem; }
.lg-input-wrap { position:relative; }
.lg-input { width:100%; padding:.85rem 1rem .85rem 2.75rem; border:1.5px solid #e2e8f0; border-radius:12px; background:#fff; color:#0f172a; font-family:'Plus Jakarta Sans',sans-serif; font-size:.92rem; outline:none; transition:border-color .18s,box-shadow .18s; }
.lg-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
.lg-input.err { border-color:#dc2626; }
.lg-input::placeholder { color:#cbd5e1; }
.lg-input-ico { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); font-size:1rem; pointer-events:none; opacity:.5; }
.lg-input.has-eye { padding-right:2.75rem; }
.lg-eye { position:absolute; right:.9rem; top:50%; transform:translateY(-50%); cursor:pointer; font-size:.95rem; opacity:.45; transition:opacity .18s; background:none; border:none; padding:0; }
.lg-eye:hover { opacity:.8; }

.lg-forgot-row { display:flex; justify-content:flex-end; margin-top:-.35rem; margin-bottom:1.25rem; }
.lg-forgot { font-size:.78rem; color:#64748b; text-decoration:none; transition:color .18s; }
.lg-forgot:hover { color:#3b82f6; }

.lg-btn { width:100%; padding:.95rem; border-radius:12px; border:none; background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.98rem; cursor:pointer; transition:all .22s; position:relative; overflow:hidden; display:flex; align-items:center; justify-content:center; gap:.5rem; }
.lg-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.15),transparent); opacity:0; transition:opacity .2s; }
.lg-btn:hover:not(:disabled)::after { opacity:1; }
.lg-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(59,130,246,.35); }
.lg-btn:disabled { opacity:.5; cursor:not-allowed; }

.lg-spinner { width:18px; height:18px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:lg-spin .7s linear infinite; }
@keyframes lg-spin { to { transform:rotate(360deg); } }

.lg-divider { display:flex; align-items:center; gap:.75rem; margin:1.25rem 0; color:#cbd5e1; font-size:.75rem; font-family:'DM Mono',monospace; }
.lg-divider::before, .lg-divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }

.lg-signup-row { text-align:center; font-size:.85rem; color:#64748b; margin-top:1rem; }
.lg-signup-link { color:#3b82f6; font-weight:700; text-decoration:none; margin-left:.25rem; }
.lg-signup-link:hover { text-decoration:underline; }

.lg-success { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:2.5rem 0; animation:lg-fadein .4s ease; text-align:center; }
.lg-success-ring { width:64px; height:64px; border-radius:50%; background:rgba(13,148,136,.1); border:3px solid #0d9488; display:flex; align-items:center; justify-content:center; font-size:1.6rem; }
.lg-success-msg { font-family:'Instrument Serif',serif; font-size:1.3rem; color:#0f172a; }
.lg-success-sub { font-size:.82rem; color:#64748b; }

@media(max-width:768px) { .lg-root{grid-template-columns:1fr} .lg-left{display:none} .lg-right{min-height:100vh;padding:2rem 1.25rem} }
`;

export default function Login() {
  const navigate            = useNavigate();
  const location            = useLocation();
  const { login }           = useAuth();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [success,  setSuccess]  = useState(false);

  const destination = location.state?.from?.pathname || "/app";

  async function onSubmit(e) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setError(""); setLoading(true);

    try {
      const { data } = await axios.post(
        "http://localhost:5001/api/auth/login",
        { email: email.trim().toLowerCase(), password }
      );

      login(data.token, data.user);
      setSuccess(true);
      setTimeout(() => navigate(destination, { replace: true }), 1200);

    } catch (err) {
      // ✅ FIXED: read .error not .message — matches backend response shape
      const msg = err.response?.data?.error;

      if (!err.response) {
        setError("Cannot connect to server. Make sure the backend is running on port 5001.");
      } else if (err.response.status === 401) {
        setError(msg || "Incorrect email or password. Please try again.");
      } else if (err.response.status === 400) {
        setError(msg || "Please fill in all fields.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const features = [
    { ico:"🎙", bg:"rgba(59,130,246,.12)", label:"AI-powered mock interviews with instant scoring" },
    { ico:"📋", bg:"rgba(13,148,136,.12)", label:"Real-time ATS resume analysis and keyword gaps"  },
    { ico:"📊", bg:"rgba(245,158,11,.12)", label:"Performance trends and personalised action plans" },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="lg-root">

        {/* ── LEFT PANEL ── */}
        <div className="lg-left">
          <div className="lg-orb" style={{width:320,height:320,top:"-80px",left:"-80px",background:"radial-gradient(rgba(59,130,246,.22),transparent 70%)",animationDuration:"10s"}}/>
          <div className="lg-orb" style={{width:260,height:260,bottom:"-60px",right:"-60px",background:"radial-gradient(rgba(99,102,241,.18),transparent 70%)",animationDuration:"13s",animationDelay:"2s"}}/>
          <div className="lg-orb" style={{width:160,height:160,top:"45%",left:"55%",background:"radial-gradient(rgba(16,185,129,.14),transparent 70%)",animationDuration:"17s",animationDelay:"5s"}}/>

          <div className="lg-brand">
            <div className="lg-brand-mark">IP</div>
            <span className="lg-brand-name">InterviewPrep.ai</span>
          </div>

          <div className="lg-hero">
            <div className="lg-hero-tag">AI Interview Platform</div>
            <h1 className="lg-h1">Land your<br/>dream job <em>faster</em><br/>with AI prep.</h1>
            <p className="lg-desc">Practice interviews, analyse your resume against ATS systems, and track your improvement — all in one place.</p>
            <div className="lg-features">
              {features.map((f,i) => (
                <div className="lg-feat" key={i}>
                  <div className="lg-feat-dot" style={{background:f.bg}}>{f.ico}</div>
                  <span>{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg-stats">
            {[{num:"12k+",lbl:"Resumes scanned"},{num:"98%",lbl:"ATS accuracy"},{num:"4s",lbl:"Analysis time"}].map((s,i)=>(
              <div key={i}>
                <div className="lg-stat-num">{s.num}</div>
                <div className="lg-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="lg-right">
          <div className="lg-form-wrap">

            {success ? (
              <div className="lg-success">
                <div className="lg-success-ring">✓</div>
                <div className="lg-success-msg">Login successful!</div>
                <div className="lg-success-sub">Taking you to your dashboard…</div>
              </div>
            ) : (
              <>
                <div className="lg-form-header">
                  <h2 className="lg-form-title">Welcome <em>back</em> 👋</h2>
                  <p className="lg-form-sub">Sign in to continue your interview preparation.</p>
                </div>

                {error && (
                  <div className="lg-error">
                    <span style={{flexShrink:0}}>⚠</span> {error}
                  </div>
                )}

                <form onSubmit={onSubmit} noValidate>
                  <div className="lg-field">
                    <label className="lg-label" htmlFor="lg-email">Email Address</label>
                    <div className="lg-input-wrap">
                      <span className="lg-input-ico">✉</span>
                      <input
                        id="lg-email"
                        className={`lg-input${error ? " err" : ""}`}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(""); }}
                        required
                        autoComplete="email"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="lg-field">
                    <label className="lg-label" htmlFor="lg-pass">Password</label>
                    <div className="lg-input-wrap">
                      <span className="lg-input-ico">🔒</span>
                      <input
                        id="lg-pass"
                        className={`lg-input has-eye${error ? " err" : ""}`}
                        type={showPass ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        required
                        autoComplete="current-password"
                      />
                      <button type="button" className="lg-eye" onClick={() => setShowPass(v=>!v)} aria-label={showPass?"Hide":"Show"}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                  </div>

                  <div className="lg-forgot-row">
                    <Link to="/forgot-password" className="lg-forgot">Forgot password?</Link>
                  </div>

                  <button className="lg-btn" type="submit" disabled={loading || !email || !password}>
                    {loading
                      ? <><div className="lg-spinner"/> Signing in…</>
                      : "Sign In →"
                    }
                  </button>
                </form>

                <div className="lg-divider">or</div>

                <div className="lg-signup-row">
                  Don't have an account?
                  <Link to="/signup" className="lg-signup-link">Create one free</Link>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  );
}
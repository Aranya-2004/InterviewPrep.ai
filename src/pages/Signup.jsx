/**
 * pages/Signup.jsx
 *
 * Real signup — calls POST /api/auth/register.
 * No demo credentials anywhere.
 * Password strength meter + field validation + terms checkbox.
 */

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

function getStrength(pw) {
  if (!pw) return { score:0, label:"", color:"" };
  let s = 0;
  if (pw.length >= 8)          s++;
  if (/[A-Z]/.test(pw))        s++;
  if (/[0-9]/.test(pw))        s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  const map = [
    { label:"",          color:"#e2e8f0" },
    { label:"Weak",      color:"#dc2626" },
    { label:"Fair",      color:"#f59e0b" },
    { label:"Good",      color:"#3b82f6" },
    { label:"Strong 💪", color:"#0d9488" },
  ];
  return { score:s, ...map[s] };
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;1,400&family=DM+Mono:wght@400;500&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
body { background:#0c1220; font-family:'Plus Jakarta Sans',sans-serif; }

.sg-root { min-height:100vh; display:grid; grid-template-columns:1fr 1fr; overflow:hidden; }

/* LEFT */
.sg-left { position:relative; background:#0c1220; display:flex; flex-direction:column; justify-content:space-between; padding:3rem; overflow:hidden; min-height:100vh; }
.sg-left::before { content:''; position:absolute; inset:0; background-image:linear-gradient(rgba(59,130,246,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.06) 1px,transparent 1px); background-size:48px 48px; pointer-events:none; }
.sg-orb { position:absolute; border-radius:50%; pointer-events:none; animation:sg-float ease-in-out infinite; }
@keyframes sg-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }

.sg-brand { position:relative; z-index:2; display:flex; align-items:center; gap:.85rem; }
.sg-brand-mark { width:42px; height:42px; border-radius:12px; background:linear-gradient(135deg,#3b82f6,#6366f1); display:flex; align-items:center; justify-content:center; font-family:'Instrument Serif',serif; font-size:1.2rem; color:#fff; box-shadow:0 4px 20px rgba(59,130,246,.4); }
.sg-brand-name { font-family:'Instrument Serif',serif; font-size:1.3rem; color:#fff; letter-spacing:-.3px; }

.sg-hero { position:relative; z-index:2; flex:1; display:flex; flex-direction:column; justify-content:center; padding:2rem 0; }
.sg-hero-tag { display:inline-flex; align-items:center; gap:.45rem; padding:.28rem .85rem; border-radius:999px; border:1px solid rgba(59,130,246,.35); background:rgba(59,130,246,.1); font-family:'DM Mono',monospace; font-size:.65rem; letter-spacing:2px; color:#93c5fd; text-transform:uppercase; margin-bottom:1.5rem; width:fit-content; }
.sg-hero-tag::before { content:''; width:5px; height:5px; border-radius:50%; background:#3b82f6; animation:sg-blink 1.6s ease-in-out infinite; }
@keyframes sg-blink { 0%,100%{opacity:1} 50%{opacity:.2} }
.sg-h1 { font-family:'Instrument Serif',serif; font-size:clamp(2.2rem,3.8vw,3.2rem); font-weight:400; line-height:1.1; letter-spacing:-.5px; color:#fff; margin-bottom:1.25rem; }
.sg-h1 em { font-style:italic; color:#60a5fa; }
.sg-desc { font-size:.92rem; color:#64748b; line-height:1.7; max-width:380px; margin-bottom:2.5rem; }
.sg-steps { display:flex; flex-direction:column; gap:1rem; }
.sg-step { display:flex; align-items:flex-start; gap:.9rem; }
.sg-step-num { width:28px; height:28px; border-radius:8px; flex-shrink:0; background:rgba(59,130,246,.15); border:1px solid rgba(59,130,246,.3); display:flex; align-items:center; justify-content:center; font-family:'DM Mono',monospace; font-size:.72rem; color:#93c5fd; font-weight:600; }
.sg-step-title { font-size:.85rem; font-weight:600; color:#e2e8f0; line-height:1.3; }
.sg-step-desc { font-size:.76rem; color:#475569; margin-top:.12rem; }

.sg-stats { position:relative; z-index:2; display:flex; gap:2rem; border-top:1px solid rgba(255,255,255,.07); padding-top:1.75rem; }
.sg-stat-num { font-family:'Instrument Serif',serif; font-size:1.8rem; color:#fff; line-height:1; }
.sg-stat-lbl { font-size:.65rem; font-family:'DM Mono',monospace; letter-spacing:1.5px; text-transform:uppercase; color:#475569; margin-top:.2rem; }

/* RIGHT */
.sg-right { display:flex; align-items:center; justify-content:center; padding:3rem 2rem; background:#f8f9fc; overflow-y:auto; }
.sg-form-wrap { width:100%; max-width:420px; opacity:0; transform:translateY(20px); animation:sg-fadein .6s .1s ease forwards; }
@keyframes sg-fadein { to { opacity:1; transform:none; } }

.sg-form-header { margin-bottom:1.75rem; }
.sg-form-title { font-family:'Instrument Serif',serif; font-size:1.85rem; font-weight:400; color:#0f172a; line-height:1.2; letter-spacing:-.3px; margin-bottom:.4rem; }
.sg-form-title em { font-style:italic; color:#3b82f6; }
.sg-form-sub { font-size:.85rem; color:#64748b; }

/* progress */
.sg-progress { display:flex; align-items:center; gap:.4rem; margin-bottom:1.5rem; }
.sg-prog-dot { width:8px; height:8px; border-radius:50%; background:#e2e8f0; transition:all .3s; }
.sg-prog-dot.done { background:#0d9488; transform:scale(1.15); }
.sg-prog-dot.cur  { background:#3b82f6; transform:scale(1.25); }
.sg-prog-lbl { font-size:.68rem; font-family:'DM Mono',monospace; color:#94a3b8; margin-left:.35rem; }

/* alerts */
.sg-alert { display:flex; align-items:flex-start; gap:.55rem; border-radius:10px; padding:.75rem 1rem; margin-bottom:1rem; font-size:.82rem; font-family:'DM Mono',monospace; animation:sg-fadein .25s ease; line-height:1.5; }
.sg-alert.err  { background:rgba(220,38,38,.07); border:1px solid rgba(220,38,38,.2); color:#dc2626; }
.sg-alert.succ { background:rgba(13,148,136,.08); border:1px solid rgba(13,148,136,.22); color:#0d9488; }

/* fields */
.sg-field { margin-bottom:1.05rem; }
.sg-label { display:block; font-size:.72rem; font-family:'DM Mono',monospace; letter-spacing:1.5px; text-transform:uppercase; color:#64748b; margin-bottom:.45rem; }
.sg-input-wrap { position:relative; }
.sg-input { width:100%; padding:.85rem 1rem .85rem 2.75rem; border:1.5px solid #e2e8f0; border-radius:12px; background:#fff; color:#0f172a; font-family:'Plus Jakarta Sans',sans-serif; font-size:.92rem; outline:none; transition:border-color .18s,box-shadow .18s; }
.sg-input:focus { border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.12); }
.sg-input.valid { border-color:#0d9488; }
.sg-input.err   { border-color:#dc2626; }
.sg-input::placeholder { color:#cbd5e1; }
.sg-input-ico { position:absolute; left:.9rem; top:50%; transform:translateY(-50%); font-size:1rem; pointer-events:none; opacity:.5; }
.sg-input.has-eye { padding-right:2.75rem; }
.sg-eye { position:absolute; right:.9rem; top:50%; transform:translateY(-50%); cursor:pointer; font-size:.95rem; opacity:.45; transition:opacity .18s; background:none; border:none; padding:0; }
.sg-eye:hover { opacity:.8; }
.sg-tick { position:absolute; right:.9rem; top:50%; transform:translateY(-50%); color:#0d9488; font-size:.9rem; pointer-events:none; }

/* strength */
.sg-strength { margin-top:.5rem; }
.sg-strength-bars { display:flex; gap:4px; margin-bottom:.28rem; }
.sg-strength-bar { flex:1; height:4px; border-radius:999px; transition:background .3s; }
.sg-strength-lbl { font-size:.68rem; font-family:'DM Mono',monospace; }

/* terms */
.sg-terms { display:flex; align-items:flex-start; gap:.6rem; margin-bottom:1.25rem; }
.sg-terms input { width:16px; height:16px; margin-top:.15rem; accent-color:#3b82f6; flex-shrink:0; cursor:pointer; }
.sg-terms-lbl { font-size:.8rem; color:#64748b; line-height:1.5; cursor:pointer; }
.sg-terms-lbl a { color:#3b82f6; text-decoration:none; font-weight:600; }
.sg-terms-lbl a:hover { text-decoration:underline; }

/* button */
.sg-btn { width:100%; padding:.95rem; border-radius:12px; border:none; background:linear-gradient(135deg,#3b82f6 0%,#6366f1 100%); color:#fff; font-family:'Plus Jakarta Sans',sans-serif; font-weight:700; font-size:.98rem; cursor:pointer; transition:all .22s; display:flex; align-items:center; justify-content:center; gap:.5rem; position:relative; overflow:hidden; }
.sg-btn::after { content:''; position:absolute; inset:0; background:linear-gradient(135deg,rgba(255,255,255,.15),transparent); opacity:0; transition:opacity .2s; }
.sg-btn:hover:not(:disabled)::after { opacity:1; }
.sg-btn:hover:not(:disabled) { transform:translateY(-1px); box-shadow:0 8px 24px rgba(59,130,246,.35); }
.sg-btn:disabled { opacity:.45; cursor:not-allowed; }

.sg-spinner { width:18px; height:18px; border-radius:50%; border:2px solid rgba(255,255,255,.35); border-top-color:#fff; animation:sg-spin .7s linear infinite; }
@keyframes sg-spin { to { transform:rotate(360deg); } }

.sg-divider { display:flex; align-items:center; gap:.75rem; margin:1.25rem 0; color:#cbd5e1; font-size:.75rem; font-family:'DM Mono',monospace; }
.sg-divider::before, .sg-divider::after { content:''; flex:1; height:1px; background:#e2e8f0; }

.sg-login-row { text-align:center; font-size:.85rem; color:#64748b; margin-top:1rem; }
.sg-login-link { color:#3b82f6; font-weight:700; text-decoration:none; margin-left:.25rem; }
.sg-login-link:hover { text-decoration:underline; }

/* success */
.sg-success { display:flex; flex-direction:column; align-items:center; gap:1rem; padding:2.5rem 0; animation:sg-fadein .4s ease; text-align:center; }
.sg-success-ring { width:70px; height:70px; border-radius:50%; background:rgba(13,148,136,.1); border:3px solid #0d9488; display:flex; align-items:center; justify-content:center; font-size:1.8rem; }
.sg-success-msg { font-family:'Instrument Serif',serif; font-size:1.4rem; color:#0f172a; }
.sg-success-sub { font-size:.82rem; color:#64748b; line-height:1.6; }

@media(max-width:768px) { .sg-root{grid-template-columns:1fr} .sg-left{display:none} .sg-right{min-height:100vh;padding:2rem 1.25rem;align-items:flex-start;padding-top:3rem} }
`;

export default function Signup() {
  const navigate = useNavigate();

  const [name,         setName]         = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPass,     setShowPass]     = useState(false);
  const [agreed,       setAgreed]       = useState(false);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);
  const [nameTouched,  setNameTouched]  = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);

  const strength     = getStrength(password);
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const filledCount  = [name.trim(), isValidEmail, password.length >= 6].filter(Boolean).length;
  const canSubmit    = name.trim() && isValidEmail && password.length >= 6 && agreed && !loading;

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;
    setError(""); setLoading(true);

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
        name:     name.trim(),
        email:    email.trim().toLowerCase(),
        password,
      });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 2500);

    } catch (err) {
      const msg = err.response?.data?.error;
      const status = err.response?.status;
      if (status === 409) {
        setError("An account with this email already exists. Try logging in instead.");
      } else if (status === 400) {
        setError(msg || "Please check your details and try again.");
      } else if (!err.response) {
        setError("Cannot connect to server. Make sure the backend is running on port 5000.");
      } else {
        setError(msg || "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    { n:"01", title:"Create your account",    desc:"Takes less than 60 seconds"            },
    { n:"02", title:"Upload your resume",      desc:"Get instant ATS score and keyword gaps" },
    { n:"03", title:"Start mock interviews",   desc:"AI questions with instant scoring"      },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="sg-root">

        {/* LEFT */}
        <div className="sg-left">
          <div className="sg-orb" style={{width:300,height:300,top:"-70px",left:"-70px",background:"radial-gradient(rgba(59,130,246,.22),transparent 70%)",animationDuration:"10s"}}/>
          <div className="sg-orb" style={{width:240,height:240,bottom:"-50px",right:"-50px",background:"radial-gradient(rgba(99,102,241,.18),transparent 70%)",animationDuration:"14s",animationDelay:"2s"}}/>
          <div className="sg-orb" style={{width:150,height:150,top:"40%",left:"50%",background:"radial-gradient(rgba(16,185,129,.14),transparent 70%)",animationDuration:"18s",animationDelay:"5s"}}/>

          <div className="sg-brand">
            <div className="sg-brand-mark">Ac</div>
            <span className="sg-brand-name">AceHire</span>
          </div>

          <div className="sg-hero">
            <div className="sg-hero-tag">Free · No Credit Card</div>
            <h1 className="sg-h1">Start your<br/>interview <em>journey</em><br/>today.</h1>
            <p className="sg-desc">Join thousands of candidates using AceHire to land better jobs faster. Everything you need, in one place.</p>
            <div className="sg-steps">
              {steps.map((s,i)=>(
                <div className="sg-step" key={i}>
                  <div className="sg-step-num">{s.n}</div>
                  <div><div className="sg-step-title">{s.title}</div><div className="sg-step-desc">{s.desc}</div></div>
                </div>
              ))}
            </div>
          </div>

          <div className="sg-stats">
            {[{num:"12k+",lbl:"Users joined"},{num:"Free",lbl:"Forever plan"},{num:"98%",lbl:"ATS accuracy"}].map((s,i)=>(
              <div key={i}>
                <div className="sg-stat-num">{s.num}</div>
                <div className="sg-stat-lbl">{s.lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT */}
        <div className="sg-right">
          <div className="sg-form-wrap">

            {success ? (
              <div className="sg-success">
                <div className="sg-success-ring">🎉</div>
                <div className="sg-success-msg">Account created!</div>
                <div className="sg-success-sub">
                  Welcome to AceHire, <strong>{name}</strong>!<br/>
                  Redirecting you to login…
                </div>
              </div>
            ) : (
              <>
                <div className="sg-form-header">
                  <h2 className="sg-form-title">Create your <em>account</em></h2>
                  <p className="sg-form-sub">Free forever. No credit card required.</p>
                </div>

                {/* progress dots */}
                <div className="sg-progress">
                  {[1,2,3].map(n => (
                    <div key={n} className={`sg-prog-dot ${filledCount >= n ? "done" : filledCount === n-1 ? "cur" : ""}`}/>
                  ))}
                  <span className="sg-prog-lbl">
                    {filledCount === 0 && "Fill in your details"}
                    {filledCount === 1 && "Good start!"}
                    {filledCount === 2 && "Almost there…"}
                    {filledCount === 3 && "Ready to go! ✓"}
                  </span>
                </div>

                {error && (
                  <div className="sg-alert err"><span style={{flexShrink:0}}>⚠</span> {error}</div>
                )}

                <form onSubmit={onSubmit} noValidate>

                  {/* name */}
                  <div className="sg-field">
                    <label className="sg-label" htmlFor="sg-name">Full Name</label>
                    <div className="sg-input-wrap">
                      <span className="sg-input-ico">👤</span>
                      <input
                        id="sg-name"
                        className={`sg-input ${nameTouched && name.trim() ? "valid" : ""}`}
                        type="text"
                        placeholder="Your full name"
                        value={name}
                        onChange={e => { setName(e.target.value); setError(""); }}
                        onBlur={() => setNameTouched(true)}
                        required
                        autoComplete="name"
                        autoFocus
                      />
                      {nameTouched && name.trim() && <span className="sg-tick">✓</span>}
                    </div>
                  </div>

                  {/* email */}
                  <div className="sg-field">
                    <label className="sg-label" htmlFor="sg-email">Email Address</label>
                    <div className="sg-input-wrap">
                      <span className="sg-input-ico">✉</span>
                      <input
                        id="sg-email"
                        className={`sg-input ${emailTouched && isValidEmail ? "valid" : emailTouched && !isValidEmail ? "err" : ""}`}
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setError(""); }}
                        onBlur={() => setEmailTouched(true)}
                        required
                        autoComplete="email"
                      />
                      {emailTouched && isValidEmail && <span className="sg-tick">✓</span>}
                    </div>
                    {emailTouched && !isValidEmail && email && (
                      <div style={{fontSize:".72rem",color:"#dc2626",marginTop:".3rem",fontFamily:"'DM Mono',monospace"}}>Please enter a valid email address.</div>
                    )}
                  </div>

                  {/* password */}
                  <div className="sg-field">
                    <label className="sg-label" htmlFor="sg-pass">Password</label>
                    <div className="sg-input-wrap">
                      <span className="sg-input-ico">🔒</span>
                      <input
                        id="sg-pass"
                        className={`sg-input has-eye ${password && strength.score >= 3 ? "valid" : ""}`}
                        type={showPass ? "text" : "password"}
                        placeholder="At least 6 characters"
                        value={password}
                        onChange={e => { setPassword(e.target.value); setError(""); }}
                        required
                        autoComplete="new-password"
                        minLength={6}
                      />
                      <button type="button" className="sg-eye" onClick={()=>setShowPass(v=>!v)} aria-label={showPass?"Hide":"Show"}>
                        {showPass ? "🙈" : "👁"}
                      </button>
                    </div>
                    {password && (
                      <div className="sg-strength">
                        <div className="sg-strength-bars">
                          {[1,2,3,4].map(n=>(
                            <div key={n} className="sg-strength-bar" style={{background: n<=strength.score ? strength.color : "#e2e8f0"}}/>
                          ))}
                        </div>
                        <span className="sg-strength-lbl" style={{color:strength.color}}>
                          {strength.label}{strength.score < 3 ? " — try adding numbers or symbols" : ""}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* terms */}
                  <div className="sg-terms">
                    <input type="checkbox" id="sg-terms" checked={agreed} onChange={e=>setAgreed(e.target.checked)}/>
                    <label className="sg-terms-lbl" htmlFor="sg-terms">
                      I agree to the <a href="/terms" target="_blank" rel="noreferrer">Terms of Service</a> and <a href="/privacy" target="_blank" rel="noreferrer">Privacy Policy</a>
                    </label>
                  </div>

                  <button className="sg-btn" type="submit" disabled={!canSubmit}>
                    {loading
                      ? <><div className="sg-spinner"/> Creating account…</>
                      : "Create Account →"
                    }
                  </button>

                </form>

                <div className="sg-divider">or</div>
                <div className="sg-login-row">
                  Already have an account?
                  <Link to="/login" className="sg-login-link">Sign in</Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
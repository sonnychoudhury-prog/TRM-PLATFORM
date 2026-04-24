import { useState } from "react";
import { supabase } from "./supabase";

const CYAN = "#109DCE";
const CYAN_BRIGHT = "#19A8D5";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const DANGER = "#E05252";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [company, setCompany] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  }

  async function handleSignup() {
    setLoading(true); setError("");
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName, company } }
    });
    if (error) setError(error.message);
    else setMessage("Account created. You can now log in.");
    setLoading(false);
  }

  const s = {
    wrap: { background: BG, minHeight: "100vh", fontFamily: "'Exo 2', sans-serif", color: SILVER, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" },
    grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(16,157,206,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,157,206,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
    card: { position: "relative", zIndex: 2, width: "100%", maxWidth: 440, background: BG2, border: "1px solid rgba(16,157,206,0.25)", padding: 40 },
    logo: { fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: CYAN_BRIGHT, letterSpacing: "0.12em", marginBottom: 4 },
    logoSub: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.2em", marginBottom: 32 },
    title: { fontFamily: "'Rajdhani', sans-serif", fontSize: 26, fontWeight: 700, color: "#F0F4F6", marginBottom: 24 },
    label: { display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 },
    input: { width: "100%", background: "#090C11", border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box", marginBottom: 16 },
    btn: { width: "100%", padding: 14, background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", marginTop: 8 },
    switchBtn: { background: "none", border: "none", color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, cursor: "pointer", letterSpacing: "0.1em", marginTop: 16, display: "block", textAlign: "center", width: "100%" },
    error: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: DANGER, letterSpacing: "0.1em", marginBottom: 12 },
    success: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAFE, letterSpacing: "0.1em", marginBottom: 12 },
    divider: { border: "none", borderTop: "1px solid rgba(16,157,206,0.15)", margin: "24px 0" },
  };

  return (
    <div style={s.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@200;300;400;600&display=swap');*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}`}</style>
      <div style={s.grid}/>
      <div style={s.card}>
        <div style={s.logo}>REVOLUTION INTELL</div>
        <div style={s.logoSub}>TRM // TRUST & RISK MANAGEMENT PLATFORM</div>
        <div style={s.title}>{mode === "login" ? "Sign In" : "Request Access"}</div>
        {error && <div style={s.error}>{error}</div>}
        {message && <div style={s.success}>{message}</div>}
        {mode === "signup" && (
          <>
            <label style={s.label}>Full Name</label>
            <input style={s.input} value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your full name"/>
            <label style={s.label}>Company</label>
            <input style={s.input} value={company} onChange={e => setCompany(e.target.value)} placeholder="Your company name"/>
          </>
        )}
        <label style={s.label}>Email</label>
        <input style={s.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com"/>
        <label style={s.label}>Password</label>
        <input style={s.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"/>
        <button style={s.btn} onClick={mode === "login" ? handleLogin : handleSignup} disabled={loading}>
          {loading ? "PROCESSING..." : mode === "login" ? "SIGN IN" : "CREATE ACCOUNT"}
        </button>
        <hr style={s.divider}/>
        <button style={s.switchBtn} onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); setMessage(""); }}>
          {mode === "login" ? "NEED ACCESS? REQUEST AN ACCOUNT" : "ALREADY HAVE AN ACCOUNT? SIGN IN"}
        </button>
      </div>
    </div>
  );
}

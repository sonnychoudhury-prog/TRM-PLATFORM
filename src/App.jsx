import { useState } from "react";
const CYAN = "#109DCE";
const CYAN_BRIGHT = "#19A8D5";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const WARN = "#E0A832";
const DANGER = "#E05252";
const SESSION_ID = "RI-" + Date.now().toString(36).toUpperCase() + "-" + Math.random().toString(36).substr(2, 4).toUpperCase();
const DIMENSIONS = [
  { key: "identity", label: "Identity Verification", weight: 0.25, desc: "KYC documentation, passport quality, AML screening, beneficial ownership clarity." },
  { key: "documentation", label: "Documentation Integrity", weight: 0.20, desc: "Quality of SPAs, LOIs, SKRs, bank instruments, and supporting legal paperwork." },
  { key: "history", label: "Transaction History", weight: 0.20, desc: "Verifiable prior deal completions, references from known principals, LBMA track record." },
  { key: "source", label: "Source Credibility", weight: 0.15, desc: "Credibility of introduction channel, intermediary reputation, relationship chain of custody." },
  { key: "advancefee", label: "Advance Fee Risk", weight: 0.12, desc: "Advance fee requests, unusual payment conditions, urgency tactics, pressure patterns. (5 = clean)" },
  { key: "jurisdiction", label: "Jurisdictional Compliance", weight: 0.08, desc: "FATF status, sanctions exposure, regulatory environment, legal enforceability." },
];
const TX_TYPES = [
  { value: "", label: "Select transaction type" },
  { value: "gold-offtake", label: "Gold Offtake Agreement" },
  { value: "copper-sourcing", label: "Copper / Cobalt Sourcing" },
  { value: "critical-minerals", label: "Critical Minerals Supply" },
  { value: "bullion-flow", label: "Structured Bullion Flow" },
  { value: "co-lending", label: "Co-Lending / Capital Facility" },
  { value: "other", label: "Other Commodity Transaction" },
];
const REL_SOURCES = [
  { value: "", label: "How was this counterparty introduced?" },
  { value: "direct", label: "Direct outreach / cold contact" },
  { value: "trusted-intro", label: "Trusted intermediary introduction" },
  { value: "institutional", label: "Institutional referral (bank, exchange)" },
  { value: "existing", label: "Existing verified partner" },
  { value: "network", label: "Professional network / conference" },
];
function scoreColor(score) {
  if (score >= 80) return SAFE;
  if (score >= 40) return WARN;
  return DANGER;
}
function verdict(score) {
  if (score >= 80) return "HIGH TRUST";
  if (score >= 60) return "MODERATE TRUST";
  if (score >= 40) return "ELEVATED RISK";
  return "HIGH RISK";
}
function calcScore(ratings) {
  let total = 0;
  for (const dim of DIMENSIONS) {
    if (ratings[dim.key]) total += (ratings[dim.key] / 5) * dim.weight * 100;
  }
  return Math.round(total);
}
function getRatingColor(val) {
  if (val <= 1) return DANGER;
  if (val <= 3) return WARN;
  return SAFE;
}
function getRatingBg(val) {
  if (val <= 1) return "rgba(224,82,82,0.18)";
  if (val <= 3) return "rgba(224,168,50,0.18)";
  return "rgba(50,200,122,0.15)";
}
function flagColor(level) {
  if (level === "red") return DANGER;
  if (level === "yellow") return WARN;
  return SAFE;
}
function flagLabel(level) {
  if (level === "red") return "RISK";
  if (level === "yellow") return "CAUTION";
  return "CLEAR";
}
export default function TRMApp() {
  const [step, setStep] = useState("form");
  const [ratings, setRatings] = useState({});
  const [form, setForm] = useState({ name: "", country: "", txType: "", txValue: "", relSource: "", notes: "" });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loadingMsg, setLoadingMsg] = useState("INITIALIZING ANALYSIS...");
  const loadingSteps = ["INITIALIZING ANALYSIS...","SCORING TRUST DIMENSIONS...","RUNNING COUNTERPARTY ASSESSMENT...","GENERATING RISK REPORT..."];
  const setRating = (dim, val) => setRatings(r => ({ ...r, [dim]: val }));
  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));
  async function runAnalysis() {
    if (!form.name.trim()) { setError("Please enter a counterparty name."); return; }
    if (Object.keys(ratings).length < 6) { setError("Please rate all six trust dimensions."); return; }
    setError(""); setStep("loading");
    let msgIdx = 0;
    setLoadingMsg(loadingSteps[0]);
    const msgInterval = setInterval(() => { msgIdx = Math.min(msgIdx + 1, loadingSteps.length - 1); setLoadingMsg(loadingSteps[msgIdx]); }, 1200);
    const score = calcScore(ratings);
    const prompt = `You are the AI risk engine for Revolution INTELL's TRM platform for cross-border commodity transactions including gold, copper, and critical minerals. Analyze this counterparty. Do not use dashes. Write as a seasoned commodity transaction risk analyst.\nCOUNTERPARTY: ${form.name}\nJURISDICTION: ${form.country || "Not specified"}\nTRANSACTION TYPE: ${form.txType || "Not specified"}\nTRANSACTION VALUE: ${form.txValue || "Not disclosed"}\nRELATIONSHIP SOURCE: ${form.relSource || "Not specified"}\nIdentity Verification: ${ratings.identity}/5\nDocumentation Integrity: ${ratings.documentation}/5\nTransaction History: ${ratings.history}/5\nSource Credibility: ${ratings.source}/5\nAdvance Fee Risk: ${ratings.advancefee}/5 (5=clean)\nJurisdictional Compliance: ${ratings.jurisdiction}/5\nCOMPOSITE SCORE: ${score}/100\nNOTES: ${form.notes || "None"}\nRespond ONLY with valid JSON no markdown no backticks: {"strategic_assessment":"3-4 sentences on trust profile","flags":[{"level":"red","text":"observation"},{"level":"yellow","text":"observation"},{"level":"green","text":"observation"}],"recommendation":"2-3 sentences on whether to proceed and next steps"}`;
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] })
      });
      const data = await response.json();
      if (data.error) throw new Error(data.error.message);
      const parsed = JSON.parse(data.content[0].text.replace(/```json|```/g, "").trim());
      clearInterval(msgInterval);
      setResult({ ...parsed, score, name: form.name, country: form.country, txType: form.txType, txValue: form.txValue, ratings: { ...ratings }, timestamp: new Date().toUTCString() });
      setStep("results");
    } catch (e) {
      clearInterval(msgInterval);
      setError("Analysis failed: " + e.message);
      setStep("form");
    }
  }
  function reset() { setStep("form"); setRatings({}); setForm({ name: "", country: "", txType: "", txValue: "", relSource: "", notes: "" }); setResult(null); setError(""); }
  const s = {
    wrap: { background: BG, minHeight: "100vh", fontFamily: "'Exo 2', sans-serif", color: SILVER, position: "relative", overflow: "hidden" },
    grid: { position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(16,157,206,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(16,157,206,0.03) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 },
    inner: { position: "relative", zIndex: 2, maxWidth: 880, margin: "0 auto", padding: "0 20px 80px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: "1px solid rgba(16,157,206,0.25)", marginBottom: 40 },
    logoTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: CYAN_BRIGHT, letterSpacing: "0.12em" },
    logoSub: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.2em", marginTop: 2 },
    statusDot: { width: 6, height: 6, borderRadius: "50%", background: SAFE, display: "inline-block", marginRight: 6 },
    statusText: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAFE, letterSpacing: "0.15em" },
    sessionId: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em", marginTop: 4, textAlign: "right" },
    sectionLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 },
    sectionTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 30, fontWeight: 700, color: "#F0F4F6", letterSpacing: "0.04em", lineHeight: 1.1, marginBottom: 8 },
    sectionDesc: { fontSize: 13, color: SILVER_DIM, fontWeight: 300, lineHeight: 1.6, maxWidth: 560, marginBottom: 32 },
    formLabel: { display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7 },
    input: { width: "100%", background: BG2, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" },
    select: { width: "100%", background: BG2, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", appearance: "none", boxSizing: "border-box" },
    textarea: { width: "100%", background: BG2, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "12px 14px", minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box", fontWeight: 300 },
    dimCard: { background: BG2, border: "1px solid rgba(16,157,206,0.22)", padding: 18 },
    dimName: { fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, color: "#F0F4F6", letterSpacing: "0.05em", textTransform: "uppercase" },
    dimWeight: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em" },
    dimDesc: { fontSize: 11, color: SILVER_DIM, margin: "8px 0 12px", lineHeight: 1.5, fontWeight: 300 },
    analyzeBtn: { width: "100%", padding: 16, background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", marginTop: 8 },
    analysisBlock: { background: BG2, border: "1px solid rgba(16,157,206,0.22)", borderLeft: "3px solid " + CYAN, padding: 20, marginBottom: 16 },
    analysisTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 12, fontWeight: 600, color: CYAN, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 12 },
    analysisText: { fontSize: 13, color: SILVER, lineHeight: 1.75, fontWeight: 300 },
    divider: { border: "none", borderTop: "1px solid rgba(16,157,206,0.2)", margin: "28px 0" },
    barTrack: { height: 5, background: "rgba(210,221,225,0.08)", flex: 1 },
    resetBtn: { padding: "8px 18px", background: "transparent", border: "1px solid rgba(210,221,225,0.2)", color: SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.15em", cursor: "pointer" },
    errorMsg: { fontFamily: "'Share Tech Mono', monospace", fontSize: 11, color: DANGER, letterSpacing: "0.1em", marginBottom: 10 },
  };
  return (
    <div style={s.wrap}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}textarea::placeholder{color:#8A9BA3;opacity:0.5}button:hover{opacity:0.85}`}</style>
      <div style={s.grid}/>
      <div style={s.inner}>
        <div style={s.header}>
          <div>
            <div style={s.logoTitle}>REVOLUTION INTELL</div>
            <div style={s.logoSub}>TRM // TRUST & RISK MANAGEMENT PLATFORM</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={s.statusText}><span style={s.statusDot}/>SYSTEM ACTIVE</div>
            <div style={s.sessionId}>{SESSION_ID}</div>
          </div>
        </div>
        {step==="form"&&<div style={{animation:"fadeUp 0.4s ease"}}>
          <div style={s.sectionLabel}>// COUNTERPARTY ASSESSMENT</div>
          <div style={s.sectionTitle}>Trust Verification<br/>& Risk Scoring</div>
          <div style={s.sectionDesc}>Structured counterparty evaluation for cross-border commodity transactions. Rate all six trust dimensions to generate a scored AI risk report.</div>
          <div style={s.sectionLabel}>// 01 - ENTITY IDENTIFICATION</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label style={s.formLabel}>Counterparty Name</label><input style={s.input} value={form.name} onChange={e=>setField("name",e.target.value)} placeholder="Company or individual name"/></div>
            <div><label style={s.formLabel}>Jurisdiction / Country</label><input style={s.input} value={form.country} onChange={e=>setField("country",e.target.value)} placeholder="e.g. UAE, Ghana, Qatar"/></div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:14}}>
            <div><label style={s.formLabel}>Transaction Type</label><select style={s.select} value={form.txType} onChange={e=>setField("txType",e.target.value)}>{TX_TYPES.map(t=><option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label style={s.formLabel}>Estimated Value (USD)</label><input style={s.input} value={form.txValue} onChange={e=>setField("txValue",e.target.value)} placeholder="e.g. $5,000,000"/></div>
          </div>
          <div style={{marginBottom:32}}><label style={s.formLabel}>Relationship Source</label><select style={s.select} value={form.relSource} onChange={e=>setField("relSource",e.target.value)}>{REL_SOURCES.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}</select></div>
          <hr style={s.divider}/>
          <div style={s.sectionLabel}>// 02 - TRUST DIMENSIONS</div>
          <div style={{fontSize:12,color:SILVER_DIM,marginBottom:20,fontWeight:300}}>Rate each dimension 1 (low) to 5 (high). All six required.</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginBottom:28}}>
            {DIMENSIONS.map(dim=>(
              <div key={dim.key} style={s.dimCard}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div style={s.dimName}>{dim.label}</div>
                  <div style={s.dimWeight}>WT {Math.round(dim.weight*100)}%</div>
                </div>
                <div style={s.dimDesc}>{dim.desc}</div>
                <div style={{display:"flex",gap:5}}>
                  {[1,2,3,4,5].map(val=>(
                    <button key={val} style={{flex:1,padding:"7px 2px",background:ratings[dim.key]===val?getRatingBg(val):"transparent",border:"1px solid "+(ratings[dim.key]===val?getRatingColor(val):"rgba(210,221,225,0.15)"),color:ratings[dim.key]===val?getRatingColor(val):SILVER_DIM,fontFamily:"'Share Tech Mono',monospace",fontSize:11,cursor:"pointer"}} onClick={()=>setRating(dim.key,val)}>{val}</button>
                  ))}
                </div>
                <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:SILVER_DIM}}>LOW</span>
                  <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:8,color:SILVER_DIM}}>HIGH</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{marginBottom:28}}><label style={s.sectionLabel}>// 03 - ANALYST NOTES (OPTIONAL)</label><textarea style={s.textarea} value={form.notes} onChange={e=>setField("notes",e.target.value)} placeholder="Add any additional context, red flags, or qualitative observations..."/></div>
          {error&&<div style={s.errorMsg}>{error}</div>}
          <button style={s.analyzeBtn} onClick={runAnalysis}>&#9654; GENERATE TRUST REPORT</button>
        </div>}
        {step==="loading"&&<div style={{textAlign:"center",padding:"80px 0",animation:"fadeUp 0.3s ease"}}>
          <div style={{width:44,height:44,border:"2px solid rgba(16,157,206,0.2)",borderTopColor:CYAN,borderRadius:"50%",animation:"spin 0.8s linear infinite",margin:"0 auto 24px"}}/>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:CYAN,letterSpacing:"0.2em"}}>{loadingMsg}</div>
          <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:SILVER_DIM,letterSpacing:"0.15em",marginTop:12}}>REVOLUTION INTELL TRM ENGINE</div>
        </div>}
        {step==="results"&&result&&<div style={{animation:"fadeUp 0.4s ease"}}>
          <div style={s.sectionLabel}>// TRUST ASSESSMENT REPORT</div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:28,paddingBottom:20,borderBottom:"1px solid rgba(16,157,206,0.2)"}}>
            <div>
              <div style={{display:"flex",alignItems:"flex-end",gap:10}}>
                <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:64,fontWeight:700,lineHeight:1,color:scoreColor(result.score)}}>{result.score}</div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:16,color:SILVER_DIM,marginBottom:10}}>/100</div>
              </div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:scoreColor(result.score),letterSpacing:"0.2em",marginBottom:6}}>COMPOSITE TRUST SCORE</div>
              <div style={{display:"inline-block",padding:"6px 18px",border:"1px solid "+scoreColor(result.score),color:scoreColor(result.score),background:scoreColor(result.score)+"22",fontFamily:"'Rajdhani',sans-serif",fontSize:13,fontWeight:600,letterSpacing:"0.15em",marginTop:8}}>{verdict(result.score)}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:CYAN,letterSpacing:"0.25em",marginBottom:4}}>COUNTERPARTY</div>
              <div style={{fontFamily:"'Rajdhani',sans-serif",fontSize:22,fontWeight:600,color:"#F0F4F6"}}>{result.name}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,color:SILVER_DIM,marginTop:4}}>{[result.country,result.txType,result.txValue].filter(Boolean).join(" // ")||"Transaction on file"}</div>
            </div>
          </div>
          <div style={s.sectionLabel}>// DIMENSION BREAKDOWN</div>
          <div style={{marginBottom:28}}>
            {DIMENSIONS.map(dim=>{
              const val=result.ratings[dim.key]||0;
              const pct=(val/5)*100;
              const c=pct<40?DANGER:pct<60?WARN:SAFE;
              return(<div key={dim.key} style={{display:"grid",gridTemplateColumns:"170px 1fr 36px",alignItems:"center",gap:12,marginBottom:10}}>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:SILVER_DIM,textTransform:"uppercase"}}>{dim.label}</div>
                <div style={s.barTrack}><div style={{height:"100%",width:pct+"%",background:c}}/></div>
                <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:11,color:c,textAlign:"right"}}>{val}/5</div>
              </div>);
            })}
          </div>
          <hr style={s.divider}/>
          <div style={s.sectionLabel}>// AI RISK ANALYSIS</div>
          <div style={s.analysisBlock}>
            <div style={s.analysisTitle}>Strategic Assessment</div>
            <div style={s.analysisText}>{result.strategic_assessment}</div>
          </div>
          <div style={s.analysisBlock}>
            <div style={s.analysisTitle}>Risk Flags & Observations</div>
            {result.flags.map((flag,i)=>(
              <div key={i} style={{display:"flex",alignItems:"flex-start",gap:10,fontSize:13,fontWeight:300,lineHeight:1.5,marginBottom:8}}>
                <span style={{fontFamily:"'Share Tech Mono',monospace",fontSize:10,padding:"2px 6px",flexShrink:0,marginTop:2,border:"1px solid "+flagColor(flag.level),background:flagColor(flag.level)+"33",color:flagColor(flag.level)}}>{flagLabel(flag.level)}</span>
                <span style={{color:SILVER,fontSize:13,fontWeight:300}}>{flag.text}</span>
              </div>
            ))}
          </div>
          <div style={s.analysisBlock}>
            <div style={s.analysisTitle}>Recommended Action</div>
            <div style={s.analysisText}>{result.recommendation}</div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",paddingTop:20,borderTop:"1px solid rgba(16,157,206,0.2)",marginTop:20}}>
            <div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:SILVER_DIM}}>REVOLUTION INTELL // TRM PLATFORM v1.0</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:SILVER_DIM,marginTop:3}}>GENERATED: {result.timestamp}</div>
              <div style={{fontFamily:"'Share Tech Mono',monospace",fontSize:9,color:SILVER_DIM,marginTop:3}}>SESSION: {SESSION_ID}</div>
            </div>
            <button style={s.resetBtn} onClick={reset}>NEW ASSESSMENT</button>
          </div>
        </div>}
      </div>
    </div>
  );
}

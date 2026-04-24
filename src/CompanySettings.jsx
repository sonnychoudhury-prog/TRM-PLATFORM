import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CYAN = "#109DCE";
const CYAN_BRIGHT = "#19A8D5";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const DANGER = "#E05252";

const COMMODITY_OPTIONS = ["Gold", "Copper", "Cobalt", "Silver", "Platinum", "Critical Minerals", "Oil", "Natural Gas", "Other"];

export default function CompanySettings({ userId, onSave }) {
  const [settings, setSettings] = useState({
    company_name: "", company_address: "", company_registration: "",
    company_country: "", signatory_name: "", signatory_title: "",
    signatory_email: "", phone: "", website: "", logo_url: "",
    primary_commodities: []
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { loadSettings(); }, [userId]);

  async function loadSettings() {
    const { data } = await supabase.from("company_settings").select("*").eq("user_id", userId).single();
    if (data) {
      setSettings(data);
      if (data.logo_url) setLogoPreview(data.logo_url);
    }
  }

  function setField(k, v) { setSettings(s => ({ ...s, [k]: v })); }

  function toggleCommodity(c) {
    const current = settings.primary_commodities || [];
    if (current.includes(c)) setField("primary_commodities", current.filter(x => x !== c));
    else setField("primary_commodities", [...current, c]);
  }

  function handleLogoChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function uploadLogo() {
    if (!logoFile) return settings.logo_url;
    const ext = logoFile.name.split(".").pop();
    const path = `${userId}/logo.${ext}`;
    const { error } = await supabase.storage.from("company-logos").upload(path, logoFile, { upsert: true });
    if (error) throw new Error("Logo upload failed: " + error.message);
    const { data } = supabase.storage.from("company-logos").getPublicUrl(path);
    return data.publicUrl;
  }

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const logoUrl = await uploadLogo();
      const payload = { ...settings, user_id: userId, logo_url: logoUrl, updated_at: new Date().toISOString() };
      const { error } = await supabase.from("company_settings").upsert(payload, { onConflict: "user_id" });
      if (error) throw new Error(error.message);
      setMessage("Company settings saved successfully.");
      if (onSave) onSave(payload);
    } catch (e) { setError(e.message); }
    setSaving(false);
  }

  const s = {
    wrap: { background: BG, minHeight: "100vh", fontFamily: "'Exo 2', sans-serif", color: SILVER },
    inner: { maxWidth: 740, margin: "0 auto", padding: "0 24px 80px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: "1px solid rgba(16,157,206,0.25)", marginBottom: 36 },
    logo: { fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: CYAN_BRIGHT, letterSpacing: "0.12em" },
    logoSub: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.2em", marginTop: 2 },
    sectionLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6, marginTop: 28 },
    formLabel: { display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 7, marginTop: 14 },
    input: { width: "100%", background: BG2, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "11px 14px", outline: "none", boxSizing: "border-box" },
    textarea: { width: "100%", background: BG2, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "11px 14px", minHeight: 80, resize: "vertical", outline: "none", boxSizing: "border-box", fontWeight: 300 },
    row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 },
    logoBox: { background: BG2, border: "1px solid rgba(16,157,206,0.22)", padding: 20, display: "flex", alignItems: "center", gap: 20, marginTop: 8 },
    logoImg: { width: 80, height: 80, objectFit: "contain", background: "#fff", padding: 4 },
    logoPlaceholder: { width: 80, height: 80, background: "rgba(16,157,206,0.05)", border: "1px dashed rgba(16,157,206,0.3)", display: "flex", alignItems: "center", justifyContent: "center" },
    logoPlaceholderText: { fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: SILVER_DIM, letterSpacing: "0.1em", textAlign: "center" },
    fileInput: { display: "none" },
    uploadBtn: { padding: "8px 18px", background: "transparent", border: "1px solid rgba(16,157,206,0.3)", color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" },
    commodityGrid: { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 },
    commodityChip: (selected) => ({ padding: "6px 14px", background: selected ? "rgba(16,157,206,0.15)" : "transparent", border: "1px solid " + (selected ? CYAN : "rgba(210,221,225,0.15)"), color: selected ? CYAN : SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.1em", cursor: "pointer" }),
    saveBtn: { width: "100%", padding: 16, background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", marginTop: 28 },
    message: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAVE, letterSpacing: "0.1em", marginTop: 12, textAlign: "center" },
    error: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: DANGER, letterSpacing: "0.1em", marginTop: 12 },
    backBtn: { padding: "7px 16px", background: "transparent", border: "1px solid rgba(16,157,206,0.3)", color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer" },
  };

  return (
    <div style={s.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@200;300;400;600&display=swap');*{box-sizing:border-box}input::placeholder{color:#8A9BA3;opacity:0.5}textarea::placeholder{color:#8A9BA3;opacity:0.5}`}</style>
      <div style={s.inner}>
        <div style={s.header}>
          <div>
            <div style={s.logo}>REVOLUTION INTELL</div>
            <div style={s.logoSub}>TRM // COMPANY SETTINGS</div>
          </div>
          {onSave && <button style={s.backBtn} onClick={() => onSave(null)}>BACK TO TRM</button>}
        </div>

        <div style={s.sectionLabel}>// COMPANY BRANDING</div>
        <div style={s.logoBox}>
          {logoPreview ? <img src={logoPreview} style={s.logoImg} alt="Company logo"/> : <div style={s.logoPlaceholder}><div style={s.logoPlaceholderText}>NO LOGO<br/>UPLOADED</div></div>}
          <div>
            <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SILVER_DIM, letterSpacing: "0.1em", marginBottom: 10 }}>Upload your company logo. PNG or SVG recommended.</div>
            <input type="file" accept="image/*" style={s.fileInput} id="logo-upload" onChange={handleLogoChange}/>
            <label htmlFor="logo-upload" style={s.uploadBtn}>CHOOSE FILE</label>
            {logoFile && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SAFE, marginTop: 8, letterSpacing: "0.1em" }}>{logoFile.name}</div>}
          </div>
        </div>

        <div style={s.sectionLabel}>// COMPANY INFORMATION</div>
        <label style={s.formLabel}>Company Name</label>
        <input style={s.input} value={settings.company_name} onChange={e => setField("company_name", e.target.value)} placeholder="e.g. Muanda Global LLC"/>
        <div style={s.row}>
          <div>
            <label style={s.formLabel}>Country</label>
            <input style={s.input} value={settings.company_country} onChange={e => setField("company_country", e.target.value)} placeholder="e.g. Democratic Republic of Congo"/>
          </div>
          <div>
            <label style={s.formLabel}>Registration Number</label>
            <input style={s.input} value={settings.company_registration} onChange={e => setField("company_registration", e.target.value)} placeholder="Company registration or tax ID"/>
          </div>
        </div>
        <label style={s.formLabel}>Company Address</label>
        <textarea style={s.textarea} value={settings.company_address} onChange={e => setField("company_address", e.target.value)} placeholder="Full registered address"/>
        <div style={s.row}>
          <div>
            <label style={s.formLabel}>Phone</label>
            <input style={s.input} value={settings.phone} onChange={e => setField("phone", e.target.value)} placeholder="+1 (000) 000-0000"/>
          </div>
          <div>
            <label style={s.formLabel}>Website</label>
            <input style={s.input} value={settings.website} onChange={e => setField("website", e.target.value)} placeholder="www.company.com"/>
          </div>
        </div>

        <div style={s.sectionLabel}>// AUTHORIZED SIGNATORY</div>
        <div style={s.row}>
          <div>
            <label style={s.formLabel}>Signatory Full Name</label>
            <input style={s.input} value={settings.signatory_name} onChange={e => setField("signatory_name", e.target.value)} placeholder="e.g. Patrick Lendo"/>
          </div>
          <div>
            <label style={s.formLabel}>Title</label>
            <input style={s.input} value={settings.signatory_title} onChange={e => setField("signatory_title", e.target.value)} placeholder="e.g. Managing Director"/>
          </div>
        </div>
        <label style={s.formLabel}>Signatory Email</label>
        <input style={s.input} value={settings.signatory_email} onChange={e => setField("signatory_email", e.target.value)} placeholder="signatory@company.com"/>

        <div style={s.sectionLabel}>// PRIMARY COMMODITIES</div>
        <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em", marginBottom: 8 }}>Select all commodities your company works with.</div>
        <div style={s.commodityGrid}>
          {COMMODITY_OPTIONS.map(c => (
            <button key={c} style={s.commodityChip((settings.primary_commodities || []).includes(c))} onClick={() => toggleCommodity(c)}>{c}</button>
          ))}
        </div>

        {error && <div style={s.error}>{error}</div>}
        {message && <div style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAFE, letterSpacing: "0.1em", marginTop: 12, textAlign: "center" }}>{message}</div>}
        <button style={s.saveBtn} onClick={save} disabled={saving}>{saving ? "SAVING..." : "SAVE COMPANY SETTINGS"}</button>
      </div>
    </div>
  );
}

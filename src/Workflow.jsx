import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CYAN = "#109DCE";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const WARN = "#E0A832";
const DANGER = "#E05252";

const PIPELINE_STAGES = [
  { key: "initial_contact", label: "Initial Contact", desc: "Counterparty introduced and first communication established.", docs: ["Introduction Email", "Initial NDA"] },
  { key: "kyc_submitted", label: "KYC Submitted", desc: "Know Your Customer documentation received from counterparty.", docs: ["Passport", "Company Registration", "Proof of Address", "Beneficial Ownership"] },
  { key: "kyc_verified", label: "KYC Verified", desc: "KYC documentation reviewed and verified by compliance.", docs: ["KYC Verification Report", "Screening Certificate"] },
  { key: "loi_signed", label: "LOI Signed", desc: "Letter of Intent executed by all parties.", docs: ["Signed LOI", "Term Sheet"] },
  { key: "aml_cleared", label: "AML Cleared", desc: "Anti-Money Laundering screening completed and cleared.", docs: ["AML Screening Report", "PEP Check", "Sanctions Clearance"] },
  { key: "spa_drafted", label: "SPA Drafted", desc: "Sales and Purchase Agreement drafted and under review.", docs: ["SPA Draft", "Legal Review Notes"] },
  { key: "spa_executed", label: "SPA Executed", desc: "SPA fully executed by all principals.", docs: ["Executed SPA", "Witness Signatures"] },
  { key: "skr_validated", label: "SKR Validated", desc: "Safe Keeping Receipt validated and confirmed with custodian.", docs: ["SKR Document", "Custodian Confirmation", "LBMA Certification"] },
  { key: "escrow_opened", label: "Escrow Opened", desc: "Escrow account opened and funded per SPA terms.", docs: ["Escrow Agreement", "Funding Confirmation", "Bank Confirmation"] },
  { key: "deal_closed", label: "Deal Closed", desc: "Transaction completed and all obligations fulfilled.", docs: ["Closing Statement", "Transfer Confirmation", "Fee Settlement"] },
];

const STATUS_OPTIONS = ["pending", "in_progress", "complete", "blocked"];

function statusColor(status) {
  if (status === "complete") return SAFE;
  if (status === "in_progress") return CYAN;
  if (status === "blocked") return DANGER;
  return SILVER_DIM;
}

function statusLabel(status) {
  if (status === "complete") return "COMPLETE";
  if (status === "in_progress") return "IN PROGRESS";
  if (status === "blocked") return "BLOCKED";
  return "PENDING";
}

export default function Workflow({ counterpartyId, counterpartyName, userId }) {
  const [stages, setStages] = useState({});
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editState, setEditState] = useState({});

  useEffect(() => { loadStages(); }, [counterpartyId]);

  async function loadStages() {
    const { data } = await supabase
      .from("deal_stages")
      .select("*")
      .eq("counterparty_id", counterpartyId);
    if (data) {
      const map = {};
      data.forEach(s => { map[s.stage] = s; });
      setStages(map);
    }
  }

  function getEdit(key) {
    return editState[key] || {
      status: stages[key]?.status || "pending",
      override: stages[key]?.override || false,
      override_reason: stages[key]?.override_reason || "",
      override_authority: stages[key]?.override_authority || "",
      notes: stages[key]?.notes || "",
      document_ref: stages[key]?.document_ref || "",
    };
  }

  function setEdit(key, field, value) {
    setEditState(e => ({ ...e, [key]: { ...getEdit(key), [field]: value } }));
  }

  async function saveStage(key) {
    setSaving(true);
    const edit = getEdit(key);
    const existing = stages[key];
    const payload = {
      counterparty_id: counterpartyId,
      user_id: userId,
      stage: key,
      status: edit.status,
      override: edit.override,
      override_reason: edit.override_reason,
      override_authority: edit.override_authority,
      notes: edit.notes,
      document_ref: edit.document_ref,
      updated_at: new Date().toISOString(),
      completed_at: edit.status === "complete" ? new Date().toISOString() : null,
    };
    if (existing?.id) {
      await supabase.from("deal_stages").update(payload).eq("id", existing.id);
    } else {
      await supabase.from("deal_stages").insert(payload);
    }
    await loadStages();
    setEditState(e => { const n = { ...e }; delete n[key]; return n; });
    setSaving(false);
    setExpanded(null);
  }

  function completedCount() {
    return PIPELINE_STAGES.filter(s => stages[s.key]?.status === "complete" || stages[s.key]?.override).length;
  }

  function progressPct() {
    return Math.round((completedCount() / PIPELINE_STAGES.length) * 100);
  }

  const s = {
    wrap: { marginTop: 32 },
    sectionLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 12 },
    progressBar: { height: 4, background: "rgba(16,157,206,0.1)", marginBottom: 24, position: "relative" },
    progressFill: { height: "100%", background: CYAN, width: progressPct() + "%", transition: "width 0.5s ease" },
    progressLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.15em", marginBottom: 8 },
    stageRow: (status, isOverride) => ({
      background: BG2,
      border: "1px solid " + (isOverride ? WARN + "66" : status === "complete" ? SAFE + "44" : status === "blocked" ? DANGER + "44" : "rgba(16,157,206,0.15)"),
      borderLeft: "3px solid " + (isOverride ? WARN : statusColor(status)),
      padding: "14px 18px",
      marginBottom: 8,
      cursor: "pointer",
      transition: "all 0.2s",
    }),
    stageHeader: { display: "flex", justifyContent: "space-between", alignItems: "center" },
    stageName: { fontFamily: "'Rajdhani', sans-serif", fontSize: 15, fontWeight: 600, color: "#F0F4F6", letterSpacing: "0.05em" },
    stageDesc: { fontSize: 11, color: SILVER_DIM, marginTop: 4, fontWeight: 300 },
    statusBadge: (status, isOverride) => ({
      fontFamily: "'Share Tech Mono', monospace", fontSize: 9, padding: "3px 10px",
      border: "1px solid " + (isOverride ? WARN : statusColor(status)),
      color: isOverride ? WARN : statusColor(status),
      background: (isOverride ? WARN : statusColor(status)) + "22",
      letterSpacing: "0.1em", whiteSpace: "nowrap"
    }),
    expandedBlock: { marginTop: 14, paddingTop: 14, borderTop: "1px solid rgba(16,157,206,0.15)" },
    label: { display: "block", fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 6, marginTop: 12 },
    select: { background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "8px 12px", outline: "none", appearance: "none", width: "100%" },
    input: { width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "8px 12px", outline: "none", boxSizing: "border-box" },
    textarea: { width: "100%", background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 13, padding: "10px 12px", minHeight: 70, resize: "vertical", outline: "none", boxSizing: "border-box", fontWeight: 300 },
    overrideBox: { background: "rgba(224,168,50,0.06)", border: "1px solid rgba(224,168,50,0.2)", padding: 14, marginTop: 12 },
    overrideLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: WARN, letterSpacing: "0.15em", marginBottom: 8 },
    checkRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 10 },
    checkLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em" },
    docsRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 },
    docChip: { fontFamily: "'Share Tech Mono', monospace", fontSize: 8, padding: "3px 8px", border: "1px solid rgba(16,157,206,0.2)", color: SILVER_DIM, letterSpacing: "0.08em" },
    saveBtn: { padding: "10px 24px", background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", cursor: "pointer", marginTop: 14 },
    cancelBtn: { padding: "10px 18px", background: "transparent", border: "1px solid rgba(210,221,225,0.15)", color: SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.15em", cursor: "pointer", marginTop: 14, marginLeft: 10 },
    stepNum: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.1em", marginRight: 10, flexShrink: 0 },
  };

  return (
    <div style={s.wrap}>
      <div style={s.sectionLabel}>// 05 - DEAL WORKFLOW PIPELINE</div>
      <div style={s.progressLabel}>{completedCount()} OF {PIPELINE_STAGES.length} STAGES COMPLETE ({progressPct()}%)</div>
      <div style={s.progressBar}><div style={s.progressFill}/></div>

      {PIPELINE_STAGES.map((stage, idx) => {
        const stageData = stages[stage.key];
        const edit = getEdit(stage.key);
        const isExpanded = expanded === stage.key;
        const isOverride = stageData?.override || edit.override;
        const status = stageData?.status || "pending";

        return (
          <div key={stage.key}>
            <div style={s.stageRow(status, isOverride)} onClick={() => setExpanded(isExpanded ? null : stage.key)}>
              <div style={s.stageHeader}>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span style={s.stepNum}>{String(idx + 1).padStart(2, "0")}</span>
                  <div>
                    <div style={s.stageName}>{stage.label}</div>
                    <div style={s.stageDesc}>{stage.desc}</div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 16 }}>
                  {isOverride && <span style={{ fontFamily: "'Share Tech Mono', monospace", fontSize: 8, color: WARN, letterSpacing: "0.1em" }}>OVERRIDE</span>}
                  <span style={s.statusBadge(status, false)}>{statusLabel(status)}</span>
                  <span style={{ color: SILVER_DIM, fontSize: 12 }}>{isExpanded ? "▲" : "▼"}</span>
                </div>
              </div>

              {isExpanded && (
                <div style={s.expandedBlock} onClick={e => e.stopPropagation()}>
                  <label style={s.label}>Stage Status</label>
                  <select style={s.select} value={edit.status} onChange={e => setEdit(stage.key, "status", e.target.value)}>
                    {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o.replace("_", " ").toUpperCase()}</option>)}
                  </select>

                  <label style={s.label}>Document Reference</label>
                  <input style={s.input} value={edit.document_ref} onChange={e => setEdit(stage.key, "document_ref", e.target.value)} placeholder="Document ID, filename, or reference number"/>

                  <label style={s.label}>Notes</label>
                  <textarea style={s.textarea} value={edit.notes} onChange={e => setEdit(stage.key, "notes", e.target.value)} placeholder="Add context, verification details, or stage notes..."/>

                  <div style={s.overrideBox}>
                    <div style={s.overrideLabel}>OVERRIDE CONTROLS</div>
                    <div style={s.checkRow}>
                      <input type="checkbox" checked={edit.override} onChange={e => setEdit(stage.key, "override", e.target.checked)} id={"override-" + stage.key}/>
                      <label style={s.checkLabel} htmlFor={"override-" + stage.key}>MARK THIS STAGE AS OVERRIDDEN</label>
                    </div>
                    {edit.override && (
                      <>
                        <label style={s.label}>Override Reason</label>
                        <input style={s.input} value={edit.override_reason} onChange={e => setEdit(stage.key, "override_reason", e.target.value)} placeholder="e.g. KYC verified through HSBC directly"/>
                        <label style={s.label}>Authorizing Party</label>
                        <input style={s.input} value={edit.override_authority} onChange={e => setEdit(stage.key, "override_authority", e.target.value)} placeholder="e.g. Sonny Choudhury, Managing Principal"/>
                      </>
                    )}
                  </div>

                  <div style={s.docsRow}>
                    {stage.docs.map(doc => <span key={doc} style={s.docChip}>{doc}</span>)}
                  </div>

                  <div>
                    <button style={s.saveBtn} onClick={() => saveStage(stage.key)} disabled={saving}>
                      {saving ? "SAVING..." : "SAVE STAGE"}
                    </button>
                    <button style={s.cancelBtn} onClick={() => { setExpanded(null); setEditState(e => { const n = {...e}; delete n[stage.key]; return n; }); }}>
                      CANCEL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

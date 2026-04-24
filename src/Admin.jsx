import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const CYAN = "#109DCE";
const CYAN_BRIGHT = "#19A8D5";
const BG = "#090C11";
const BG2 = "#0D1219";
const SILVER = "#D2DDE1";
const SILVER_DIM = "#8A9BA3";
const SAFE = "#32C87A";
const WARN = "#E0A832";
const DANGER = "#E05252";

export default function Admin({ onBack }) {
  const [users, setUsers] = useState([]);
  const [counterparties, setCounterparties] = useState([]);
  const [correspondence, setCorrespondence] = useState([]);
  const [tab, setTab] = useState("users");
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteMsg, setInviteMsg] = useState("");

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    const [u, c, co] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("counterparties").select("*, profiles(email, full_name)").order("created_at", { ascending: false }),
      supabase.from("correspondence").select("*, profiles(email), counterparties(name)").order("created_at", { ascending: false })
    ]);
    if (u.data) setUsers(u.data);
    if (c.data) setCounterparties(c.data);
    if (co.data) setCorrespondence(co.data);
    setLoading(false);
  }

  async function updateRole(userId, role) {
    await supabase.from("profiles").update({ role }).eq("id", userId);
    loadData();
  }

  async function inviteUser() {
    const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail);
    if (error) setInviteMsg("Error: " + error.message);
    else { setInviteMsg("Invite sent to " + inviteEmail); setInviteEmail(""); }
  }

  const s = {
    wrap: { background: BG, minHeight: "100vh", fontFamily: "'Exo 2', sans-serif", color: SILVER },
    inner: { maxWidth: 1100, margin: "0 auto", padding: "0 24px 80px" },
    header: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 0 18px", borderBottom: "1px solid rgba(16,157,206,0.25)", marginBottom: 32 },
    logo: { fontFamily: "'Rajdhani', sans-serif", fontSize: 20, fontWeight: 700, color: CYAN_BRIGHT, letterSpacing: "0.12em" },
    logoSub: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: SILVER_DIM, letterSpacing: "0.2em", marginTop: 2 },
    backBtn: { padding: "8px 18px", background: "transparent", border: "1px solid rgba(16,157,206,0.3)", color: CYAN, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.15em", cursor: "pointer" },
    sectionLabel: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: CYAN, letterSpacing: "0.25em", textTransform: "uppercase", marginBottom: 6 },
    tabRow: { display: "flex", gap: 2, marginBottom: 28 },
    tab: (active) => ({ padding: "10px 20px", background: active ? "rgba(16,157,206,0.15)" : "transparent", border: "1px solid " + (active ? CYAN : "rgba(16,157,206,0.2)"), color: active ? CYAN : SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 10, letterSpacing: "0.15em", cursor: "pointer" }),
    table: { width: "100%", borderCollapse: "collapse" },
    th: { fontFamily: "'Share Tech Mono', monospace", fontSize: 9, color: CYAN, letterSpacing: "0.15em", textTransform: "uppercase", padding: "10px 14px", borderBottom: "1px solid rgba(16,157,206,0.2)", textAlign: "left" },
    td: { fontSize: 13, color: SILVER, padding: "12px 14px", borderBottom: "1px solid rgba(16,157,206,0.08)", fontWeight: 300 },
    badge: (role) => ({ display: "inline-block", padding: "2px 10px", border: "1px solid " + (role === "admin" ? CYAN : "rgba(210,221,225,0.2)"), color: role === "admin" ? CYAN : SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, letterSpacing: "0.1em" }),
    scoreChip: (score) => ({ display: "inline-block", padding: "2px 10px", border: "1px solid " + (score >= 80 ? SAFE : score >= 40 ? WARN : DANGER), color: score >= 80 ? SAFE : score >= 40 ? WARN : DANGER, fontFamily: "'Share Tech Mono', monospace", fontSize: 9 }),
    inviteBlock: { background: BG2, border: "1px solid rgba(16,157,206,0.22)", padding: 24, marginBottom: 28 },
    input: { background: BG, border: "1px solid rgba(16,157,206,0.25)", color: SILVER, fontFamily: "'Exo 2', sans-serif", fontSize: 14, padding: "10px 14px", outline: "none", width: 300, marginRight: 12 },
    inviteBtn: { padding: "10px 20px", background: "transparent", border: "1px solid " + CYAN, color: CYAN, fontFamily: "'Rajdhani', sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", cursor: "pointer" },
    msg: { fontFamily: "'Share Tech Mono', monospace", fontSize: 10, color: SAFE, letterSpacing: "0.1em", marginTop: 10 },
    roleBtn: (role) => ({ padding: "3px 10px", background: "transparent", border: "1px solid rgba(16,157,206,0.2)", color: SILVER_DIM, fontFamily: "'Share Tech Mono', monospace", fontSize: 9, cursor: "pointer", marginLeft: 6 }),
  };

  return (
    <div style={s.wrap}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@200;300;400;600&display=swap');*{box-sizing:border-box}`}</style>
      <div style={s.inner}>
        <div style={s.header}>
          <div>
            <div style={s.logo}>REVOLUTION INTELL</div>
            <div style={s.logoSub}>TRM // ADMIN DASHBOARD</div>
          </div>
          <button style={s.backBtn} onClick={onBack}>BACK TO TRM</button>
        </div>

        <div style={s.tabRow}>
          {["users", "counterparties", "correspondence"].map(t => (
            <button key={t} style={s.tab(tab === t)} onClick={() => setTab(t)}>{t.toUpperCase()}</button>
          ))}
        </div>

        {tab === "users" && (
          <>
            <div style={s.inviteBlock}>
              <div style={s.sectionLabel}>// INVITE USER</div>
              <div style={{ marginTop: 12 }}>
                <input style={s.input} value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="user@company.com"/>
                <button style={s.inviteBtn} onClick={inviteUser}>SEND INVITE</button>
              </div>
              {inviteMsg && <div style={s.msg}>{inviteMsg}</div>}
            </div>
            <div style={s.sectionLabel}>// ALL USERS ({users.length})</div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Email</th>
                  <th style={s.th}>Full Name</th>
                  <th style={s.th}>Company</th>
                  <th style={s.th}>Role</th>
                  <th style={s.th}>Joined</th>
                  <th style={s.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td style={s.td}>{u.email}</td>
                    <td style={s.td}>{u.full_name || "—"}</td>
                    <td style={s.td}>{u.company || "—"}</td>
                    <td style={s.td}><span style={s.badge(u.role)}>{u.role}</span></td>
                    <td style={s.td}>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td style={s.td}>
                      {u.role !== "admin" && <button style={s.roleBtn("admin")} onClick={() => updateRole(u.id, "admin")}>MAKE ADMIN</button>}
                      {u.role === "admin" && <button style={s.roleBtn("user")} onClick={() => updateRole(u.id, "user")}>MAKE USER</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === "counterparties" && (
          <>
            <div style={s.sectionLabel}>// ALL COUNTERPARTIES ({counterparties.length})</div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Name</th>
                  <th style={s.th}>Country</th>
                  <th style={s.th}>Transaction</th>
                  <th style={s.th}>Score</th>
                  <th style={s.th}>Assessed By</th>
                  <th style={s.th}>Date</th>
                </tr>
              </thead>
              <tbody>
                {counterparties.map(c => (
                  <tr key={c.id}>
                    <td style={s.td}>{c.name}</td>
                    <td style={s.td}>{c.country || "—"}</td>
                    <td style={s.td}>{c.tx_type || "—"}</td>
                    <td style={s.td}>{c.score ? <span style={s.scoreChip(c.score)}>{c.score}/100</span> : "—"}</td>
                    <td style={s.td}>{c.profiles?.email || "—"}</td>
                    <td style={s.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        {tab === "correspondence" && (
          <>
            <div style={s.sectionLabel}>// ALL CORRESPONDENCE ({correspondence.length})</div>
            <table style={s.table}>
              <thead>
                <tr>
                  <th style={s.th}>Counterparty</th>
                  <th style={s.th}>Source</th>
                  <th style={s.th}>Submitted By</th>
                  <th style={s.th}>Date</th>
                  <th style={s.th}>Flags</th>
                </tr>
              </thead>
              <tbody>
                {correspondence.map(c => (
                  <tr key={c.id}>
                    <td style={s.td}>{c.counterparties?.name || "—"}</td>
                    <td style={s.td}>{c.source || "—"}</td>
                    <td style={s.td}>{c.profiles?.email || "—"}</td>
                    <td style={s.td}>{new Date(c.created_at).toLocaleDateString()}</td>
                    <td style={s.td}>{c.flags ? JSON.parse(c.flags).length + " flags" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

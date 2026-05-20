"use client";
import { Users, ScanLine, Activity, TrendingUp, ArrowRight, UserPlus, History } from "lucide-react";

function StatCard({ icon: Icon, label, value, sub, delay }) {
  return (
    <div className={`animate-fadeUp stagger-${delay}`} style={{
      background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)",
      padding: 20, boxShadow: "var(--shadow)", transition: "transform 0.2s, box-shadow 0.2s", cursor: "default",
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-lg)"; }}
      onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
        <Icon size={20} color="var(--primary)" />
      </div>
      <div style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>{value}</div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--success)", marginTop: 4, fontWeight: 500 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ patients, scans, setTab, goToScan, goToPatientDetail }) {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentScans = scans.filter(s => new Date(s.createdAt).getTime() > weekAgo).length;
  const avgConf = scans.length ? (scans.reduce((a, s) => a + (s.confidence || 0), 0) / scans.length * 100).toFixed(0) : 0;

  return (
    <div>
      <div className="animate-fadeUp" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Dashboard</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Overview of patient assessments and clinical activity</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total Patients" value={patients.length} delay={1} />
        <StatCard icon={ScanLine} label="Scans This Week" value={recentScans} delay={2} />
        <StatCard icon={Activity} label="Total Assessments" value={scans.length} delay={3} />
        <StatCard icon={TrendingUp} label="Avg. Confidence" value={`${avgConf}%`} delay={4} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
        {/* Recent Patients */}
        <div className="animate-fadeUp stagger-5" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Recent Patients</span>
            <button onClick={() => setTab("patients")} style={{ fontSize: 12, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>View all <ArrowRight size={12} /></button>
          </div>
          {patients.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Users size={32} color="var(--text-muted)" style={{ opacity: 0.4, marginBottom: 8 }} />
              <p style={{ fontSize: 14, fontWeight: 600 }}>No patients yet</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Add your first patient to get started</p>
              <button onClick={() => setTab("patients")} style={{ marginTop: 12, padding: "6px 16px", fontSize: 12, fontWeight: 500, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Add Patient</button>
            </div>
          ) : (
            patients.slice(0, 5).map((p, i) => (
              <div key={p.id} className={`animate-slideIn stagger-${i + 1}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 20px", borderBottom: "1px solid var(--border)", cursor: "pointer", transition: "background 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                onClick={() => goToPatientDetail(p)}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--primary-hover)" }}>
                  {p.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>MRN: {p.mrn}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: "var(--success-light)", color: "var(--success)" }}>Active</span>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="animate-fadeUp stagger-6" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Quick Actions</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { icon: UserPlus, label: "New Patient", desc: "Register a record", tab: "patients", color: "var(--primary)", bg: "var(--primary-light)" },
              { icon: ScanLine, label: "Run Scan", desc: "Analyze a drawing", tab: "scan", color: "var(--info)", bg: "#eff6ff" },
              { icon: History, label: "History", desc: "Browse results", tab: "history", color: "var(--warning)", bg: "var(--warning-light)" },
              { icon: Users, label: "All Patients", desc: "View records", tab: "patients", color: "var(--success)", bg: "var(--success-light)" },
            ].map(a => (
              <button key={a.label} onClick={() => setTab(a.tab)} style={{
                display: "flex", flexDirection: "column", gap: 8, padding: 14, borderRadius: 8,
                border: "1px solid var(--border)", background: "transparent", cursor: "pointer",
                textAlign: "left", fontFamily: "inherit", transition: "all 0.15s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "#cbd5e1"; e.currentTarget.style.boxShadow = "var(--shadow)"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.boxShadow = "none"; }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 6, background: a.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <a.icon size={16} color={a.color} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{a.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

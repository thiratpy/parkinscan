"use client";
import { CheckCircle2, AlertCircle, Clock, History as HistoryIcon, AlertTriangle } from "lucide-react";

export default function History({ scans, goToPatientDetail, patients }) {
  return (
    <div>
      <div className="animate-fadeUp" style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Assessment History</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{scans.length} assessment{scans.length !== 1 ? "s" : ""} recorded</p>
      </div>

      {scans.length === 0 ? (
        <div className="animate-fadeUp stagger-1" style={{ textAlign: "center", padding: 60 }}>
          <HistoryIcon size={36} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>No assessment history</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>Run your first scan to see results here.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {scans.map((scan, i) => {
            const isHealthy = scan.prediction === "healthy" || scan.label === "healthy";
            const date = new Date(scan.createdAt);
            const dateStr = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) + " at " + date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
            const conf = scan.confidence ? (scan.confidence * 100).toFixed(1) : "N/A";
            const lowConf = scan.confidence && scan.confidence < 0.70;
            const patient = scan.patientId ? patients.find(p => p.id === scan.patientId) : null;

            return (
              <div key={scan.id} className={`animate-slideIn stagger-${Math.min(i + 1, 6)}`} style={{
                display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)",
                boxShadow: "var(--shadow)", transition: "all 0.15s",
                cursor: patient ? "pointer" : "default",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                onClick={() => patient && goToPatientDetail(patient)}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  background: isHealthy ? "var(--success-light)" : "var(--danger-light)",
                }}>
                  {isHealthy ? <CheckCircle2 size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{isHealthy ? "Healthy Pattern" : "Parkinson's Indicators"}</span>
                    {scan.patientName && <span style={{ fontSize: 12, color: "var(--text-muted)" }}>— {scan.patientName}</span>}
                    {scan.mock && <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "var(--warning-light)", color: "var(--warning)", fontWeight: 500 }}>Mock</span>}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 3, flexWrap: "wrap" }}>
                    <Clock size={12} color="var(--text-muted)" />
                    <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{dateStr}</span>
                    {lowConf && (
                      <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10, color: "var(--warning)" }}>
                        <AlertTriangle size={10} />Low confidence
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                  {scan.doctorOverride && (
                    <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, fontWeight: 500, background: scan.doctorOverride === "agree" ? "var(--success-light)" : "var(--warning-light)", color: scan.doctorOverride === "agree" ? "var(--success)" : "var(--warning)" }}>
                      {scan.doctorOverride === "agree" ? "Confirmed" : "Disputed"}
                    </span>
                  )}
                  <span style={{
                    fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 99,
                    background: isHealthy ? "var(--success-light)" : "var(--danger-light)",
                    color: isHealthy ? "var(--success)" : "var(--danger)",
                  }}>{conf}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

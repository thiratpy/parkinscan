"use client";
import { LayoutDashboard, Users, ScanLine, History, Brain, Menu, X } from "lucide-react";

const items = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "patients", icon: Users, label: "Patients" },
  { id: "scan", icon: ScanLine, label: "AI Scan" },
  { id: "history", icon: History, label: "History" },
];

export default function Sidebar({ tab, setTab, open, onToggle }) {
  return (
    <>
      {/* Mobile toggle button */}
      <button onClick={onToggle} className="sidebar-toggle" aria-label="Toggle sidebar">
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      <aside style={{
        position: "fixed", left: 0, top: 0, bottom: 0, width: 260,
        background: "var(--sidebar-bg)", display: "flex", flexDirection: "column",
        zIndex: 40, overflow: "hidden",
        transform: open ? "translateX(0)" : "translateX(-100%)",
        transition: "transform 0.25s ease",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "0 20px", height: 64, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: "var(--primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Brain size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: -0.3 }}>ParkinScan</div>
            <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: 1.5 }}>Clinical Platform</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: "16px 12px", display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((item) => {
            const active = tab === item.id || (item.id === "patients" && tab === "patientDetail");
            return (
              <button key={item.id} onClick={() => setTab(item.id)} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "0 12px", height: 40,
                borderRadius: 6, border: "none", cursor: "pointer", width: "100%", textAlign: "left",
                background: active ? "var(--sidebar-active)" : "transparent",
                color: active ? "#fff" : "var(--text-muted)", fontSize: 14, fontWeight: 500,
                fontFamily: "inherit", transition: "all 0.15s",
              }}
                onMouseEnter={(e) => { if (!active) { e.currentTarget.style.background = "var(--sidebar-hover)"; e.currentTarget.style.color = "#fff"; }}}
                onMouseLeave={(e) => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-muted)"; }}}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Status */}
        <div style={{ padding: "12px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", borderRadius: 6, background: "rgba(255,255,255,0.04)" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2dd4bf" }} />
            <div>
              <div style={{ fontSize: 11, color: "#cbd5e1" }}>System Status</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#2dd4bf" }}>Demo v1.0</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

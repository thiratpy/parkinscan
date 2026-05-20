"use client";
import { useState, useEffect } from "react";
import Sidebar from "./ui/Sidebar";
import Dashboard from "./ui/Dashboard";
import Patients from "./ui/Patients";
import Scanner from "./ui/Scanner";
import History from "./ui/History";

function loadData(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : fallback; } catch { return fallback; }
}
function saveData(key, data) { localStorage.setItem(key, JSON.stringify(data)); }

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    setPatients(loadData("pk_patients", []));
    setScans(loadData("pk_scans", []));
    // Collapse sidebar on small screens
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setSidebarOpen(false);
    const handler = (e) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const updatePatients = (p) => { setPatients(p); saveData("pk_patients", p); };
  const updateScans = (s) => { setScans(s); saveData("pk_scans", s); };

  const addPatient = (p) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const mrn = "PKS-" + id.toUpperCase().slice(0, 8);
    const newP = { id, mrn, ...p, status: "active", createdAt: new Date().toISOString() };
    updatePatients([newP, ...patients]);
    return newP;
  };

  const editPatient = (id, updates) => {
    updatePatients(patients.map(p => p.id === id ? { ...p, ...updates } : p));
    if (selectedPatient?.id === id) setSelectedPatient(prev => ({ ...prev, ...updates }));
  };

  const deletePatient = (id) => {
    updatePatients(patients.filter(p => p.id !== id));
    updateScans(scans.filter(s => s.patientId !== id));
    if (selectedPatient?.id === id) { setSelectedPatient(null); setTab("patients"); }
  };

  const addScan = (scan) => {
    const newScan = { id: Date.now().toString(), ...scan, createdAt: new Date().toISOString() };
    updateScans([newScan, ...scans]);
  };

  const goToScan = (patient) => { setSelectedPatient(patient); setTab("scan"); };
  const goToPatientDetail = (patient) => { setSelectedPatient(patient); setTab("patientDetail"); };

  const props = {
    patients, scans, addPatient, editPatient, deletePatient, addScan,
    selectedPatient, setSelectedPatient, setTab, goToScan, goToPatientDetail,
    sidebarOpen, setSidebarOpen,
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar tab={tab} setTab={setTab} open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      {/* Overlay for mobile when sidebar open */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} className="sidebar-overlay" />
      )}
      <main style={{ flex: 1, marginLeft: sidebarOpen ? 260 : 0, padding: 24, background: "var(--bg)", transition: "margin-left 0.25s ease", minWidth: 0 }}>
        {tab === "dashboard" && <Dashboard {...props} />}
        {tab === "patients" && <Patients {...props} />}
        {tab === "patientDetail" && <Patients {...props} detailMode />}
        {tab === "scan" && <Scanner {...props} />}
        {tab === "history" && <History {...props} />}
      </main>
    </div>
  );
}

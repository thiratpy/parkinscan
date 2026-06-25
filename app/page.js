"use client";
import { useState, useEffect } from "react";
import Sidebar from "./ui/Sidebar";
import Dashboard from "./ui/Dashboard";
import Patients from "./ui/Patients";
import Scanner from "./ui/Scanner";
import History from "./ui/History";

import { listPatients, createPatient as dbCreatePatient, updatePatient as dbUpdatePatient, deletePatient as dbDeletePatient, listScanHistory, addScanResult as dbAddScanResult } from "./lib/db";

export default function App() {
  const [tab, setTab] = useState("dashboard");
  const [patients, setPatients] = useState([]);
  const [scans, setScans] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const pRes = await listPatients({ pageSize: 1000 });
        setPatients(pRes.patients || []);
        const sRes = await listScanHistory(null, { pageSize: 1000 });
        setScans(sRes || []);
      } catch (err) {
        console.error("Failed to load from Supabase:", err);
      }
    }
    load();
    // Collapse sidebar on small screens
    const mq = window.matchMedia("(max-width: 768px)");
    if (mq.matches) setSidebarOpen(false);
    const handler = (e) => setSidebarOpen(!e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const addPatient = async (p) => {
    try {
      const newP = await dbCreatePatient(p);
      setPatients(prev => [newP, ...prev]);
      return newP;
    } catch (e) { console.error("addPatient error:", e); }
  };

  const editPatient = async (id, updates) => {
    try {
      await dbUpdatePatient(id, updates);
      setPatients(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      if (selectedPatient?.id === id) setSelectedPatient(prev => ({ ...prev, ...updates }));
    } catch (e) { console.error("editPatient error:", e); }
  };

  const deletePatient = async (id) => {
    try {
      await dbDeletePatient(id);
      setPatients(prev => prev.filter(p => p.id !== id));
      setScans(prev => prev.filter(s => s.patientId !== id));
      if (selectedPatient?.id === id) { setSelectedPatient(null); setTab("patients"); }
    } catch (e) { console.error("deletePatient error:", e); }
  };

  const addScan = async (scan) => {
    try {
      const { patientId, ...scanData } = scan;
      const newScan = await dbAddScanResult(patientId, scanData);
      setScans(prev => [newScan, ...prev]);
    } catch (e) { console.error("addScan error:", e); }
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



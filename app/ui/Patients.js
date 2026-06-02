"use client";
import { useState } from "react";
import { UserPlus, Search, X, Calendar, ArrowRight, ScanLine, ArrowLeft, Edit3, Trash2, User, Stethoscope, Pill, Phone, Save } from "lucide-react";

// ── Shared styles ──
const labelStyle = { display: "block", fontSize: 13, fontWeight: 500, color: "var(--text)", marginBottom: 6 };
const inputStyle = { width: "100%", height: 40, padding: "0 12px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", outline: "none", fontFamily: "inherit", background: "#fff", color: "var(--text)", transition: "border 0.15s" };
const btnPrimary = { padding: "8px 20px", fontSize: 13, fontWeight: 500, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" };
const btnGhost = { padding: "8px 20px", fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--text-secondary)", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" };
const btnDanger = { padding: "8px 20px", fontSize: 13, fontWeight: 500, background: "var(--danger)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" };

const diagLabels = { under_evaluation: "Under Evaluation", diagnosed: "Diagnosed", not_diagnosed: "Not Diagnosed" };
const diagColors = { under_evaluation: { bg: "var(--warning-light)", color: "var(--warning)" }, diagnosed: { bg: "var(--danger-light)", color: "var(--danger)" }, not_diagnosed: { bg: "var(--success-light)", color: "var(--success)" } };

// ── Patient Form (Add/Edit) ──
function PatientForm({ onSubmit, onClose, initial }) {
  const [f, setF] = useState(initial || { name: "", hn: "", age: "", sex: "male", dateOfBirth: "", diagnosisStatus: "under_evaluation", medications: "", treatingPhysician: "", phone: "", email: "", notes: "" });
  const [err, setErr] = useState("");
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) { setErr("Name is required"); return; }
    const ageNum = Number(f.age);
    if (!f.age || isNaN(ageNum) || ageNum < 0 || ageNum > 120 || !Number.isInteger(ageNum)) {
      setErr("Age must be a whole number between 0 and 120"); return;
    }
    if (f.phone && !/^[\d+\-\s]{9,15}$/.test(f.phone)) {
      setErr("Phone must be 9–15 digits (may include +, -, spaces)"); return;
    }
    if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
      setErr("Please enter a valid email address"); return;
    }
    onSubmit(f);
  };
  const isEdit = !!initial;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)" }} />
      <div className="animate-scaleIn" style={{ position: "relative", width: "100%", maxWidth: 560, background: "#fff", borderRadius: "var(--radius-lg)", boxShadow: "0 8px 24px rgba(0,0,0,0.15)", maxHeight: "85vh", overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderBottom: "1px solid var(--border)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>{isEdit ? "Edit Patient" : "Register New Patient"}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{isEdit ? "Update patient information" : "Fill in the details below"}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 6, borderRadius: 6, color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        <form onSubmit={submit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Full Name *" value={f.name} onChange={v => { set("name", v); setErr(""); }} placeholder="Patient full name" />
          <Field label="HN (Hospital Number)" value={f.hn || ""} onChange={v => { set("hn", v); setErr(""); }} placeholder="e.g., HN-12345 (optional, for hospital reference)" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Age *" value={f.age} onChange={v => { set("age", v); setErr(""); }} type="number" placeholder="0–120" min="0" max="120" />
            <div><label style={labelStyle}>Sex</label><select value={f.sex} onChange={e => set("sex", e.target.value)} style={inputStyle}><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Date of Birth" value={f.dateOfBirth} onChange={v => set("dateOfBirth", v)} type="date" />
            <div><label style={labelStyle}>Diagnosis</label><select value={f.diagnosisStatus} onChange={e => set("diagnosisStatus", e.target.value)} style={inputStyle}><option value="under_evaluation">Under Evaluation</option><option value="diagnosed">Diagnosed</option><option value="not_diagnosed">Not Diagnosed</option></select></div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Phone" value={f.phone || ""} onChange={v => set("phone", v)} placeholder="Contact number" />
            <Field label="Email" value={f.email || ""} onChange={v => set("email", v)} placeholder="Email address" />
          </div>
          <Field label="Medications" value={f.medications} onChange={v => set("medications", v)} placeholder="e.g., Levodopa 100mg" />
          <Field label="Treating Physician" value={f.treatingPhysician} onChange={v => set("treatingPhysician", v)} placeholder="Dr. name" />
          {err && <div style={{ fontSize: 13, color: "var(--danger)", background: "var(--danger-light)", padding: "8px 12px", borderRadius: 6 }}>{err}</div>}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
            <button type="button" onClick={onClose} style={btnGhost}>Cancel</button>
            <button type="submit" style={btnPrimary}>{isEdit ? "Save Changes" : "Add Patient"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, min, max }) {
  return (
    <div><label style={labelStyle}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} min={min} max={max} />
    </div>
  );
}

// ── Patient Detail View ──
function PatientDetail({ patient, scans, goToScan, editPatient, deletePatient, setTab }) {
  const [showEdit, setShowEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!patient) return (
    <div className="animate-fadeUp" style={{ textAlign: "center", padding: 60 }}>
      <User size={36} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 12 }} />
      <p style={{ fontSize: 15, fontWeight: 600 }}>No patient selected</p>
      <button onClick={() => setTab("patients")} style={{ ...btnPrimary, marginTop: 16, fontSize: 12 }}>Go to Patients</button>
    </div>
  );

  const patientScans = scans.filter(s => s.patientId === patient.id);
  const d = diagColors[patient.diagnosisStatus] || diagColors.under_evaluation;
  const initials = patient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div>
      {/* Back button */}
      <button onClick={() => setTab("patients")} className="animate-fadeUp" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 20 }}>
        <ArrowLeft size={16} />Back to Patients
      </button>

      {/* Header card */}
      <div className="animate-fadeUp stagger-1" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 700, color: "var(--primary-hover)", flexShrink: 0 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 20, fontWeight: 700 }}>{patient.name}</h1>
              <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 10px", borderRadius: 99, background: d.bg, color: d.color }}>{diagLabels[patient.diagnosisStatus] || "Unknown"}</span>
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>{patient.hn ? `HN: ${patient.hn} · ` : ""}MRN: {patient.mrn} · {patient.age} years · {patient.sex}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setShowEdit(true)} style={{ ...btnGhost, display: "flex", alignItems: "center", gap: 4, border: "1px solid var(--border)", borderRadius: 6 }}><Edit3 size={14} />Edit</button>
            <button onClick={() => goToScan(patient)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 4 }}><ScanLine size={14} />New Scan</button>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 20 }}>
        {/* Left: Info cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <InfoCard icon={User} title="Demographics" color="var(--primary)" items={[
            { label: "Date of Birth", value: patient.dateOfBirth || "—" },
            { label: "Sex", value: patient.sex ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1) : "—" },
            { label: "Registered", value: new Date(patient.createdAt).toLocaleDateString() },
          ]} />
          <InfoCard icon={Phone} title="Contact" color="var(--info)" items={[
            { label: "Phone", value: patient.phone || "—" },
            { label: "Email", value: patient.email || "—" },
          ]} />
          <InfoCard icon={Stethoscope} title="Clinical" color="var(--success)" items={[
            { label: "Physician", value: patient.treatingPhysician || "—" },
            { label: "Medications", value: patient.medications || "None recorded" },
          ]} />
          {/* Danger zone */}
          <div className="animate-fadeUp stagger-5" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}><Trash2 size={14} />Danger Zone</div>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Permanently delete this patient and all associated scans.</p>
            {confirmDelete ? (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => deletePatient(patient.id)} style={btnDanger}>Confirm Delete</button>
                <button onClick={() => setConfirmDelete(false)} style={btnGhost}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} style={{ ...btnDanger, opacity: 0.8, fontSize: 12 }}>Delete Patient</button>
            )}
          </div>
        </div>

        {/* Right: Scan history */}
        <div className="animate-fadeUp stagger-3" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Assessment History</div>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{patientScans.length} scan{patientScans.length !== 1 ? "s" : ""}</span>
          </div>
          {patientScans.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <ScanLine size={28} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontSize: 13, fontWeight: 600 }}>No scans yet</p>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Run the first AI scan for this patient.</p>
              <button onClick={() => goToScan(patient)} style={{ ...btnPrimary, marginTop: 12, fontSize: 12 }}>Run Scan</button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {patientScans.map(scan => {
                const isHealthy = scan.prediction === "healthy" || scan.label === "healthy";
                const conf = scan.confidence ? (scan.confidence * 100).toFixed(1) : "N/A";
                const date = new Date(scan.createdAt);
                return (
                  <div key={scan.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 6, border: "1px solid var(--border)", transition: "background 0.15s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: isHealthy ? "var(--success)" : "var(--danger)", flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{isHealthy ? "Healthy" : "Parkinson's"}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{date.toLocaleDateString()} at {date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: isHealthy ? "var(--success)" : "var(--danger)" }}>{conf}%</span>
                    {scan.doctorOverride && (
                      <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: scan.doctorOverride === "agree" ? "var(--success-light)" : "var(--warning-light)", color: scan.doctorOverride === "agree" ? "var(--success)" : "var(--warning)" }}>
                        {scan.doctorOverride === "agree" ? "Confirmed" : "Disputed"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showEdit && <PatientForm initial={patient} onSubmit={(data) => { editPatient(patient.id, data); setShowEdit(false); }} onClose={() => setShowEdit(false)} />}
    </div>
  );
}

function InfoCard({ icon: Icon, title, color, items }) {
  return (
    <div className="animate-fadeUp stagger-2" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 16 }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <Icon size={14} color={color} />{title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map(item => (
          <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{item.label}</span>
            <span style={{ fontSize: 12, fontWeight: 500, textAlign: "right" }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Patient List View ──
export default function Patients({ patients, addPatient, editPatient, deletePatient, goToScan, goToPatientDetail, scans, selectedPatient, setTab, detailMode }) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // If in detail mode, show PatientDetail
  if (detailMode) {
    return <PatientDetail patient={selectedPatient} scans={scans} goToScan={goToScan} editPatient={editPatient} deletePatient={deletePatient} setTab={setTab} />;
  }

  const filtered = patients.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.mrn.toLowerCase().includes(search.toLowerCase()) || (p.hn && p.hn.toLowerCase().includes(search.toLowerCase())));

  return (
    <div>
      <div className="animate-fadeUp" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div><h1 style={{ fontSize: 24, fontWeight: 700 }}>Patients</h1><p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>{patients.length} patient{patients.length !== 1 ? "s" : ""} registered</p></div>
        <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, display: "flex", alignItems: "center", gap: 6 }}><UserPlus size={16} />Add Patient</button>
      </div>

      <div className="animate-fadeUp stagger-1" style={{ marginBottom: 20 }}>
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search size={16} color="var(--text-muted)" style={{ position: "absolute", left: 12, top: 12 }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, MRN, or HN..." style={{ ...inputStyle, paddingLeft: 36 }} />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="animate-fadeUp stagger-2" style={{ textAlign: "center", padding: 60 }}>
          <UserPlus size={36} color="var(--text-muted)" style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontSize: 15, fontWeight: 600 }}>{search ? "No matching patients" : "No patients yet"}</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 300, margin: "4px auto 0" }}>
            {search ? "Try a different search term." : "Register your first patient to begin tracking assessments."}
          </p>
          {!search && <button onClick={() => setShowForm(true)} style={{ ...btnPrimary, marginTop: 16, fontSize: 12 }}>Add First Patient</button>}
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
          {filtered.map((p, i) => {
            const d = diagColors[p.diagnosisStatus] || diagColors.under_evaluation;
            const patientScans = scans.filter(s => s.patientId === p.id);
            return (
              <div key={p.id} className={`animate-fadeUp stagger-${Math.min(i + 1, 6)}`} style={{
                background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)",
                padding: 16, boxShadow: "var(--shadow)", transition: "all 0.2s", cursor: "pointer",
              }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = "var(--shadow-lg)"; e.currentTarget.style.borderColor = "#cbd5e1"; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = "var(--shadow)"; e.currentTarget.style.borderColor = "var(--border)"; }}
                onClick={() => goToPatientDetail(p)}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--primary-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "var(--primary-hover)", flexShrink: 0 }}>
                    {p.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                      <span style={{ fontSize: 11, fontWeight: 500, padding: "2px 8px", borderRadius: 99, background: d.bg, color: d.color, flexShrink: 0 }}>{diagLabels[p.diagnosisStatus] || "Unknown"}</span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{p.hn ? `HN: ${p.hn} · ` : ""}MRN: {p.mrn} · {p.age} yrs · {p.sex}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--text-muted)" }}>
                        <Calendar size={12} />{new Date(p.createdAt).toLocaleDateString()}
                        {patientScans.length > 0 && <span>&middot; {patientScans.length} scan{patientScans.length !== 1 ? "s" : ""}</span>}
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); goToScan(p); }} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
                        <ScanLine size={12} />Scan <ArrowRight size={10} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showForm && <PatientForm onSubmit={(data) => { addPatient(data); setShowForm(false); }} onClose={() => setShowForm(false)} />}
    </div>
  );
}

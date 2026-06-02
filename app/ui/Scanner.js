"use client";
import { useState, useCallback, useRef } from "react";
import { Upload, X, ScanLine, CheckCircle2, AlertCircle, Brain, TrendingUp, Save, ImageIcon, Loader2, AlertTriangle, ThumbsUp, ThumbsDown, Users, ArrowLeft, FileDown, Eye } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const CONFIDENCE_THRESHOLD = 0.70;

export default function Scanner({ patients, selectedPatient, setSelectedPatient, addScan, setTab }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [doctorOverride, setDoctorOverride] = useState(null);
  const [saved, setSaved] = useState(false);
  const [heatmapSrc, setHeatmapSrc] = useState(null);
  const printRef = useRef(null);

  const handleFile = useCallback((f) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) { setErrorMsg("Invalid file type. Please upload a PNG, JPEG, or WebP image."); return; }
    if (f.size > 10 * 1024 * 1024) { setErrorMsg("File too large. Maximum size is 10MB."); return; }
    setFile(f);
    setErrorMsg("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(f);
    setResult(null);
    setDoctorOverride(null);
    setSaved(false);
  }, []);

  const analyze = async () => {
    if (!file || !selectedPatient) return;
    setStatus("analyzing");
    setErrorMsg("");
    setHeatmapSrc(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      // Try gradcam endpoint first, fallback to /predict
      let res = await fetch(`${API_URL}/predict-gradcam`, { method: "POST", body: fd });
      if (!res.ok && res.status === 404) {
        const fd2 = new FormData();
        fd2.append("file", file);
        res = await fetch(`${API_URL}/predict`, { method: "POST", body: fd2 });
      }
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        throw new Error(`Server returned ${res.status}${errText ? ": " + errText : ""}`);
      }
      const data = await res.json();
      setResult(data);
      if (data.heatmap) setHeatmapSrc(data.heatmap);
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err.message || "Analysis failed. Check the API connection.");
    }
  };

  const save = () => {
    if (!result || !selectedPatient) return;
    addScan({
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      prediction: result.prediction || result.label,
      confidence: result.confidence,
      label: result.label || result.prediction,
      doctorOverride: doctorOverride,
      mock: result.mock || false,
    });
    setSaved(true);
  };

  const reset = () => { setFile(null); setPreview(null); setResult(null); setStatus("idle"); setErrorMsg(""); setDoctorOverride(null); setSaved(false); setHeatmapSrc(null); };

  const exportPdf = () => {
    const el = printRef.current;
    if (!el) return;
    const printWin = window.open("", "_blank");
    if (!printWin) return;
    printWin.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>ParkinScan Report — ${selectedPatient?.name || "Patient"}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Sarabun', sans-serif; font-size: 13px; color: #1a1a2e; padding: 32px; max-width: 700px; margin: 0 auto; }
  h2 { font-size: 18px; margin-bottom: 4px; }
  .meta { font-size: 12px; color: #666; margin-bottom: 20px; }
  .section { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .section-title { font-size: 13px; font-weight: 600; margin-bottom: 10px; color: #0f3460; }
  .row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; }
  .row .label { color: #888; }
  .badge { display: inline-block; padding: 2px 10px; border-radius: 99px; font-size: 11px; font-weight: 600; }
  .healthy { background: #d1fae5; color: #059669; }
  .parkinson { background: #ffe4e6; color: #e11d48; }
  img { max-width: 100%; border-radius: 6px; margin-top: 8px; }
  .disclaimer { font-size: 11px; color: #b45309; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 6px; padding: 10px 14px; margin-top: 16px; }
  @media print { body { padding: 16px; } }
</style></head><body>`);
    const label = result.prediction || result.label;
    const isH = label === "healthy";
    const confPct = (result.confidence * 100).toFixed(1);
    const now = new Date().toLocaleString();
    printWin.document.write(`<h2>ParkinScan — AI Scan Report</h2>`);
    printWin.document.write(`<div class="meta">${now}</div>`);
    printWin.document.write(`<div class="section"><div class="section-title">Patient Information</div>`);
    printWin.document.write(`<div class="row"><span class="label">Name</span><span>${selectedPatient.name}</span></div>`);
    if (selectedPatient.hn) printWin.document.write(`<div class="row"><span class="label">HN</span><span>${selectedPatient.hn}</span></div>`);
    printWin.document.write(`<div class="row"><span class="label">MRN</span><span>${selectedPatient.mrn}</span></div>`);
    printWin.document.write(`<div class="row"><span class="label">Age / Sex</span><span>${selectedPatient.age} yrs / ${selectedPatient.sex}</span></div>`);
    printWin.document.write(`</div>`);
    printWin.document.write(`<div class="section"><div class="section-title">AI Classification Result</div>`);
    printWin.document.write(`<div class="row"><span class="label">Classification</span><span class="badge ${isH ? 'healthy' : 'parkinson'}">${isH ? 'Healthy' : "Parkinson's"}</span></div>`);
    printWin.document.write(`<div class="row"><span class="label">Confidence</span><span>${confPct}%</span></div>`);
    if (doctorOverride) printWin.document.write(`<div class="row"><span class="label">Clinician Review</span><span>${doctorOverride === 'agree' ? 'Confirmed' : 'Disputed'}</span></div>`);
    printWin.document.write(`</div>`);
    if (preview) printWin.document.write(`<div class="section"><div class="section-title">Uploaded MRI</div><img src="${preview}" alt="MRI" /></div>`);
    if (heatmapSrc) printWin.document.write(`<div class="section"><div class="section-title">Grad-CAM — AI Focus Region</div><img src="${heatmapSrc}" alt="Grad-CAM Heatmap" /></div>`);
    printWin.document.write(`<div class="disclaimer">ข้อจำกัดความรับผิดชอบ: ผลการวิเคราะห์นี้เป็นเครื่องมือช่วยตัดสินใจเท่านั้น ไม่ใช่การวินิจฉัยทางการแพทย์ กรุณาปรึกษาแพทย์ผู้เชี่ยวชาญก่อนดำเนินการใดๆ</div>`);
    printWin.document.write(`</body></html>`);
    printWin.document.close();
    setTimeout(() => { printWin.print(); }, 400);
  };

  const isHealthy = result && (result.prediction === "healthy" || result.label === "healthy");
  const conf = result ? (result.confidence * 100).toFixed(1) : 0;
  const lowConfidence = result && result.confidence < CONFIDENCE_THRESHOLD;

  // ── No patient selected: prompt to pick one ──
  if (!selectedPatient) {
    return (
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <div className="animate-fadeUp" style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Scan Analysis</h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>Select a patient to begin the scan</p>
        </div>

        <div className="animate-fadeUp stagger-1" style={{ background: "var(--card)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 32, textAlign: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--primary-light)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <Users size={24} color="var(--primary)" />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600 }}>No patient selected</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginTop: 4, maxWidth: 320, margin: "4px auto 0" }}>
            Each scan must be associated with a patient record. Select an existing patient or register a new one.
          </p>

          {patients.length > 0 ? (
            <div style={{ marginTop: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 500, marginBottom: 6, textAlign: "left" }}>Choose a patient</label>
              <select
                value=""
                onChange={e => { const p = patients.find(p => p.id === e.target.value); if (p) setSelectedPatient(p); }}
                style={{ width: "100%", height: 40, padding: "0 12px", fontSize: 13, borderRadius: 6, border: "1px solid var(--border)", fontFamily: "inherit", background: "#fff", cursor: "pointer" }}
              >
                <option value="" disabled>Select a patient...</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.mrn}</option>)}
              </select>
              <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                or <button onClick={() => setTab("patients")} style={{ color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 12, fontWeight: 500, textDecoration: "underline" }}>register a new patient</button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>No patients registered yet.</p>
              <button onClick={() => setTab("patients")} style={{ padding: "8px 20px", fontSize: 13, fontWeight: 500, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
                Register First Patient
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ── Patient selected: scan flow ──
  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Back to patient */}
      <button onClick={() => { setSelectedPatient(null); }} className="animate-fadeUp" style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", marginBottom: 16 }}>
        <ArrowLeft size={16} />Change patient
      </button>

      <div className="animate-fadeUp" style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>AI Scan Analysis</h1>
        <p style={{ fontSize: 14, color: "var(--text-muted)", marginTop: 4 }}>
          Upload a spiral or wave drawing to analyze motor function
        </p>
      </div>

      {/* Patient info bar */}
      <div className="animate-fadeUp stagger-1" style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", marginBottom: 20, background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--primary-100)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "var(--primary-hover)" }}>
          {selectedPatient.name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{selectedPatient.name}</div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{selectedPatient.hn ? `HN: ${selectedPatient.hn} · ` : ""}MRN: {selectedPatient.mrn} · {selectedPatient.age} yrs · {selectedPatient.sex}</div>
        </div>
        <button onClick={() => { setTab("patientDetail"); }} style={{ fontSize: 11, fontWeight: 500, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>View Profile</button>
      </div>

      {/* Inline error banner */}
      {errorMsg && (
        <div className="animate-fadeUp" style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 16px", marginBottom: 16, borderRadius: "var(--radius)", background: "var(--danger-light)", border: "1px solid rgba(225,29,72,0.15)" }}>
          <AlertTriangle size={16} color="var(--danger)" style={{ marginTop: 1, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--danger)" }}>Error</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{errorMsg}</div>
          </div>
          <button onClick={() => setErrorMsg("")} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--danger)", padding: 2 }}><X size={14} /></button>
        </div>
      )}

      {/* Medical Disclaimer — always visible */}
      <div className="animate-fadeUp stagger-2" style={{
        display: "flex", alignItems: "flex-start", gap: 10,
        padding: "12px 16px", marginBottom: 16,
        borderRadius: "var(--radius)",
        background: "var(--warning-light)",
        border: "1px solid rgba(217,119,6,0.2)",
      }}>
        <AlertTriangle size={16} color="var(--warning)" style={{ marginTop: 1, flexShrink: 0 }} />
        <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6 }}>
          <strong style={{ color: "var(--warning)" }}>ข้อจำกัดความรับผิดชอบ (Disclaimer):</strong>{" "}
          ผลการวิเคราะห์นี้เป็นเครื่องมือช่วยตัดสินใจเท่านั้น <strong style={{ color: "var(--warning)" }}>ไม่ใช่การวินิจฉัยทางการแพทย์</strong>
          {" "}กรุณาปรึกษาแพทย์ผู้เชี่ยวชาญก่อนดำเนินการใดๆ
        </div>
      </div>

      {/* Upload area */}
      <div className="animate-fadeUp stagger-2" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 24, marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 16 }}>
          <ScanLine size={16} color="var(--primary)" />Drawing Upload
        </div>

        {preview ? (
          <div style={{ borderRadius: 8, border: "2px solid var(--border)", overflow: "hidden", background: "#f8fafc" }}>
            <img src={preview} alt="Preview" style={{ width: "100%", maxHeight: 320, objectFit: "contain" }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", background: "#fff", borderTop: "1px solid var(--border)" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--text-muted)" }}><ImageIcon size={14} />Ready for analysis</span>
              <button onClick={reset} disabled={status === "analyzing"} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--danger)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}><X size={14} />Remove</button>
            </div>
          </div>
        ) : (
          <label
            onDrop={e => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }}
            onDragOver={e => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "48px 24px", borderRadius: 8, border: `2px dashed ${dragActive ? "var(--primary)" : "#cbd5e1"}`,
              background: dragActive ? "var(--primary-light)" : "#f8fafc", cursor: "pointer", transition: "all 0.15s",
            }}>
            <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0])} hidden />
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: dragActive ? "var(--primary-100)" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
              <Upload size={22} color={dragActive ? "var(--primary)" : "var(--text-muted)"} />
            </div>
            <p style={{ fontSize: 14, fontWeight: 500 }}>{dragActive ? "Drop image here" : "Upload spiral or wave drawing"}</p>
            <p style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>Drag and drop, or click to browse. PNG, JPEG, WebP up to 10MB.</p>
          </label>
        )}

        {file && !result && status !== "error" && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
            <button onClick={analyze} disabled={status === "analyzing"} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "10px 24px", fontSize: 13, fontWeight: 500,
              background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
              opacity: status === "analyzing" ? 0.6 : 1,
            }}>
              {status === "analyzing" ? <><Loader2 size={16} className="animate-spin" />Analyzing...</> : <><ScanLine size={16} />Analyze Drawing</>}
            </button>
          </div>
        )}
        {status === "error" && file && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
            <button onClick={reset} style={{ padding: "8px 16px", fontSize: 13, background: "transparent", color: "var(--text-secondary)", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Cancel</button>
            <button onClick={analyze} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13, fontWeight: 500, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
              <ScanLine size={16} />Retry
            </button>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <div className="animate-fadeUp" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", overflow: "hidden", marginBottom: 20 }}>
          {result.mock && (
            <div style={{ padding: "10px 24px", background: "var(--warning-light)", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "var(--warning)", fontWeight: 500 }}>
              <AlertTriangle size={14} />Mock result — model not loaded on API server
            </div>
          )}
          <div style={{ padding: "16px 24px", background: isHealthy ? "var(--success-light)" : "var(--danger-light)", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: isHealthy ? "rgba(5,150,105,0.1)" : "rgba(225,29,72,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {isHealthy ? <CheckCircle2 size={20} color="var(--success)" /> : <AlertCircle size={20} color="var(--danger)" />}
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{isHealthy ? "Healthy Pattern Detected" : "Parkinson's Indicators Found"}</div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>AI analysis complete for {selectedPatient.name}</div>
            </div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}><Brain size={16} />Classification</span>
              <span style={{ fontSize: 12, fontWeight: 600, padding: "2px 10px", borderRadius: 99, background: isHealthy ? "var(--success-light)" : "var(--danger-light)", color: isHealthy ? "var(--success)" : "var(--danger)" }}>{isHealthy ? "Healthy" : "Parkinson's"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--text-secondary)" }}><TrendingUp size={16} />Confidence</span>
              <span style={{ fontSize: 14, fontWeight: 700 }}>{conf}%</span>
            </div>
            <div style={{ height: 8, background: "#f1f5f9", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", borderRadius: 99, background: isHealthy ? "var(--success)" : "var(--danger)", width: `${conf}%`, animation: "barGrow 0.8s ease-out" }} />
            </div>
            {lowConfidence && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 12px", borderRadius: 6, background: "var(--warning-light)", border: "1px solid rgba(217,119,6,0.15)" }}>
                <AlertTriangle size={14} color="var(--warning)" />
                <span style={{ fontSize: 12, color: "var(--warning)", fontWeight: 500 }}>Low confidence ({conf}%) — manual review recommended</span>
              </div>
            )}

            {/* Doctor override */}
            <div style={{ marginTop: 16, padding: "12px 0", borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 8 }}>Clinical Review</div>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 10 }}>Do you agree with the AI assessment?</p>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setDoctorOverride("agree")} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${doctorOverride === "agree" ? "var(--success)" : "var(--border)"}`,
                  borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                  background: doctorOverride === "agree" ? "var(--success-light)" : "transparent",
                  color: doctorOverride === "agree" ? "var(--success)" : "var(--text-secondary)",
                }}><ThumbsUp size={14} />Agree</button>
                <button onClick={() => setDoctorOverride("disagree")} style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", fontSize: 12, fontWeight: 500,
                  border: `1.5px solid ${doctorOverride === "disagree" ? "var(--warning)" : "var(--border)"}`,
                  borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                  background: doctorOverride === "disagree" ? "var(--warning-light)" : "transparent",
                  color: doctorOverride === "disagree" ? "var(--warning)" : "var(--text-secondary)",
                }}><ThumbsDown size={14} />Disagree</button>
              </div>
            </div>
          </div>
          <div style={{ padding: "12px 24px", background: "#f8fafc", borderTop: "1px solid var(--border)", fontSize: 11, color: "var(--text-muted)" }}>
            This result is generated by an AI model (EfficientNet) and should be used as a screening aid only. Always consult a qualified neurologist.
          </div>
        </div>
      )}

      {/* Grad-CAM Heatmap */}
      {heatmapSrc && (
        <div className="animate-fadeUp" style={{ background: "var(--card)", borderRadius: "var(--radius)", border: "1px solid var(--border)", boxShadow: "var(--shadow)", padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, fontWeight: 600, marginBottom: 12 }}>
            <Eye size={16} color="var(--primary)" />AI Focus Region (Grad-CAM)
          </div>
          <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>Heatmap shows which brain regions the model focused on during classification. Red = high attention, blue = low attention.</p>
          <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)" }}>
            <img src={heatmapSrc} alt="Grad-CAM Heatmap" style={{ width: "100%", display: "block" }} />
          </div>
        </div>
      )}

      {result && !saved && (
        <div className="animate-fadeUp" style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <button onClick={reset} style={{ padding: "8px 20px", fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--text-secondary)", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>Scan Another</button>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportPdf} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13, fontWeight: 500, background: "transparent", color: "var(--text-secondary)", border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}><FileDown size={16} />Export PDF</button>
            <button onClick={save} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 20px", fontSize: 13, fontWeight: 500, background: "var(--primary)", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}><Save size={16} />Save to History</button>
          </div>
        </div>
      )}

      {saved && (
        <div className="animate-fadeUp" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderRadius: "var(--radius)", background: "var(--success-light)", border: "1px solid rgba(5,150,105,0.15)", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={16} color="var(--success)" />
            <span style={{ fontSize: 13, fontWeight: 500, color: "var(--success)" }}>Saved to {selectedPatient.name}'s record</span>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={exportPdf} style={{ fontSize: 12, fontWeight: 500, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 4 }}><FileDown size={12} />Export PDF</button>
            <button onClick={reset} style={{ fontSize: 12, fontWeight: 500, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>Scan Another</button>
            <button onClick={() => setTab("patientDetail")} style={{ fontSize: 12, fontWeight: 500, color: "var(--primary)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>View Patient</button>
          </div>
        </div>
      )}
    </div>
  );
}

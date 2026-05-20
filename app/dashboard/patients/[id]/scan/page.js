"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, ScanLine, Save } from "lucide-react";
import PageTransition from "../../../../components/layout/PageTransition";
import ImageUploader from "../../../../components/scan/ImageUploader";
import ScanResultPanel from "../../../../components/scan/ScanResultPanel";
import Button from "../../../../components/ui/Button";
import { getPatient, addScanResult } from "../../../../lib/db";
import { analyzeScan } from "../../../../lib/api";
import toast from "react-hot-toast";

export default function ScanPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState("idle");
  const [saving, setSaving] = useState(false);

  useEffect(() => { getPatient(id).then(setPatient).catch(() => toast.error("Failed to load patient")); }, [id]);

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus("analyzing"); setResult(null);
    try { const data = await analyzeScan(file); setResult(data); setStatus("success"); toast.success("Analysis complete"); }
    catch (err) { setStatus("error"); toast.error(err.message || "Analysis failed"); }
  };

  const handleSave = async () => {
    if (!result) return; setSaving(true);
    try {
      await addScanResult(id, { prediction: result.prediction || result.label, confidence: result.confidence, label: result.label || result.prediction });
      toast.success("Saved to patient record"); router.push(`/dashboard/patients/${id}`);
    } catch { toast.error("Failed to save"); setSaving(false); }
  };

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer mb-6">
          <ArrowLeft className="w-4 h-4" />Back to {patient?.name || "Patient"}
        </button>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Run AI Scan</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Upload a spiral or wave drawing for {patient?.name || "this patient"}</p>
        </div>
        <div className="space-y-6">
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <ScanLine className="w-4 h-4 text-[var(--color-primary-600)]" />Drawing Upload
            </h3>
            <ImageUploader onFileSelect={setFile} disabled={status === "analyzing"} />
            {file && !result && (
              <div className="mt-4 flex justify-end">
                <Button onClick={handleAnalyze} loading={status === "analyzing"} icon={status === "analyzing" ? undefined : ScanLine}>
                  {status === "analyzing" ? "Analyzing..." : "Analyze Drawing"}
                </Button>
              </div>
            )}
          </div>
          {result && <ScanResultPanel result={result} />}
          {result && (
            <div className="flex items-center justify-between">
              <Button variant="ghost" onClick={() => { setResult(null); setFile(null); setStatus("idle"); }}>Scan Another</Button>
              <Button icon={Save} onClick={handleSave} loading={saving}>Save to Patient Record</Button>
            </div>
          )}
          {status === "error" && !result && (
            <div className="bg-[var(--color-danger-light)] border border-[var(--color-danger)]/20 rounded-[var(--radius-md)] p-4">
              <p className="text-sm text-[var(--color-danger)] font-medium">Analysis Failed</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Check that the Python API is running at the configured URL.</p>
              <Button variant="ghost" size="sm" className="mt-2" onClick={handleAnalyze}>Retry</Button>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Edit3, ScanLine, Trash2, Phone, User, Stethoscope, Shield, AlertTriangle } from "lucide-react";
import PageTransition from "../../../components/layout/PageTransition";
import PatientTimeline from "../../../components/patients/PatientTimeline";
import PatientForm from "../../../components/patients/PatientForm";
import Button from "../../../components/ui/Button";
import Badge from "../../../components/ui/Badge";
import Skeleton from "../../../components/ui/Skeleton";
import { getPatient, deletePatient, listScanHistory } from "../../../lib/db";
import toast from "react-hot-toast";
import Link from "next/link";

const diagnosisVariant = {
  under_evaluation: { label: "Under Evaluation", variant: "warning" },
  diagnosed: { label: "Diagnosed", variant: "danger" },
  not_diagnosed: { label: "Not Diagnosed", variant: "success" },
  in_remission: { label: "In Remission", variant: "info" },
};

const stageDescriptions = {
  "1": "Stage 1 — Unilateral", "1.5": "Stage 1.5", "2": "Stage 2 — Bilateral",
  "2.5": "Stage 2.5", "3": "Stage 3 — Moderate bilateral", "4": "Stage 4 — Severe",
  "5": "Stage 5 — Wheelchair/bedridden",
};

export default function PatientDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [patient, setPatient] = useState(null);
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const [p, s] = await Promise.all([getPatient(id), listScanHistory(id)]);
      setPatient(p);
      setScans(s);
    } catch { toast.error("Failed to load patient data"); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleDelete = async () => {
    if (!confirm("Delete this patient record permanently?")) return;
    setDeleting(true);
    try { await deletePatient(id); toast.success("Patient deleted"); router.replace("/dashboard/patients"); }
    catch { toast.error("Failed to delete"); setDeleting(false); }
  };

  if (loading) return (
    <PageTransition><div className="max-w-5xl mx-auto"><Skeleton className="w-32 h-8 mb-6" />
      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-6">
        <div className="flex items-start gap-4"><Skeleton circle className="!w-14 !h-14" /><div className="flex-1 space-y-2"><Skeleton className="w-48 h-6" /><Skeleton className="w-64 h-4" /></div></div>
      </div></div></PageTransition>
  );

  if (!patient) return (
    <PageTransition><div className="text-center py-20"><AlertTriangle className="w-12 h-12 text-[var(--color-warning)] mx-auto mb-4" />
      <h2 className="text-lg font-semibold">Patient Not Found</h2>
      <Button variant="secondary" className="mt-4" onClick={() => router.replace("/dashboard/patients")}>Back to Patients</Button>
    </div></PageTransition>
  );

  const diagnosis = diagnosisVariant[patient.diagnosisStatus] || diagnosisVariant.under_evaluation;
  const initials = (patient.name || "?").split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer">
            <ArrowLeft className="w-4 h-4" />Back to Patients
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setShowEdit(true)}>Edit</Button>
            <Link href={`/dashboard/patients/${id}/scan`}><Button size="sm" icon={ScanLine}>New Scan</Button></Link>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-[var(--color-primary-700)]">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-[var(--text-primary)]">{patient.name}</h1>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-sm text-[var(--text-muted)]">MRN: {patient.mrn}</span>
                <Badge variant={diagnosis.variant} dot>{diagnosis.label}</Badge>
                <Badge variant={patient.status === "active" ? "success" : "default"}>{patient.status === "active" ? "Active" : "Archived"}</Badge>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-4">
            <InfoSection icon={User} title="Demographics" items={[
              { label: "Age", value: patient.age ? `${patient.age} years` : "—" },
              { label: "Sex", value: patient.sex ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1) : "—" },
              { label: "Date of Birth", value: patient.dateOfBirth || "—" },
            ]} />
            <InfoSection icon={Phone} title="Contact" color="var(--color-info)" items={[
              { label: "Phone", value: patient.phone || "—" },
              { label: "Email", value: patient.email || "—" },
              { label: "Emergency", value: patient.emergencyContact || "—" },
            ]} />
            <InfoSection icon={Stethoscope} title="Clinical" color="var(--color-success)" items={[
              { label: "H&Y Stage", value: patient.hoenhYahrStage ? stageDescriptions[patient.hoenhYahrStage] || `Stage ${patient.hoenhYahrStage}` : "Not assessed" },
              { label: "Physician", value: patient.treatingPhysician || "—" },
              { label: "Medications", value: patient.medications || "None recorded" },
            ]} />
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <h3 className="text-sm font-semibold text-[var(--color-danger)] mb-3 flex items-center gap-2"><Shield className="w-4 h-4" />Danger Zone</h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">Permanently delete this patient and all scans.</p>
              <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete} loading={deleting}>Delete Patient</Button>
            </div>
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">Assessment Timeline</h3>
                <Link href={`/dashboard/patients/${id}/scan`}><Button size="sm" variant="secondary" icon={ScanLine}>New Scan</Button></Link>
              </div>
              <PatientTimeline scans={scans} />
            </div>
          </div>
        </div>
        <PatientForm open={showEdit} onClose={() => setShowEdit(false)} onSuccess={fetchData} patient={patient} />
      </div>
    </PageTransition>
  );
}

function InfoSection({ icon: Icon, title, items, color = "var(--color-primary-600)" }) {
  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4" style={{ color }} />{title}
      </h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-start justify-between gap-2">
            <span className="text-xs text-[var(--text-muted)]">{item.label}</span>
            <span className="text-xs font-medium text-[var(--text-primary)] text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

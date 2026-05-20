"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Edit3,
  ScanLine,
  Trash2,
  Phone,
  Mail,
  Calendar,
  User,
  Stethoscope,
  Pill,
  AlertTriangle,
  Shield,
} from "lucide-react";
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
  "1": "Stage 1 — Unilateral involvement",
  "1.5": "Stage 1.5",
  "2": "Stage 2 — Bilateral, no balance impairment",
  "2.5": "Stage 2.5",
  "3": "Stage 3 — Mild to moderate bilateral",
  "4": "Stage 4 — Severe disability",
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
      const [patientData, scanData] = await Promise.all([
        getPatient(id),
        listScanHistory(id),
      ]);
      setPatient(patientData);
      setScans(scanData);
    } catch (err) {
      console.error("Failed to load patient:", err);
      toast.error("Failed to load patient data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this patient record? This action cannot be undone.")) return;
    setDeleting(true);
    try {
      await deletePatient(id);
      toast.success("Patient record deleted");
      router.replace("/patients");
    } catch (err) {
      toast.error("Failed to delete patient");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="max-w-5xl mx-auto">
          <Skeleton className="w-32 h-8 mb-6" />
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-6">
            <div className="flex items-start gap-4">
              <Skeleton circle className="!w-14 !h-14" />
              <div className="flex-1 space-y-2">
                <Skeleton className="w-48 h-6" />
                <Skeleton className="w-64 h-4" />
                <Skeleton className="w-32 h-4" />
              </div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (!patient) {
    return (
      <PageTransition>
        <div className="text-center py-20">
          <AlertTriangle className="w-12 h-12 text-[var(--color-warning)] mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Patient Not Found</h2>
          <p className="text-sm text-[var(--text-muted)] mt-1 mb-4">
            This patient record may have been deleted or the link is invalid.
          </p>
          <Button variant="secondary" onClick={() => router.replace("/patients")}>
            Back to Patients
          </Button>
        </div>
      </PageTransition>
    );
  }

  const diagnosis = diagnosisVariant[patient.diagnosisStatus] || diagnosisVariant.under_evaluation;
  const initials = (patient.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto">
        {/* Back + Actions */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Patients
          </button>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" icon={Edit3} onClick={() => setShowEdit(true)}>
              Edit
            </Button>
            <Link href={`/patients/${id}/scan`}>
              <Button size="sm" icon={ScanLine}>
                New Scan
              </Button>
            </Link>
          </div>
        </div>

        {/* Patient Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-6 mb-6"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-[var(--color-primary-700)]">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h1 className="text-xl font-bold text-[var(--text-primary)]">{patient.name}</h1>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-sm text-[var(--text-muted)]">MRN: {patient.mrn}</span>
                    <Badge variant={diagnosis.variant} dot>
                      {diagnosis.label}
                    </Badge>
                    <Badge variant={patient.status === "active" ? "success" : "default"}>
                      {patient.status === "active" ? "Active" : "Archived"}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Patient Info */}
          <div className="lg:col-span-1 space-y-4">
            {/* Demographics */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-[var(--color-primary-600)]" />
                Demographics
              </h3>
              <div className="space-y-3">
                <InfoRow label="Age" value={patient.age ? `${patient.age} years` : "—"} />
                <InfoRow label="Sex" value={patient.sex ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1) : "—"} />
                <InfoRow label="Date of Birth" value={patient.dateOfBirth || "—"} />
              </div>
            </div>

            {/* Contact */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Phone className="w-4 h-4 text-[var(--color-info)]" />
                Contact
              </h3>
              <div className="space-y-3">
                <InfoRow label="Phone" value={patient.phone || "—"} />
                <InfoRow label="Email" value={patient.email || "—"} />
                <InfoRow label="Emergency" value={patient.emergencyContact ? `${patient.emergencyContact} (${patient.emergencyPhone || "no phone"})` : "—"} />
              </div>
            </div>

            {/* Clinical */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[var(--color-success)]" />
                Clinical
              </h3>
              <div className="space-y-3">
                <InfoRow
                  label="H&Y Stage"
                  value={patient.hoenhYahrStage ? stageDescriptions[patient.hoenhYahrStage] || `Stage ${patient.hoenhYahrStage}` : "Not assessed"}
                />
                <InfoRow label="Physician" value={patient.treatingPhysician || "—"} />
                <InfoRow label="Medications" value={patient.medications || "None recorded"} />
              </div>
            </div>

            {/* Danger zone */}
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <h3 className="text-sm font-semibold text-[var(--color-danger)] mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Danger Zone
              </h3>
              <p className="text-xs text-[var(--text-muted)] mb-3">
                Permanently delete this patient and all associated scan records.
              </p>
              <Button variant="danger" size="sm" icon={Trash2} onClick={handleDelete} loading={deleting}>
                Delete Patient
              </Button>
            </div>
          </div>

          {/* Right: Assessment Timeline */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  Assessment Timeline
                </h3>
                <Link href={`/patients/${id}/scan`}>
                  <Button size="sm" variant="secondary" icon={ScanLine}>
                    New Scan
                  </Button>
                </Link>
              </div>
              <PatientTimeline scans={scans} />
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <PatientForm
          open={showEdit}
          onClose={() => setShowEdit(false)}
          onSuccess={fetchData}
          patient={patient}
        />
      </div>
    </PageTransition>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-2">
      <span className="text-xs text-[var(--text-muted)] shrink-0">{label}</span>
      <span className="text-xs font-medium text-[var(--text-primary)] text-right">{value}</span>
    </div>
  );
}

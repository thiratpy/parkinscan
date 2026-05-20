"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import Badge from "../ui/Badge";

const diagnosisVariant = {
  under_evaluation: { label: "Under Evaluation", variant: "warning" },
  diagnosed: { label: "Diagnosed", variant: "danger" },
  not_diagnosed: { label: "Not Diagnosed", variant: "success" },
  in_remission: { label: "In Remission", variant: "info" },
};

export default function PatientCard({ patient }) {
  const diagnosis = diagnosisVariant[patient.diagnosisStatus] || diagnosisVariant.under_evaluation;
  const initials = (patient.name || "?")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const createdDate = patient.createdAt?.toDate
    ? patient.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "N/A";

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={`/dashboard/patients/${patient.id}`}
        className="block bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-lg)] hover:border-[var(--color-neutral-300)] transition-all group"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center shrink-0">
            <span className="text-sm font-bold text-[var(--color-primary-700)]">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary-700)] transition-colors">
                {patient.name}
              </h3>
              <Badge variant={diagnosis.variant} className="shrink-0">
                {diagnosis.label}
              </Badge>
            </div>
            <p className="text-xs text-[var(--text-muted)] mb-2 truncate">
              MRN: {patient.mrn} &middot; {patient.age ? `${patient.age} yrs` : "Age N/A"} &middot; {patient.sex ? patient.sex.charAt(0).toUpperCase() + patient.sex.slice(1) : ""}
            </p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
                <Calendar className="w-3 h-3" />
                Added {createdDate}
              </div>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

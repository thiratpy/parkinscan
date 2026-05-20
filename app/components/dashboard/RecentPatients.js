"use client";

import Link from "next/link";
import { format } from "date-fns";
import { ArrowRight, User } from "lucide-react";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";

export default function RecentPatients({ patients = [] }) {
  if (patients.length === 0) {
    return (
      <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)]">
        <div className="px-5 py-4 border-b border-[var(--border-default)]">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Patients</h3>
        </div>
        <EmptyState
          icon={User}
          title="No patients yet"
          description="Start by adding your first patient record to the system."
          actionLabel="Add Patient"
          onAction={() => window.location.href = "/dashboard/patients"}
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)]">
      <div className="px-5 py-4 border-b border-[var(--border-default)] flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">Recent Patients</h3>
        <Link
          href="/dashboard/patients"
          className="text-xs font-medium text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] flex items-center gap-1 transition-colors"
        >
          View all
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      <div className="divide-y divide-[var(--border-default)]">
        {patients.map((patient) => (
          <Link
            key={patient.id}
            href={`/dashboard/patients/${patient.id}`}
            className="flex items-center gap-4 px-5 py-3.5 hover:bg-[var(--color-neutral-50)] transition-colors group"
          >
            <div className="w-9 h-9 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-[var(--color-primary-700)]">
                {(patient.name || "?").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate group-hover:text-[var(--color-primary-700)] transition-colors">
                {patient.name}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                MRN: {patient.mrn}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant={patient.status === "active" ? "success" : "default"}
                dot
              >
                {patient.status === "active" ? "Active" : "Archived"}
              </Badge>
              <ArrowRight className="w-4 h-4 text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

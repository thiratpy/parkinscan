"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { UserPlus, ScanLine, History, FileText } from "lucide-react";

const actions = [
  {
    href: "/dashboard/patients?action=new",
    icon: UserPlus,
    label: "New Patient",
    description: "Register a new patient record",
    color: "var(--color-primary-600)",
    bg: "var(--color-primary-50)",
  },
  {
    href: "/dashboard/patients",
    icon: ScanLine,
    label: "Run Scan",
    description: "Upload and analyze a drawing",
    color: "var(--color-info)",
    bg: "var(--color-info-light)",
  },
  {
    href: "/dashboard/history",
    icon: History,
    label: "View History",
    description: "Browse past assessments",
    color: "var(--color-warning)",
    bg: "var(--color-warning-light)",
  },
  {
    href: "/dashboard/patients",
    icon: FileText,
    label: "Patient Records",
    description: "View all patient files",
    color: "var(--color-success)",
    bg: "var(--color-success-light)",
  },
];

export default function QuickActions() {
  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-5">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h3>
      <div className="grid grid-cols-2 gap-3">
        {actions.map((action, i) => (
          <motion.div
            key={action.label}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Link
              href={action.href}
              className="flex flex-col gap-2.5 p-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] hover:border-[var(--color-neutral-300)] hover:shadow-[var(--shadow-md)] transition-all group"
            >
              <div
                className="w-9 h-9 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{ backgroundColor: action.bg }}
              >
                <action.icon className="w-4.5 h-4.5" style={{ color: action.color }} />
              </div>
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--color-primary-700)] transition-colors">
                  {action.label}
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  {action.description}
                </p>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

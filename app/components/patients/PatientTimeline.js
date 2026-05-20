"use client";

import { motion } from "framer-motion";
import { CheckCircle2, AlertCircle, Clock, ScanLine } from "lucide-react";
import Badge from "../ui/Badge";

export default function PatientTimeline({ scans = [] }) {
  if (scans.length === 0) {
    return (
      <div className="text-center py-8">
        <ScanLine className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
        <p className="text-sm text-[var(--text-muted)]">No assessments recorded yet</p>
        <p className="text-xs text-[var(--text-muted)] mt-1">Upload a spiral or wave drawing to start</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border-default)]" />

      <div className="space-y-4">
        {scans.map((scan, i) => {
          const isHealthy = scan.prediction === "healthy" || scan.label === "healthy";
          const scanDate = scan.createdAt?.toDate
            ? scan.createdAt.toDate().toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })
            : "Unknown date";

          return (
            <motion.div
              key={scan.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08, duration: 0.3 }}
              className="relative flex gap-4 pl-2"
            >
              {/* Dot */}
              <div
                className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                  isHealthy
                    ? "bg-[var(--color-success-light)] text-[var(--color-success)]"
                    : "bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                }`}
              >
                {isHealthy ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertCircle className="w-3.5 h-3.5" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 shadow-[var(--shadow-sm)]">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {isHealthy ? "Healthy Pattern Detected" : "Parkinson's Indicators Found"}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3 h-3" />
                      {scanDate}
                    </div>
                  </div>
                  <Badge variant={isHealthy ? "success" : "danger"}>
                    {scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : "N/A"}
                  </Badge>
                </div>

                {/* Confidence bar */}
                {scan.confidence && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1">
                      <span>Confidence</span>
                      <span className="font-medium">{(scan.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-[var(--color-neutral-100)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${scan.confidence * 100}%` }}
                        transition={{ duration: 0.8, delay: i * 0.08 + 0.3, ease: [0.4, 0, 0.2, 1] }}
                        className={`h-full rounded-full ${
                          isHealthy ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"
                        }`}
                      />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

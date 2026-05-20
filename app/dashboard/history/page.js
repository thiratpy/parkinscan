"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { History as HistoryIcon, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import PageTransition from "../../components/layout/PageTransition";
import { StaggerContainer, StaggerItem } from "../../components/layout/PageTransition";
import Badge from "../../components/ui/Badge";
import EmptyState from "../../components/ui/EmptyState";
import Skeleton from "../../components/ui/Skeleton";
import { listScanHistory, getPatient } from "../../lib/db";
import Link from "next/link";

export default function HistoryPage() {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [patientMap, setPatientMap] = useState({});

  useEffect(() => {
    async function fetchData() {
      try {
        const scanData = await listScanHistory(null, { pageSize: 100 });
        setScans(scanData);
        const uniqueIds = [...new Set(scanData.map((s) => s.patientId).filter(Boolean))];
        const patients = {};
        await Promise.all(uniqueIds.map(async (pid) => { try { const p = await getPatient(pid); if (p) patients[pid] = p; } catch {} }));
        setPatientMap(patients);
      } catch (err) { console.error("Failed to load history:", err); }
      finally { setLoading(false); }
    }
    fetchData();
  }, []);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Assessment History</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Chronological log of all AI-powered assessments</p>
      </div>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4 flex items-center gap-4">
            <Skeleton circle className="!w-10 !h-10" /><div className="flex-1 space-y-2"><Skeleton className="w-48 h-4" /><Skeleton className="w-32 h-3" /></div><Skeleton className="w-16 h-5" />
          </div>
        ))}</div>
      ) : scans.length === 0 ? (
        <EmptyState icon={HistoryIcon} title="No assessment history" description="Run your first scan to see results here."
          actionLabel="Go to Patients" onAction={() => window.location.href = "/dashboard/patients"} />
      ) : (
        <StaggerContainer className="space-y-3">
          {scans.map((scan) => {
            const isHealthy = scan.prediction === "healthy" || scan.label === "healthy";
            const patient = patientMap[scan.patientId];
            const scanDate = scan.createdAt?.toDate ? format(scan.createdAt.toDate(), "MMM d, yyyy 'at' h:mm a") : "Unknown date";
            return (
              <StaggerItem key={scan.id}>
                <Link href={scan.patientId ? `/dashboard/patients/${scan.patientId}` : "#"}
                  className="flex items-center gap-4 bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-4 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-neutral-300)] transition-all group">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isHealthy ? "bg-[var(--color-success-light)]" : "bg-[var(--color-danger-light)]"}`}>
                    {isHealthy ? <CheckCircle2 className="w-5 h-5 text-[var(--color-success)]" /> : <AlertCircle className="w-5 h-5 text-[var(--color-danger)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--color-primary-700)] transition-colors">
                      {isHealthy ? "Healthy Pattern" : "Parkinson's Indicators"}{patient && <span className="text-[var(--text-muted)] font-normal"> — {patient.name}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5"><Clock className="w-3 h-3 text-[var(--text-muted)]" /><span className="text-xs text-[var(--text-muted)]">{scanDate}</span></div>
                  </div>
                  <Badge variant={isHealthy ? "success" : "danger"}>{scan.confidence ? `${(scan.confidence * 100).toFixed(1)}%` : "N/A"}</Badge>
                </Link>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      )}
    </PageTransition>
  );
}

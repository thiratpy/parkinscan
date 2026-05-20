"use client";

import { useEffect, useState } from "react";
import { Users, ScanLine, Activity, TrendingUp } from "lucide-react";
import PageTransition from "../components/layout/PageTransition";
import { StaggerContainer, StaggerItem } from "../components/layout/PageTransition";
import StatCard from "../components/dashboard/StatCard";
import RecentPatients from "../components/dashboard/RecentPatients";
import QuickActions from "../components/dashboard/QuickActions";
import Skeleton from "../components/ui/Skeleton";
import { getDashboardStats, listPatients } from "../lib/db";

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentPatients, setRecentPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, patientsData] = await Promise.all([
          getDashboardStats(),
          listPatients({ pageSize: 5 }),
        ]);
        setStats(statsData);
        setRecentPatients(patientsData.patients);
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setStats({ totalPatients: 0, scansThisWeek: 0, totalScans: 0, avgConfidence: 0 });
        setRecentPatients([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="text-sm text-[var(--text-muted)] mt-1">Overview of patient assessments and clinical activity</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5">
              <Skeleton className="w-10 h-10 mb-3 !rounded-[var(--radius-md)]" />
              <Skeleton className="w-20 h-7 mb-1" />
              <Skeleton className="w-32 h-4" />
            </div>
          ))}
        </div>
      ) : (
        <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StaggerItem>
            <StatCard icon={Users} label="Total Patients" value={stats?.totalPatients || 0} change="+2 this week" changeType="positive" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={ScanLine} label="Scans This Week" value={stats?.scansThisWeek || 0} change="+5 vs last week" changeType="positive" />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={Activity} label="Total Assessments" value={stats?.totalScans || 0} />
          </StaggerItem>
          <StaggerItem>
            <StatCard icon={TrendingUp} label="Avg. Confidence" value={stats?.avgConfidence ? `${stats.avgConfidence}%` : "0%"} change="Model accuracy" changeType="neutral" />
          </StaggerItem>
        </StaggerContainer>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentPatients patients={recentPatients} />
        </div>
        <div>
          <QuickActions />
        </div>
      </div>
    </PageTransition>
  );
}

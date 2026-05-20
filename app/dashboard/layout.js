"use client";

import { useAuth } from "../components/providers/AuthProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import Sidebar from "../components/layout/Sidebar";
import TopBar from "../components/layout/TopBar";

export default function DashboardLayout({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarWidth, setSidebarWidth] = useState(260);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    const sidebar = document.querySelector("aside");
    if (!sidebar) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSidebarWidth(entry.contentRect.width);
      }
    });
    observer.observe(sidebar);
    return () => observer.disconnect();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-primary-600)]" />
          <p className="text-sm text-[var(--text-muted)]">Loading clinical workspace...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[var(--bg-app)]">
      <Sidebar />
      <motion.div
        initial={false}
        animate={{ marginLeft: sidebarWidth }}
        transition={{ type: "spring", damping: 20, stiffness: 200 }}
        className="min-h-screen flex flex-col"
      >
        <TopBar />
        <main className="flex-1 p-6">
          {children}
        </main>
      </motion.div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import {
  LayoutDashboard,
  Users,
  ScanLine,
  History,
  Settings,
  ChevronLeft,
  ChevronRight,
  Activity,
  Brain,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/patients", label: "Patients", icon: Users },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (href) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", damping: 20, stiffness: 200 }}
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-[var(--bg-sidebar)] overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.06] shrink-0">
        <div className="w-9 h-9 rounded-[var(--radius-lg)] bg-[var(--color-primary-600)] flex items-center justify-center shrink-0">
          <Brain className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-w-0"
            >
              <span className="text-sm font-bold text-white tracking-tight truncate">
                ParkinScan
              </span>
              <span className="text-[10px] text-[var(--color-neutral-400)] uppercase tracking-widest">
                Clinical Platform
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group relative flex items-center gap-3 px-3 h-10 rounded-[var(--radius-md)] transition-all duration-[var(--duration-fast)]",
                "focus-ring",
                active
                  ? "bg-[var(--bg-sidebar-active)] text-white"
                  : "text-[var(--color-neutral-400)] hover:bg-[var(--bg-sidebar-hover)] hover:text-white"
              )}
            >
              {active && (
                <motion.div
                  layoutId="sidebar-active-bg"
                  className="absolute inset-0 rounded-[var(--radius-md)] bg-[var(--bg-sidebar-active)]"
                  transition={{ type: "spring", damping: 20, stiffness: 200 }}
                />
              )}
              <item.icon className="w-5 h-5 relative z-10 shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium relative z-10 truncate"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      {/* Status indicator */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <div
          className={clsx(
            "flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] bg-white/[0.04]",
            collapsed && "justify-center"
          )}
        >
          <Activity className="w-4 h-4 text-[var(--color-primary-400)] shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col min-w-0"
              >
                <span className="text-xs text-[var(--color-neutral-300)] truncate">
                  AI Model Status
                </span>
                <span className="text-xs font-medium text-[var(--color-primary-400)] truncate">
                  EfficientNet Ready
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute top-5 -right-3 w-6 h-6 rounded-full bg-[var(--bg-sidebar)] border-2 border-[var(--color-neutral-700)] flex items-center justify-center text-[var(--color-neutral-400)] hover:text-white hover:border-[var(--color-primary-600)] transition-colors cursor-pointer z-50"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </motion.aside>
  );
}

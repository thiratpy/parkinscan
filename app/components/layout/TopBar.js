"use client";

import { useState } from "react";
import { useAuth } from "../providers/AuthProvider";
import { signOut } from "../../lib/auth";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Bell, LogOut, User, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";

export default function TopBar() {
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  const displayName = user?.displayName || user?.email?.split("@")[0] || "Clinician";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-[var(--border-default)] flex items-center justify-between px-6 gap-4">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search patients by name, MRN, or diagnosis..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-full h-9 pl-10 pr-4 text-sm rounded-[var(--radius-md)] bg-[var(--color-neutral-50)] border border-transparent focus:bg-white focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] outline-none transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative p-2 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--color-neutral-50)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
          aria-label="Notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[var(--color-primary-600)]" />
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--color-primary-600)] flex items-center justify-center">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-sm font-medium text-[var(--text-primary)] leading-tight">
                {displayName}
              </span>
              <span className="text-[11px] text-[var(--text-muted)] leading-tight">
                Clinician
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[var(--text-muted)] hidden sm:block" />
          </button>

          <AnimatePresence>
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 4, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-white rounded-[var(--radius-lg)] shadow-[var(--shadow-xl)] border border-[var(--border-default)] overflow-hidden z-50"
                >
                  <div className="px-4 py-3 border-b border-[var(--border-default)]">
                    <p className="text-sm font-medium text-[var(--text-primary)]">{displayName}</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">{user?.email}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = "/dashboard/settings";
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)] transition-colors cursor-pointer"
                    >
                      <User className="w-4 h-4" />
                      Account Settings
                    </button>
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-[var(--color-danger)] hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

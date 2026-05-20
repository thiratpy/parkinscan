"use client";

import { useState } from "react";
import { useAuth } from "../../components/providers/AuthProvider";
import { signOut } from "../../lib/auth";
import { motion } from "framer-motion";
import { User, Lock, Bell, Shield, LogOut, ExternalLink } from "lucide-react";
import PageTransition from "../../components/layout/PageTransition";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(true);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">Manage your account and preferences</p>
        </div>

        <div className="space-y-6">
          {/* Account */}
          <Section icon={User} title="Account Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Display Name" value={user?.displayName || ""} disabled hint="Managed by your authentication provider" />
              <Input label="Email" value={user?.email || ""} disabled />
            </div>
            <div className="mt-4 pt-4 border-t border-[var(--border-default)]">
              <p className="text-xs text-[var(--text-muted)]">
                Account ID: <code className="text-xs bg-[var(--color-neutral-100)] px-1.5 py-0.5 rounded">{user?.uid?.substring(0, 16)}...</code>
              </p>
            </div>
          </Section>

          {/* Notifications */}
          <Section icon={Bell} title="Notifications">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Assessment notifications</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Get notified when AI analysis completes</p>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${
                  notifications ? "bg-[var(--color-primary-600)]" : "bg-[var(--color-neutral-300)]"
                }`}
                role="switch"
                aria-checked={notifications}
              >
                <motion.div
                  animate={{ x: notifications ? 20 : 2 }}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm"
                />
              </button>
            </div>
          </Section>

          {/* Privacy */}
          <Section icon={Shield} title="Data & Privacy">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-[var(--color-neutral-50)] rounded-[var(--radius-md)]">
                <Shield className="w-4 h-4 text-[var(--color-primary-600)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">Your data is not used for model training</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">Patient records and scan images are stored securely and used only for clinical assessments within this platform.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-[var(--color-neutral-50)] rounded-[var(--radius-md)]">
                <Lock className="w-4 h-4 text-[var(--color-info)] mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">End-to-end encryption</p>
                  <p className="text-xs text-[var(--text-muted)] mt-0.5">All data transmitted between your browser and our servers is encrypted using TLS.</p>
                </div>
              </div>
            </div>
          </Section>

          {/* Sign Out */}
          <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">Sign out of this device</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">You will need to sign in again to access the platform.</p>
              </div>
              <Button variant="danger" size="sm" icon={LogOut} onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] shadow-[var(--shadow-sm)] p-6">
      <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <Icon className="w-4 h-4 text-[var(--color-primary-600)]" />
        {title}
      </h3>
      {children}
    </div>
  );
}

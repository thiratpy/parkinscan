"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmail, signInWithGoogle } from "../../lib/auth";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | loading | error
  const [error, setError] = useState("");

  const validate = () => {
    if (!form.email.trim()) {
      setError("Enter your email address");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Enter a valid email address");
      return false;
    }
    if (!form.password) {
      setError("Enter your password");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    return true;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!validate()) return;

    setStatus("loading");
    try {
      await signInWithEmail(form.email, form.password);
      toast.success("Signed in successfully");
      router.replace("/");
    } catch (err) {
      setStatus("error");
      const message =
        err.code === "auth/user-not-found" || err.code === "auth/wrong-password"
          ? "Invalid email or password"
          : err.code === "auth/too-many-requests"
          ? "Too many attempts. Try again later."
          : "Sign in failed. Please try again.";
      setError(message);
    }
  };

  const handleGoogleLogin = async () => {
    setStatus("loading");
    setError("");
    try {
      await signInWithGoogle();
      toast.success("Signed in with Google");
      router.replace("/");
    } catch (err) {
      setStatus("error");
      if (err.code !== "auth/popup-closed-by-user") {
        setError("Google sign-in failed. Please try again.");
      }
    }
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Sign in to your account
        </h2>
        <p className="text-sm text-[var(--text-muted)] mt-1">
          Access patient records and run Parkinson's assessments
        </p>
      </div>

      <form onSubmit={handleEmailLogin} className="space-y-4">
        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-email" className="text-sm font-medium text-[var(--text-primary)]">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              placeholder="you@hospital.org"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                setError("");
              }}
              className="w-full h-11 pl-10 pr-4 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
            />
          </div>
        </div>

        {/* Password */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="login-password" className="text-sm font-medium text-[var(--text-primary)]">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="Enter your password"
              value={form.password}
              onChange={(e) => {
                setForm({ ...form, password: e.target.value });
                setError("");
              }}
              className="w-full h-11 pl-10 pr-11 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-all focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors cursor-pointer"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-[var(--color-danger)] bg-[var(--color-danger-light)] px-3 py-2 rounded-[var(--radius-md)]"
          >
            {error}
          </motion.p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full h-11 flex items-center justify-center gap-2 bg-[var(--color-primary-600)] text-white text-sm font-medium rounded-[var(--radius-md)] hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-800)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transform active:scale-[0.99]"
        >
          {status === "loading" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              Sign In
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-[var(--border-default)]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-[var(--text-muted)]">or continue with</span>
        </div>
      </div>

      {/* Google */}
      <button
        onClick={handleGoogleLogin}
        disabled={status === "loading"}
        className="w-full h-11 flex items-center justify-center gap-3 bg-white border border-[var(--border-default)] text-sm font-medium text-[var(--text-primary)] rounded-[var(--radius-md)] hover:bg-[var(--color-neutral-50)] hover:border-[var(--color-neutral-300)] transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Google Account
      </button>
    </div>
  );
}

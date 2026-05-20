"use client";

import { forwardRef } from "react";
import { clsx } from "clsx";
import { Loader2 } from "lucide-react";

const variants = {
  primary: "bg-[var(--color-primary-600)] text-white hover:bg-[var(--color-primary-700)] active:bg-[var(--color-primary-800)]",
  secondary: "bg-[var(--color-neutral-100)] text-[var(--text-primary)] hover:bg-[var(--color-neutral-200)] active:bg-[var(--color-neutral-300)] border border-[var(--border-default)]",
  danger: "bg-[var(--color-danger)] text-white hover:bg-rose-700 active:bg-rose-800",
  ghost: "bg-transparent text-[var(--text-secondary)] hover:bg-[var(--color-neutral-100)] active:bg-[var(--color-neutral-200)]",
  outline: "bg-transparent border-2 border-[var(--color-primary-600)] text-[var(--color-primary-700)] hover:bg-[var(--color-primary-50)]",
};

const sizes = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

const Button = forwardRef(function Button(
  { variant = "primary", size = "md", loading = false, disabled = false, icon: Icon, children, className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-[var(--radius-md)] transition-all",
        "focus-ring cursor-pointer select-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "transform active:scale-[0.98]",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : Icon ? (
        <Icon className="w-4 h-4" />
      ) : null}
      {children}
    </button>
  );
});

export default Button;

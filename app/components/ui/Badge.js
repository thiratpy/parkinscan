"use client";

import { clsx } from "clsx";

const badgeVariants = {
  default: "bg-[var(--color-neutral-100)] text-[var(--text-secondary)]",
  primary: "bg-[var(--color-primary-100)] text-[var(--color-primary-800)]",
  success: "bg-[var(--color-success-light)] text-[var(--color-success)]",
  danger: "bg-[var(--color-danger-light)] text-[var(--color-danger)]",
  warning: "bg-[var(--color-warning-light)] text-[var(--color-warning)]",
  info: "bg-[var(--color-info-light)] text-[var(--color-info)]",
};

export default function Badge({ variant = "default", children, dot = false, className }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-[var(--radius-full)] text-xs font-medium",
        badgeVariants[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full animate-pulse-dot",
            variant === "success" && "bg-[var(--color-success)]",
            variant === "danger" && "bg-[var(--color-danger)]",
            variant === "warning" && "bg-[var(--color-warning)]",
            variant === "primary" && "bg-[var(--color-primary-600)]",
            variant === "info" && "bg-[var(--color-info)]",
            variant === "default" && "bg-[var(--text-muted)]"
          )}
        />
      )}
      {children}
    </span>
  );
}

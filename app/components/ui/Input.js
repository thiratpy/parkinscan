"use client";

import { forwardRef, useId } from "react";
import { clsx } from "clsx";

const Input = forwardRef(function Input(
  { label, error, hint, icon: Icon, type = "text", className, ...props },
  ref
) {
  const id = useId();

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-sm font-medium text-[var(--text-primary)]"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={id}
          type={type}
          className={clsx(
            "w-full h-10 px-3 text-sm rounded-[var(--radius-md)]",
            "bg-white border border-[var(--border-default)]",
            "text-[var(--text-primary)] placeholder:text-[var(--text-muted)]",
            "transition-all duration-[var(--duration-fast)]",
            "focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)]",
            error && "border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-red-100",
            Icon && "pl-10",
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-[var(--color-danger)]">{error}</p>
      )}
      {hint && !error && (
        <p className="text-xs text-[var(--text-muted)]">{hint}</p>
      )}
    </div>
  );
});

export default Input;

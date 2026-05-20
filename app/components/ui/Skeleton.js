"use client";

import { clsx } from "clsx";

export default function Skeleton({ className, lines = 1, circle = false }) {
  if (circle) {
    return (
      <div
        className={clsx("skeleton rounded-full", className)}
        style={{ width: 40, height: 40 }}
      />
    );
  }

  if (lines > 1) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={clsx("skeleton h-4", className)}
            style={{ width: i === lines - 1 ? "60%" : "100%" }}
          />
        ))}
      </div>
    );
  }

  return <div className={clsx("skeleton h-4", className)} />;
}

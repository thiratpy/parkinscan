"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect } from "react";

export default function StatCard({ icon: Icon, label, value, change, changeType = "neutral" }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (typeof value === "string" && value.includes("%")) {
      return `${Math.round(latest)}%`;
    }
    return Math.round(latest).toLocaleString();
  });

  useEffect(() => {
    const numericValue = typeof value === "string" ? parseFloat(value) : value;
    if (!isNaN(numericValue)) {
      const controls = animate(count, numericValue, {
        duration: 1,
        ease: [0.4, 0, 0.2, 1],
      });
      return controls.stop;
    }
  }, [value, count]);

  const changeColors = {
    positive: "text-[var(--color-success)]",
    negative: "text-[var(--color-danger)]",
    neutral: "text-[var(--text-muted)]",
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
      transition={{ duration: 0.2 }}
      className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 shadow-[var(--shadow-sm)]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-50)] flex items-center justify-center">
          <Icon className="w-5 h-5 text-[var(--color-primary-600)]" />
        </div>
        {change && (
          <span className={`text-xs font-medium ${changeColors[changeType]}`}>
            {change}
          </span>
        )}
      </div>
      <motion.p className="text-2xl font-bold text-[var(--text-primary)] mb-0.5">
        {rounded}
      </motion.p>
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
    </motion.div>
  );
}

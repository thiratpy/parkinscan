"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={8}
      toastOptions={{
        duration: 4000,
        style: {
          background: "#0f172a",
          color: "#f8fafc",
          fontSize: "14px",
          fontFamily: "Inter, system-ui, sans-serif",
          borderRadius: "8px",
          padding: "12px 16px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
          maxWidth: "400px",
        },
        success: {
          iconTheme: {
            primary: "#059669",
            secondary: "#f8fafc",
          },
        },
        error: {
          iconTheme: {
            primary: "#e11d48",
            secondary: "#f8fafc",
          },
          duration: 5000,
        },
      }}
    />
  );
}

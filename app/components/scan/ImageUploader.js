"use client";

import { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, ImageIcon, X } from "lucide-react";

export default function ImageUploader({ onFileSelect, disabled = false }) {
  const [preview, setPreview] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const validTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!validTypes.includes(file.type)) { alert("Upload PNG, JPEG, or WebP."); return; }
    if (file.size > 10 * 1024 * 1024) { alert("Max 10MB."); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
    onFileSelect(file);
  }, [onFileSelect]);

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragActive(false); handleFile(e.dataTransfer.files[0]); }, [handleFile]);

  const clearPreview = () => { setPreview(null); onFileSelect(null); };

  return (
    <AnimatePresence mode="wait">
      {preview ? (
        <motion.div key="preview" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
          className="relative rounded-[var(--radius-lg)] border-2 border-[var(--border-default)] overflow-hidden bg-[var(--color-neutral-50)]">
          <img src={preview} alt="Scan preview" className="w-full max-h-80 object-contain" />
          <button onClick={clearPreview} disabled={disabled}
            className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm text-[var(--text-secondary)] hover:text-[var(--color-danger)] transition-colors shadow-md cursor-pointer" aria-label="Remove image">
            <X className="w-4 h-4" />
          </button>
          <div className="px-4 py-3 bg-white border-t border-[var(--border-default)]">
            <p className="text-xs text-[var(--text-muted)] flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5" />Ready for analysis</p>
          </div>
        </motion.div>
      ) : (
        <motion.div key="dropzone" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <label onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)}
            className={`flex flex-col items-center justify-center py-16 px-8 rounded-[var(--radius-lg)] border-2 border-dashed transition-all cursor-pointer ${
              dragActive ? "border-[var(--color-primary-500)] bg-[var(--color-primary-50)]" : "border-[var(--color-neutral-300)] bg-[var(--color-neutral-50)] hover:border-[var(--color-primary-400)] hover:bg-white"
            }`}>
            <input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={(e) => handleFile(e.target.files[0])} className="hidden" disabled={disabled} />
            <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${dragActive ? "bg-[var(--color-primary-100)]" : "bg-[var(--color-neutral-200)]"}`}>
              <Upload className={`w-6 h-6 ${dragActive ? "text-[var(--color-primary-600)]" : "text-[var(--text-muted)]"}`} />
            </div>
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">{dragActive ? "Drop image here" : "Upload spiral or wave drawing"}</p>
            <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">Drag and drop, or click to browse. PNG, JPEG, WebP up to 10MB.</p>
          </label>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

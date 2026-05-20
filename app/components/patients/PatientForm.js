"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2 } from "lucide-react";
import Button from "../ui/Button";
import Input from "../ui/Input";
import toast from "react-hot-toast";
import { createPatient, updatePatient } from "../../lib/db";

const INITIAL_FORM = {
  name: "",
  age: "",
  sex: "male",
  dateOfBirth: "",
  phone: "",
  email: "",
  emergencyContact: "",
  emergencyPhone: "",
  diagnosisStatus: "under_evaluation",
  hoenhYahrStage: "",
  medications: "",
  treatingPhysician: "",
  notes: "",
};

export default function PatientForm({ open, onClose, onSuccess, patient = null }) {
  const isEdit = !!patient;
  const [form, setForm] = useState(patient ? { ...INITIAL_FORM, ...patient } : INITIAL_FORM);
  const [status, setStatus] = useState("idle");
  const [errors, setErrors] = useState({});

  const set = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Patient name is required";
    if (!form.age || isNaN(form.age) || form.age < 0 || form.age > 150) errs.age = "Enter a valid age (0-150)";
    if (!form.dateOfBirth) errs.dateOfBirth = "Date of birth is required";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email format";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setStatus("loading");
    try {
      const data = {
        ...form,
        age: parseInt(form.age),
      };

      if (isEdit) {
        await updatePatient(patient.id, data);
        toast.success("Patient record updated");
      } else {
        await createPatient(data);
        toast.success("Patient added successfully");
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error(isEdit ? "Failed to update patient" : "Failed to add patient");
      setStatus("idle");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative w-full max-w-2xl bg-white rounded-[var(--radius-xl)] shadow-[var(--shadow-xl)] max-h-[90vh] overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-default)] shrink-0">
              <div>
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {isEdit ? "Edit Patient Record" : "Register New Patient"}
                </h2>
                <p className="text-sm text-[var(--text-muted)] mt-0.5">
                  {isEdit ? "Update the patient's information below" : "Fill in the patient's details to create a new record"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-[var(--radius-md)] text-[var(--text-muted)] hover:bg-[var(--color-neutral-100)] transition-colors cursor-pointer"
                aria-label="Close form"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5">
              <div className="space-y-6">
                {/* Personal Information */}
                <fieldset>
                  <legend className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-[var(--color-primary-600)]" />
                    Personal Information
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <Input
                        label="Full Name"
                        placeholder="Enter patient's full name"
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        error={errors.name}
                      />
                    </div>
                    <Input
                      label="Age"
                      type="number"
                      placeholder="Years"
                      value={form.age}
                      onChange={(e) => set("age", e.target.value)}
                      error={errors.age}
                    />
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Sex</label>
                      <select
                        value={form.sex}
                        onChange={(e) => set("sex", e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all cursor-pointer"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <Input
                      label="Date of Birth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={(e) => set("dateOfBirth", e.target.value)}
                      error={errors.dateOfBirth}
                    />
                  </div>
                </fieldset>

                {/* Contact */}
                <fieldset>
                  <legend className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-[var(--color-info)]" />
                    Contact Information
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Phone"
                      type="tel"
                      placeholder="Phone number"
                      value={form.phone}
                      onChange={(e) => set("phone", e.target.value)}
                    />
                    <Input
                      label="Email"
                      type="email"
                      placeholder="patient@email.com"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      error={errors.email}
                    />
                    <Input
                      label="Emergency Contact Name"
                      placeholder="Contact person name"
                      value={form.emergencyContact}
                      onChange={(e) => set("emergencyContact", e.target.value)}
                    />
                    <Input
                      label="Emergency Phone"
                      type="tel"
                      placeholder="Emergency phone number"
                      value={form.emergencyPhone}
                      onChange={(e) => set("emergencyPhone", e.target.value)}
                    />
                  </div>
                </fieldset>

                {/* Clinical */}
                <fieldset>
                  <legend className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
                    <div className="w-1.5 h-4 rounded-full bg-[var(--color-success)]" />
                    Clinical Information
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Diagnosis Status</label>
                      <select
                        value={form.diagnosisStatus}
                        onChange={(e) => set("diagnosisStatus", e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all cursor-pointer"
                      >
                        <option value="under_evaluation">Under Evaluation</option>
                        <option value="diagnosed">Diagnosed</option>
                        <option value="not_diagnosed">Not Diagnosed</option>
                        <option value="in_remission">In Remission</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-medium text-[var(--text-primary)]">Hoehn & Yahr Stage</label>
                      <select
                        value={form.hoenhYahrStage}
                        onChange={(e) => set("hoenhYahrStage", e.target.value)}
                        className="w-full h-10 px-3 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all cursor-pointer"
                      >
                        <option value="">Not assessed</option>
                        <option value="1">Stage 1 — Unilateral</option>
                        <option value="1.5">Stage 1.5</option>
                        <option value="2">Stage 2 — Bilateral, no balance impairment</option>
                        <option value="2.5">Stage 2.5</option>
                        <option value="3">Stage 3 — Mild to moderate bilateral</option>
                        <option value="4">Stage 4 — Severe disability</option>
                        <option value="5">Stage 5 — Wheelchair/bedridden</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <Input
                        label="Medications"
                        placeholder="e.g., Levodopa 100mg, Carbidopa 25mg"
                        value={form.medications}
                        onChange={(e) => set("medications", e.target.value)}
                        hint="Comma-separated list of current medications"
                      />
                    </div>
                    <Input
                      label="Treating Physician"
                      placeholder="Dr. name"
                      value={form.treatingPhysician}
                      onChange={(e) => set("treatingPhysician", e.target.value)}
                    />
                  </div>
                </fieldset>

                {/* Notes */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-[var(--text-primary)]">Clinical Notes</label>
                  <textarea
                    rows={3}
                    placeholder="Additional observations or notes about this patient..."
                    value={form.notes}
                    onChange={(e) => set("notes", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] transition-all resize-none"
                  />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[var(--border-default)] bg-[var(--color-neutral-50)] shrink-0">
              <Button variant="ghost" onClick={onClose} disabled={status === "loading"}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                loading={status === "loading"}
              >
                {isEdit ? "Save Changes" : "Add Patient"}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

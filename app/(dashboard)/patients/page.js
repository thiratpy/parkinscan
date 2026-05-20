"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Filter, UserPlus, Users } from "lucide-react";
import PageTransition from "../../components/layout/PageTransition";
import { StaggerContainer, StaggerItem } from "../../components/layout/PageTransition";
import PatientCard from "../../components/patients/PatientCard";
import PatientForm from "../../components/patients/PatientForm";
import EmptyState from "../../components/ui/EmptyState";
import Button from "../../components/ui/Button";
import Skeleton from "../../components/ui/Skeleton";
import { listPatients } from "../../lib/db";

const filterOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

export default function PatientsPage() {
  const searchParams = useSearchParams();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showForm, setShowForm] = useState(searchParams.get("action") === "new");

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const result = await listPatients({ status: statusFilter, pageSize: 50 });
      setPatients(result.patients);
    } catch (err) {
      console.error("Failed to load patients:", err);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [statusFilter]);

  const filteredPatients = patients.filter((p) =>
    !search || p.name?.toLowerCase().includes(search.toLowerCase()) || p.mrn?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <PageTransition>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Patients</h1>
          <p className="text-sm text-[var(--text-muted)] mt-1">
            {patients.length} patient{patients.length !== 1 ? "s" : ""} registered in the system
          </p>
        </div>
        <Button icon={UserPlus} onClick={() => setShowForm(true)}>
          Add Patient
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search by name or MRN..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 text-sm rounded-[var(--radius-md)] bg-white border border-[var(--border-default)] focus:border-[var(--border-focus)] focus:ring-2 focus:ring-[var(--color-primary-100)] outline-none transition-all placeholder:text-[var(--text-muted)]"
          />
        </div>
        <div className="flex items-center gap-1.5 bg-white border border-[var(--border-default)] rounded-[var(--radius-md)] p-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded-[var(--radius-sm)] transition-all cursor-pointer ${
                statusFilter === opt.value
                  ? "bg-[var(--color-primary-600)] text-white"
                  : "text-[var(--text-secondary)] hover:bg-[var(--color-neutral-50)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Patient List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-[var(--radius-lg)] border border-[var(--border-default)] p-4">
              <div className="flex items-start gap-3.5">
                <Skeleton circle className="!w-11 !h-11" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="w-32 h-4" />
                  <Skeleton className="w-48 h-3" />
                  <Skeleton className="w-24 h-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredPatients.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? "No matching patients" : "No patients yet"}
          description={
            search
              ? `No patients found matching "${search}". Try a different search term.`
              : "Start by registering your first patient to begin tracking their assessments."
          }
          actionLabel={search ? undefined : "Add First Patient"}
          onAction={search ? undefined : () => setShowForm(true)}
        />
      ) : (
        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredPatients.map((patient) => (
            <StaggerItem key={patient.id}>
              <PatientCard patient={patient} />
            </StaggerItem>
          ))}
        </StaggerContainer>
      )}

      {/* Patient Form Modal */}
      <PatientForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={fetchPatients}
      />
    </PageTransition>
  );
}

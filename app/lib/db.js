// db.js — All database operations go through the Python backend API.
// No Supabase JS client, no env vars, no localStorage. Pure fetch().

function getApiBase() {
  if (typeof window !== "undefined") {
    const port = window.location.port;
    const host = window.location.hostname;
    // Local dev: Next.js on :3000, Python API on :8000
    if (host === "localhost" && (port === "3000" || port === "3001")) {
      return "http://localhost:8000";
    }
  }
  // Production (HF Space): same origin
  return "";
}

const API = getApiBase();

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${errText}`);
  }
  return res.json();
}

// ── Patients ──────────────────────────────────────────

function mapPatient(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at || "",
    updatedAt: row.updated_at || "",
    dateOfBirth: row.date_of_birth || "",
    diagnosisStatus: row.diagnosis_status || "under_evaluation",
    treatingPhysician: row.treating_physician || "",
  };
}

export async function createPatient(data) {
  const raw = await apiFetch("/api/patients", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return mapPatient(raw);
}

export async function updatePatient(id, data) {
  await apiFetch(`/api/patients/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deletePatient(id) {
  await apiFetch(`/api/patients/${id}`, { method: "DELETE" });
}

export async function getPatient(id) {
  try {
    const res = await apiFetch(`/api/patients?search=${id}&page_size=1`);
    const match = (res.patients || []).find((p) => p.id === id);
    return match ? mapPatient(match) : null;
  } catch {
    return null;
  }
}

export async function listPatients({
  search = "",
  status = "all",
  sortBy = "created_at",
  sortDir = "desc",
  pageSize = 100,
  offset = 0,
} = {}) {
  const params = new URLSearchParams({
    search,
    status,
    sort_by: sortBy === "createdAt" ? "created_at" : sortBy,
    sort_dir: sortDir,
    page_size: String(pageSize),
    offset: String(offset),
  });
  const res = await apiFetch(`/api/patients?${params}`);
  return {
    patients: (res.patients || []).map(mapPatient),
    hasMore: (res.count || 0) > offset + pageSize,
    nextOffset: offset + pageSize,
  };
}

// ── Scans ──────────────────────────────────────────────

function mapScan(row) {
  if (!row) return null;
  return {
    ...row,
    createdAt: row.created_at || "",
    patientId: row.patient_id || "",
    doctorOverride: row.doctor_override || null,
    imageUrl: row.image_url || null,
    mock: row.is_mock || false,
  };
}

export async function addScanResult(patientId, scanData) {
  const raw = await apiFetch("/api/scans", {
    method: "POST",
    body: JSON.stringify({ patientId, ...scanData }),
  });
  return mapScan(raw);
}

export async function listScanHistory(patientId = null, { pageSize = 100 } = {}) {
  const params = new URLSearchParams({ page_size: String(pageSize) });
  if (patientId) params.set("patient_id", patientId);
  const raw = await apiFetch(`/api/scans?${params}`);
  return (Array.isArray(raw) ? raw : []).map(mapScan);
}

export async function getScanResult(id) {
  try {
    const all = await listScanHistory(null, { pageSize: 500 });
    return all.find((s) => s.id === id) || null;
  } catch {
    return null;
  }
}

// ── Stats ──────────────────────────────────────────────

export async function getDashboardStats() {
  try {
    return await apiFetch("/api/stats");
  } catch {
    return { totalPatients: 0, totalScans: 0, scansThisWeek: 0, avgConfidence: 0 };
  }
}

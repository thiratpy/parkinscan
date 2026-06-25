import { supabase } from "./supabase";

const PATIENTS_COLLECTION = "patients";
const SCANS_COLLECTION = "scans";

// ── Patient CRUD ──────────────────────────────────────────

function generateMRN() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKS-${timestamp}-${random}`;
}

function mapRow(row) {
  if (!row) return null;
  const mapped = { ...row };
  if (row.created_at) {
    mapped.createdAt = { toDate: () => new Date(row.created_at) };
  }
  if (row.updated_at) {
    mapped.updatedAt = { toDate: () => new Date(row.updated_at) };
  }
  return mapped;
}

export async function createPatient(data) {
  const patientData = {
    ...data,
    mrn: generateMRN(),
    status: "active",
  };
  
  const { data: newPatient, error } = await supabase
    .from(PATIENTS_COLLECTION)
    .insert([patientData])
    .select()
    .single();
    
  if (error) throw error;
  return mapRow(newPatient);
}

export async function updatePatient(id, data) {
  const { error } = await supabase
    .from(PATIENTS_COLLECTION)
    .update(data)
    .eq('id', id);
    
  if (error) throw error;
}

export async function deletePatient(id) {
  const { error } = await supabase
    .from(PATIENTS_COLLECTION)
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export async function getPatient(id) {
  const { data, error } = await supabase
    .from(PATIENTS_COLLECTION)
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return mapRow(data);
}

export async function listPatients({ search = "", status = "all", sortBy = "created_at", sortDir = "desc", pageSize = 20, offset = 0 } = {}) {
  let query = supabase
    .from(PATIENTS_COLLECTION)
    .select('*', { count: 'exact' });

  if (status !== "all") {
    query = query.eq('status', status);
  }

  if (search) {
    query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,mrn.ilike.%${search}%`);
  }

  const orderByField = sortBy === "createdAt" ? "created_at" : sortBy;
  
  const { data: patients, error, count } = await query
    .order(orderByField, { ascending: sortDir === "asc" })
    .range(offset, offset + pageSize - 1);

  if (error) throw error;

  return {
    patients: (patients || []).map(mapRow),
    hasMore: count > offset + pageSize,
    nextOffset: offset + pageSize,
  };
}

// ── Scan Results ──────────────────────────────────────────

export async function addScanResult(patientId, scanData) {
  const { data, error } = await supabase
    .from(SCANS_COLLECTION)
    .insert([{ patientId: patientId, ...scanData }])
    .select()
    .single();
    
  if (error) throw error;
  return mapRow(data);
}

export async function listScanHistory(patientId = null, { pageSize = 50 } = {}) {
  let query = supabase
    .from(SCANS_COLLECTION)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(pageSize);
    
  if (patientId) {
    query = query.eq('patientId', patientId);
  }
  
  const { data, error } = await query;
  if (error) throw error;
  return (data || []).map(mapRow);
}

export async function getScanResult(id) {
  const { data, error } = await supabase
    .from(SCANS_COLLECTION)
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return mapRow(data);
}

// ── Stats ──────────────────────────────────────────────

export async function getDashboardStats() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { count: totalPatients } = await supabase
    .from(PATIENTS_COLLECTION)
    .select('*', { count: 'exact', head: true });

  const { count: totalScans } = await supabase
    .from(SCANS_COLLECTION)
    .select('*', { count: 'exact', head: true });

  const { count: scansThisWeek } = await supabase
    .from(SCANS_COLLECTION)
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo);

  const { data: allScans } = await supabase
    .from(SCANS_COLLECTION)
    .select('confidence');
    
  let avgConfidence = 0;
  if (allScans && allScans.length > 0) {
    const validScans = allScans.filter(s => s.confidence !== null && s.confidence !== undefined);
    if (validScans.length > 0) {
      const sum = validScans.reduce((acc, curr) => acc + parseFloat(curr.confidence), 0);
      avgConfidence = (sum / validScans.length).toFixed(1);
    }
  }

  return {
    totalPatients: totalPatients || 0,
    scansThisWeek: scansThisWeek || 0,
    totalScans: totalScans || 0,
    avgConfidence,
  };
}

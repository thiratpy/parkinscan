import { getSupabase } from "./supabase";

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
  if (row.created_at) mapped.createdAt = { toDate: () => new Date(row.created_at) };
  if (row.updated_at) mapped.updatedAt = { toDate: () => new Date(row.updated_at) };
  
  // Map snake_case from DB back to camelCase for frontend
  if (row.date_of_birth !== undefined) mapped.dateOfBirth = row.date_of_birth;
  if (row.diagnosis_status !== undefined) mapped.diagnosisStatus = row.diagnosis_status;
  if (row.treating_physician !== undefined) mapped.treatingPhysician = row.treating_physician;
  
  return mapped;
}

export async function createPatient(data) {
  const supabase = await getSupabase();
  const patientData = {
    name: data.name,
    hn: data.hn,
    age: data.age ? Number(data.age) : null,
    sex: data.sex,
    date_of_birth: data.dateOfBirth,
    diagnosis_status: data.diagnosisStatus,
    medications: data.medications,
    treating_physician: data.treatingPhysician,
    phone: data.phone,
    email: data.email,
    notes: data.notes,
    mrn: generateMRN(),
    status: "active",
  };
  
  const { data: newPatient, error } = await supabase
    .from(PATIENTS_COLLECTION)
    .insert([patientData])
    .select()
    .single();
    
  if (error) {
    console.error("Supabase createPatient Error:", error);
    throw new Error(error.message || JSON.stringify(error));
  }
  return mapRow(newPatient);
}

export async function updatePatient(id, data) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from(PATIENTS_COLLECTION)
    .update(data)
    .eq('id', id);
    
  if (error) throw error;
}

export async function deletePatient(id) {
  const supabase = await getSupabase();
  const { error } = await supabase
    .from(PATIENTS_COLLECTION)
    .delete()
    .eq('id', id);
    
  if (error) throw error;
}

export async function getPatient(id) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(PATIENTS_COLLECTION)
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  return mapRow(data);
}

export async function listPatients({ search = "", status = "all", sortBy = "created_at", sortDir = "desc", pageSize = 20, offset = 0 } = {}) {
  const supabase = await getSupabase();
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
  const supabase = await getSupabase();
  const scanRow = {
    patient_id: patientId,
    type: scanData.type || "mri",
    prediction: scanData.prediction,
    confidence: scanData.confidence ? Number(scanData.confidence) : null,
    doctor_override: scanData.doctorOverride || null,
    label: scanData.label || null,
    is_mock: scanData.mock || false,
    notes: scanData.notes || null,
    image_url: scanData.imageUrl || null,
  };

  const { data, error } = await supabase
    .from(SCANS_COLLECTION)
    .insert([scanRow])
    .select()
    .single();
    
  if (error) {
    console.error("Supabase addScanResult Error:", error);
    throw new Error(error.message || JSON.stringify(error));
  }
  return mapRow(data);
}

export async function listScanHistory(patientId = null, { pageSize = 50 } = {}) {
  const supabase = await getSupabase();
  let query = supabase
    .from(SCANS_COLLECTION)
    .select('*')
    .order('created_at', { ascending: false })
    .limit(pageSize);
    
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  
  const { data, error } = await query;
  if (error) {
    console.error("Supabase listScanHistory Error:", error);
    throw new Error(error.message || JSON.stringify(error));
  }
  return (data || []).map((row) => {
    const mapped = mapRow(row);
    // map scan-specific fields back to frontend camelCase
    mapped.patientId = row.patient_id;
    mapped.doctorOverride = row.doctor_override;
    mapped.imageUrl = row.image_url;
    mapped.mock = row.is_mock;
    return mapped;
  });
}

export async function getScanResult(id) {
  const supabase = await getSupabase();
  const { data, error } = await supabase
    .from(SCANS_COLLECTION)
    .select('*')
    .eq('id', id)
    .single();
    
  if (error) return null;
  const mapped = mapRow(data);
  mapped.patientId = data.patient_id;
  mapped.doctorOverride = data.doctor_override;
  mapped.imageUrl = data.image_url;
  mapped.mock = data.is_mock;
  return mapped;
}

// ── Stats ──────────────────────────────────────────────

export async function getDashboardStats() {
  const supabase = await getSupabase();
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

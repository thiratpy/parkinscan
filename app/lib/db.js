import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebase";

const PATIENTS_COLLECTION = "patients";
const SCANS_COLLECTION = "scans";

// ── Patient CRUD ──────────────────────────────────────────

function generateMRN() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PKS-${timestamp}-${random}`;
}

export async function createPatient(data) {
  const patientData = {
    ...data,
    mrn: generateMRN(),
    status: "active",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, PATIENTS_COLLECTION), patientData);
  return { id: docRef.id, ...patientData };
}

export async function updatePatient(id, data) {
  const docRef = doc(db, PATIENTS_COLLECTION, id);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deletePatient(id) {
  const docRef = doc(db, PATIENTS_COLLECTION, id);
  await deleteDoc(docRef);
}

export async function getPatient(id) {
  const docRef = doc(db, PATIENTS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

export async function listPatients({ search = "", status = "all", sortBy = "createdAt", sortDir = "desc", pageSize = 20, lastDoc = null } = {}) {
  let q = collection(db, PATIENTS_COLLECTION);
  const constraints = [];

  if (status !== "all") {
    constraints.push(where("status", "==", status));
  }

  constraints.push(orderBy(sortBy, sortDir));
  constraints.push(limit(pageSize));

  if (lastDoc) {
    constraints.push(startAfter(lastDoc));
  }

  q = query(q, ...constraints);
  const snapshot = await getDocs(q);
  const patients = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

  return {
    patients,
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
    hasMore: snapshot.docs.length === pageSize,
  };
}

// ── Scan Results ──────────────────────────────────────────

export async function addScanResult(patientId, scanData) {
  const data = {
    patientId,
    ...scanData,
    createdAt: serverTimestamp(),
  };
  const docRef = await addDoc(collection(db, SCANS_COLLECTION), data);
  return { id: docRef.id, ...data };
}

export async function listScanHistory(patientId = null, { pageSize = 50 } = {}) {
  let q = collection(db, SCANS_COLLECTION);
  const constraints = [];

  if (patientId) {
    constraints.push(where("patientId", "==", patientId));
  }

  constraints.push(orderBy("createdAt", "desc"));
  constraints.push(limit(pageSize));

  q = query(q, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getScanResult(id) {
  const docRef = doc(db, SCANS_COLLECTION, id);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...snapshot.data() };
}

// ── Stats ──────────────────────────────────────────────

export async function getDashboardStats() {
  const patientsSnapshot = await getDocs(collection(db, PATIENTS_COLLECTION));
  const scansSnapshot = await getDocs(collection(db, SCANS_COLLECTION));

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekAgoTimestamp = Timestamp.fromDate(weekAgo);

  let recentScans = 0;
  let totalConfidence = 0;
  let scanCount = 0;

  scansSnapshot.docs.forEach((doc) => {
    const data = doc.data();
    if (data.createdAt && data.createdAt.toDate() > weekAgo) {
      recentScans++;
    }
    if (data.confidence) {
      totalConfidence += data.confidence;
      scanCount++;
    }
  });

  return {
    totalPatients: patientsSnapshot.size,
    scansThisWeek: recentScans,
    totalScans: scansSnapshot.size,
    avgConfidence: scanCount > 0 ? (totalConfidence / scanCount).toFixed(1) : 0,
  };
}

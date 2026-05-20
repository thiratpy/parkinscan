# ParkinScan (Parkinson AI) - Inspection & Improvement Report

This document outlines the security vulnerabilities, UX/UI flaws, and strategic upgrades required to make ParkinScan a production-ready, clinical-grade tool for neurologists and medical practitioners.

## 🔴 1. Critical Vulnerabilities & Architecture Flaws

### 1.1 Data Persistence & Loss Risk (High)
* **Current State:** Patient records and scan history are saved in the browser's `localStorage` (`app/page.js`).
* **Vulnerability:** If the user clears their browser cache or uses incognito mode, **all medical records are permanently deleted**.
* **Fix:** Integrate a real backend database. The project already has `firebase` in `package.json`. Connect Firestore to securely store and retrieve patient data.

### 1.2 Unstored Medical Imagery (High)
* **Current State:** `Scanner.js` uploads the drawing, receives the AI prediction, and saves the text metadata. The actual drawing image is discarded.
* **Vulnerability:** Medical applications require audit trails. Without the original image, doctors cannot verify *why* the AI made its prediction, rendering the tool legally and clinically risky.
* **Fix:** Upload scan images to cloud storage (e.g., Firebase Storage or AWS S3) and store the image URL alongside the scan metadata in the database.

### 1.3 Missing Authentication & Authorization (Critical)
* **Current State:** The app opens directly to patient data without a login screen.
* **Vulnerability:** Extremely severe HIPAA/GDPR violation. Anyone with access to the browser can view sensitive Protected Health Information (PHI).
* **Fix:** Implement robust authentication (e.g., Firebase Auth or NextAuth) with Role-Based Access Control (RBAC) (e.g., Admin, Doctor, Nurse).

### 1.4 API Security (Medium)
* **Current State:** `py-api/main.py` has wide-open CORS (`allow_methods=["*"]`, `allow_headers=["*"]`).
* **Fix:** Restrict CORS in production to only the allowed frontend domains. Implement API key or JWT token verification for the `/predict` endpoint to prevent unauthorized abuse of the AI model.

---

## 🟡 2. UX / UI Improvements

### 2.1 Clunky Error Handling
* **Issue:** `Scanner.js` uses native browser `alert()` for errors (e.g., file too large, server down). This freezes the UI and feels unprofessional.
* **Fix:** The project already has `react-hot-toast` installed. Replace all `alert()` calls with modern, non-blocking toast notifications.

### 2.2 Patient Management Deficiencies
* **Issue:** Users can create patients, but they **cannot edit or delete them**. 
* **Issue:** The `History` tab shows a global flat list of all scans. There is no way to click a patient and see *only* their specific scans.
* **Fix:** Add a "Patient Details" view. Allow editing patient info, deleting records (soft delete), and viewing a filtered timeline of a specific patient's assessments.

### 2.3 Non-Responsive Layout
* **Issue:** The `Sidebar.js` has a hardcoded `width: 260px` and `page.js` uses a hardcoded `marginLeft: 260`. 
* **Fix:** Clinics often use tablets (iPads). The layout will break on smaller screens. Implement a responsive layout with a collapsible hamburger menu on mobile/tablet breakpoints.

### 2.4 Lack of Human Override
* **Issue:** The AI assigns a "Healthy" or "Parkinson's" label, and it gets saved directly to history.
* **Fix:** AI in medicine should be a *screening aid*. Add a feature allowing the doctor to review the scan and mark "Agree with AI" or "Disagree (False Positive/Negative)".

---

## 🟢 3. Strategic Upgrades for Target Users (Clinicians)

To make this project truly usable in a real-world clinical setting, the following features should be prioritized:

### 3.1 Longitudinal Tracking (Disease Progression)
* **Upgrade:** Parkinson's is a progressive disease. Add a chart/graph on the Patient Details page mapping their scan confidence scores over time (e.g., 6 months ago: 80% healthy -> Today: 55% healthy). Visualizing decline is crucial for adjusting medication.

### 3.2 Clinical Report Generation (PDF Export)
* **Upgrade:** Doctors need to append findings to a hospital's EHR (Electronic Health Record) system. Add a "Generate Report" button that creates a clean, printable PDF containing:
    * Patient Demographics (Name, MRN, Age)
    * The uploaded spiral/wave image
    * The AI prediction and confidence score
    * A signature line for the reviewing physician.

### 3.3 Enhanced Input Validation
* **Upgrade:** Standardize MRN (Medical Record Number) generation or allow manual input to match the clinic's existing database.
* **Upgrade:** In `PatientForm` (`Patients.js`), add strict validation for dates and require specific formats to prevent dirty data.

### 3.4 API File Validation
* **Upgrade:** In `main.py`, relying on `try: Image.open()` is risky. Implement python-magic or strict mime-type checking before passing the file to Pillow to prevent decompression bomb attacks or corrupted file crashes.

---

### Suggested Next Steps for Implementation:
1. Initialize Firebase (Auth & Firestore) to replace `localStorage`.
2. Refactor UI layout for tablet responsiveness.
3. Replace `alert()` with `react-hot-toast`.
4. Build the individual "Patient Profile" view with scan history filtering.

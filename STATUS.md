# ParkinScan — Project Status Report

_Last updated: May 20, 2026_

---

## Current Architecture

```
app/
├── layout.js          Root layout (Inter font, metadata)
├── globals.css        Design tokens + CSS animations + responsive
├── page.js            App shell — tab navigation, localStorage state
└── ui/
    ├── Sidebar.js     Sidebar navigation (collapsible on mobile)
    ├── Dashboard.js   Stats, recent patients, quick actions
    ├── Patients.js    Patient list + detail view + add/edit/delete
    ├── Scanner.js     Image upload + API call + result + doctor override
    └── History.js     Scan history feed with override badges

py-api/
├── main.py            FastAPI inference server (lifespan, logging)
├── requirements.txt   Python dependencies
└── model/
    └── parkinsons_efficientnet_prod.pth (16MB EfficientNet model)
```

**Active files:** 8 frontend + 2 backend = **10 files total**

---

## What Works

| Feature | Status | Notes |
|---------|--------|-------|
| Dashboard stats | Working | Counts patients/scans from localStorage |
| Add patient form | Working | Name, age, sex, DOB, diagnosis, medications, physician, phone, email |
| Edit patient | Working | Opens pre-filled form, saves changes |
| Delete patient | Working | Two-step confirmation, cascades to delete scans |
| Patient detail view | Working | Info cards, scan timeline, edit/delete actions |
| Patient list + search | Working | Search by name or MRN, card grid with scan counts |
| Sidebar navigation | Working | Tab-based, collapses on mobile with hamburger |
| Image upload (drag/drop) | Working | Validates type + size (10MB max) |
| AI scan analysis | Working | Calls POST /predict on Python API |
| Scan result display | Working | Classification + confidence bar + disclaimer |
| Doctor override | Working | Agree/Disagree buttons saved with scan record |
| Confidence threshold | Working | Warning shown below 70% confidence |
| Mock result indicator | Working | Yellow banner when model not loaded |
| Inline error handling | Working | Banner with dismiss, retry button (no more alert()) |
| Save confirmation | Working | Green banner with "Scan Another" / "View History" |
| History feed | Working | Doctor override badges, mock tags, low-conf warnings |
| Python API /predict | Working | EfficientNet inference, mock fallback, latency logging |
| Python API /health | Working | Reports model status + device |
| Responsive layout | Working | Sidebar collapses, grids stack on mobile |

---

## Fixed Issues (from previous report)

| Issue | Fix Applied |
|-------|-------------|
| No patient edit/delete | [x] Full CRUD with PatientDetail view |
| No patient detail view | [x] New tab with info cards + scan timeline |
| Dashboard grid breaks on small screens | [x] Uses auto-fit instead of fixed 2fr/1fr |
| Sidebar not responsive | [x] Slides out with hamburger toggle on mobile |
| alert() for errors | [x] Replaced with inline error/success banners |
| on_event("startup") deprecated | [x] Replaced with lifespan context manager |
| No request logging | [x] Added latency, filename, prediction logging |
| No confidence threshold | [x] Warning at < 70% |
| No doctor override | [x] Agree/Disagree saved with scan metadata |

---

## Remaining Issues

### Still Present (intentionally left for demo scope)

| Issue | Severity | Notes |
|-------|----------|---------|
| localStorage only | Known | Demo limitation — no persistence across devices |
| No auth | Known | Demo doesn't need login |
| CORS wide open | Low | Fine for localhost demo |
| No image storage | Medium | Drawings discarded after prediction |
| Old files in project | Cleanup | (auth), (dashboard), dashboard, components, lib — dead but left as backup |
| Unused npm deps | Cleanup | firebase, framer-motion, clsx, date-fns, react-hot-toast, tailwindcss |

### P2 — Future Production Features

| Feature | Description |
|---------|-------------|
| Firebase integration | Replace localStorage with Firestore |
| Image storage | Upload scans to cloud storage with audit trail |
| PDF report export | Clinical report with patient info + image + AI result |
| Longitudinal chart | Plot confidence scores over time per patient |
| Auth + RBAC | Login with role-based access (Admin, Doctor, Nurse) |

---

## How to Run

### Frontend
```bash
cd /path/to/parkinson-ai
npm install
npm run dev
# Opens at http://localhost:3000
```

### Python API
```bash
cd /path/to/parkinson-ai/py-api
pip install -r requirements.txt
python main.py
# Opens at http://localhost:8000
# Health check: GET http://localhost:8000/health
```

### Full Demo Flow
1. Open http://localhost:3000
2. Dashboard → Quick Actions → **New Patient**
3. Fill form → submit
4. Click patient card → **Patient Detail** view
5. Click **New Scan** → upload spiral/wave drawing
6. Click **Analyze Drawing** → see result
7. Review → click **Agree** or **Disagree**
8. Click **Save to History**
9. Check **History** tab — see override badges, confidence, patient names

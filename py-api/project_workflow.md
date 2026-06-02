# ขั้นตอนการทำงานของโครงการ ParkinScan — ระบบคัดกรองโรคพาร์กินสันด้วยปัญญาประดิษฐ์

---

## ๑. บทนำ

โครงการ ParkinScan เป็นระบบตรวจคัดกรองโรคพาร์กินสัน (Parkinson's Disease) จากภาพถ่าย MRI สมอง โดยอาศัยเทคโนโลยีปัญญาประดิษฐ์ (Artificial Intelligence) เพื่อประเมินความเป็นไปได้ว่าผู้ป่วยมีลักษณะของโรคพาร์กินสันหรือไม่ ระบบประกอบด้วยองค์ประกอบหลัก ๒ ส่วน ได้แก่

- **ส่วนหลังบ้าน (Backend):** สร้างด้วย FastAPI (Python) ทำหน้าที่รับภาพ MRI แล้วประมวลผลด้วยแบบจำลองเชิงลึก (Deep Learning Model) เพื่อส่งคืนผลการวินิจฉัย
- **ส่วนหน้าบ้าน (Frontend):** สร้างด้วย Next.js (React) แสดงผลในรูปแบบแดชบอร์ดทางคลินิก (Clinical Dashboard) สำหรับการจัดการข้อมูลผู้ป่วยและการดูผลการสแกน

ระบบถูกนำขึ้นใช้งาน (Deploy) บน Hugging Face Spaces ในรูปแบบ Docker Container เดียว ที่ให้บริการทั้ง Frontend และ API อนุมาน (Inference API)

---

## ๒. ขั้นตอนการเตรียมข้อมูลและฝึกแบบจำลอง

### ๒.๑ แหล่งข้อมูล (Dataset)

ข้อมูลที่ใช้ในการฝึกแบบจำลองมาจากชุดข้อมูลภาพ MRI สมองผู้ป่วยพาร์กินสัน (Kaggle: `irfansheriff/parkinsons-brain-mri-dataset`) แบ่งเป็น ๒ กลุ่ม:

| กลุ่ม | คำอธิบาย | ป้ายกำกับ (Label) |
|------|---------|------------------|
| Normal | ภาพ MRI สมองปกติ | `0` |
| Parkinson | ภาพ MRI สมองผู้ป่วยพาร์กินสัน | `1` |

### ๒.๒ การเตรียมภาพก่อนป้อนเข้าแบบจำลอง (Medical Preprocessing)

ภาพ MRI แต่ละภาพจะผ่านกระบวนการเตรียมข้อมูลดังนี้:

1. **CLAHE (Contrast Limited Adaptive Histogram Equalization):** ปรับปรุงความคมชัดของภาพด้วยเทคนิค CLAHE โดยกำหนด `clipLimit=2.0` และ `tileGridSize=(8,8)`
2. **Smart Crop:** ตัดพื้นที่สีดำที่ไม่มีข้อมูล (dead space) ออกจากภาพ ด้วยการใช้ threshold กับ contour detection
3. **แปลงภาพ Grayscale → RGB:** แปลงภาพขาวดำเป็นภาพ ๓ ช่องสี (RGB) เพื่อให้สอดคล้องกับรูปแบบที่แบบจำลอง EfficientNet-B0 รองรับ

> **สำคัญ:** กระบวนการเตรียมข้อมูลในขั้นตอนนี้ต้องถูกทำซ้ำอย่างเหมือนกันทุกประการในขั้นตอนการอนุมาน (Inference) เพื่อให้ได้ผลลัพธ์ที่ถูกต้อง

### ๒.๓ การแบ่งข้อมูลและการจัดการความไม่สมดุลของข้อมูล

- ใช้ **Stratified Split** แบ่งข้อมูล 80/20 สำหรับ Train/Validation เพื่อรักษาสัดส่วนของแต่ละกลุ่มให้สม่ำเสมอ
- ใช้ **WeightedRandomSampler** เพื่อแก้ปัญหาความไม่สมดุลของจำนวนข้อมูลระหว่างกลุ่ม Normal และ Parkinson

### ๒.๔ Data Augmentation

เฉพาะชุดข้อมูลฝึกหัด (Training Set) จะมีการเสริมข้อมูล (Augmentation) ดังนี้:

- ปรับขนาดเป็น 224×224 พิกเซล
- หมุนภาพแบบสุ่ม (Random Rotation ±15°)
- เลื่อนและปรับขนาดแบบสุ่ม (Random Affine)
- พลิกภาพแนวนอนแบบสุ่ม (Random Horizontal Flip)
- แปลงเป็น Tensor และ Normalize ด้วย ImageNet mean/std

ชุดข้อมูลตรวจสอบ (Validation Set) จะทำเพียงปรับขนาดและ Normalize เท่านั้น

### ๒.๕ สถาปัตยกรรมแบบจำลอง

ใช้แบบจำลอง **EfficientNet-B0** จากไลบรารี `timm` (PyTorch Image Models) โดย:

- โหลดน้ำหนักที่ถูกฝึกมาก่อน (Pretrained Weights) จาก ImageNet
- กำหนดจำนวนคลาสผลลัพธ์ = 2 (Normal, Parkinson)

### ๒.๖ กลยุทธ์การฝึก (Two-Phase Training)

การฝึกแบ่งเป็น ๒ ระยะ:

**ระยะที่ ๑ — Frozen Backbone Warmup (Epoch 1–10):**
- แช่แข็งพารามิเตอร์ของ Backbone ทั้งหมด ฝึกเฉพาะส่วน Classifier
- อัตราการเรียนรู้ (Learning Rate) = `1e-3`
- Optimizer: AdamW (weight_decay = 0.01)
- Scheduler: CosineAnnealingWarmRestarts (T_0=5)

**ระยะที่ ๒ — Fine-tuning (Epoch 11–50):**
- ปลดล็อก ๓ บล็อกสุดท้ายของ Backbone เพื่อ Fine-tune
- ลดอัตราการเรียนรู้เป็น `1e-5`
- Optimizer: AdamW (weight_decay = 0.001)
- Scheduler: CosineAnnealingWarmRestarts (T_0=10)

### ๒.๗ ฟังก์ชันสูญเสีย (Loss Function)

ใช้ **CrossEntropyLoss** พร้อมเทคนิค **Label Smoothing** (`label_smoothing=0.1`) เพื่อป้องกันแบบจำลองจากการตัดสินใจที่รุนแรงเกินไป (over-confident predictions)

### ๒.๘ Mixed Precision Training

ใช้ **Automatic Mixed Precision (AMP)** ของ PyTorch 2.x (`torch.amp.autocast` + `GradScaler`) เพื่อเพิ่มความเร็วในการฝึกบน GPU

### ๒.๙ Early Stopping

- บันทึกแบบจำลองที่ดีที่สุดตามค่า AUC บน Validation Set
- หยุดฝึกอัตโนมัติหากค่า AUC ไม่ดีขึ้นใน ๑๐ Epoch ติดต่อกัน (Patience = 10)

---

## ๓. การประเมินผลแบบจำลอง

### ๓.๑ การกำหนด Optimal Threshold

ใช้ **Youden's J Statistic** (J = Sensitivity + Specificity − 1) เพื่อหาค่าขีดแบ่ง (Threshold) ที่เหมาะสมที่สุดจากเส้นโค้ง ROC

**ค่า Optimal Threshold ที่ได้ = 0.7012**

### ๓.๒ ผลลัพธ์สุดท้ายบน Validation Set

| ตัวชี้วัด | ค่า |
|---------|-----|
| Optimal Threshold | 0.7012 |
| Accuracy | 92.8% |
| Sensitivity (Recall) | 100.0% — ตรวจจับพาร์กินสันได้ทุกราย |
| Specificity | 90.2% — ระบุคนปกติได้ 90.2% |
| Precision | 78.6% |
| F1-Score | 0.88 |
| ROC-AUC | 0.9841 |
| PR-AUC | 0.9587 |

---

## ๔. ขั้นตอนการให้บริการ (Inference Pipeline)

### ๔.๑ ภาพรวม

เมื่อผู้ใช้งานอัปโหลดภาพ MRI ผ่านทาง Frontend ระบบจะดำเนินการตามขั้นตอนดังนี้:

```
ผู้ใช้อัปโหลดภาพ MRI
        ↓
[POST /predict] — FastAPI รับภาพ
        ↓
ตรวจสอบ Content-Type (ต้องเป็น image/*)
        ↓
เตรียมข้อมูลภาพ (crop_and_enhance_mri)
  ① CLAHE Contrast Enhancement
  ② Smart Crop ตัดพื้นที่ว่าง
  ③ Grayscale → RGB
        ↓
ปรับขนาดเป็น 224×224 + Normalize
        ↓
ป้อนเข้าแบบจำลอง EfficientNet-B0 (timm)
        ↓
คำนวณ Softmax → P(Parkinson)
        ↓
เปรียบเทียบกับ Optimal Threshold (0.70)
  ✓ P(Parkinson) ≥ 0.70 → ป้ายกำกับ: "parkinson"
  ✗ P(Parkinson) < 0.70 → ป้ายกำกับ: "healthy"
        ↓
ส่งผลลัพธ์กลับเป็น JSON
```

### ๔.๒ รายละเอียดทางเทคนิค

- **Framework:** FastAPI
- **Model:** EfficientNet-B0 (timm) — โหลดจากไฟล์ `parkinsons_efficientnet_prod.pth`
- **Preprocessing:** OpenCV (CLAHE + Contour Crop) → PIL → torchvision transforms
- **Threshold:** ใช้ค่า 0.70 จาก Youden's J Statistic แทนการใช้ argmax มาตรฐาน (0.50)
- **Fallback:** หากโหลดแบบจำลองไม่สำเร็จ ระบบจะส่งคืนผลลัพธ์จำลอง (Mock Result)

---

## ๕. สถาปัตยกรรมระบบ (System Architecture)

### ๕.๑ โครงสร้าง Monorepo

```
parkinson-ai/
├── app/                    ← Next.js Frontend (React SPA)
│   ├── globals.css
│   ├── layout.js
│   ├── page.js             ← หน้าหลัก (Clinical Dashboard)
│   └── ui/
│       └── Sidebar.js      ← แถบเมนูด้านข้าง
├── py-api/                 ← Python Backend
│   ├── main.py             ← FastAPI Application + Inference
│   ├── model/
│   │   └── parkinsons_efficientnet_prod.pth  ← ไฟล์น้ำหนักแบบจำลอง
│   ├── parkinsons.ipynb    ← Jupyter Notebook สำหรับการฝึก
│   ├── requirements.txt    ← Dependencies (dev)
│   └── requirements-prod.txt ← Dependencies (production)
├── Dockerfile              ← Multi-stage Docker Build
├── README.md               ← Hugging Face Spaces Metadata
└── next.config.mjs         ← Next.js Configuration (static export)
```

### ๕.๒ การ Deploy บน Hugging Face Spaces

ใช้ **Multi-stage Docker Build** ประกอบด้วย ๒ ขั้นตอน:

**Stage 1 — Frontend Build:**
- ใช้ `node:20-slim` เป็น Base Image
- ติดตั้ง Dependencies ด้วย `npm ci`
- Build Next.js เป็น Static Export (`output: "export"`) → สร้างไฟล์ในโฟลเดอร์ `/build/out`

**Stage 2 — Python Runtime:**
- ใช้ `python:3.11-slim` เป็น Base Image
- ติดตั้ง Python Dependencies จาก `requirements-prod.txt`
  - FastAPI, Uvicorn, PyTorch (CPU), timm, Pillow, OpenCV, NumPy
- คัดลอก `main.py` และโฟลเดอร์ `model/`
- คัดลอก Frontend Static Build จาก Stage 1 ไปยังโฟลเดอร์ `/app/static`
- เปิดพอร์ต 7860 (มาตรฐาน Hugging Face Spaces)
- รัน `uvicorn main:app` เพื่อให้บริการทั้ง API และ Static Frontend

### ๕.๓ การจัดการไฟล์ขนาดใหญ่

ไฟล์น้ำหนักแบบจำลอง (`parkinsons_efficientnet_prod.pth`, ~16 MB) ถูกจัดการผ่าน **Git LFS** เนื่องจากมีขนาดเกินกว่าขีดจำกัดของ Hugging Face (10 MB)

---

## ๖. Dependencies หลัก

### Python (Backend)

| ไลบรารี | เวอร์ชัน | วัตถุประสงค์ |
|--------|---------|-----------|
| FastAPI | ≥0.110.0 | Web Framework สำหรับ API |
| Uvicorn | ≥0.27.0 | ASGI Server |
| PyTorch | ≥2.0.0 (CPU) | Deep Learning Framework |
| torchvision | ≥0.15.0 | Image Transforms |
| timm | ≥1.0.0 | EfficientNet Model |
| Pillow | ≥10.0.0 | Image Processing |
| OpenCV (headless) | ≥4.8.0 | CLAHE + Image Preprocessing |
| NumPy | ≥1.24.0 | Numerical Computing |
| python-multipart | ≥0.0.7 | File Upload Support |

### JavaScript (Frontend)

| ไลบรารี | วัตถุประสงค์ |
|--------|-----------|
| Next.js | React Framework (Static Export) |
| React | UI Library |
| lucide-react | Icon Library |

---

## ๗. สรุป

โครงการ ParkinScan ดำเนินการตาม Workflow ดังนี้:

1. **รวบรวมข้อมูล** — ภาพ MRI สมองจาก Kaggle Dataset
2. **เตรียมข้อมูล** — CLAHE, Smart Crop, Grayscale→RGB, Stratified Split, Weighted Sampling
3. **ฝึกแบบจำลอง** — EfficientNet-B0 (timm), Two-Phase Training, Label Smoothing, Mixed Precision, Early Stopping
4. **ประเมินผล** — ROC-AUC 0.984, Sensitivity 100%, Optimal Threshold 0.70
5. **พัฒนา API** — FastAPI + Inference Pipeline ที่จำลอง Preprocessing เหมือนขั้นตอนฝึก
6. **พัฒนา Frontend** — Next.js Clinical Dashboard (Static Export)
7. **Deploy** — Hugging Face Spaces ผ่าน Docker Container เดียว (Port 7860)

ระบบได้รับการออกแบบให้ทำงานเป็น Single Container ที่ให้บริการทั้ง Static Frontend และ Inference API โดยไม่มีปัญหา CORS หรือ Cross-Origin

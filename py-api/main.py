import io
import os
import time
import logging
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import uvicorn

# ── Logging ──────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("parkinscan")

# ── Model ────────────────────────────────────────────────
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
MODEL_PATH = "model/parkinsons_efficientnet_prod.pth"
LABELS = ["healthy", "parkinson"]

# Optimal threshold from training (Youden's J statistic)
# See parkinsons.ipynb for derivation
OPTIMAL_THRESHOLD = 0.70

model = None


def crop_and_enhance_mri(img_bytes):
    """
    Replicates the exact preprocessing used during training:
    1. CLAHE contrast enhancement
    2. Smart crop to remove black dead space
    3. Convert grayscale → RGB PIL Image
    """
    # Decode image bytes to numpy array
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_GRAYSCALE)

    if img is None:
        return None

    # Apply CLAHE (Contrast Limited Adaptive Histogram Equalization)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    img = clahe.apply(img)

    # Smart crop to remove pure black dead space
    _, thresh = cv2.threshold(img, 5, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if contours:
        c = max(contours, key=cv2.contourArea)
        x, y, w, h = cv2.boundingRect(c)
        img = img[y:y+h, x:x+w]

    # Convert grayscale → RGB
    img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    return Image.fromarray(img)


def load_model():
    global model
    try:
        import timm
        model = timm.create_model("efficientnet_b0", pretrained=False, num_classes=len(LABELS))
        state_dict = torch.load(MODEL_PATH, map_location=DEVICE, weights_only=True)
        model.load_state_dict(state_dict)
        model.to(DEVICE)
        model.eval()
        logger.info(f"Model loaded successfully on {DEVICE}")
    except Exception as e:
        logger.warning(f"Could not load model — {e}")
        logger.warning("The /predict endpoint will return mock results until a valid model is loaded.")


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])

# ── Lifespan ─────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app):
    load_model()
    yield

# ── App ──────────────────────────────────────────────────
app = FastAPI(
    title="ParkinScan Inference API",
    description="EfficientNet-based MRI analysis for Parkinson's disease screening",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API Endpoints ────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "device": str(DEVICE),
    }

@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    start = time.time()

    if not file.content_type or not file.content_type.startswith("image/"):
        logger.warning(f"Rejected upload: invalid content type '{file.content_type}'")
        raise HTTPException(status_code=400, detail="Upload an image file (PNG, JPEG, WebP)")

    try:
        contents = await file.read()
    except Exception:
        logger.error("Failed to read uploaded file")
        raise HTTPException(status_code=400, detail="Could not read the uploaded file")

    if model is None:
        logger.info(f"Mock prediction returned (model not loaded) in {(time.time()-start)*1000:.0f}ms")
        return {
            "prediction": "healthy",
            "label": "healthy",
            "confidence": 0.85,
            "mock": True,
            "message": "Model not loaded — returning mock result",
        }

    # Apply the same preprocessing as training: CLAHE + smart crop + grayscale→RGB
    image = crop_and_enhance_mri(contents)
    if image is None:
        # Fallback: try loading as regular RGB image
        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            logger.error("Failed to decode image")
            raise HTTPException(status_code=400, detail="Could not decode the uploaded image")

    input_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.softmax(output, dim=1)
        # probability of class 1 (parkinson)
        parkinson_prob = probabilities[0, 1].item()

    # Use optimal threshold from training instead of naive argmax
    if parkinson_prob >= OPTIMAL_THRESHOLD:
        label = "parkinson"
        conf = round(parkinson_prob, 4)
    else:
        label = "healthy"
        conf = round(1.0 - parkinson_prob, 4)

    latency_ms = (time.time() - start) * 1000

    logger.info(f"Prediction: {label} | Confidence: {conf} | P(parkinson): {parkinson_prob:.4f} | Threshold: {OPTIMAL_THRESHOLD} | Latency: {latency_ms:.0f}ms | File: {file.filename}")

    return {
        "prediction": label,
        "label": label,
        "confidence": conf,
    }


# ── Serve Frontend (production only) ─────────────────────
# When deployed, the Next.js static export lives in /app/static
STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")

if os.path.isdir(STATIC_DIR):
    # Serve Next.js _next assets
    app.mount("/_next", StaticFiles(directory=os.path.join(STATIC_DIR, "_next")), name="next_assets")

    # Serve other static files (favicon, etc.)
    @app.get("/favicon.ico")
    async def favicon():
        fav = os.path.join(STATIC_DIR, "favicon.ico")
        if os.path.isfile(fav):
            return FileResponse(fav)
        raise HTTPException(404)

    # SPA fallback — serve index.html for all non-API routes
    @app.get("/{path:path}")
    async def serve_spa(path: str):
        # Try exact file first (e.g., file.js, image.png)
        file_path = os.path.join(STATIC_DIR, path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise serve index.html (SPA)
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))
else:
    logger.info("No static directory found — running in API-only mode (local dev)")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

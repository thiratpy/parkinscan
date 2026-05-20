import io
import os
import time
import logging
import torch
import torch.nn as nn
from torchvision import transforms, models
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

model = None

def load_model():
    global model
    try:
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, len(LABELS))
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
    description="EfficientNet-based spiral/wave drawing analysis for Parkinson's disease screening",
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
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception:
        logger.error("Failed to read uploaded image")
        raise HTTPException(status_code=400, detail="Could not read the uploaded image")

    if model is None:
        logger.info(f"Mock prediction returned (model not loaded) in {(time.time()-start)*1000:.0f}ms")
        return {
            "prediction": "healthy",
            "label": "healthy",
            "confidence": 0.85,
            "mock": True,
            "message": "Model not loaded — returning mock result",
        }

    input_tensor = transform(image).unsqueeze(0).to(DEVICE)

    with torch.no_grad():
        output = model(input_tensor)
        probabilities = torch.softmax(output, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    label = LABELS[predicted.item()]
    conf = round(confidence.item(), 4)
    latency_ms = (time.time() - start) * 1000

    logger.info(f"Prediction: {label} | Confidence: {conf} | Latency: {latency_ms:.0f}ms | File: {file.filename}")

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

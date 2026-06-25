import io
import os
import time
import logging
import uuid
from datetime import datetime, timezone
from supabase import create_client, Client
import numpy as np
import cv2
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
from contextlib import asynccontextmanager
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
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

# ── Supabase ─────────────────────────────────────────────
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")
supabase_client: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("Supabase client initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize Supabase client: {e}")

def log_usage_to_supabase(endpoint: str, label: str, confidence: float, latency_ms: float, image_bytes: bytes, filename: str):
    if not supabase_client:
        return
    
    try:
        file_ext = filename.split(".")[-1] if "." in filename else "png"
        unique_filename = f"{uuid.uuid4()}.{file_ext}"
        
        supabase_client.storage.from_("mri-images").upload(
            file=image_bytes,
            path=unique_filename,
            file_options={"content-type": f"image/{file_ext}"}
        )
        
        image_url = supabase_client.storage.from_("mri-images").get_public_url(unique_filename)
        
        supabase_client.table("usage_logs").insert({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "endpoint": endpoint,
            "predicted_label": label,
            "confidence": confidence,
            "latency_ms": latency_ms,
            "image_url": image_url
        }).execute()
        logger.info(f"Successfully logged usage to Supabase: {unique_filename}")
        
    except Exception as e:
        logger.error(f"Failed to log usage to Supabase: {e}")


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

@app.get("/api/config")
async def get_config():
    return {
        "SUPABASE_URL": os.environ.get("NEXT_PUBLIC_SUPABASE_URL") or os.environ.get("SUPABASE_URL") or "",
        "SUPABASE_ANON_KEY": os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.environ.get("SUPABASE_ANON_KEY") or ""
    }

@app.post("/predict")
async def predict(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
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

    background_tasks.add_task(log_usage_to_supabase, "/predict", label, conf, latency_ms, contents, file.filename)

    return {
        "prediction": label,
        "label": label,
        "confidence": conf,
    }


def generate_gradcam(input_tensor, target_class):
    """Generate Grad-CAM heatmap for the given input and target class."""
    # Get the last conv layer from EfficientNet-B0 (timm): model.conv_head
    # Fallback to features[-1] if conv_head doesn't exist
    target_layer = None
    if hasattr(model, "conv_head"):
        target_layer = model.conv_head
    elif hasattr(model, "features"):
        target_layer = model.features[-1]
    else:
        return None

    activations = []
    gradients = []

    def forward_hook(module, inp, out):
        activations.append(out.detach())

    def backward_hook(module, grad_in, grad_out):
        gradients.append(grad_out[0].detach())

    fh = target_layer.register_forward_hook(forward_hook)
    bh = target_layer.register_full_backward_hook(backward_hook)

    try:
        output = model(input_tensor)
        model.zero_grad()
        target_score = output[0, target_class]
        target_score.backward()

        if not activations or not gradients:
            return None

        act = activations[0]  # (1, C, H, W)
        grad = gradients[0]   # (1, C, H, W)

        # Global average pool of gradients → channel weights
        weights = grad.mean(dim=(2, 3), keepdim=True)  # (1, C, 1, 1)
        cam = (weights * act).sum(dim=1, keepdim=True)  # (1, 1, H, W)
        cam = torch.relu(cam)
        cam = cam.squeeze().cpu().numpy()

        # Normalize to [0, 255]
        if cam.max() > 0:
            cam = cam / cam.max()
        cam = (cam * 255).astype(np.uint8)

        # Resize to 224x224
        cam = cv2.resize(cam, (224, 224))

        return cam
    except Exception as e:
        logger.warning(f"Grad-CAM computation failed: {e}")
        return None
    finally:
        fh.remove()
        bh.remove()


@app.post("/predict-gradcam")
async def predict_gradcam(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    """Prediction with Grad-CAM heatmap overlay."""
    start = time.time()

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file (PNG, JPEG, WebP)")

    try:
        contents = await file.read()
    except Exception:
        raise HTTPException(status_code=400, detail="Could not read the uploaded file")

    if model is None:
        return {
            "prediction": "healthy",
            "label": "healthy",
            "confidence": 0.85,
            "mock": True,
            "message": "Model not loaded — returning mock result",
        }

    # Preprocess
    image = crop_and_enhance_mri(contents)
    if image is None:
        try:
            image = Image.open(io.BytesIO(contents)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Could not decode the uploaded image")

    input_tensor = transform(image).unsqueeze(0).to(DEVICE)
    input_tensor.requires_grad_(True)

    # Forward pass (with gradients for Grad-CAM)
    output = model(input_tensor)
    probabilities = torch.softmax(output, dim=1)
    parkinson_prob = probabilities[0, 1].item()

    if parkinson_prob >= OPTIMAL_THRESHOLD:
        label = "parkinson"
        conf = round(parkinson_prob, 4)
        target_class = 1
    else:
        label = "healthy"
        conf = round(1.0 - parkinson_prob, 4)
        target_class = 0

    # Generate Grad-CAM
    heatmap_b64 = None
    cam = generate_gradcam(input_tensor.detach().clone().requires_grad_(True), target_class)
    if cam is not None:
        try:
            # Apply colormap
            heatmap_colored = cv2.applyColorMap(cam, cv2.COLORMAP_JET)

            # Get original image as numpy array (224x224)
            img_np = np.array(image.resize((224, 224)))
            if len(img_np.shape) == 2:
                img_np = cv2.cvtColor(img_np, cv2.COLOR_GRAY2BGR)
            elif img_np.shape[2] == 3:
                img_np = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

            # Blend: 60% original + 40% heatmap
            overlay = cv2.addWeighted(img_np, 0.6, heatmap_colored, 0.4, 0)

            # Encode to base64 PNG
            import base64
            _, buffer = cv2.imencode('.png', overlay)
            heatmap_b64 = "data:image/png;base64," + base64.b64encode(buffer).decode('utf-8')
        except Exception as e:
            logger.warning(f"Heatmap overlay failed: {e}")

    latency_ms = (time.time() - start) * 1000
    logger.info(f"Grad-CAM Prediction: {label} | Confidence: {conf} | P(parkinson): {parkinson_prob:.4f} | Latency: {latency_ms:.0f}ms | File: {file.filename}")

    background_tasks.add_task(log_usage_to_supabase, "/predict-gradcam", label, conf, latency_ms, contents, file.filename)

    result = {
        "prediction": label,
        "label": label,
        "confidence": conf,
    }
    if heatmap_b64:
        result["heatmap"] = heatmap_b64

    return result


@app.get("/ping-db")
async def ping_db():
    if not supabase_client:
        return {"status": "skipped", "message": "Supabase not configured"}
    try:
        # Just a lightweight query to keep DB alive
        supabase_client.table("usage_logs").select("timestamp").limit(1).execute()
        return {"status": "ok", "message": "Database pinged successfully"}
    except Exception as e:
        logger.error(f"Database ping failed: {e}")
        return {"status": "error", "message": str(e)}


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
        # Otherwise serve index.html (SPA) with NO CACHE headers
        return FileResponse(
            os.path.join(STATIC_DIR, "index.html"),
            headers={
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        )
else:
    logger.info("No static directory found — running in API-only mode (local dev)")


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

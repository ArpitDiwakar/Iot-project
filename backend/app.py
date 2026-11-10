"""
Multi-Class Animal Image Classification - FastAPI backend
=========================================================

Serves the trained MobileNetV2 transfer-learning model from the Colab notebook.

Preprocessing contract (mirrors the notebook's `predict_animal` function):
    PIL image -> convert("RGB") -> resize((180, 180)) -> float32 array (0..255)
    -> add batch dimension -> model.predict

The saved model already contains `Lambda(preprocess_input)` as its first layer,
so MobileNetV2 preprocessing is NOT applied again here.
"""

import hashlib
import io
import json
import logging
import os
import threading
import time
import urllib.request
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError

# Silence TensorFlow's verbose C++ logs (must be set before importing TF).
os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "2")

import tensorflow as tf  # noqa: E402
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input  # noqa: E402

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("animal-classifier")

# --------------------------------------------------------------------------
# Configuration (override with environment variables on Render)
# --------------------------------------------------------------------------
BASE_DIR = Path(__file__).resolve().parent

MODEL_PATH = Path(os.getenv("MODEL_PATH", BASE_DIR / "multiclass_animal_classifier.keras"))
LABELS_PATH = Path(os.getenv("LABELS_PATH", BASE_DIR / "animal_class_names.json"))

# Optional: download the model at startup if the file is not present
# (only needed if you decide NOT to commit the model to GitHub).
MODEL_URL = os.getenv("MODEL_URL", "").strip()
MODEL_SHA256 = os.getenv("MODEL_SHA256", "").strip().lower()  # optional integrity check

IMAGE_SIZE = (180, 180)  # IMAGE_SIZE used in the notebook
TOP_K = 3
MAX_UPLOAD_MB = float(os.getenv("MAX_UPLOAD_MB", "5"))
MAX_UPLOAD_BYTES = int(MAX_UPLOAD_MB * 1024 * 1024)
ALLOWED_CONTENT_TYPES = {"image/jpeg", "image/jpg", "image/png"}
ALLOWED_FORMATS = {"JPEG", "PNG"}

# Refuse absurdly large images (decompression-bomb protection).
Image.MAX_IMAGE_PIXELS = 50_000_000

# Local development origins. In production set ALLOWED_ORIGINS on Render, e.g.
#   ALLOWED_ORIGINS=https://your-username.github.io
DEFAULT_DEV_ORIGINS = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_origins_env = os.getenv("ALLOWED_ORIGINS", "").strip()
ALLOWED_ORIGINS = (
    [o.strip().rstrip("/") for o in _origins_env.split(",") if o.strip()]
    if _origins_env
    else DEFAULT_DEV_ORIGINS
)

# Same English display names as the notebook's Gradio cell.
ENGLISH_NAMES = {
    "cane": "Dog",
    "cavallo": "Horse",
    "elefante": "Elephant",
    "farfalla": "Butterfly",
    "gallina": "Chicken",
    "gatto": "Cat",
    "mucca": "Cow",
    "pecora": "Sheep",
    "ragno": "Spider",
    "scoiattolo": "Squirrel",
}

# --------------------------------------------------------------------------
# Model state
# --------------------------------------------------------------------------
class ModelState:
    model = None
    class_names: list = []
    load_error: str = ""


state = ModelState()
predict_lock = threading.Lock()  # keep inference thread-safe on small instances


def display_name(raw: str) -> str:
    """Italian folder name -> English display name (same logic as the notebook)."""
    return ENGLISH_NAMES.get(raw.lower(), raw.replace("_", " ").title())


def _sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def ensure_model_file() -> None:
    """Download the model if it is missing and MODEL_URL is configured."""
    if MODEL_PATH.exists():
        return
    if not MODEL_URL:
        raise FileNotFoundError(
            f"Model file not found at {MODEL_PATH}. Place "
            "'multiclass_animal_classifier.keras' in the backend folder, "
            "or set MODEL_URL to a direct-download link."
        )
    if not MODEL_URL.lower().startswith("https://"):
        raise ValueError("MODEL_URL must start with https://")

    logger.info("Model not found locally. Downloading from MODEL_URL ...")
    MODEL_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp_path = MODEL_PATH.with_suffix(".download")
    urllib.request.urlretrieve(MODEL_URL, tmp_path)

    if MODEL_SHA256 and _sha256(tmp_path) != MODEL_SHA256:
        tmp_path.unlink(missing_ok=True)
        raise ValueError("Downloaded model failed the SHA-256 integrity check.")
    tmp_path.replace(MODEL_PATH)
    logger.info("Model downloaded to %s", MODEL_PATH)


def load_everything() -> None:
    """Load class names and the Keras model. Order comes ONLY from the JSON file."""
    if not LABELS_PATH.exists():
        raise FileNotFoundError(f"Class-name file not found at {LABELS_PATH}")
    with open(LABELS_PATH, "r", encoding="utf-8") as f:
        class_names = json.load(f)
    if not isinstance(class_names, list) or not all(isinstance(c, str) for c in class_names):
        raise ValueError("animal_class_names.json must be a JSON list of strings.")

    ensure_model_file()

    # The model contains Lambda(preprocess_input). Keras 3 needs the function
    # supplied via custom_objects, and safe_mode=False to deserialize a Lambda
    # layer. This is safe here because the .keras file is YOUR OWN model;
    # never load model files from untrusted sources with safe_mode=False.
    custom_objects = {
        "preprocess_input": preprocess_input,
        "mobilenet_v2.preprocess_input": preprocess_input,
        "keras.applications.mobilenet_v2.preprocess_input": preprocess_input,
    }
    model = tf.keras.models.load_model(
        str(MODEL_PATH),
        custom_objects=custom_objects,
        compile=False,  # inference only; no optimizer/loss needed
        safe_mode=False,
    )

    output_units = model.output_shape[-1]
    if output_units != len(class_names):
        raise ValueError(
            f"Model outputs {output_units} classes but {LABELS_PATH.name} "
            f"lists {len(class_names)}."
        )
    input_shape = tuple(model.input_shape[1:3])
    if input_shape != IMAGE_SIZE:
        raise ValueError(f"Model expects {input_shape} input, backend uses {IMAGE_SIZE}.")

    # Warm-up so the first real request is fast.
    model.predict(np.zeros((1, *IMAGE_SIZE, 3), dtype=np.float32), verbose=0)

    state.model = model
    state.class_names = class_names
    state.load_error = ""
    logger.info("Model loaded. Classes (in model order): %s", class_names)


@asynccontextmanager
async def lifespan(_: FastAPI):
    try:
        load_everything()
    except Exception as exc:  # keep the server up so /health can report the problem
        state.load_error = f"{type(exc).__name__}: {exc}"
        logger.exception("Failed to load model")
    yield


app = FastAPI(
    title="Multi-Class Animal Image Classification API",
    description="MobileNetV2 transfer-learning classifier trained on Animals-10.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------
# Image handling
# --------------------------------------------------------------------------
def read_and_validate_image(data: bytes) -> Image.Image:
    """Validate the bytes really are a JPEG/PNG image and return an RGB PIL image."""
    try:
        with Image.open(io.BytesIO(data)) as probe:
            if probe.format not in ALLOWED_FORMATS:
                raise HTTPException(
                    status_code=415, detail="Unsupported image format. Use JPG, JPEG or PNG."
                )
            probe.verify()  # detects truncated/corrupt files
        image = Image.open(io.BytesIO(data))  # verify() invalidates the handle; reopen
        image.load()
    except HTTPException:
        raise
    except Image.DecompressionBombError:
        raise HTTPException(status_code=413, detail="Image dimensions are too large.")
    except (UnidentifiedImageError, OSError, SyntaxError, ValueError):
        raise HTTPException(
            status_code=400, detail="The file is not a valid or readable image."
        )
    return image.convert("RGB")


def preprocess_for_model(image: Image.Image) -> np.ndarray:
    """Exactly the notebook's steps. No extra MobileNetV2 preprocessing here."""
    image = image.resize(IMAGE_SIZE)
    arr = np.array(image, dtype=np.float32)  # values stay in 0..255
    return np.expand_dims(arr, axis=0)  # shape (1, 180, 180, 3)


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.get("/")
def root():
    return {
        "name": "Multi-Class Animal Image Classification API",
        "status": "running",
        "model_loaded": state.model is not None,
        "endpoints": {"health": "GET /health", "predict": "POST /predict (multipart field 'file')"},
        "docs": "/docs",
    }


@app.get("/health")
def health():
    loaded = state.model is not None
    body = {
        "status": "ok" if loaded else "model_not_loaded",
        "model_loaded": loaded,
        "num_classes": len(state.class_names),
        "classes": [display_name(c) for c in state.class_names],
    }
    if not loaded and state.load_error:
        body["error"] = state.load_error
    return body


@app.post("/predict")
def predict(file: UploadFile = File(...)):
    # Plain `def` so FastAPI runs this in a worker thread (inference is CPU-bound).
    if state.model is None:
        raise HTTPException(status_code=503, detail="Model is not loaded on the server.")

    if (file.content_type or "").lower() not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=415, detail="Invalid file type. Please upload a JPG, JPEG or PNG image."
        )

    # Read at most MAX_UPLOAD_BYTES + 1 so oversized files are rejected cheaply.
    data = file.file.read(MAX_UPLOAD_BYTES + 1)
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413, detail=f"File too large. Maximum size is {MAX_UPLOAD_MB:g} MB."
        )

    image = read_and_validate_image(data)
    batch = preprocess_for_model(image)

    try:
        started = time.perf_counter()
        with predict_lock:
            probabilities = state.model.predict(batch, verbose=0)[0]
        elapsed_ms = round((time.perf_counter() - started) * 1000)
    except Exception:
        logger.exception("Prediction failed")
        raise HTTPException(status_code=500, detail="Prediction failed on the server.")

    top_indices = np.argsort(probabilities)[::-1][:TOP_K]
    predictions = [
        {
            "animal": display_name(state.class_names[int(i)]),
            "confidence": float(probabilities[int(i)]),
        }
        for i in top_indices
    ]
    return {"predictions": predictions, "inference_ms": elapsed_ms}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="127.0.0.1", port=int(os.getenv("PORT", "8000")), reload=False)

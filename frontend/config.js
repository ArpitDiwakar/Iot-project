/*
 * Frontend configuration.
 * After deploying the backend on Render, change API_BASE_URL to your Render URL
 * (no trailing slash), e.g. "https://animal-classifier-api.onrender.com".
 */
window.APP_CONFIG = {
  // Local development: FastAPI started with `python app.py` or uvicorn.
  API_BASE_URL: "http://127.0.0.1:8000",

  // Keep in sync with MAX_UPLOAD_MB in backend/app.py (default 5).
  MAX_FILE_SIZE_MB: 5,

  // Render's free plan can take ~1 minute to wake up after being idle.
  REQUEST_TIMEOUT_MS: 90000,

  // Contact section. Fill in what you want to show; empty values are hidden.
  CONTACT: {
    studentName: "",
    email: "",
    github: "",   // e.g. "https://github.com/your-username/Animal-Image-Classification"
    linkedin: ""  // e.g. "https://www.linkedin.com/in/your-profile"
  }
};

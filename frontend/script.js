/* =============================================================
   AnimalLens AI - frontend logic
   All predictions come from the FastAPI backend (POST /predict).
   Nothing is simulated in the browser.
   ============================================================= */
(function () {
  "use strict";

  const CFG = Object.assign(
    {
      API_BASE_URL: "http://127.0.0.1:8000",
      MAX_FILE_SIZE_MB: 5,
      REQUEST_TIMEOUT_MS: 90000,
      CONTACT: {},
    },
    window.APP_CONFIG || {}
  );
  const API = String(CFG.API_BASE_URL).replace(/\/+$/, "");
  const MAX_BYTES = CFG.MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_TYPES = ["image/jpeg", "image/png"];
  const ALLOWED_EXT = ["jpg", "jpeg", "png"];

  const $ = (id) => document.getElementById(id);

  /* ---------------- Static content ---------------- */
  const ANIMALS = [
    { name: "Dog", emoji: "🐶", img: "dog", color: "#3b3a8f", text: "Loyal, social companions that come in hundreds of breeds, from tiny terriers to large shepherds." },
    { name: "Horse", emoji: "🐴", img: "horse", color: "#6b3f2e", text: "Strong, fast grazing animals used for riding, farm work and sport." },
    { name: "Elephant", emoji: "🐘", img: "elephant", color: "#37556b", text: "The largest land animal, easy to spot by its trunk, tusks and big ears." },
    { name: "Butterfly", emoji: "🦋", img: "butterfly", color: "#5a3b86", text: "Insects with large coloured wings that begin life as caterpillars." },
    { name: "Chicken", emoji: "🐔", img: "chicken", color: "#8a4b2a", text: "Farm birds kept for eggs and meat, with feathers, a comb and a beak." },
    { name: "Cat", emoji: "🐱", img: "cat", color: "#2f5f66", text: "Agile pets with whiskers, sharp claws and excellent night vision." },
    { name: "Cow", emoji: "🐄", img: "cow", color: "#3d6240", text: "Domestic cattle raised for milk, meat and farm work." },
    { name: "Sheep", emoji: "🐑", img: "sheep", color: "#4a5a7a", text: "Woolly farm animals raised for wool, milk and meat." },
    { name: "Spider", emoji: "🕷️", img: "spider", color: "#4b2f58", text: "Eight-legged arachnids that spin silk webs to catch insects." },
    { name: "Squirrel", emoji: "🐿️", img: "squirrel", color: "#7a4a24", text: "Bushy-tailed rodents that climb trees and bury nuts for winter." },
  ];

  const TECH = [
    { ico: "Py", name: "Python", role: "Backend language" },
    { ico: "TF", name: "TensorFlow", role: "Deep learning framework" },
    { ico: "Ke", name: "Keras", role: "Model building API" },
    { ico: "M2", name: "MobileNetV2", role: "Pretrained CNN base" },
    { ico: "Fa", name: "FastAPI", role: "Prediction API" },
    { ico: "H5", name: "HTML", role: "Page structure" },
    { ico: "C3", name: "CSS", role: "Styling and layout" },
    { ico: "JS", name: "JavaScript", role: "Interactivity and Fetch" },
    { ico: "Co", name: "Google Colab", role: "Model training" },
    { ico: "Ka", name: "Kaggle Animals-10", role: "Training dataset" },
  ];

  /* ---------------- Navigation ---------------- */
  const navToggle = $("nav-toggle");
  const navLinks = $("nav-links");

  function closeNav() {
    navLinks.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open menu");
  }
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeNav));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeNav(); });

  // Highlight the nav link of the section currently in view.
  const sectionLinks = new Map();
  navLinks.querySelectorAll("a").forEach((a) => sectionLinks.set(a.getAttribute("href").slice(1), a));
  if ("IntersectionObserver" in window) {
    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          sectionLinks.forEach((link) => link.classList.remove("active"));
          const link = sectionLinks.get(entry.target.id);
          if (link) link.classList.add("active");
        });
      },
      { rootMargin: "-45% 0px -50% 0px" }
    );
    sectionLinks.forEach((_, id) => { const el = $(id); if (el) spy.observe(el); });
  }

  /* ---------------- Build static sections ---------------- */
  const catGrid = $("cat-grid");
  ANIMALS.forEach((a) => {
    const card = document.createElement("article");
    card.className = "cat-card";

    const media = document.createElement("div");
    media.className = "cat-media";
    media.style.background = `linear-gradient(145deg, ${a.color}, #0e1530)`;
    media.textContent = a.emoji; // fallback visual

    // Optional real photo: put frontend/images/<name>.jpg to replace the emoji tile.
    const img = new Image();
    img.alt = a.name;
    img.loading = "lazy";
    img.src = `images/${a.img}.jpg`;
    img.addEventListener("load", () => { media.textContent = ""; media.appendChild(img); });

    const body = document.createElement("div");
    body.className = "cat-body";
    const h = document.createElement("h3"); h.textContent = a.name;
    const p = document.createElement("p"); p.textContent = a.text;
    body.append(h, p);

    card.append(media, body);
    catGrid.appendChild(card);
  });

  const techGrid = $("tech-grid");
  TECH.forEach((t) => {
    const li = document.createElement("li");
    const ico = document.createElement("span"); ico.className = "tech-ico"; ico.textContent = t.ico; ico.setAttribute("aria-hidden", "true");
    const wrap = document.createElement("div");
    const n = document.createElement("div"); n.className = "tech-name"; n.textContent = t.name;
    const r = document.createElement("div"); r.className = "tech-role"; r.textContent = t.role;
    wrap.append(n, r);
    li.append(ico, wrap);
    techGrid.appendChild(li);
  });

  // Contact section (only shows details you configured in config.js)
  (function renderContact() {
    const c = CFG.CONTACT || {};
    if (c.studentName) $("contact-name").textContent = c.studentName;
    const box = $("contact-links");
    const add = (label, href, primary) => {
      const a = document.createElement("a");
      a.className = "btn btn-sm " + (primary ? "btn-primary" : "btn-ghost");
      a.textContent = label;
      a.href = href;
      if (href.startsWith("https://")) { a.target = "_blank"; a.rel = "noopener noreferrer"; }
      box.appendChild(a);
    };
    if (c.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email)) add("Email", "mailto:" + c.email, true);
    if (typeof c.github === "string" && c.github.startsWith("https://")) add("GitHub", c.github, false);
    if (typeof c.linkedin === "string" && c.linkedin.startsWith("https://")) add("LinkedIn", c.linkedin, false);
  })();

  $("year").textContent = new Date().getFullYear();
  $("max-size-label").textContent = String(CFG.MAX_FILE_SIZE_MB);

  /* ---------------- Scroll reveal (respects reduced motion) ---------------- */
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.documentElement.classList.add("reveal-ready");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".section-head, .cat-card, .steps li").forEach((el) => io.observe(el));
  }

  /* ---------------- API status ---------------- */
  const apiDot = $("api-dot");
  const apiText = $("api-status-text");

  function setStatus(kind, text) {
    apiDot.className = "dot " + kind;
    apiText.textContent = text;
  }

  async function checkHealth() {
    setStatus("wait", "Checking server…");
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(API + "/health", { signal: ctrl.signal });
      const data = await res.json();
      if (res.ok && data.model_loaded) {
        setStatus("ok", "Model server online. Ready to classify.");
        return true;
      }
      setStatus("bad", "Server is running but the model is not loaded.");
    } catch (err) {
      setStatus("bad", "Server not reachable. It may be starting up. Try again in a minute.");
    } finally {
      clearTimeout(timer);
    }
    return false;
  }
  checkHealth();
  $("api-status").addEventListener("click", checkHealth);
  $("api-status").style.cursor = "pointer";
  $("api-status").title = "Click to re-check the server";

  /* ---------------- Upload handling ---------------- */
  const dropzone = $("dropzone");
  const fileInput = $("file-input");
  const dzEmpty = $("dz-empty");
  const dzPreview = $("dz-preview");
  const previewImg = $("preview-img");
  const fileNameEl = $("file-name");
  const fileSizeEl = $("file-size");
  const errorBox = $("error-box");
  const errorText = $("error-text");
  const predictBtn = $("predict-btn");
  const changeBtn = $("change-btn");
  const removeBtn = $("remove-btn");
  const resetBtn = $("reset-btn");

  let selectedFile = null;
  let previewUrl = null;
  let busy = false;

  function showError(msg) { errorText.textContent = msg; errorBox.hidden = false; }
  function clearError() { errorBox.hidden = true; errorText.textContent = ""; }

  function formatSize(bytes) {
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  }

  function validateFile(file) {
    const ext = (file.name.split(".").pop() || "").toLowerCase();
    const typeOk = ALLOWED_TYPES.includes(file.type) || (file.type === "" && ALLOWED_EXT.includes(ext));
    if (!typeOk || !ALLOWED_EXT.includes(ext)) return "Invalid file type. Please choose a JPG, JPEG or PNG image.";
    if (file.size === 0) return "This file is empty. Please choose another image.";
    if (file.size > MAX_BYTES) return `File too large (${formatSize(file.size)}). The maximum size is ${CFG.MAX_FILE_SIZE_MB} MB.`;
    return null;
  }

  function setFile(file) {
    clearError();
    const problem = validateFile(file);
    if (problem) { showError(problem); return; }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    selectedFile = file;
    previewUrl = URL.createObjectURL(file);
    previewImg.src = previewUrl;
    fileNameEl.textContent = file.name;
    fileSizeEl.textContent = formatSize(file.size);
    dzEmpty.hidden = true;
    dzPreview.hidden = false;
    dropzone.classList.add("has-image");
    changeBtn.hidden = false;
    removeBtn.hidden = false;
    showResultState("empty");
  }

  function clearFile() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = null;
    selectedFile = null;
    fileInput.value = "";
    previewImg.removeAttribute("src");
    dzEmpty.hidden = false;
    dzPreview.hidden = true;
    dropzone.classList.remove("has-image");
    changeBtn.hidden = true;
    removeBtn.hidden = true;
  }

  function openPicker() { if (!busy) fileInput.click(); }

  $("browse-btn").addEventListener("click", (e) => { e.stopPropagation(); openPicker(); });
  dropzone.addEventListener("click", () => { if (!selectedFile) openPicker(); });
  dropzone.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && !selectedFile) { e.preventDefault(); openPicker(); }
  });
  fileInput.addEventListener("change", () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });

  ["dragenter", "dragover"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); if (!busy) dropzone.classList.add("drag"); })
  );
  ["dragleave", "drop"].forEach((evt) =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove("drag"); })
  );
  dropzone.addEventListener("drop", (e) => {
    if (busy) return;
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) setFile(file);
  });
  // Stop the browser from opening a file that is dropped outside the dropzone.
  ["dragover", "drop"].forEach((evt) => window.addEventListener(evt, (e) => e.preventDefault()));

  changeBtn.addEventListener("click", openPicker);
  removeBtn.addEventListener("click", () => { clearFile(); clearError(); showResultState("empty"); });
  resetBtn.addEventListener("click", () => { if (busy) return; clearFile(); clearError(); showResultState("empty"); });

  /* ---------------- Result states ---------------- */
  const stateEls = { empty: $("result-empty"), loading: $("result-loading"), content: $("result-content") };
  function showResultState(name) {
    Object.entries(stateEls).forEach(([key, el]) => { el.hidden = key !== name; });
  }

  function renderResult(predictions, inferenceMs) {
    const top = predictions[0];
    $("top-name").textContent = top.animal;
    $("top-conf").textContent = (top.confidence * 100).toFixed(1) + "%";

    const low = $("low-note");
    if (top.confidence < 0.5) {
      low.textContent = "The model is not very sure about this image. It may show something outside the 10 supported animals, or the animal may be hard to see.";
      low.hidden = false;
    } else {
      low.hidden = true;
    }

    const bars = $("bars");
    bars.textContent = "";
    predictions.forEach((p, i) => {
      const pct = Math.max(0, Math.min(100, p.confidence * 100));
      const li = document.createElement("li");
      li.className = "bar-row rank-" + (i + 1);

      const head = document.createElement("div");
      head.className = "bar-head";
      const name = document.createElement("span"); name.textContent = `${i + 1}. ${p.animal}`;
      const val = document.createElement("span"); val.className = "pct"; val.textContent = pct.toFixed(1) + "%";
      head.append(name, val);

      const track = document.createElement("div");
      track.className = "bar-track";
      track.setAttribute("role", "progressbar");
      track.setAttribute("aria-valuemin", "0");
      track.setAttribute("aria-valuemax", "100");
      track.setAttribute("aria-valuenow", pct.toFixed(1));
      track.setAttribute("aria-label", `${p.animal} confidence`);
      const fill = document.createElement("div"); fill.className = "bar-fill";
      track.appendChild(fill);

      li.append(head, track);
      bars.appendChild(li);
      // Animate after insertion.
      requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.width = pct.toFixed(2) + "%"; }));
    });

    $("result-foot").textContent =
      (typeof inferenceMs === "number" ? `Inference time on server: ${inferenceMs} ms. ` : "") +
      "Confidence is the model's own probability estimate and is not a guarantee.";
    showResultState("content");
  }

  /* ---------------- Prediction request ---------------- */
  function setBusy(isBusy) {
    busy = isBusy;
    predictBtn.disabled = isBusy;
    predictBtn.classList.toggle("loading", isBusy);
    predictBtn.querySelector(".btn-label").textContent = isBusy ? "Predicting…" : "Predict Animal";
    [changeBtn, removeBtn, resetBtn].forEach((b) => { b.disabled = isBusy; });
  }

  function parsePredictions(data) {
    if (!data || !Array.isArray(data.predictions) || data.predictions.length === 0) return null;
    const list = data.predictions.map((p) => ({ animal: String(p.animal), confidence: Number(p.confidence) }));
    return list.every((p) => p.animal && Number.isFinite(p.confidence)) ? list : null;
  }

  async function predict() {
    clearError();
    if (busy) return;
    if (!selectedFile) { showError("No image selected. Please upload an animal image first."); return; }
    const problem = validateFile(selectedFile);
    if (problem) { showError(problem); return; }

    setBusy(true);
    showResultState("loading");
    const note = $("loading-note");
    note.textContent = "The model is looking at your image.";
    const slowTimer = setTimeout(() => {
      note.textContent = "Still working. Free hosting can take up to a minute to wake up after being idle.";
    }, 7000);

    const form = new FormData();
    form.append("file", selectedFile, selectedFile.name);

    const ctrl = new AbortController();
    const abortTimer = setTimeout(() => ctrl.abort(), CFG.REQUEST_TIMEOUT_MS);

    try {
      const res = await fetch(API + "/predict", { method: "POST", body: form, signal: ctrl.signal });

      let data = null;
      try { data = await res.json(); } catch (_) { /* non-JSON response */ }

      if (!res.ok) {
        let msg = "Prediction failed. Please try again.";
        if (data && typeof data.detail === "string") msg = data.detail;
        else if (res.status === 422) msg = "The server could not read the uploaded file. Please try another image.";
        else if (res.status >= 500) msg = "The server had a problem while predicting. Please try again shortly.";
        throw new Error(msg);
      }

      const predictions = parsePredictions(data);
      if (!predictions) throw new Error("The server sent an unexpected response. Please try again.");

      renderResult(predictions, data.inference_ms);
      setStatus("ok", "Model server online. Ready to classify.");
    } catch (err) {
      showResultState("empty");
      if (err.name === "AbortError") {
        showError("The request timed out. The server may be waking up. Please wait a moment and try again.");
        setStatus("bad", "Server did not respond in time.");
      } else if (err instanceof TypeError) {
        // fetch() rejects with TypeError for network errors and blocked CORS requests.
        showError("Cannot reach the prediction server. Check that the backend is running and that API_BASE_URL in config.js is correct.");
        setStatus("bad", "Server not reachable.");
      } else {
        showError(err.message || "Prediction failed. Please try again.");
      }
    } finally {
      clearTimeout(slowTimer);
      clearTimeout(abortTimer);
      setBusy(false);
    }
  }

  predictBtn.addEventListener("click", predict);
})();

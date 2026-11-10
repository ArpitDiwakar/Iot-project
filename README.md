# Multi-Class Animal Image Classification

B.Tech CSE Project, Invertis University.
Upload an animal photo and a MobileNetV2 transfer-learning model (TensorFlow/Keras) predicts which of 10 animals it shows. The website is plain HTML/CSS/JavaScript and talks to a FastAPI backend that runs your trained model.

**Classes (from the Animals-10 dataset):** Dog, Horse, Elephant, Butterfly, Chicken, Cat, Cow, Sheep, Spider, Squirrel.

## Project structure

```
Animal-Image-Classification/
├── .github/workflows/pages.yml      # publishes frontend/ to GitHub Pages
├── frontend/
│   ├── index.html
│   ├── style.css
│   ├── script.js
│   ├── config.js                    # API URL + contact details (edit this)
│   └── images/                      # optional animal photos
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   ├── animal_class_names.json
│   └── multiclass_animal_classifier.keras   # YOU add this file
├── .gitignore
└── README.md
```

## What was taken from your notebook

| Item | Value in notebook | How the backend uses it |
|---|---|---|
| Input size | 180 × 180 | `IMAGE_SIZE = (180, 180)` |
| Preprocessing | `Lambda(preprocess_input)` is **inside** the model | Backend sends raw 0–255 `float32` pixels and does **not** preprocess again |
| Inference steps | `convert("RGB").resize(IMAGE_SIZE)`, `np.array(dtype=float32)`, `expand_dims`, `model.predict` | Same steps in `preprocess_for_model()` |
| Labels | `animal_class_names.json` holds Italian folder names (`cane`, `gatto`, ...) in alphabetical order | Order is read **only** from the JSON; the same Italian-to-English map as your Gradio cell is used for display |
| Output | softmax over 10 classes | Top 3 returned by `np.argsort` |

The numbers shown on the site (26,179 images, 20,944 train / 5,235 validation, 2,270,794 parameters, 95.59% validation accuracy) are copied from your notebook's printed output. Nothing was invented.

## Step 1: Add your model file

1. Run the last notebook cell in Colab (`files.download(MODEL_PATH)`) to download `multiclass_animal_classifier.keras` and `animal_class_names.json`.
2. Copy `multiclass_animal_classifier.keras` into the `backend` folder.
3. The `animal_class_names.json` included here matches the class list printed in your notebook. If your downloaded file differs, **replace it with yours**.

The model is about 8.7 MB, far below GitHub's 100 MB file limit, so you can commit it to the repository normally. No external hosting is needed.

If you ever retrain a larger model, you can instead upload it to a private host that gives a direct HTTPS link and set `MODEL_URL` (and optionally `MODEL_SHA256`) as Render environment variables. The backend downloads it on startup if the file is missing.

## Step 2: Run locally in VS Code (Windows PowerShell)

Install **Python 3.11 or 3.12** (check with `py --version`). Open the `Animal-Image-Classification` folder in VS Code, then open a terminal (Terminal → New Terminal, PowerShell).

### Backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

If PowerShell blocks the activate script, run this once and try again:

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

```powershell
python -m pip install --upgrade pip
pip install -r requirements.txt
python app.py
```

The first start takes a while because TensorFlow loads. When you see `Model loaded. Classes (in model order): [...]` the API is ready at `http://127.0.0.1:8000`.

Check it in a **second** terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/health
curl.exe -X POST -F "file=@C:\path\to\dog.jpg" http://127.0.0.1:8000/predict
```

Interactive API docs are at `http://127.0.0.1:8000/docs`.

### Frontend

In a new terminal:

```powershell
cd frontend
python -m http.server 5500
```

Open **http://127.0.0.1:5500** (or `http://localhost:5500`). Both are already allowed by the backend's local CORS list. The VS Code "Live Server" extension (port 5500) also works.

`frontend/config.js` already points to `http://127.0.0.1:8000`. Upload an image and press **Predict Animal**.

## Step 3: Deploy the backend on Render

1. Push the project to GitHub (see Step 4, parts 1 to 2). Make sure `backend/multiclass_animal_classifier.keras` is committed.
2. On [render.com](https://render.com) choose **New → Web Service** and connect your repository.
3. Settings:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
4. Environment variables:

   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.9` |
   | `ALLOWED_ORIGINS` | `https://YOUR-GITHUB-USERNAME.github.io` |

   `ALLOWED_ORIGINS` is the site **origin only**: no path and no trailing slash (not `.../Animal-Image-Classification`). Separate several origins with commas.
5. Deploy. When the log shows `Model loaded`, open `https://YOUR-SERVICE.onrender.com/health`. It should show `"model_loaded": true`.

Things to know about Render:

- **Free plan sleeps** after inactivity, so the first request can take about a minute. The website already shows a "still working" message and waits up to 90 seconds.
- **Memory:** TensorFlow is heavy and the free plan has 512 MB of RAM. If the deploy log shows the service was killed for running out of memory, upgrade the instance type.
- No secrets are needed. Do not add Kaggle tokens or any credentials to GitHub or Render; they are only used in Colab (through Colab Secrets) for training.

## Step 4: Deploy the frontend on GitHub Pages

1. **Create the repository** on GitHub (for example `Animal-Image-Classification`), without a README.
2. **Upload the project** from the project root in PowerShell:

   ```powershell
   git init
   git add .
   git commit -m "Animal image classification website"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/Animal-Image-Classification.git
   git push -u origin main
   ```
3. **Set the API URL.** Edit `frontend/config.js`:

   ```js
   API_BASE_URL: "https://YOUR-SERVICE.onrender.com",
   ```

   (no trailing slash), then fill in `CONTACT` if you want it shown, and commit and push again.
4. **Enable Pages:** repository **Settings → Pages → Build and deployment → Source: GitHub Actions**. The included workflow publishes the `frontend` folder whenever you push to `main`. Check progress in the **Actions** tab.
5. Your site will be at `https://YOUR-USERNAME.github.io/Animal-Image-Classification/`.

## Step 5: Test the deployed site

1. Open `https://YOUR-SERVICE.onrender.com/health` and wait until it returns `model_loaded: true` (this also wakes the free server).
2. Open your GitHub Pages URL. The status badge above the classifier should say **Model server online**.
3. Upload a clear photo of one of the 10 animals and press **Predict Animal**. You should see the top 3 predictions.
4. If the badge says the server is not reachable, open the browser console (F12) and see Troubleshooting.

## Troubleshooting

| Problem | Likely cause and fix |
|---|---|
| Browser console shows a CORS error | `ALLOWED_ORIGINS` on Render does not exactly match your Pages origin (`https://username.github.io`). Fix it and redeploy. |
| `/health` shows `model_not_loaded` and an `error` | Read the message. A missing file means the `.keras` file was not committed to `backend/`. |
| Error mentioning `Lambda` or `preprocess_input` while loading | Keep `tensorflow-cpu==2.21.0` (the version used in Colab). Keras files with Lambda layers are sensitive to version changes. |
| `Model outputs N classes but ... lists M` | The `.keras` file and `animal_class_names.json` are from different training runs. Use the pair saved together. |
| Request times out on the first try | Free Render instance was asleep. Wait a minute and press Predict again. |
| `pip` cannot find `tensorflow-cpu==2.21.0` | Replace that line in `requirements.txt` with `tensorflow==2.21.0`. |

## Notes and limitations

- `app.py` loads the model with `safe_mode=False`, which Keras requires for models that contain a Lambda layer. This is safe for your own model file. Never load a `.keras` file from an untrusted source this way.
- The model only knows the 10 Animals-10 classes. A photo of anything else is still assigned to one of them, so the interface shows a low-confidence warning below 50%.
- Predictions come only from `model.predict()` on the server. The frontend never generates results itself.

## Credits

Dataset: [Animals-10 on Kaggle](https://www.kaggle.com/datasets/alessiocorrado99/animals10). Model: MobileNetV2 (ImageNet weights) with a new classification head, trained in Google Colab.

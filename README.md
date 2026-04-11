# 🎬 CineMatch

> *Stop scrolling. Start watching.*

An ML-powered Netflix recommendation engine that actually understands what you're looking for — not just the genre you're stuck in.

---

## ✦ What It Does

Type any show or movie. Get 10 recommendations that match the **vibe**, not just the label.

Unlike a simple genre filter, CineMatch uses a hybrid model that crosses genre lines when the narrative, tone, or themes are similar — because that's how humans actually recommend things.

---

## ⚡ Live

| | |
|---|---|
| 🌐 **App** | [netflix-show-recommender-3ltsta73g.vercel.app](https://netflix-show-recommender-3ltsta73g.vercel.app) |
| 🤗 **API** | [ishitakapoor-netflix-recommender.hf.space](https://ishitakapoor-netflix-recommender.hf.space) |
| 📖 **API Docs** | [/docs](https://ishitakapoor-netflix-recommender.hf.space/docs) |

> ⚠️ Backend runs on HuggingFace free tier — first request after 48h inactivity takes ~1-2 min to wake up. Worth the wait.

---

## 🧠 The Model

Three signals. One recommendation.

```
TF-IDF on genre labels      ──── weight 0.30  ████████░░░░░░░░░░░░
Sentence-BERT on description ─── weight 0.50  ████████████░░░░░░░░
Scaled metadata              ─── weight 0.20  █████░░░░░░░░░░░░░░░
```

All three are concatenated into a weighted hybrid matrix. KNN with cosine similarity finds the 50 closest matches, served in pages of 10.

**Why not just TF-IDF?**

| Metric | TF-IDF Baseline | Hybrid Model |
|---|---|---|
| Genre Accuracy | 89.3% | 67.7% |
| Diversity Distance | 0.0046 | **0.4417** |

The 22% accuracy drop is intentional. A model that only returns the same genre isn't recommending — it's filtering. The hybrid finds shows that *feel* similar, not just ones with the same label.

---

## 🏗️ Architecture

```
You
 │
 ▼
Vercel (Next.js frontend)
 │
 ▼
HuggingFace Spaces (FastAPI + Docker)
 │
 ├── title in 2021 dataset? ──→ KNN on local hybrid matrix
 │
 └── title not found? ────────→ TMDB API (live fetch)
                                 └──→ build feature vector on the fly
                                      └──→ query same KNN index
```

---

## 🛠️ Stack

| Layer | Tech |
|---|---|
| **Frontend** | Next.js 16 · React 19 · Tailwind CSS · Framer Motion |
| **Backend** | Python · FastAPI · uvicorn |
| **ML** | scikit-learn · Sentence-BERT · TF-IDF · KNN |
| **Deployment** | Vercel (frontend) · HuggingFace Spaces Docker (backend) |
| **External** | TMDB API — posters + metadata for post-2021 titles |

---

## 📁 Structure

```
netflix-recommender/
├── index.html                 ← project showcase page
├── backend/
│   ├── main.py                ← FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── models/
│       ├── knn_hybrid.pkl     ← trained KNN
│       ├── hybrid_features.npy
│       ├── tfidf_vectorizer.pkl
│       ├── ohe.pkl
│       ├── scaler.pkl
│       ├── titles_meta.pkl
│       └── titles.json
└── frontend/
    ├── app/
    │   ├── page.js            ← entire UI
    │   ├── layout.js
    │   └── globals.css
    └── hooks/
        └── use-outside-click.js
```

---

## 🚀 Run Locally

**Backend**
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --reload
# → http://127.0.0.1:8000
```

**Frontend**
```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

Add a `.env` file in `/backend`:
```
TMDB_API_KEY=your_key_here
```

---

## 📊 Dataset

[Netflix Movies and TV Shows — Kaggle](https://www.kaggle.com/datasets/shivamb/netflix-shows) · ~8,800 titles · data up to 2021

---

## 👤 Author

**Ishita Kapoor** · VIT Vellore '26

*Powered by TMDB API *

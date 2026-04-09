from dotenv import load_dotenv
import os
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), '.env'))

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sklearn.preprocessing import normalize
import numpy as np
import pandas as pd
import pickle, json, requests

app = FastAPI()  

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Lazy load on first request ───────────────────────────────────────────────
models_loaded = False
knn_hybrid = hybrid_features = tfidf_vectorizer = ohe = scaler = meta = all_titles = tmdb_config = sbert = None

def load_models():
    global models_loaded, knn_hybrid, hybrid_features, tfidf_vectorizer
    global ohe, scaler, meta, all_titles, tmdb_config, sbert
    
    if models_loaded:
        return
    
    print("Loading models...")
    import pickle, json
    import numpy as np
    
    with open("models/knn_hybrid.pkl", "rb") as f:
        knn_hybrid = pickle.load(f)
    hybrid_features = np.load("models/hybrid_features.npy")
    with open("models/tfidf_vectorizer.pkl", "rb") as f:
        tfidf_vectorizer = pickle.load(f)
    with open("models/ohe.pkl", "rb") as f:
        ohe = pickle.load(f)
    with open("models/scaler.pkl", "rb") as f:
        scaler = pickle.load(f)
    with open("models/titles_meta.pkl", "rb") as f:
        meta = pickle.load(f)
    with open("models/titles.json") as f:
        all_titles = json.load(f)
    with open("tmdb_config.json") as f:
        tmdb_config = json.load(f)
    
    from sentence_transformers import SentenceTransformer
    sbert = SentenceTransformer("all-MiniLM-L6-v2")
    
    global GENRE_MAP_MOVIE, GENRE_MAP_TV
    GENRE_MAP_MOVIE = {int(k): v for k, v in tmdb_config["genre_map_movie"].items()}
    GENRE_MAP_TV    = {int(k): v for k, v in tmdb_config["genre_map_tv"].items()}
    
    models_loaded = True
    print("✅ All models loaded")

TMDB_API_KEY    = os.environ.get("TMDB_API_KEY", "")
TMDB_BASE       = "https://api.themoviedb.org/3"
W_GENRE    = 0.30
W_SEMANTIC = 0.50
W_METADATA = 0.20

# These get set inside load_models() but need to exist globally
GENRE_MAP_MOVIE = {}
GENRE_MAP_TV    = {}


def fetch_from_tmdb(title: str):
    try:
        r = requests.get(f"{TMDB_BASE}/search/multi", params={
            "api_key": TMDB_API_KEY, "query": title,
            "language": "en-US", "page": 1
        }, timeout=8)
        results = [x for x in r.json().get("results", [])
                   if x.get("media_type") in ("movie", "tv")]
        if not results:
            return None

        hit        = results[0]
        media_type = hit.get("media_type", "movie")
        genre_map  = GENRE_MAP_TV if media_type == "tv" else GENRE_MAP_MOVIE
        genres     = ", ".join([genre_map[g] for g in hit.get("genre_ids", [])
                                if g in genre_map]) or "Unknown"
        date_str   = hit.get("release_date") or hit.get("first_air_date") or "0"
        year       = int(date_str[:4]) if date_str[:4].isdigit() else 0

        return {
            "title":            hit.get("title") or hit.get("name", title),
            "description":      hit.get("overview") or "No description available.",
            "listed_in":        genres,
            "type":             "TV Show" if media_type == "tv" else "Movie",
            "rating":           "Unknown",
            "release_year":     year,
            "duration_numeric": 0,
            "year_added":       0,
            "month_added":      0,
        }
    except Exception:
        return None


def build_vector(row: dict):
    genre_vec    = normalize(tfidf_vectorizer.transform([row["listed_in"]]).toarray())
    desc_vec     = sbert.encode([row["description"]], normalize_embeddings=True,
                                convert_to_numpy=True)
    meta_ohe     = normalize(ohe.transform([[row["type"], row["rating"]]]))
    meta_numeric = normalize(scaler.transform([[
        row["release_year"], row["year_added"],
        row["month_added"], row["duration_numeric"]
    ]]))
    meta_vec = np.hstack([meta_ohe, meta_numeric])
    return np.hstack([genre_vec * W_GENRE, desc_vec * W_SEMANTIC, meta_vec * W_METADATA])

@app.get("/")
def root():
    return {"status": "ok"}

@app.get("/titles")
def get_titles():
    load_models()
    return {"titles": all_titles}

@app.get("/recommend")
def recommend(title: str, n: int = 10, page: int = 0):
    load_models()
    if not title or len(title.strip()) < 1:
        raise HTTPException(status_code=400, detail="Title required")
    if len(title) > 200:
        raise HTTPException(status_code=400, detail="Title too long")
    if page < 0 or page > 10:
        page = 0
    meta["_lower"] = meta["title"].str.lower().str.strip()
    matches = meta[meta["_lower"] == title.lower().strip()]

    # fetch more neighbors than needed so we can paginate through them
    fetch_n = n * 5  

    if not matches.empty:
        idx    = matches.index[0]
        vec    = hybrid_features[idx].reshape(1, -1)
        skip   = 1
        source = "local"
    else:
        tmdb_row = fetch_from_tmdb(title)
        if tmdb_row is None:
            raise HTTPException(status_code=404, detail="Show not found")
        vec    = build_vector(tmdb_row)
        skip   = 0
        source = "tmdb"

    distances, indices = knn_hybrid.kneighbors(vec, n_neighbors=fetch_n + skip)
    rec_idx  = indices[0][skip:]
    rec_dist = distances[0][skip:]

    # page 0 = top 10, page 1 = next 10, page 2 = next 10 etc.
    start = page * n
    end   = start + n

    # if user goes beyond available results, wrap around
    if start >= len(rec_idx):
        start = 0
        end   = n

    rec_idx  = rec_idx[start:end]
    rec_dist = rec_dist[start:end]

    results = meta.iloc[rec_idx][
        ["title", "type", "release_year", "rating", "listed_in"]
    ].copy()
    results["similarity"] = (1 - rec_dist).round(3)
    results["title"]      = results["title"].str.title()

    return {
        "source":          source,
        "page":            page,
        "recommendations": results.reset_index(drop=True).to_dict(orient="records")
    }
    
@app.get("/poster")
def get_poster(title: str):
    load_models()
    """
    Fetches poster URL from TMDB for a given title.
    Called per card so posters load progressively without slowing recommendations.
    """
    if not title or len(title) > 200:
        return {"poster_url": None}
    try:
        r = requests.get(f"{TMDB_BASE}/search/multi", params={
            "api_key": TMDB_API_KEY,
            "query":   title,
            "language": "en-US",
            "page": 1
        }, timeout=6)
        results = [x for x in r.json().get("results", [])
                   if x.get("media_type") in ("movie", "tv")]

        if not results:
            return {"poster_url": None}

        poster_path = results[0].get("poster_path")
        if not poster_path:
            return {"poster_url": None}

        return {"poster_url": f"https://image.tmdb.org/t/p/w500{poster_path}"}

    except Exception:
        return {"poster_url": None}
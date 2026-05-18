import numpy as np
import pickle
import os
import scipy.sparse as sp
from implicit.als import AlternatingLeastSquares
from implicit.nearest_neighbours import bm25_weight
from database import fetch_all

_SRC_DIR = os.path.dirname(os.path.abspath(__file__))
_PROJECT_ROOT = os.path.dirname(_SRC_DIR)
ARTIFACTS_DIR = os.path.join(_PROJECT_ROOT, "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

MODEL_PATH = os.path.join(ARTIFACTS_DIR, "implicit_model.pkl")
MAPPINGS_PATH = os.path.join(ARTIFACTS_DIR, "implicit_mappings.pkl")
MATRIX_PATH = os.path.join(ARTIFACTS_DIR, "implicit_matrix.pkl")

def build_matrix():
    print("Fetching interactions...", flush=True)
    interactions = fetch_all("""
        SELECT uma.user_id, uma.tmdb_id,
               COALESCE(udr.overall_rating, 0) as rating,
               uma.is_favorite,
               uma.is_disliked,
               uma.is_watchlist
        FROM user_movie_actions uma
        LEFT JOIN user_detailed_ratings udr
            ON udr.user_id = uma.user_id AND udr.tmdb_id = uma.tmdb_id
        WHERE (uma.is_watched = TRUE OR uma.is_favorite = TRUE OR uma.is_watchlist = TRUE)
          AND uma.is_disliked = FALSE
    """)

    users = sorted(set(r["user_id"] for r in interactions))
    items = sorted(set(r["tmdb_id"] for r in interactions))

    user_to_idx = {u: i for i, u in enumerate(users)}
    item_to_idx = {it: i for i, it in enumerate(items)}
    idx_to_item = {i: it for it, i in item_to_idx.items()}

    rows, cols, data = [], [], []
    
    for r in interactions:
        if r["is_favorite"]:
            preference = 5.0
        elif r["rating"] and r["rating"] >= 8:
            preference = 4.0
        elif r["rating"] and r["rating"] >= 6:
            preference = 3.0
        elif r["rating"] and r["rating"] >= 4:
            preference = 2.0
        elif r["is_watchlist"]:
            preference = 1.5  
        else:
            preference = 1.0  
        
        rows.append(user_to_idx[r["user_id"]])
        cols.append(item_to_idx[r["tmdb_id"]])
        data.append(preference)

    matrix = sp.csr_matrix(
        (data, (rows, cols)),
        shape=(len(users), len(items))
    )

    print(f"Matrix shape: {matrix.shape}", flush=True)
    print(f"Sparsity: {1 - matrix.nnz / (matrix.shape[0] * matrix.shape[1]):.2%}", flush=True)
    print(f"Total interactions: {matrix.nnz}", flush=True)
    
    return matrix, user_to_idx, item_to_idx, idx_to_item


def train_model():
    print("Building dataset...", flush=True)
    matrix, user_to_idx, item_to_idx, idx_to_item = build_matrix()

    print("Applying BM25 weighting...", flush=True)
    matrix_weighted = bm25_weight(matrix, K1=100, B=0.8).tocsr()

    print("Training ALS model...", flush=True)
    model = AlternatingLeastSquares(
        factors=24,           
        iterations=30,       
        regularization=1.0, 
        alpha=20.0,           
        random_state=42,
        use_gpu=False
    )
    model.fit(matrix_weighted)
    print("Training done!", flush=True)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump(model, f)
    with open(MAPPINGS_PATH, "wb") as f:
        pickle.dump((user_to_idx, item_to_idx, idx_to_item), f)
    with open(MATRIX_PATH, "wb") as f:
        pickle.dump(matrix, f)

    print("Model saved!", flush=True)
    return model, user_to_idx, item_to_idx, idx_to_item, matrix


def load_model():
    if not all(os.path.exists(p) for p in [MODEL_PATH, MAPPINGS_PATH, MATRIX_PATH]):
        print("Model files not found, training new model...", flush=True)
        return train_model()

    print("Loading existing model...", flush=True)
    with open(MODEL_PATH, "rb") as f:
        model = pickle.load(f)
    with open(MAPPINGS_PATH, "rb") as f:
        user_to_idx, item_to_idx, idx_to_item = pickle.load(f)
    with open(MATRIX_PATH, "rb") as f:
        matrix = pickle.load(f)

    return model, user_to_idx, item_to_idx, idx_to_item, matrix


def get_recommendations(user_id: int, n: int = 40) -> list[int]:
    model, user_to_idx, item_to_idx, idx_to_item, matrix = load_model()

    if user_id not in user_to_idx:
        print(f"User {user_id} not found in training data", flush=True)
        return []

    user_idx = user_to_idx[user_id]
    user_items = matrix[user_idx]
    
    if not sp.issparse(user_items):
        user_items = sp.csr_matrix(user_items.reshape(1, -1))

    n_items = matrix.shape[1]
    n_recommend = min(n + 100, n_items)
    
    ids, scores = model.recommend(
        user_idx,
        user_items,
        N=n_recommend,
        filter_already_liked_items=True,
        recalculate_user=False 
    )

    watched = fetch_all(
        "SELECT tmdb_id FROM user_movie_actions WHERE user_id = %s AND (is_watched = TRUE OR is_disliked = TRUE)",
        (user_id,)
    )
    watched_ids = {row["tmdb_id"] for row in watched}

    result = []
    for idx in ids:
        tmdb_id = idx_to_item.get(int(idx))
        if tmdb_id and tmdb_id not in watched_ids:
            result.append(int(tmdb_id))
        if len(result) >= n:
            break

    return result
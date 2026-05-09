import numpy as np
import pickle
import os
import scipy.sparse as sp
from scipy.sparse import csr_matrix
from implicit.als import AlternatingLeastSquares
from database import fetch_all

MODEL_PATH = "implicit_model.pkl"
MAPPINGS_PATH = "implicit_mappings.pkl"
MATRIX_PATH = "implicit_matrix.pkl"

def build_matrix():
    print("Fetching interactions...", flush=True)
    interactions = fetch_all("""
        SELECT uma.user_id, uma.tmdb_id,
               COALESCE(udr.overall_rating, 0) as rating,
               uma.is_favorite,
               uma.is_disliked
        FROM user_movie_actions uma
        LEFT JOIN user_detailed_ratings udr
            ON udr.user_id = uma.user_id AND udr.tmdb_id = uma.tmdb_id
        WHERE uma.is_watched = TRUE
    """)

    users = list(set(r["user_id"] for r in interactions))
    items = list(set(r["tmdb_id"] for r in interactions))

    user_to_idx = {u: i for i, u in enumerate(users)}
    item_to_idx = {it: i for i, it in enumerate(items)}
    idx_to_item = {i: it for it, i in item_to_idx.items()}

    rows, cols, data = [], [], []
    for r in interactions:
        if r["is_disliked"]:
            continue
        weight = 5.0 if r["is_favorite"] else float(r["rating"]) if r["rating"] else 1.0
        rows.append(user_to_idx[r["user_id"]])
        cols.append(item_to_idx[r["tmdb_id"]])
        data.append(weight)

    matrix = sp.csr_matrix(
        (data, (rows, cols)),
        shape=(len(users), len(items))  # (users, items)
    )

    print(f"Matrix shape: {matrix.shape}", flush=True)
    print(f"Users: {len(users)}, Items: {len(items)}", flush=True)
    return matrix, user_to_idx, item_to_idx, idx_to_item


def train_model():
    print("Building dataset...", flush=True)
    matrix, user_to_idx, item_to_idx, idx_to_item = build_matrix()

    print("Training ALS model...", flush=True)
    model = AlternatingLeastSquares(
        factors=64,
        iterations=20,
        regularization=0.1,
        random_state=42
    )
    model.fit(matrix)
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
    if not os.path.exists(MODEL_PATH) or not os.path.exists(MAPPINGS_PATH) or not os.path.exists(MATRIX_PATH):
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

    print(f"user_id: {user_id}", flush=True)
    print(f"matrix shape: {matrix.shape}", flush=True)

    if user_id not in user_to_idx:
        print(f"User {user_id} not found in training data", flush=True)
        return []

    user_idx = user_to_idx[user_id]
    print(f"user_idx: {user_idx}", flush=True)

    user_items = matrix[user_idx]
    
    if not sp.issparse(user_items):
        user_items = csr_matrix(user_items.reshape(1, -1))
    elif isinstance(user_items, sp.csr_matrix):
        if user_items.shape[0] != 1:
            user_items = user_items.reshape(1, -1)
    else:
        user_items = user_items.tocsr()
        if user_items.shape[0] != 1:
            user_items = user_items.reshape(1, -1)

    n_items = matrix.shape[1]  
    n_recommend = min(n + 50, n_items)
    
    print(f"Requesting {n_recommend} recommendations from {n_items} items", flush=True)
    
    ids, scores = model.recommend(
        user_idx,
        user_items,
        N=n_recommend,
        filter_already_liked_items=True,
        recalculate_user=True
    )

    print(f"Got {len(ids)} recommendations from model", flush=True)

    watched = fetch_all(
        "SELECT tmdb_id FROM user_movie_actions WHERE user_id = %s AND (is_watched = TRUE OR is_disliked = TRUE)",
        (user_id,)
    )
    watched_ids = {row["tmdb_id"] for row in watched}
    print(f"User has {len(watched_ids)} watched/disliked movies", flush=True)

    result = []
    for idx in ids:
        tmdb_id = idx_to_item.get(idx)
        if tmdb_id and tmdb_id not in watched_ids:
            result.append(int(tmdb_id))
        if len(result) >= n:
            break

    print(f"Returning {len(result)} recommendations", flush=True)
    return result
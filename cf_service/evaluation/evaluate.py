import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

import numpy as np
import scipy.sparse as sp
from implicit.als import AlternatingLeastSquares
from implicit.nearest_neighbours import bm25_weight
from model import build_matrix
import warnings
warnings.filterwarnings('ignore')


def evaluate_loo():
    print("Building matrix...")
    matrix, user_to_idx, item_to_idx, idx_to_item = build_matrix()
    print(f"Shape: {matrix.shape}, NNZ: {matrix.nnz}")
    
    np.random.seed(42)
    
    test_pairs = []
    train_matrix = matrix.copy().tolil()
    
    for u in range(matrix.shape[0]):
        user_items = matrix[u].indices
        if len(user_items) < 5:
            continue
        test_item = np.random.choice(user_items)
        test_pairs.append((u, test_item))
        train_matrix[u, test_item] = 0
    
    train_matrix = train_matrix.tocsr()
    train_matrix.eliminate_zeros()
    
    train_weighted = bm25_weight(train_matrix, K1=100, B=0.8).tocsr()
    
    model = AlternatingLeastSquares(
        factors=24, iterations=30, regularization=1.0,
        alpha=20.0, random_state=42, use_gpu=False
    )
    model.fit(train_weighted)
    
    hits_1, hits_5, hits_10, hits_20 = [], [], [], []
    ranks = []
    
    for u, true_item in test_pairs:
        ids, _ = model.recommend(
            u, train_matrix[u],
            N=50,
            filter_already_liked_items=True
        )
        ids = list(ids)
        if true_item in ids:
            pos = ids.index(true_item) + 1
            ranks.append(pos)
            hits_1.append(1 if pos <= 1 else 0)
            hits_5.append(1 if pos <= 5 else 0)
            hits_10.append(1 if pos <= 10 else 0)
            hits_20.append(1 if pos <= 20 else 0)
        else:
            hits_1.append(0); hits_5.append(0); hits_10.append(0); hits_20.append(0)
    
    print(f"\nUsers tested: {len(test_pairs)}")
    print(f"Hit Rate@1:  {np.mean(hits_1)*100:.2f}%")
    print(f"Hit Rate@5:  {np.mean(hits_5)*100:.2f}%")
    print(f"Hit Rate@10: {np.mean(hits_10)*100:.2f}%")
    print(f"Hit Rate@20: {np.mean(hits_20)*100:.2f}%")
    if ranks:
        print(f"MRR (found): {np.mean([1/r for r in ranks]):.4f}")
        print(f"Avg rank when found: {np.mean(ranks):.1f}")


if __name__ == "__main__":
    evaluate_loo()
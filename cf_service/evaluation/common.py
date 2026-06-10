import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

import numpy as np
from model import build_matrix

MIN_INTERACTIONS = 5
RANDOM_SEED = 42


def prepare_loo_split():
    print("Building matrix...")
    full_matrix, _, _, _ = build_matrix()
    print(f"Shape: {full_matrix.shape}, NNZ: {full_matrix.nnz}, "
          f"Sparsity: {1 - full_matrix.nnz / (full_matrix.shape[0] * full_matrix.shape[1]):.2%}\n")

    np.random.seed(RANDOM_SEED)

    test_pairs = []
    train_matrix = full_matrix.copy().tolil()

    for u in range(full_matrix.shape[0]):
        user_items = full_matrix[u].indices
        if len(user_items) < MIN_INTERACTIONS:
            continue
        test_item = np.random.choice(user_items)
        test_pairs.append((u, test_item))
        train_matrix[u, test_item] = 0

    train_matrix = train_matrix.tocsr()
    train_matrix.eliminate_zeros()

    return full_matrix, train_matrix, test_pairs
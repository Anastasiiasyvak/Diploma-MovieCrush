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

PARAM_GRID = {
    'factors': [12, 16, 20, 24, 32],
    'alpha': [20.0, 40.0, 60.0, 80.0],
    'regularization': [0.1, 0.5, 1.0],
}

ITERATIONS = 30
N_RECOMMEND = 50  


def prepare_data():
    print("Building matrix...")
    matrix, user_to_idx, item_to_idx, idx_to_item = build_matrix()
    print(f"Shape: {matrix.shape}, NNZ: {matrix.nnz}\n")
    
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
    
    return train_matrix, test_pairs


def evaluate_config(train_matrix, test_pairs, factors, alpha, regularization):
    train_weighted = bm25_weight(train_matrix, K1=100, B=0.8).tocsr()
    
    model = AlternatingLeastSquares(
        factors=factors,
        iterations=ITERATIONS,
        regularization=regularization,
        alpha=alpha,
        random_state=42,
        use_gpu=False
    )
    
    os.environ['TQDM_DISABLE'] = '1'
    model.fit(train_weighted, show_progress=False)
    
    hits_5, hits_10, hits_20 = [], [], []
    ranks = []
    
    for u, true_item in test_pairs:
        ids, _ = model.recommend(
            u, train_matrix[u],
            N=N_RECOMMEND,
            filter_already_liked_items=True
        )
        ids = list(ids)
        if true_item in ids:
            pos = ids.index(true_item) + 1
            ranks.append(pos)
            hits_5.append(1 if pos <= 5 else 0)
            hits_10.append(1 if pos <= 10 else 0)
            hits_20.append(1 if pos <= 20 else 0)
        else:
            hits_5.append(0); hits_10.append(0); hits_20.append(0)
    
    return {
        'hr5': np.mean(hits_5) * 100,
        'hr10': np.mean(hits_10) * 100,
        'hr20': np.mean(hits_20) * 100,
        'mrr': np.mean([1/r for r in ranks]) if ranks else 0,
        'avg_rank': np.mean(ranks) if ranks else 0,
        'found': len(ranks),
    }


def main():
    train_matrix, test_pairs = prepare_data()
    print(f"Users to test: {len(test_pairs)}")
    
    from itertools import product
    combinations = list(product(
        PARAM_GRID['factors'],
        PARAM_GRID['alpha'],
        PARAM_GRID['regularization'],
    ))
    
    total = len(combinations)
    print(f"Total combinations to test: {total}\n")
    print(f"{'factors':>8} {'alpha':>6} {'reg':>5} | "
          f"{'HR@5':>6} {'HR@10':>6} {'HR@20':>6} {'MRR':>7} {'AvgRank':>8}")
    print("-" * 75)
    
    results = []
    for i, (f, a, r) in enumerate(combinations, 1):
        metrics = evaluate_config(train_matrix, test_pairs, f, a, r)
        results.append({
            'factors': f, 'alpha': a, 'reg': r, **metrics
        })
        print(f"{f:>8} {a:>6.0f} {r:>5.1f} | "
              f"{metrics['hr5']:>5.2f}% {metrics['hr10']:>5.2f}% {metrics['hr20']:>5.2f}% "
              f"{metrics['mrr']:>7.4f} {metrics['avg_rank']:>8.1f}  [{i}/{total}]")
    
    print("\n" + "=" * 75)
    print("TOP 5 BY HIT RATE @10")
    print("=" * 75)
    top = sorted(results, key=lambda x: -x['hr10'])[:5]
    for i, r in enumerate(top, 1):
        print(f"{i}. factors={r['factors']}, alpha={r['alpha']}, reg={r['reg']} "
              f"→ HR@10={r['hr10']:.2f}%, HR@20={r['hr20']:.2f}%, MRR={r['mrr']:.4f}")
    
    print("\nTOP 5 BY MRR (better ranking)")
    print("=" * 75)
    top_mrr = sorted(results, key=lambda x: -x['mrr'])[:5]
    for i, r in enumerate(top_mrr, 1):
        print(f"{i}. factors={r['factors']}, alpha={r['alpha']}, reg={r['reg']} "
              f"→ MRR={r['mrr']:.4f}, HR@10={r['hr10']:.2f}%")
    
    print(f"\nDone! Tested {total} combinations.")


if __name__ == "__main__":
    main()
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src'))

import numpy as np
import scipy.sparse as sp
from implicit.als import AlternatingLeastSquares
from implicit.nearest_neighbours import bm25_weight
from sklearn.metrics import roc_auc_score, roc_curve
from model import build_matrix
import warnings
warnings.filterwarnings('ignore')

FACTORS = 24
ITERATIONS = 30
REGULARIZATION = 1.0
ALPHA = 20.0

K_VALUES = [1, 5, 10, 20]

RESULTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'results')
os.makedirs(RESULTS_DIR, exist_ok=True)


def prepare_data():
    print("Building matrix...")
    matrix, user_to_idx, item_to_idx, idx_to_item = build_matrix()
    print(f"Shape: {matrix.shape}, NNZ: {matrix.nnz}, "
          f"Sparsity: {1 - matrix.nnz / (matrix.shape[0] * matrix.shape[1]):.2%}\n")
    
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
    
    return matrix, train_matrix, test_pairs


def train_model(train_matrix):
    print(f"Training ALS (factors={FACTORS}, alpha={ALPHA}, reg={REGULARIZATION})...")
    train_weighted = bm25_weight(train_matrix, K1=100, B=0.8).tocsr()
    
    model = AlternatingLeastSquares(
        factors=FACTORS,
        iterations=ITERATIONS,
        regularization=REGULARIZATION,
        alpha=ALPHA,
        random_state=42,
        use_gpu=False
    )
    model.fit(train_weighted, show_progress=False)
    print("Training done!\n")
    return model


def compute_ranking_metrics(model, train_matrix, test_pairs):
    print("=" * 60)
    print("RANKING METRICS (Hit Rate, MRR, NDCG)")
    print("=" * 60)
    
    metrics = {k: {'hits': []} for k in K_VALUES}
    ranks = []
    
    for u, true_item in test_pairs:
        ids, scores = model.recommend(
            u, train_matrix[u],
            N=max(K_VALUES) + 30,
            filter_already_liked_items=True
        )
        ids = list(ids)
        
        if true_item in ids:
            pos = ids.index(true_item) + 1
            ranks.append(pos)
            for k in K_VALUES:
                metrics[k]['hits'].append(1 if pos <= k else 0)
        else:
            for k in K_VALUES:
                metrics[k]['hits'].append(0)
    
    print(f"\n{'K':>5} | {'Hit Rate@K':>12} | {'NDCG@K':>10}")
    print("-" * 40)
    for k in K_VALUES:
        hr = np.mean(metrics[k]['hits']) * 100
        ndcg_scores = []
        for pos in [r if r <= k else None for r in ranks]:
            if pos:
                ndcg_scores.append(1 / np.log2(pos + 1))
            else:
                ndcg_scores.append(0)
        ndcg_scores.extend([0] * (len(test_pairs) - len(ranks)))
        ndcg = np.mean(ndcg_scores)
        print(f"{k:>5} | {hr:>10.2f}% | {ndcg:>10.4f}")
    
    if ranks:
        mrr = np.mean([1/r for r in ranks])
        print(f"\nMRR: {mrr:.4f}")
        print(f"Average rank (when found): {np.mean(ranks):.2f}")
    
    return metrics


def compute_classification_metrics(model, train_matrix, test_pairs, full_matrix):
    print("\n" + "=" * 60)
    print("CLASSIFICATION METRICS (Precision, Recall, F1)")
    print("=" * 60)
    
    user_relevant = {}
    for u in range(full_matrix.shape[0]):
        user_relevant[u] = set(full_matrix[u].indices)
    
    results = {k: {'precision': [], 'recall': [], 'f1': []} for k in K_VALUES}
    
    for u, _ in test_pairs:
        relevant = user_relevant[u]
        if not relevant:
            continue
        
        ids, _ = model.recommend(
            u, train_matrix[u],
            N=max(K_VALUES),
            filter_already_liked_items=False
        )
        ids = list(ids)
        
        for k in K_VALUES:
            top_k = set(ids[:k])
            tp = len(top_k & relevant)
            
            precision = tp / k if k > 0 else 0
            recall = tp / len(relevant) if relevant else 0
            f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0
            
            results[k]['precision'].append(precision)
            results[k]['recall'].append(recall)
            results[k]['f1'].append(f1)
    
    print(f"\n{'K':>5} | {'Precision@K':>13} | {'Recall@K':>10} | {'F1@K':>8}")
    print("-" * 50)
    for k in K_VALUES:
        p = np.mean(results[k]['precision'])
        r = np.mean(results[k]['recall'])
        f1 = np.mean(results[k]['f1'])
        print(f"{k:>5} | {p:>12.4f} | {r:>10.4f} | {f1:>8.4f}")
    
    return results


def compute_roc_auc(model, train_matrix, full_matrix, test_pairs):
    print("\n" + "=" * 60)
    print("ROC / AUC")
    print("=" * 60)
    
    y_true = []
    y_scores = []
    
    n_items = full_matrix.shape[1]
    np.random.seed(42)
    
    for u, true_item in test_pairs:
        all_user_items = set(full_matrix[u].indices)
        negative_pool = [i for i in range(n_items) if i not in all_user_items]
        
        if len(negative_pool) < 50:
            continue
        
        negatives = np.random.choice(negative_pool, size=50, replace=False)
        items_to_score = np.array([true_item] + list(negatives))
        labels = [1] + [0] * len(negatives)
        
        user_factor = model.user_factors[u]
        item_factors = model.item_factors[items_to_score]
        scores = item_factors @ user_factor
        
        y_true.extend(labels)
        y_scores.extend(scores.tolist())
    
    y_true = np.array(y_true)
    y_scores = np.array(y_scores)
    
    auc = roc_auc_score(y_true, y_scores)
    print(f"\nROC AUC: {auc:.4f}")
    print(f"  (1.0 = perfect, 0.5 = random, your value)")
    
    fpr, tpr, thresholds = roc_curve(y_true, y_scores)
    
    print(f"\nROC curve points (sample):")
    print(f"{'Threshold':>10} | {'FPR':>6} | {'TPR':>6}")
    print("-" * 35)
    n_points = len(thresholds)
    for idx in [0, n_points // 4, n_points // 2, 3 * n_points // 4, n_points - 1]:
        print(f"{thresholds[idx]:>10.4f} | {fpr[idx]:>6.4f} | {tpr[idx]:>6.4f}")
    
    roc_data_path = os.path.join(RESULTS_DIR, 'roc_data.npz')
    np.savez(roc_data_path, fpr=fpr, tpr=tpr, auc=auc)
    print(f"\nROC data saved to {roc_data_path}")
    
    return auc, fpr, tpr


def plot_roc(fpr, tpr, auc_value):
    try:
        import matplotlib.pyplot as plt
        plt.figure(figsize=(8, 6))
        plt.plot(fpr, tpr, color='darkorange', lw=2, label=f'ROC curve (AUC = {auc_value:.4f})')
        plt.plot([0, 1], [0, 1], color='navy', lw=2, linestyle='--', label='Random')
        plt.xlim([0.0, 1.0])
        plt.ylim([0.0, 1.05])
        plt.xlabel('False Positive Rate')
        plt.ylabel('True Positive Rate')
        plt.title('ROC Curve - ALS Collaborative Filtering')
        plt.legend(loc="lower right")
        plt.grid(alpha=0.3)
        
        roc_png_path = os.path.join(RESULTS_DIR, 'roc_curve.png')
        plt.savefig(roc_png_path, dpi=100, bbox_inches='tight')
        print(f"ROC curve saved to {roc_png_path}")
    except ImportError:
        print("matplotlib not installed. Run: pip install matplotlib")


def main():
    full_matrix, train_matrix, test_pairs = prepare_data()
    print(f"Test pairs: {len(test_pairs)}\n")
    
    model = train_model(train_matrix)
    
    compute_ranking_metrics(model, train_matrix, test_pairs)
    compute_classification_metrics(model, train_matrix, test_pairs, full_matrix)
    
    auc, fpr, tpr = compute_roc_auc(model, train_matrix, full_matrix, test_pairs)
    plot_roc(fpr, tpr, auc)
    
    print("\n" + "=" * 60)
    print("EVALUATION COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
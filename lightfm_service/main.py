from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from model import get_recommendations, train_model, load_model
import uvicorn

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Loading ALS model...", flush=True)
    try:
        model, user_to_idx, item_to_idx, idx_to_item, matrix = load_model()
        print(f"Model ready! Users: {len(user_to_idx)}, Items: {len(item_to_idx)}", flush=True)
        print(f"Matrix shape: {matrix.shape}", flush=True)
    except Exception as e:
        print(f"Warning: Could not load model: {e}", flush=True)
        print("Will train on first request or /train endpoint", flush=True)
    yield

app = FastAPI(title="MovieCrush ALS Service", lifespan=lifespan)

@app.get("/health")
def health():
    return {"status": "ok", "service": "als"}

@app.post("/train")
def train():
    try:
        model, user_to_idx, item_to_idx, idx_to_item, matrix = train_model()
        return {
            "status": "ok", 
            "message": "Model trained successfully",
            "users": len(user_to_idx),
            "items": len(item_to_idx),
            "matrix_shape": matrix.shape
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/recommend/{user_id}")
def recommend(user_id: int, n: int = 40):
    try:
        if n > 100:
            n = 100
        tmdb_ids = get_recommendations(user_id, n)
        return {
            "user_id": user_id,
            "recommendations": tmdb_ids,
            "count": len(tmdb_ids)
        }
    except Exception as e:
        print(f"Error in recommend endpoint: {e}", flush=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/info")
def info():
    """Debug endpoint to see model info"""
    try:
        model, user_to_idx, item_to_idx, idx_to_item, matrix = load_model()
        return {
            "users": len(user_to_idx),
            "items": len(item_to_idx),
            "matrix_shape": matrix.shape,
            "sample_users": list(user_to_idx.keys())[:5],
            "sample_items": list(item_to_idx.keys())[:5]
        }
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
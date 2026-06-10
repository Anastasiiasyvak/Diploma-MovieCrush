from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from model import get_recommendations, train_model, get_cached_model
from logging_config import get_logger
import uvicorn

log = get_logger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    log.info("Loading ALS model...")
    try:
        model, user_to_idx, item_to_idx, idx_to_item, matrix = get_cached_model()
        log.info(f"Model ready! Users: {len(user_to_idx)}, Items: {len(item_to_idx)}")
        log.info(f"Matrix shape: {matrix.shape}")
    except Exception as e:
        log.warning(f"Could not load model: {e}")
        log.warning("Will train on first request or /train endpoint")
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
        log.exception("Error in recommend endpoint")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/info")
def info():
    """Debug endpoint to see model info"""
    try:
        model, user_to_idx, item_to_idx, idx_to_item, matrix = get_cached_model()
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
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, reload_dirs=["."])
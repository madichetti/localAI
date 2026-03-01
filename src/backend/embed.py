"""
Embeddings API router for unified BFF
- Merged from embeddings-service/main.py
"""
from fastapi import APIRouter
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
import time
import logging

router = APIRouter()

# Load model once
logger = logging.getLogger("embed-router")
logger.setLevel(logging.INFO)
model = SentenceTransformer("all-MiniLM-L6-v2", device="cuda")
logger.info("✓ Embedding model loaded")

class EmbedRequest(BaseModel):
    texts: list[str]

@router.get("/embed/health")
def health():
    return {"status": "healthy", "service": "embeddings"}

@router.post("/embed")
def embed(req: EmbedRequest):
    start_time = time.time()
    logger.info(f"Encoding {len(req.texts)} text(s) into embeddings")
    vectors = model.encode(req.texts, convert_to_tensor=False).tolist()
    duration = (time.time() - start_time) * 1000
    result = {
        "embeddings": vectors,
        "model": "all-MiniLM-L6-v2",
        "dim": len(vectors[0]) if vectors else 0,
    }
    logger.info(f"✓ Generated embeddings: {len(vectors)} vectors × {result['dim']} dimensions in {duration:.1f}ms")
    return result

"""
Unified Python FastAPI BFF for LocalAI Stack
- Combines Embeddings, RAG, and LLM endpoints
- Designed to replace Node.js BFF and all Python microservices
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware


from embed import router as embed_router


app = FastAPI(title="LocalAI Unified BFF API")


# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(embed_router)
from rag import router as rag_router
app.include_router(rag_router)
from llm import router as llm_router
app.include_router(llm_router)

@app.get("/health")
def health():
    return {"status": "healthy", "service": "bff-api"}

# TODO: Add routers for /embed, /rag, /llm, etc.
# TODO: Add logging, request ID, SSE support as needed

"""
RAG API router for unified BFF
- Merged from rag-app/main.py (core endpoints only)
"""
import os
import time
import logging
import requests
from typing import List
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from pymilvus import MilvusClient
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer

router = APIRouter()

logger = logging.getLogger("rag-router")
logger.setLevel(logging.INFO)

MILVUS_URI = os.getenv("MILVUS_URI", "http://localhost:19530")
MILVUS_COLLECTION = os.getenv("MILVUS_COLLECTION", "demo_docs")
MILVUS_TEXT_MAX_BYTES = int(os.getenv("MILVUS_TEXT_MAX_BYTES", "60000"))
RAG_INGEST_MAX_TOTAL_BYTES = int(os.getenv("RAG_INGEST_MAX_TOTAL_BYTES", "5000000"))
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "all-MiniLM-L6-v2")
RAG_CHUNK_TOKENS_RAW = os.getenv("RAG_CHUNK_TOKENS", "max")
RAG_CHUNK_OVERLAP = int(os.getenv("RAG_CHUNK_OVERLAP", "40"))

logger.info(f"Connecting to Milvus at {MILVUS_URI}")
milvus_client = MilvusClient(uri=MILVUS_URI)
logger.info("✓ Milvus client initialized")

logger.info(f"Loading sentence-transformers model: {EMBEDDING_MODEL_NAME}")
embedder = SentenceTransformer(EMBEDDING_MODEL_NAME, device="cuda")
logger.info("✓ Embedder model loaded")

logger.info(f"Loading tokenizer for chunking: {EMBEDDING_MODEL_NAME}")
tokenizer = AutoTokenizer.from_pretrained(EMBEDDING_MODEL_NAME)
logger.info("✓ Tokenizer loaded")

def resolve_model_max_chunk_tokens() -> int:
    max_seq = getattr(embedder, "max_seq_length", None)
    if isinstance(max_seq, int) and max_seq > 0:
        return max_seq

    tokenizer_max = getattr(tokenizer, "model_max_length", None)
    if isinstance(tokenizer_max, int) and 0 < tokenizer_max < 1000000:
        return tokenizer_max

    return 512

MODEL_MAX_CHUNK_TOKENS = resolve_model_max_chunk_tokens()

def resolve_chunk_tokens(raw_value: str) -> int:
    if raw_value.lower() in {"max", "auto"}:
        return MODEL_MAX_CHUNK_TOKENS

    try:
        requested = int(raw_value)
    except ValueError:
        logger.warning(
            f"Invalid RAG_CHUNK_TOKENS='{raw_value}', using model max {MODEL_MAX_CHUNK_TOKENS}"
        )
        return MODEL_MAX_CHUNK_TOKENS

    return max(32, min(requested, MODEL_MAX_CHUNK_TOKENS))

RAG_CHUNK_TOKENS = resolve_chunk_tokens(RAG_CHUNK_TOKENS_RAW)
logger.info(
    f"Token chunking config: chunk_tokens={RAG_CHUNK_TOKENS} (model_max={MODEL_MAX_CHUNK_TOKENS}), overlap={RAG_CHUNK_OVERLAP}"
)

class AskRequest(BaseModel):
    question: str
    top_k: int = 3

class IngestRequest(BaseModel):
    documents: List[str]

@router.get("/rag/health")
def health():
    return {"status": "healthy", "service": "rag"}


# --- Begin merged endpoints from rag-app/main.py ---

class IngestResponse(BaseModel):
    inserted: int
    collection: str

class ResetResponse(BaseModel):
    reset: bool
    collection: str
    dimension: int

class DocumentItem(BaseModel):
    id: int
    text: str

class DocumentsResponse(BaseModel):
    collection: str
    total: int
    returned: int
    documents: List[DocumentItem]

def get_embedding_dimension() -> int:
    sample = embedder.encode(["dimension probe"], convert_to_tensor=False)
    return len(sample[0])

def ensure_collection_exists() -> None:
    if MILVUS_COLLECTION in milvus_client.list_collections():
        return
    dimension = get_embedding_dimension()
    milvus_client.create_collection(MILVUS_COLLECTION, dimension=dimension)

def recreate_collection() -> int:
    if MILVUS_COLLECTION in milvus_client.list_collections():
        milvus_client.drop_collection(MILVUS_COLLECTION)
    dimension = get_embedding_dimension()
    milvus_client.create_collection(MILVUS_COLLECTION, dimension=dimension)
    return dimension

def normalize_documents(documents: List[str]) -> List[str]:
    def utf8_length(text: str) -> int:
        return len(text.encode("utf-8"))

    def trim_to_max_bytes(text: str, max_bytes: int) -> str:
        if utf8_length(text) <= max_bytes:
            return text
        return text.encode("utf-8")[:max_bytes].decode("utf-8", errors="ignore").strip()

    def chunk_by_tokens(text: str, chunk_tokens: int, overlap_tokens: int) -> List[str]:
        token_ids = tokenizer.encode(text, add_special_tokens=False)
        if len(token_ids) <= chunk_tokens:
            return [text]

        chunks: List[str] = []
        step = max(1, chunk_tokens - overlap_tokens)
        start_index = 0
        while start_index < len(token_ids):
            end_index = min(start_index + chunk_tokens, len(token_ids))
            window = token_ids[start_index:end_index]
            chunk = tokenizer.decode(window, skip_special_tokens=True, clean_up_tokenization_spaces=True).strip()
            if chunk:
                chunks.append(chunk)

            if end_index >= len(token_ids):
                break
            start_index += step
        return chunks

    chunk_tokens = max(32, RAG_CHUNK_TOKENS)
    overlap_tokens = max(0, min(RAG_CHUNK_OVERLAP, chunk_tokens - 1))

    cleaned: List[str] = []
    for document in documents:
        text = document.replace("\x00", " ").strip()
        if text:
            for chunk in chunk_by_tokens(text, chunk_tokens, overlap_tokens):
                safe_chunk = trim_to_max_bytes(chunk, MILVUS_TEXT_MAX_BYTES)
                if safe_chunk:
                    cleaned.append(safe_chunk)
    return cleaned

@router.post("/rag/ask")
def ask(request: AskRequest):
    start_time = time.time()
    logger.info(f"Processing query: {request.question[:50]}... (top_k={request.top_k})")
    if not request.question.strip():
        logger.warning("Question is empty")
        raise HTTPException(status_code=400, detail="Question is required")
    if MILVUS_COLLECTION not in milvus_client.list_collections():
        logger.error(f"Collection '{MILVUS_COLLECTION}' not found")
        raise HTTPException(
            status_code=400,
            detail=f"Collection '{MILVUS_COLLECTION}' not found. Run milvus_demo.py first.",
        )
    # Step 1: Embed the question
    embed_start = time.time()
    vector = embedder.encode([request.question]).tolist()
    embed_duration = (time.time() - embed_start) * 1000
    logger.info(f"Question embedded in {embed_duration:.1f}ms")
    # Step 2: Search for similar documents
    search_start = time.time()
    hits = milvus_client.search(
        MILVUS_COLLECTION,
        vector,
        limit=max(1, request.top_k),
        output_fields=["text"],
    )
    search_duration = (time.time() - search_start) * 1000
    logger.info(f"Retrieved {len(hits[0])} context document(s) in {search_duration:.1f}ms")
    context: List[str] = []
    for hit in hits[0]:
        entity = hit.get("entity", {})
        text = entity.get("text") or hit.get("text")
        if text:
            context.append(text)
    prompt = (
        "Use the context to answer concisely and accurately. "
        "If context is insufficient, say so.\n\n"
        f"Context:\n{os.linesep.join(context)}\n\n"
        f"Question: {request.question}\n"
        "Answer:"
    )
    # Step 3: Call Ollama for LLM inference
    logger.info(f"Calling Ollama with model '{os.getenv('OLLAMA_MODEL', 'deepseek-coder:6.7b')}'")
    ollama_start = time.time()
    try:
        response = requests.post(
            os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate"),
            json={"model": os.getenv("OLLAMA_MODEL", "deepseek-coder:6.7b"), "prompt": prompt, "stream": False},
            timeout=180,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.HTTPError as error:
        logger.error(f"Ollama call failed: {error}")
        details = error.response.text if error.response is not None else str(error)
        raise HTTPException(status_code=502, detail=f"Ollama call failed: {details}")
    except Exception as error:
        logger.error(f"Ollama call failed: {error}")
        raise HTTPException(status_code=502, detail=f"Ollama call failed: {error}")
    ollama_duration = (time.time() - ollama_start) * 1000
    answer = payload.get("response", "").strip() or "No answer returned."
    logger.info(f"Ollama inference complete in {ollama_duration:.1f}ms, answer length: {len(answer)} chars")
    total_duration = (time.time() - start_time) * 1000
    logger.info(f"✓ RAG query complete in {total_duration:.1f}ms total")
    return {"answer": answer, "context": context, "model": os.getenv("OLLAMA_MODEL", "deepseek-coder:6.7b")}

@router.post("/rag/ingest")
def ingest(request: IngestRequest):
    start_time = time.time()
    logger.info(f"Ingesting {len(request.documents)} document(s)")
    total_payload_bytes = sum(len(document.encode("utf-8")) for document in request.documents)
    if total_payload_bytes > RAG_INGEST_MAX_TOTAL_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"Upload payload is too large ({total_payload_bytes} bytes). "
                f"Current limit is {RAG_INGEST_MAX_TOTAL_BYTES} bytes."
            ),
        )

    source_count = len(request.documents)
    documents = normalize_documents(request.documents)
    if not documents:
        logger.warning("No valid documents provided for ingestion")
        raise HTTPException(status_code=400, detail="At least one non-empty document is required")
    try:
        ensure_collection_exists()
        logger.info(f"Encoding {len(documents)} chunks derived from {source_count} document(s) into vectors...")
        embed_start = time.time()
        vectors = embedder.encode(documents).tolist()
        embed_duration = (time.time() - embed_start) * 1000
        logger.info(f"Encoded {len(documents)} documents in {embed_duration:.1f}ms")
        now = time.time_ns()
        rows = [
            {"id": (now + index) % 9223372036854775807, "vector": vector, "text": text}
            for index, (vector, text) in enumerate(zip(vectors, documents))
        ]
        insert_start = time.time()
        milvus_client.insert(MILVUS_COLLECTION, rows)
        milvus_client.flush(MILVUS_COLLECTION)
        milvus_client.load_collection(MILVUS_COLLECTION)
        insert_duration = (time.time() - insert_start) * 1000
        logger.info(f"Inserted {len(rows)} documents into Milvus in {insert_duration:.1f}ms")
    except Exception as error:
        logger.error(f"Ingest failed: {error}")
        raise HTTPException(status_code=500, detail=f"Ingest failed: {error}")
    total_duration = (time.time() - start_time) * 1000
    logger.info(f"✓ Ingest complete: {len(rows)} documents in {total_duration:.1f}ms")
    return {"inserted": len(rows), "collection": MILVUS_COLLECTION}

@router.post("/rag/reset")
def reset():
    try:
        dimension = recreate_collection()
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"Reset failed: {error}")
    return {"reset": True, "collection": MILVUS_COLLECTION, "dimension": dimension}

@router.get("/rag/documents")
def documents(limit: int = Query(default=20, ge=1, le=200)):
    try:
        if MILVUS_COLLECTION not in milvus_client.list_collections():
            return {
                "collection": MILVUS_COLLECTION,
                "total": 0,
                "returned": 0,
                "documents": [],
            }
        stats = milvus_client.get_collection_stats(MILVUS_COLLECTION)
        total = int(stats.get("row_count", 0))
        rows = milvus_client.query(
            MILVUS_COLLECTION,
            filter="id >= 0",
            output_fields=["id", "text"],
            limit=limit,
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"List documents failed: {error}")
    items: List[DocumentItem] = []
    for row in rows:
        text = row.get("text")
        identifier = row.get("id")
        if text is None or identifier is None:
            continue
        items.append({"id": int(identifier), "text": str(text)})
    return {
        "collection": MILVUS_COLLECTION,
        "total": total,
        "returned": len(items),
        "documents": items,
    }
# --- End merged endpoints ---

"""
LLM API router for unified BFF
- Provides /llm/chat and /llm/health endpoints
- Uses Ollama backend
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import requests
import logging

router = APIRouter()
logger = logging.getLogger("llm-router")
logger.setLevel(logging.INFO)

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434/api/generate")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

class LLMChatRequest(BaseModel):
    prompt: str
    model: str = OLLAMA_MODEL
    stream: bool = False

@router.get("/llm/health")
def health():
    return {"status": "healthy", "service": "llm"}

@router.post("/llm/chat")
def chat(req: LLMChatRequest):
    logger.info(f"Calling Ollama model '{req.model}' with prompt length {len(req.prompt)}")
    try:
        response = requests.post(
            OLLAMA_URL,
            json={"model": req.model, "prompt": req.prompt, "stream": req.stream},
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
    return {"response": payload.get("response", "").strip(), "model": req.model}

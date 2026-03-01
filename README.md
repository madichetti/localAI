# localAI

A local-first AI application stack for enterprise-style prototyping and internal product development.

This repository provides:
- A web frontend (`src/frontend`) built with Next.js
- A Python backend API (`src/backend`) built with FastAPI
- Local model/runtime integrations for embeddings, retrieval, and generation
- Infrastructure helpers for GPU, Milvus, Redis, and PostgreSQL setup

---

## 1) Business Use Case

### Problem Statement
Most AI prototypes fail to become operational internal tools because they depend on fragmented scripts, external cloud-only APIs, and poor observability of model/runtime behavior. Teams need a reliable local platform where:
- sensitive data can stay on developer-controlled infrastructure
- retrieval + generation workflows can be tested end-to-end
- product and engineering stakeholders can validate value with a real UI

### Target Business Outcomes
localAI is designed to support the following outcomes:
- **Faster AI solution validation** for internal tooling and proof-of-value
- **Lower experimentation cost** by running core AI workflows locally
- **Improved engineering productivity** with one consolidated frontend/backend stack
- **Operational readiness** via repeatable setup and deterministic dependency management

### Primary Business Scenarios
1. **Enterprise Knowledge Assistant**
   - ingest internal documents
   - retrieve relevant context
   - generate grounded answers
2. **Semantic Similarity Workbench**
   - compare text pairs
   - test embedding quality quickly
3. **Model Behavior Evaluation Playground**
   - run prompt-based generation
   - observe latency and output quality
4. **Pre-Production AI Feature Sandbox**
   - iterate on full-stack AI user journeys before cloud deployment

### Intended Users
- AI engineers and platform engineers
- full-stack developers shipping AI-powered features
- product managers validating AI UX and business value
- solution architects defining local-to-production migration paths

### Compact Business FAQ

**Q: What business problem does localAI solve?**  
A: It reduces time and cost to validate AI use cases by providing a local, end-to-end product stack instead of disconnected scripts.

**Q: Who should use it first?**  
A: Teams building internal AI assistants, semantic search, or retrieval-based copilots that need fast experimentation.

**Q: What is the immediate ROI?**  
A: Faster prototype cycles, fewer integration bottlenecks, and clearer evidence for go/no-go product decisions.

**Q: Is it only for engineering teams?**  
A: No. Product and architecture stakeholders can evaluate business fit directly through the running UI.

**Q: Can this move to production later?**  
A: Yes. The current design is local-first, but the architecture is structured to support hardening and deployment planning.

**Q: What makes it practical for enterprise use?**  
A: Consolidated frontend/backend code, deterministic setup steps, and support for local data/model workflows.

---

## 2) Solution Architecture

### High-Level Architecture
```
Browser (User)
   |
   v
Next.js Frontend (src/frontend, port 3000)
   |
   v
FastAPI Backend (src/backend, port 8010)
   |-----------------------------|
   |                             |
Embeddings / RAG flows       LLM inference calls
(sentence-transformers,       (Ollama endpoint)
 Milvus)
```

### Key Architectural Characteristics
- **Local-first runtime**: optimized for local development and testing
- **Single backend API surface**: one FastAPI app exposing embed/rag/llm routes
- **Frontend-backend separation**: clean UI and API layers under `src/`
- **Dependency reproducibility**: pinned Python dependencies and package-lock for frontend
- **GPU-capable pipeline**: setup supports CUDA-enabled workflows where available

### Repository Structure
```
localAI/
├── src/
│   ├── frontend/           # Next.js app (UI)
│   └── backend/            # FastAPI app (API + AI orchestration + requirements.txt)
├── scripts/                # validation and helper scripts
├── setup/                  # environment/bootstrap manifests and scripts
└── README.md
```

---

## 3) Functional Working of the App

### Frontend Applications
The frontend provides three core functional experiences:

1. **Embeddings Explorer** (`/embeddings`)
   - accepts two text inputs
   - calls backend embedding endpoint
   - calculates and displays cosine similarity
   - shows model and embedding metadata

2. **LLM Playground** (`/llm-playground`)
   - accepts natural language prompt
   - submits request to backend RAG/LLM path
   - displays generated answer with response metrics

3. **RAG Application** (`/rag-app`)
   - uploads and ingests documents
   - performs question answering over indexed content
   - displays generated answer and retrieved context
   - supports collection reset and document listing

### Backend API Responsibilities
`src/backend` centralizes all application behavior:
- route registration (`main.py`)
- embeddings (`embed.py`)
- retrieval augmented generation (`rag.py`)
- llm proxy/generation (`llm.py`)

### Active API Endpoints
- `GET /health`
- `GET /embed/health`
- `POST /embed`
- `GET /rag/health`
- `POST /rag/ask`
- `POST /rag/ingest`
- `POST /rag/reset`
- `GET /rag/documents`
- `GET /llm/health`
- `POST /llm/chat`

### Request Flow (Typical RAG Query)
1. User asks a question in `/rag-app`
2. Frontend sends request to `POST /rag/ask`
3. Backend embeds the query
4. Backend retrieves top matches from Milvus
5. Backend assembles prompt with context
6. Backend calls LLM endpoint (Ollama)
7. Backend returns generated answer + context
8. Frontend renders answer and sources

---

## 4) Technology Stack

### Frontend (`src/frontend`)
- **Next.js** `16.1.6` (latest installed)
- **React** `19.2.4`
- **React DOM** `19.2.4`
- TypeScript + Tailwind CSS

### Backend (`src/backend`)
- FastAPI + Uvicorn
- sentence-transformers
- pymilvus
- requests + pydantic

### Runtime/Infrastructure
- Python virtual environment (`.venv`)
- Ollama for local generation
- Milvus for vector search
- optional Redis/PostgreSQL via docker compose

---

## 5) Setup Guide (Detailed)

## 5.1 Prerequisites
- Windows with PowerShell
- Python 3.11+ (project currently uses local `.venv`)
- Node.js + npm
- Docker Desktop (for Milvus and related services)
- Ollama installed and running for generation workflows

## 5.2 Clone and Environment
```powershell
cd C:\DevCode\WorkSpaces\WorkSpaces.AI
# repository already located at localAI
cd localAI
```

## 5.3 Python Environment
```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r .\src\backend\requirements.txt
```

## 5.4 Start Backend
```powershell
cd src\backend
..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

Important: do not run `python.exe -m uvicorn ...` unless `python.exe` is the `.venv` interpreter. If you see `No module named uvicorn`, use the full `.venv` path above.

Backend base URL: `http://localhost:8010`

## 5.5 Start Frontend
In a second terminal:
```powershell
cd src\frontend
npm install
npm run dev
```

Frontend URL: `http://localhost:3000`

## 5.6 Frontend Environment Variable
Create `src/frontend/.env.local` (if needed):
```env
NEXT_PUBLIC_API_URL=http://localhost:8010
```

## 5.7 Optional RAG Chunking Settings (Backend)
Token-based chunking with overlap is enabled for `POST /rag/ingest`.

Set these environment variables (optional) before starting backend:
```env
EMBEDDING_MODEL_NAME=all-MiniLM-L6-v2
RAG_CHUNK_TOKENS=max
RAG_CHUNK_OVERLAP=40
MILVUS_TEXT_MAX_BYTES=60000
RAG_INGEST_MAX_TOTAL_BYTES=5000000
```

## 5.8 Optional Infrastructure (Docker)
```powershell
docker compose -f setup\docker-compose.yaml up -d
```

## 5.9 Optional Health Check
```powershell
.\scripts\run-all-checks.ps1
```

---

## 5.10 Validation Status (Latest Run)

Validation executed successfully with both script entrypoints:

```powershell
.\scripts\run-all-checks.ps1
.\scripts\run-all-checks.bat
```

Checks that passed:
- Preflight executable checks
- Python + CUDA detection (`torch 2.10.0+cu126`, CUDA available, NVIDIA GPU detected)
- Docker + Milvus health checks (Milvus/Redis/PostgreSQL/etcd/MinIO running)
- Ollama inference check (`ollama_ok True`)
- FastAPI embed endpoint check (`/embed` responded with model + vector dimensions)

Expected final signal:

```text
[PASS] All checks completed successfully
```

### Failure Triage (Quick)
- If Preflight fails: verify `.venv` exists and Ollama is installed/running.
- If Docker/Milvus fails: run `docker compose -f setup\docker-compose.yaml up -d` and recheck `http://localhost:9091/healthz`.
- If Ollama inference fails: run `ollama list` and confirm `deepseek-coder:6.7b` is available.
- If FastAPI `/embed` fails: start backend via `cd src\backend` and run uvicorn command from section 5.4.

---

## 6) Operational Notes

### Local Development Cycle
1. start backend
2. start frontend
3. iterate feature code
4. validate via UI and API behavior
5. run frontend build before merge

### Build Validation
```powershell
cd src\frontend
npm run build
```

### Backend Syntax Validation
```powershell
.\.venv\Scripts\python.exe -m py_compile src/backend/main.py src/backend/embed.py src/backend/llm.py src/backend/rag.py
```

---

## 7) Security and Data Handling Considerations

- local runtime minimizes external data transfer
- model calls should be reviewed for data classification requirements
- environment variables should be used for runtime endpoints and secrets
- do not commit credentials or secret tokens
- if moving to shared environments, add authn/authz and request auditing

---

## 8) Known Constraints

- backend behavior depends on local runtime services (Milvus/Ollama availability)
- GPU-dependent workloads may degrade to slower CPU execution if CUDA is unavailable
- current setup prioritizes local developer experience over production hardening

---

## 9) Recommended Next Steps

- add API authentication and role-based controls
- add structured logging and trace IDs across frontend/backend
- add automated backend tests for endpoint contracts
- add benchmark profiles for embedding and generation latency
- define production deployment architecture and CI/CD pipeline

---

## 10) Version Snapshot (Current)

- Next.js: `16.1.6`
- React: `19.2.4`
- React DOM: `19.2.4`
- eslint-config-next: `16.1.6`

---

## 11) Quick Start (Two-Terminal)

Terminal 1:
```powershell
cd src\backend
..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --port 8010 --reload
```

Terminal 2:
```powershell
cd src\frontend
npm install
npm run dev
```

Then open: `http://localhost:3000`

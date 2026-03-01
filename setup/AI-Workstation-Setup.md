# AI Workstation Setup — Complete Guide

A fully modern, GPU‑accelerated AI development environment for Windows 11.
This setup includes:

- Latest SDKs & development tools (via Winget)
- NVIDIA CUDA + cuDNN GPU stack
- Python AI environment (PyTorch CUDA, Transformers, FAISS, etc.)
- Local LLM runtimes (Ollama + LM Studio)
- Docker‑based backend services (Redis, PostgreSQL, Milvus)
- Persistent storage on C:\dbstore

This document explains prerequisites, installation steps, execution, and validation.

## 1. Prerequisites

### Hardware
- Windows 11 (22H2 or later)
- NVIDIA GPU (RTX 4060 or better)
- Minimum 32 GB RAM
- At least 200 GB free disk space (on C:\)

### Software
- Windows Package Manager (Winget)
- PowerShell 7+
- Administrator privileges

## 2. Folder Structure

Create persistent storage directories:

C:\dbstore\
    redis\
    postgres\
    milvus\
    minio\ (optional)

## 3. Install Core Development Tools (Winget)

winget import -i winget-packages.json

This installs:
- Visual Studio 2022 Enterprise
- VS Code
- Node.js LTS
- Python 3.13
- .NET SDK 10
- Git + GitHub CLI
- Docker Desktop
- kubectl + Helm
- SQL Server 2022 Developer + SSMS
- 7zip + Oh My Posh

## 4. GPU‑Ready AI Bootstrap Script

Run:

powershell -ExecutionPolicy Bypass -File .\gpu-bootstrap.ps1

Restart after installation.

## 5. Validate GPU Setup

nvidia-smi

python -c "import torch; print(torch.cuda.is_available(), torch.cuda.get_device_name(0))"

Expected:

True RTX 4060

## 6. Docker Backend Services

docker compose up -d  
docker compose down  
docker ps

Services:
- Redis
- PostgreSQL
- Milvus
- Optional: pgAdmin, MinIO

## 7. Service Endpoints

Redis: localhost:6379  
PostgreSQL: localhost:5432  
Milvus: localhost:19530  
Milvus Dashboard: localhost:9091  
pgAdmin: localhost:5050  
MinIO: localhost:9000 / 9001  

## 8. Local LLM Runtimes

Ollama:

ollama run llama3

LM Studio: Launch from Start Menu

## 9. Python AI Environment

C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv

Activate:

C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv\Scripts\Activate.ps1

Install:

pip install langchain langchain-community fastapi uvicorn

## 10. Recommended Project Structure

C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\
    .venv\
    src\
        backend\
        frontend\

## 11. Updating the Environment

winget upgrade --all  
pip install --upgrade pip  
docker compose pull && docker compose up -d

## 12. Troubleshooting

Docker fails → enable WSL2  
CUDA not detected → reboot, update drivers  
Milvus fails → ensure C:\dbstore\milvus exists

## 13. Summary

This setup gives you a full AI development workstation ready for:
- RAG pipelines
- Embedding services
- Local inference endpoints
- AI‑powered web apps
- Fine‑tuning workflows

<#
run-all-checks.ps1

Purpose:
- One-command local stack smoke test for localAI.

Validates:
- Python + PyTorch CUDA availability
- Docker services + Milvus health endpoint
- Ollama model inference
- FastAPI embeddings /embed endpoint

Prerequisites:
- Run from workspace root: C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI
- .venv exists and dependencies installed
- Docker Desktop installed (script starts compose services if needed)
- Ollama installed at: C:\Users\msra\AppData\Local\Programs\Ollama\ollama.exe
- Model available: deepseek-coder:6.7b

Expected runtime:
- Typical warm run: 20-90 seconds
- First run after reboot/model cold start may take longer

Usage:
    .\scripts\run-all-checks.ps1
    .\scripts\run-all-checks.ps1 -SkipFastAPI
    .\scripts\run-all-checks.ps1 -SkipOllama -SkipFastAPI
#>

param(
    [switch]$SkipDocker,
    [switch]$SkipOllama,
    [switch]$SkipFastAPI
)

$ErrorActionPreference = "Stop"

$workspace = "C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI"
$venvPython = Join-Path $workspace ".venv\Scripts\python.exe"
$composeFile = Join-Path $workspace "setup\docker-compose.yaml"
$ollamaExe = "C:\Users\msra\AppData\Local\Programs\Ollama\ollama.exe"
$backendAppDir = Join-Path $workspace "src\backend"

function Write-Section($title) {
    Write-Host "`n=== $title ===" -ForegroundColor Cyan
}

function Write-Pass($msg) {
    Write-Host "[PASS] $msg" -ForegroundColor Green
}

function Write-Fail($msg) {
    Write-Host "[FAIL] $msg" -ForegroundColor Red
}

function Assert-Command($path, $name) {
    if (-not (Test-Path $path)) {
        throw "$name not found at: $path"
    }
}

try {
    $uvicorn = $null
    Write-Section "Preflight"
    Assert-Command $venvPython "Workspace Python"
    if (-not $SkipOllama) {
        Assert-Command $ollamaExe "Ollama"
    }
    Write-Pass "Required executables found"

    Write-Section "Python + CUDA"
    & $venvPython -c "import torch; print('torch', torch.__version__); print('cuda', torch.cuda.is_available()); print('gpu', torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'N/A')"
    if ($LASTEXITCODE -ne 0) { throw "Python CUDA check failed" }
    Write-Pass "PyTorch CUDA check completed"

    if (-not $SkipDocker) {
        Write-Section "Docker + Milvus"
        docker compose -f $composeFile up -d | Out-Null
        docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
        $health = Invoke-RestMethod http://localhost:9091/healthz
        if ($health -eq "OK" -or $health.status -eq "healthy") {
            Write-Pass "Milvus health endpoint is healthy"
        }
        else {
            throw "Milvus health check returned unexpected value: $health"
        }
    }
    else {
        Write-Section "Docker + Milvus"
        Write-Pass "Skipped (SkipDocker switch used)"
    }

    if (-not $SkipOllama) {
        Write-Section "Ollama Inference"
        & $ollamaExe list
        & $venvPython -c "import requests; r=requests.post('http://localhost:11434/api/generate', json={'model':'deepseek-coder:6.7b','prompt':'Write hello world in python','stream':False}, timeout=60); r.raise_for_status(); print('ollama_ok', bool(r.json().get('response')) )"
        if ($LASTEXITCODE -ne 0) { throw "Ollama inference test failed" }
        Write-Pass "Ollama inference successful"
    }
    else {
        Write-Section "Ollama Inference"
        Write-Pass "Skipped (SkipOllama switch used)"
    }

    if (-not $SkipFastAPI) {
        Write-Section "FastAPI /embed"
        $uvicorn = Start-Process -FilePath $venvPython -ArgumentList @("-m", "uvicorn", "main:app", "--app-dir", $backendAppDir, "--port", "8010") -PassThru -WindowStyle Hidden
        $ready = $false
        for ($attempt = 1; $attempt -le 30; $attempt++) {
            Start-Sleep -Seconds 2
            try {
                $null = Invoke-RestMethod -Method Post -Uri http://localhost:8010/embed -ContentType "application/json" -Body '{"texts":["health check"]}' -TimeoutSec 5
                $ready = $true
                break
            }
            catch {
                if ($uvicorn.HasExited) {
                    throw "FastAPI server exited before becoming ready"
                }
            }
        }

        if (-not $ready) {
            throw "FastAPI server did not become ready within timeout"
        }

        $embedResult = Invoke-RestMethod -Method Post -Uri http://localhost:8010/embed -ContentType "application/json" -Body '{"texts":["GPU validated","Milvus healthy"]}' -TimeoutSec 15
        if ($embedResult.model -and $embedResult.dim -gt 0 -and $embedResult.embeddings.Count -eq 2) {
            Write-Pass "Embed API responded (model=$($embedResult.model), dim=$($embedResult.dim), vectors=$($embedResult.embeddings.Count))"
        }
        else {
            throw "Embed API response shape unexpected"
        }

        if ($uvicorn -and -not $uvicorn.HasExited) {
            Stop-Process -Id $uvicorn.Id -Force
        }
    }
    else {
        Write-Section "FastAPI /embed"
        Write-Pass "Skipped (SkipFastAPI switch used)"
    }

    Write-Section "Summary"
    Write-Pass "All checks completed successfully"
    exit 0
}
catch {
    Write-Fail $_.Exception.Message
    exit 1
}
finally {
    if ($uvicorn -and -not $uvicorn.HasExited) {
        Stop-Process -Id $uvicorn.Id -Force
    }
}

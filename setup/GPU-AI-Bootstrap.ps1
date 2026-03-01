# ================================
# GPU-READY AI DEV BOOTSTRAP SCRIPT
# For NVIDIA RTX 4060 (16GB VRAM)
# ================================

Write-Host "Starting GPU-ready AI environment setup..." -ForegroundColor Cyan

# -------------------------------
# 1. Install CUDA Toolkit (Latest)
# -------------------------------
$cudaUrl = "https://developer.download.nvidia.com/compute/cuda/12.6.2/local_installers/cuda_12.6.2_560.94_windows.exe"
$cudaInstaller = "$env:TEMP\cuda_installer.exe"

Write-Host "Downloading CUDA Toolkit..." -ForegroundColor Yellow
Invoke-WebRequest -Uri $cudaUrl -OutFile $cudaInstaller

Write-Host "Installing CUDA Toolkit..." -ForegroundColor Yellow
Start-Process -FilePath $cudaInstaller -ArgumentList "-s", "-n", "-installdir `"C:\NVIDIA\CUDA\v12.6`"" -Wait

# -------------------------------
# 2. Install cuDNN (Latest)
# -------------------------------
Write-Host "Installing cuDNN..." -ForegroundColor Yellow

$cuDnnZip = "$env:TEMP\cudnn.zip"
$cuDnnUrl = "https://developer.download.nvidia.com/compute/cudnn/redist/cudnn/windows-x86_64/cudnn-windows-x86_64-9.5.1.17_cuda12-archive.zip"

Invoke-WebRequest -Uri $cuDnnUrl -OutFile $cuDnnZip
Expand-Archive -Path $cuDnnZip -DestinationPath "$env:TEMP\cudnn" -Force

$cudaBase = "C:\NVIDIA\CUDA\v12.6"

Copy-Item "$env:TEMP\cudnn\cudnn-windows-x86_64-*\bin\*"     "$cudaBase\bin"     -Force
Copy-Item "$env:TEMP\cudnn\cudnn-windows-x86_64-*\include\*" "$cudaBase\include" -Force
Copy-Item "$env:TEMP\cudnn\cudnn-windows-x86_64-*\lib\*"     "$cudaBase\lib\x64" -Force

# -------------------------------
# 3. Add CUDA to PATH
# -------------------------------
Write-Host "Configuring CUDA environment variables..." -ForegroundColor Yellow

[Environment]::SetEnvironmentVariable("CUDA_PATH", $cudaBase, "Machine")

$paths = @(
  "$cudaBase\bin",
  "$cudaBase\libnvvp"
)

foreach ($p in $paths) {
  if (-not ($env:Path -split ";" | Where-Object { $_ -eq $p })) {
    [Environment]::SetEnvironmentVariable("Path", "$env:Path;$p", "Machine")
    Write-Host "  Added to PATH: $p" -ForegroundColor Green
  }
}

# -------------------------------
# 4. Create Python Virtual Environment
# -------------------------------
Write-Host "Creating Python virtual environment at C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv..." -ForegroundColor Yellow

New-Item -ItemType Directory -Force -Path "C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv" | Out-Null
py -m venv "C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv"

# Activate venv for this session
& "C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv\Scripts\Activate.ps1"

# Upgrade pip
py -m pip install --upgrade pip

# -------------------------------
# 5. Install PyTorch (CUDA 12.4)
# -------------------------------
Write-Host "Installing PyTorch with CUDA 12.4 support..." -ForegroundColor Yellow

pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu126

# -------------------------------
# 6. Install AI / ML Packages
# -------------------------------
Write-Host "Installing AI/ML packages..." -ForegroundColor Yellow

pip install `
  transformers `
  datasets `
  accelerate `
  peft `
  bitsandbytes `
  sentence-transformers `
  faiss-cpu `
  langchain `
  langchain-community `
  openai `
  fastapi `
  uvicorn `
  pymilvus `
  redis `
  psycopg2-binary

# -------------------------------
# 7. Scaffold Project Directories
# -------------------------------
Write-Host "Creating project directory structure..." -ForegroundColor Yellow

$dirs = @(
  "C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\src\backend",
  "C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\src\frontend"
)

foreach ($d in $dirs) {
  New-Item -ItemType Directory -Force -Path $d | Out-Null
  Write-Host "  Created: $d" -ForegroundColor Green
}

# -------------------------------
# 8. Done
# -------------------------------
Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " GPU-ready AI environment setup complete! " -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "  1. REBOOT to apply CUDA PATH changes" -ForegroundColor Yellow
Write-Host "  2. Activate venv:  C:\DevCode\WorkSpaces\WorkSpaces.AI\localAI\.venv\Scripts\Activate.ps1" -ForegroundColor White
Write-Host "  3. Verify GPU:     python -c `"import torch; print(torch.cuda.is_available())`"" -ForegroundColor White
Write-Host "  4. Start Docker:   docker compose up -d" -ForegroundColor White

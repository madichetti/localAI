@echo off
REM run-all-checks.bat
REM One-click PowerShell wrapper for run-all-checks.ps1

cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File ".\run-all-checks.ps1" %*

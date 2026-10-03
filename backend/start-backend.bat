@echo off
cd /d "%~dp0"
echo Starting MathVox API on http://127.0.0.1:8080
echo Keep this window open. Press Ctrl+C to stop.
if exist "venv\Scripts\python.exe" (
  set "PYTHON=venv\Scripts\python.exe"
) else (
  set "PYTHON=python"
)
"%PYTHON%" -m uvicorn app.main:app --host 127.0.0.1 --port 8080
if errorlevel 1 (
  echo.
  echo Backend failed to start. Install dependencies with: python -m pip install -r requirements.txt
)
pause

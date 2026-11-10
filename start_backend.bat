@echo off
title Animal Classification Backend

cd /d "%~dp0backend"

echo Starting Animal Classification API...

"%~dp0.venv\Scripts\python.exe" -m uvicorn app:app --host 127.0.0.1 --port 8000

pause
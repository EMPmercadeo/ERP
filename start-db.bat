@echo off
echo ==========================================
echo   ERP PANAMA - STARTING DATABASE
echo ==========================================
echo.
echo Navigate to project folder...
cd /d "%~dp0"

echo.
echo Attempting to start Docker containers...
docker compose -f docker/docker-compose.yml up -d

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Failed to run 'docker compose'.
    echo.
    echo POSIBLES SOLUCIONES / POSSIBLE SOLUTIONS:
    echo 1. Asegurate de tener Docker Desktop instalado.
    echo 2. Asegurate de que Docker Desktop este ABIERTO y corriendo (mira el icono de la ballena).
    echo.
    echo Press any key to exit...
    pause >nul
    exit /b 1
)

echo.
echo [SUCCESS] Database is running!
echo You can now use the application.
echo.
timeout /t 5

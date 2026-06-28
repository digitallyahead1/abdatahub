@echo off
REM Start all services for AB Data Hub on Windows

echo.
echo 🚀 Starting AB Data Hub Services...
echo.

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker is not running. Please start Docker first.
    exit /b 1
)

REM Start Docker Compose services
echo 📦 Starting Docker services (PostgreSQL, Redis, etc.)...
docker-compose up -d

REM Wait for services to be ready
echo.
echo ⏳ Waiting for services to be ready...
timeout /t 5 /nobreak

REM Start backend in new window
echo.
echo 🔧 Starting Backend API...
start "Backend" cmd /k "cd backend && npm run start:dev"

REM Wait a moment
timeout /t 3 /nobreak

REM Start frontend in new window
echo.
echo 🎨 Starting Frontend...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ✨ Services started in separate windows!
echo.
echo 📍 Access URLs:
echo    Frontend:        http://localhost:3000
echo    Backend API:     http://localhost:3001
echo    API Docs:        http://localhost:3001/api/docs
echo    PgAdmin:         http://localhost:5050
echo    Redis Commander: http://localhost:8081
echo.
echo 💡 Tip: Close the terminal windows to stop services
echo.
pause

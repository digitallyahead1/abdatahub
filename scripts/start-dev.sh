#!/bin/bash
# Start all services for AB Data Hub

echo "🚀 Starting AB Data Hub Services..."
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker first."
  exit 1
fi

# Start Docker Compose services
echo "📦 Starting Docker services (PostgreSQL, Redis, etc.)..."
docker-compose up -d

# Wait for services to be ready
echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Start backend
echo ""
echo "🔧 Starting Backend API..."
cd backend
npm run start:dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to initialize
sleep 3

# Start frontend
echo ""
echo "🎨 Starting Frontend..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo ""
echo "✨ Services started!"
echo ""
echo "📍 Access URLs:"
echo "   Frontend:        http://localhost:3000"
echo "   Backend API:     http://localhost:3001"
echo "   API Docs:        http://localhost:3001/api/docs"
echo "   PgAdmin:         http://localhost:5050"
echo "   Redis Commander: http://localhost:8081"
echo ""
echo "🛑 To stop all services, press Ctrl+C"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID

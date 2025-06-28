#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform - Start Script
# ====================================

echo "======================================"
echo " Starting COAS TEAM OSINT Platform"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if already running
if [ -f backend.pid ]; then
    PID=$(cat backend.pid)
    if ps -p $PID > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Backend is already running (PID: $PID)${NC}"
        exit 1
    fi
fi

# Start backend
echo "🔧 Starting backend server..."
node run-backend-simple.js > backend.log 2>&1 &
BACKEND_PID=$!

# Check if backend started successfully
sleep 2
if ps -p $BACKEND_PID > /dev/null; then
    echo $BACKEND_PID > backend.pid
    echo -e "${GREEN}✓ Backend started successfully (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}✗ Backend failed to start${NC}"
    exit 1
fi

# Wait a bit for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 2

# Check backend health
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed (but it might still be starting)${NC}"
fi

# Start frontend
echo ""
echo "🎨 Starting frontend server..."
cd frontend && npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

# Check if frontend started
sleep 3
if ps -p $FRONTEND_PID > /dev/null; then
    echo $FRONTEND_PID > frontend.pid
    echo -e "${GREEN}✓ Frontend started successfully (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}✗ Frontend failed to start${NC}"
    echo "Check frontend.log for errors"
    # Kill backend if frontend fails
    kill $BACKEND_PID 2>/dev/null
    rm backend.pid
    exit 1
fi

# Success message
echo ""
echo "======================================"
echo -e "${GREEN}✅ COAS TEAM OSINT Platform is running!${NC}"
echo "======================================"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 API Health: http://localhost:3001/api/health"
echo ""
echo "📝 Logs:"
echo "   - Backend: tail -f backend.log"
echo "   - Frontend: tail -f frontend.log"
echo ""
echo "🛑 To stop: ./stop.sh"
echo ""
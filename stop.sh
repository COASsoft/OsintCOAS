#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform - Stop Script
# ====================================

echo "======================================"
echo " Stopping COAS TEAM OSINT Platform"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

STOPPED_SOMETHING=false

# Stop backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo "🔧 Stopping backend (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
        sleep 1
        
        # Force kill if still running
        if ps -p $BACKEND_PID > /dev/null 2>&1; then
            kill -9 $BACKEND_PID 2>/dev/null
        fi
        
        echo -e "${GREEN}✓ Backend stopped${NC}"
        STOPPED_SOMETHING=true
    else
        echo -e "${YELLOW}ℹ️  Backend was not running (PID: $BACKEND_PID)${NC}"
    fi
    rm -f backend.pid
else
    echo -e "${YELLOW}ℹ️  No backend.pid file found${NC}"
fi

# Stop frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo "🎨 Stopping frontend (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
        sleep 1
        
        # Force kill if still running
        if ps -p $FRONTEND_PID > /dev/null 2>&1; then
            kill -9 $FRONTEND_PID 2>/dev/null
        fi
        
        echo -e "${GREEN}✓ Frontend stopped${NC}"
        STOPPED_SOMETHING=true
    else
        echo -e "${YELLOW}ℹ️  Frontend was not running (PID: $FRONTEND_PID)${NC}"
    fi
    rm -f frontend.pid
else
    echo -e "${YELLOW}ℹ️  No frontend.pid file found${NC}"
fi

# Clean up any orphaned processes on our ports
echo ""
echo "🧹 Cleaning up any remaining processes..."

# Kill ALL processes on ports 3000-3010 (Next.js likes to use fallback ports)
for port in {3000..3010}; do
    if lsof -ti:$port > /dev/null 2>&1; then
        echo "Found process on port $port, stopping..."
        lsof -ti:$port | xargs kill -9 2>/dev/null
        echo -e "${GREEN}✓ Port $port cleared${NC}"
        STOPPED_SOMETHING=true
    fi
done

# Also kill port 3001 (backend)
if lsof -ti:3001 > /dev/null 2>&1; then
    echo "Found process on port 3001, stopping..."
    lsof -ti:3001 | xargs kill -9 2>/dev/null
    echo -e "${GREEN}✓ Port 3001 cleared${NC}"
    STOPPED_SOMETHING=true
fi

# Kill any remaining Next.js dev servers
pkill -f "next dev" 2>/dev/null && echo -e "${GREEN}✓ Killed Next.js dev processes${NC}"

# Final message
echo ""
if [ "$STOPPED_SOMETHING" = true ]; then
    echo "======================================"
    echo -e "${GREEN}✅ COAS TEAM OSINT Platform stopped${NC}"
    echo "======================================"
else
    echo "======================================"
    echo -e "${YELLOW}ℹ️  Platform was already stopped${NC}"
    echo "======================================"
fi
echo ""
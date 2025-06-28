#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform - Status Check
# ====================================

echo "======================================"
echo " COAS TEAM OSINT Platform Status"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check backend
echo "🔧 Backend Status:"
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓ Running${NC} (PID: $BACKEND_PID)"
        
        # Check API health
        if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
            echo -e "   ${GREEN}✓ API Healthy${NC}"
            
            # Get API info
            HEALTH=$(curl -s http://localhost:3001/api/health)
            if [ ! -z "$HEALTH" ]; then
                echo -e "   ${BLUE}ℹ️  API Response:${NC}"
                echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"
            fi
        else
            echo -e "   ${RED}✗ API Not Responding${NC}"
        fi
    else
        echo -e "   ${RED}✗ Not Running${NC} (stale PID file)"
        rm -f backend.pid
    fi
else
    # Check if running without PID file
    if lsof -ti:3001 > /dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠️  Running without PID file${NC}"
        echo "   Process on port 3001: $(lsof -ti:3001)"
    else
        echo -e "   ${RED}✗ Not Running${NC}"
    fi
fi

echo ""

# Check frontend
echo "🎨 Frontend Status:"
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null 2>&1; then
        echo -e "   ${GREEN}✓ Running${NC} (PID: $FRONTEND_PID)"
        
        # Check if responding
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            echo -e "   ${GREEN}✓ Web Interface Accessible${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Starting up...${NC}"
        fi
    else
        echo -e "   ${RED}✗ Not Running${NC} (stale PID file)"
        rm -f frontend.pid
    fi
else
    # Check if running without PID file
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠️  Running without PID file${NC}"
        echo "   Process on port 3000: $(lsof -ti:3000)"
    else
        echo -e "   ${RED}✗ Not Running${NC}"
    fi
fi

echo ""

# Check ports
echo "🔌 Port Status:"
echo -n "   Port 3000 (Frontend): "
if lsof -ti:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}In Use${NC}"
else
    echo -e "${YELLOW}Free${NC}"
fi

echo -n "   Port 3001 (Backend): "
if lsof -ti:3001 > /dev/null 2>&1; then
    echo -e "${GREEN}In Use${NC}"
else
    echo -e "${YELLOW}Free${NC}"
fi

echo ""

# Check logs
echo "📝 Recent Log Activity:"
if [ -f backend.log ]; then
    echo "   Backend Log (last 3 lines):"
    tail -3 backend.log | sed 's/^/     /'
else
    echo "   No backend.log found"
fi

echo ""

if [ -f frontend.log ]; then
    echo "   Frontend Log (last 3 lines):"
    tail -3 frontend.log | sed 's/^/     /'
else
    echo "   No frontend.log found"
fi

echo ""

# Summary
echo "======================================"
BACKEND_RUNNING=false
FRONTEND_RUNNING=false

if [ -f backend.pid ] && ps -p $(cat backend.pid) > /dev/null 2>&1; then
    BACKEND_RUNNING=true
fi

if [ -f frontend.pid ] && ps -p $(cat frontend.pid) > /dev/null 2>&1; then
    FRONTEND_RUNNING=true
fi

if [ "$BACKEND_RUNNING" = true ] && [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${GREEN}✅ Platform is RUNNING${NC}"
    echo ""
    echo "🌐 Access at: http://localhost:3000"
elif [ "$BACKEND_RUNNING" = true ] || [ "$FRONTEND_RUNNING" = true ]; then
    echo -e "${YELLOW}⚠️  Platform is PARTIALLY RUNNING${NC}"
    echo ""
    echo "Run ./stop.sh and then ./start.sh to restart"
else
    echo -e "${RED}✗ Platform is STOPPED${NC}"
    echo ""
    echo "Run ./start.sh to start the platform"
fi
echo "======================================"
echo ""
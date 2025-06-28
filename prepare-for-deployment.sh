#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform
# Deployment Preparation Script
# ====================================

echo "======================================"
echo " Preparing COAS TEAM OSINT Platform"
echo " for deployment/storage"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Stop any running services
echo "🛑 Stopping services..."
./stop.sh 2>/dev/null || true

# Clean up temporary files
echo ""
echo "🧹 Cleaning temporary files..."
rm -f *.pid
rm -f frontend/.next/trace
find . -name "*.tmp" -delete 2>/dev/null || true
find . -name ".DS_Store" -delete 2>/dev/null || true

# Clean node_modules if requested
echo ""
read -p "Remove node_modules to save space? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "📦 Removing node_modules..."
    rm -rf frontend/node_modules
    echo -e "${GREEN}✓${NC} node_modules removed (run install.sh to restore)"
fi

# Create final backup
echo ""
read -p "Create final backup? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    ./backup.sh
fi

# Make all scripts executable
echo ""
echo "🔧 Setting permissions..."
chmod +x *.sh 2>/dev/null || true

# Create quick reference
echo ""
echo "📚 Creating quick reference..."
cat > QUICK_START.txt << 'EOF'
COAS TEAM OSINT PLATFORM - QUICK START
=====================================

1. FIRST TIME SETUP:
   ./install.sh

2. START THE PLATFORM:
   ./start.sh              (development)
   ./start-production.sh   (production)

3. ACCESS:
   Frontend: http://localhost:3000
   Backend:  http://localhost:3001

4. STOP:
   ./stop.sh

5. BACKUP:
   ./backup.sh

6. VIEW LOGS:
   tail -f backend.log
   tail -f frontend.log

FEATURES:
- 34 OSINT Tools
- Real Data Integration
- Automatic Reports
- Professional UI
- Export to PDF/JSON/CSV/HTML

For detailed documentation, see PROJECT_DOCUMENTATION.md
EOF

# Final summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Platform prepared successfully!${NC}"
echo "======================================"
echo ""
echo "📋 Current Status:"
echo "   - Services: Stopped"
echo "   - Logs: Preserved"
echo "   - Scripts: Executable"
echo "   - Documentation: Complete"
echo ""
echo "📦 Total size:"
du -sh .
echo ""
echo "🚀 To deploy or share:"
echo "   1. Create backup: ./backup.sh"
echo "   2. Share the .tar.gz file from backups/"
echo "   3. Recipient runs: ./install.sh"
echo ""
echo -e "${YELLOW}ℹ️  Remember to export browser data!${NC}"
echo "   Instructions in any backup's data/ folder"
echo ""
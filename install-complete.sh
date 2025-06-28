#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform - Complete Installer
# Version: 2.0
# Installs: Infoooze + Web Platform
# ====================================

echo "======================================"
echo " COAS TEAM OSINT Platform"
echo " Complete Installation Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_step() {
    echo -e "${BLUE}===> $1${NC}"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please do not run this installer as root!"
   exit 1
fi

# ====================================
# STEP 1: Install System Dependencies
# ====================================
print_step "Step 1/4: Checking system dependencies..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_success "Node.js installed (v$NODE_VERSION)"
    
    # Check if version is 16 or higher
    REQUIRED_VERSION=16
    CURRENT_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ $CURRENT_VERSION -lt $REQUIRED_VERSION ]; then
        print_error "Node.js version must be 16 or higher. Current: v$NODE_VERSION"
        echo "Please update Node.js: https://nodejs.org/"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 16+ first."
    echo ""
    echo "Installation options:"
    echo "1. Using NodeSource (recommended):"
    echo "   curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -"
    echo "   sudo apt-get install -y nodejs"
    echo ""
    echo "2. Using NVM:"
    echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
    echo "   nvm install --lts"
    echo ""
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    print_success "npm installed (v$NPM_VERSION)"
else
    print_error "npm is not installed."
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    print_success "Git installed"
else
    print_info "Git not installed (optional but recommended)"
fi

# ====================================
# STEP 2: Install Infoooze OSINT Tool
# ====================================
print_step "Step 2/4: Installing Infoooze OSINT tool..."

# Check if infoooze is already installed
if command -v infoooze &> /dev/null; then
    INFOOOZE_VERSION=$(infoooze --version 2>/dev/null || echo "unknown")
    print_info "Infoooze already installed (version: $INFOOOZE_VERSION)"
    print_info "Skipping Infoooze installation..."
else
    echo "Installing Infoooze from NPM..."
    if npm install -g infoooze; then
        print_success "Infoooze installed successfully"
        
        # Verify installation
        if command -v infoooze &> /dev/null; then
            print_success "Infoooze command available at: $(which infoooze)"
        else
            print_error "Infoooze installed but command not found in PATH"
            echo "You may need to add npm global bin to your PATH"
            echo "Try: export PATH=$PATH:$(npm config get prefix)/bin"
        fi
    else
        print_error "Failed to install Infoooze"
        echo ""
        echo "Try manual installation:"
        echo "1. sudo npm install -g infoooze"
        echo "2. Or clone from GitHub: https://github.com/devxprite/infoooze"
        exit 1
    fi
fi

# Test Infoooze
echo ""
echo "Testing Infoooze installation..."
if infoooze -h &> /dev/null; then
    print_success "Infoooze is working correctly"
else
    print_error "Infoooze test failed"
    echo "Please check the installation manually"
fi

# ====================================
# STEP 3: Install Web Platform
# ====================================
print_step "Step 3/4: Installing COAS TEAM web platform..."

# Install frontend dependencies
echo ""
echo "Installing frontend dependencies..."
cd frontend
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend for production
echo ""
echo "Building frontend..."
if npm run build; then
    print_success "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi

cd ..

# ====================================
# STEP 4: Final Setup
# ====================================
print_step "Step 4/4: Finalizing setup..."

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p data
mkdir -p results
mkdir -p backups
print_success "Directories created"

# Create environment file if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo "Creating environment configuration..."
    cat > frontend/.env.local << EOF
# COAS TEAM OSINT Platform Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=COAS TEAM
NEXT_PUBLIC_APP_VERSION=2.0
EOF
    print_success "Environment configuration created"
fi

# Create start/stop scripts
echo "Creating control scripts..."

# Create unified start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "Starting COAS TEAM OSINT Platform..."
echo ""

# Check if infoooze is available
if ! command -v infoooze &> /dev/null; then
    echo "❌ Error: Infoooze is not installed!"
    echo "Please run ./install-complete.sh first"
    exit 1
fi

# Start backend
echo "🔧 Starting backend server..."
node run-backend-simple.js > backend.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > backend.pid
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "❌ Backend failed to start. Check backend.log for errors"
    exit 1
fi

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend && npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > ../frontend.pid
echo "Frontend started with PID: $FRONTEND_PID"

echo ""
echo "✅ COAS TEAM OSINT Platform is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "📋 Available OSINT tools: 34"
echo "🔍 Infoooze CLI: $(which infoooze)"
echo ""
echo "To stop the platform, run: ./stop.sh"
echo "To view logs: tail -f backend.log or tail -f frontend.log"
EOF

# Create stop script
cat > stop.sh << 'EOF'
#!/bin/bash

echo "Stopping COAS TEAM OSINT Platform..."

# Stop backend
if [ -f backend.pid ]; then
    BACKEND_PID=$(cat backend.pid)
    if ps -p $BACKEND_PID > /dev/null; then
        kill $BACKEND_PID
        echo "✓ Backend stopped"
    fi
    rm backend.pid
fi

# Stop frontend
if [ -f frontend.pid ]; then
    FRONTEND_PID=$(cat frontend.pid)
    if ps -p $FRONTEND_PID > /dev/null; then
        kill $FRONTEND_PID
        echo "✓ Frontend stopped"
    fi
    rm frontend.pid
fi

# Kill any remaining node processes on our ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null

echo "✅ Platform stopped"
EOF

# Make scripts executable
chmod +x start.sh
chmod +x stop.sh
chmod +x install.sh
chmod +x install-complete.sh

print_success "Control scripts created"

# Create a quick test script
cat > test-platform.sh << 'EOF'
#!/bin/bash

echo "🧪 Testing COAS TEAM OSINT Platform..."
echo ""

# Test backend
echo "Testing backend API..."
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend is responding"
else
    echo "❌ Backend is not responding"
fi

# Test frontend
echo "Testing frontend..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend is responding"
else
    echo "❌ Frontend is not responding"
fi

# Test Infoooze
echo "Testing Infoooze CLI..."
if infoooze -h > /dev/null 2>&1; then
    echo "✅ Infoooze CLI is working"
else
    echo "❌ Infoooze CLI is not working"
fi

echo ""
echo "Test complete!"
EOF

chmod +x test-platform.sh

# ====================================
# Installation Summary
# ====================================
echo ""
echo "✅ ============================================="
echo "✅ Installation completed successfully!"
echo "✅ ============================================="
echo ""
echo "📋 Installed components:"
echo "   • Infoooze OSINT CLI tool"
echo "   • COAS TEAM Web Platform"
echo "   • 34 OSINT tools ready to use"
echo ""
echo "🚀 Quick Start:"
echo "   1. Start the platform:  ./start.sh"
echo "   2. Open browser:        http://localhost:3000"
echo "   3. Test the platform:   ./test-platform.sh"
echo "   4. Stop the platform:   ./stop.sh"
echo ""
echo "📖 Documentation:"
echo "   • README.md - Full documentation"
echo "   • Infoooze help: infoooze -h"
echo ""
echo "🎉 Welcome to COAS TEAM OSINT Platform!"
echo ""
#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform - Installer
# Version: 2.0
# ====================================

echo "======================================"
echo " COAS TEAM OSINT Platform Installer"
echo " Version 2.0 - Professional Edition"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
   echo "⚠️  Please do not run this installer as root!"
   exit 1
fi

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
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

# Check system requirements
echo "📋 Checking system requirements..."

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d'v' -f2)
    print_success "Node.js installed (v$NODE_VERSION)"
    
    # Check if version is 18 or higher
    REQUIRED_VERSION=18
    CURRENT_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1)
    if [ $CURRENT_VERSION -lt $REQUIRED_VERSION ]; then
        print_error "Node.js version must be 18 or higher. Current: v$NODE_VERSION"
        exit 1
    fi
else
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
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

# Check Git (optional but recommended)
if command -v git &> /dev/null; then
    print_success "Git installed"
else
    print_info "Git not installed (optional)"
fi

echo ""
echo "📦 Installing dependencies..."
echo ""

# Install frontend dependencies
echo "🎨 Installing frontend dependencies..."
cd frontend
if npm install; then
    print_success "Frontend dependencies installed"
else
    print_error "Failed to install frontend dependencies"
    exit 1
fi

# Build frontend for production
echo ""
echo "🔨 Building frontend for production..."
if npm run build; then
    print_success "Frontend built successfully"
else
    print_error "Failed to build frontend"
    exit 1
fi

cd ..

# Create necessary directories
echo ""
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data
mkdir -p backups
print_success "Directories created"

# Create environment file if it doesn't exist
if [ ! -f "frontend/.env.local" ]; then
    echo ""
    echo "🔧 Creating environment configuration..."
    cat > frontend/.env.local << EOF
# COAS TEAM OSINT Platform Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=COAS TEAM
NEXT_PUBLIC_APP_VERSION=2.0
EOF
    print_success "Environment configuration created"
fi

# Create startup scripts
echo ""
echo "🚀 Creating startup scripts..."

# Create start script
cat > start.sh << 'EOF'
#!/bin/bash

echo "Starting COAS TEAM OSINT Platform..."
echo ""

# Start backend
echo "🔧 Starting backend server..."
node run-backend-simple.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Start frontend
echo "🎨 Starting frontend server..."
cd frontend && npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo ""
echo "✅ COAS TEAM OSINT Platform is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "To stop the platform, run: ./stop.sh"
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

# Create production start script
cat > start-production.sh << 'EOF'
#!/bin/bash

echo "Starting COAS TEAM OSINT Platform (Production Mode)..."
echo ""

# Start backend
echo "🔧 Starting backend server..."
NODE_ENV=production node run-backend-simple.js > backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
sleep 3

# Start frontend in production mode
echo "🎨 Starting frontend server (production)..."
cd frontend && npm run start > ../frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend started with PID: $FRONTEND_PID"

# Save PIDs
echo $BACKEND_PID > ../backend.pid
echo $FRONTEND_PID > ../frontend.pid

echo ""
echo "✅ COAS TEAM OSINT Platform is running in production mode!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "To stop the platform, run: ./stop.sh"
EOF

# Make scripts executable
chmod +x start.sh
chmod +x stop.sh
chmod +x start-production.sh

print_success "Startup scripts created"

# Create systemd service (optional)
echo ""
read -p "Do you want to install as a system service? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cat > coas-osint.service << EOF
[Unit]
Description=COAS TEAM OSINT Platform
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
ExecStart=$(pwd)/start-production.sh
ExecStop=$(pwd)/stop.sh
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF
    
    print_info "Service file created. To install:"
    echo "  sudo cp coas-osint.service /etc/systemd/system/"
    echo "  sudo systemctl enable coas-osint"
    echo "  sudo systemctl start coas-osint"
fi

echo ""
echo "✅ Installation completed successfully!"
echo ""
echo "📚 Quick Start Guide:"
echo "   1. Start the platform:  ./start.sh"
echo "   2. Open your browser:   http://localhost:3000"
echo "   3. Stop the platform:   ./stop.sh"
echo ""
echo "📖 For production deployment: ./start-production.sh"
echo ""
echo "🎉 Welcome to COAS TEAM OSINT Platform!"
echo ""
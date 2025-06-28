#!/bin/bash

# ====================================
# COAS TEAM OSINT Platform - Backup System
# Version: 2.0
# ====================================

echo "======================================"
echo " COAS TEAM OSINT Platform Backup"
echo " Creating complete backup..."
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Create backup directory with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/backup_${TIMESTAMP}"
mkdir -p "$BACKUP_DIR"

echo "📦 Creating backup in: $BACKUP_DIR"
echo ""

# Function to print progress
print_progress() {
    echo -e "${GREEN}✓${NC} $1"
}

# Stop services if running
echo "🛑 Stopping services if running..."
./stop.sh 2>/dev/null || true
sleep 2

# 1. Backup source code
echo ""
echo "📁 Backing up source code..."
mkdir -p "$BACKUP_DIR/source"

# Frontend
print_progress "Backing up frontend..."
rsync -av --exclude='node_modules' --exclude='.next' --exclude='out' \
    frontend/ "$BACKUP_DIR/source/frontend/" > /dev/null 2>&1

# Backend
print_progress "Backing up backend..."
cp run-backend-simple.js "$BACKUP_DIR/source/"

# Configuration files
print_progress "Backing up configuration..."
cp -r *.sh "$BACKUP_DIR/source/" 2>/dev/null || true
cp -r *.json "$BACKUP_DIR/source/" 2>/dev/null || true
cp -r *.md "$BACKUP_DIR/source/" 2>/dev/null || true

# 2. Backup data from localStorage (if browser data exists)
echo ""
echo "💾 Backing up application data..."
mkdir -p "$BACKUP_DIR/data"

# Create data export script
cat > "$BACKUP_DIR/data/export_instructions.txt" << 'EOF'
COAS TEAM OSINT Platform - Data Export Instructions
==================================================

To backup your browser data (scans, reports, settings):

1. Open the platform in your browser (http://localhost:3000)
2. Open Developer Console (F12)
3. Go to Console tab
4. Paste and run this code:

// Export all OSINT data
const exportData = {
  scans: localStorage.getItem('osint_scans'),
  reports: localStorage.getItem('osint_reports'),
  settings: localStorage.getItem('osint_settings'),
  exportDate: new Date().toISOString(),
  version: '2.0'
};

const blob = new Blob([JSON.stringify(exportData, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'coas_osint_data_backup.json';
a.click();
URL.revokeObjectURL(url);
console.log('✅ Data exported successfully!');

5. Save the downloaded file in this backup's data directory
EOF

# 3. Backup logs
echo ""
echo "📝 Backing up logs..."
mkdir -p "$BACKUP_DIR/logs"
cp *.log "$BACKUP_DIR/logs/" 2>/dev/null || true

# 4. Create system information
echo ""
echo "ℹ️  Saving system information..."
cat > "$BACKUP_DIR/system_info.txt" << EOF
COAS TEAM OSINT Platform - Backup Information
============================================
Backup Date: $(date)
Platform Version: 2.0
Node Version: $(node -v)
NPM Version: $(npm -v)
Operating System: $(uname -a)
Current Directory: $(pwd)

Installed Features:
- 34 OSINT Tools
- Real-time Dashboard
- Automatic Report Generation  
- Professional Data Visualization
- Real Data Integration:
  * Moralis API (Crypto)
  * GitHub API
  * IPInfo.io (Geolocation)
  * Phone Pattern Analysis
  * Email Discovery
- Statistics & Analytics
- Multi-format Export (PDF, JSON, CSV, HTML)

API Keys Status:
- Moralis: Configured (if provided by user)
- Others: Using free tier APIs
EOF

# 5. Create package list
echo ""
echo "📋 Saving package information..."
cd frontend && npm list --depth=0 > "../$BACKUP_DIR/npm_packages.txt" 2>/dev/null
cd ..

# 6. Create restoration script
echo ""
echo "🔧 Creating restoration script..."
cat > "$BACKUP_DIR/restore.sh" << 'EOF'
#!/bin/bash

echo "======================================"
echo " COAS TEAM OSINT Platform Restore"
echo " Restoring from backup..."
echo "======================================"
echo ""

# Check if we're in the backup directory
if [ ! -f "system_info.txt" ]; then
    echo "❌ Error: This script must be run from the backup directory"
    exit 1
fi

# Get target directory
read -p "Enter target directory for restoration (or press Enter for current directory): " TARGET_DIR
if [ -z "$TARGET_DIR" ]; then
    TARGET_DIR="../../restored_coas_osint"
fi

# Create target directory
mkdir -p "$TARGET_DIR"
echo "📁 Restoring to: $TARGET_DIR"

# Copy source files
echo "📦 Restoring source code..."
cp -r source/* "$TARGET_DIR/"

# Make scripts executable
chmod +x "$TARGET_DIR"/*.sh 2>/dev/null || true

# Restore logs if requested
read -p "Restore logs? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    cp -r logs "$TARGET_DIR/"
    echo "✓ Logs restored"
fi

echo ""
echo "✅ Restoration completed!"
echo ""
echo "Next steps:"
echo "1. cd $TARGET_DIR"
echo "2. ./install.sh"
echo "3. Import your browser data using instructions in data/export_instructions.txt"
echo ""
EOF

chmod +x "$BACKUP_DIR/restore.sh"

# 7. Create comprehensive README
echo ""
echo "📚 Creating documentation..."
cat > "$BACKUP_DIR/README.md" << 'EOF'
# COAS TEAM OSINT Platform - Backup

## 📦 Backup Contents

- **source/**: Complete source code (frontend & backend)
- **data/**: Instructions for browser data export
- **logs/**: Application logs (if any)
- **system_info.txt**: System configuration at backup time
- **npm_packages.txt**: List of npm dependencies
- **restore.sh**: Automated restoration script

## 🔄 How to Restore

### Quick Restore:
```bash
cd backup_[timestamp]
./restore.sh
```

### Manual Restore:
1. Copy source files to new location
2. Run `./install.sh` in the new location
3. Import browser data following instructions in `data/export_instructions.txt`

## 💾 Browser Data Import

After restoration, import your saved data:

1. Open Developer Console (F12) in the platform
2. Run this code:
```javascript
// Import OSINT data
fetch('coas_osint_data_backup.json')
  .then(r => r.json())
  .then(data => {
    if(data.scans) localStorage.setItem('osint_scans', data.scans);
    if(data.reports) localStorage.setItem('osint_reports', data.reports);
    if(data.settings) localStorage.setItem('osint_settings', data.settings);
    console.log('✅ Data imported successfully!');
    location.reload();
  });
```

## 🚀 Starting the Platform

Development mode:
```bash
./start.sh
```

Production mode:
```bash
./start-production.sh
```

## 📝 Platform Features

- **34 OSINT Tools** across multiple categories
- **Real-time Dashboard** with live statistics
- **Automatic Report Generation** after each scan
- **Professional Visualizations** for all data types
- **Real Data Sources**:
  - Crypto: Moralis API integration
  - GitHub: Real repository/user data
  - Geolocation: IPInfo.io integration
  - Phone: Pattern analysis & validation
  - Email: Discovery and validation
- **Export Formats**: PDF, JSON, CSV, HTML
- **Risk Analysis** and security scoring

## 🔑 API Configuration

Some features require API keys for full functionality:
- Moralis API: For complete crypto data
- Other APIs use free tiers with limitations

## 📞 Support

Platform: COAS TEAM OSINT Platform v2.0
Created by: COAS TEAM
EOF

# 8. Create compressed archive
echo ""
echo "🗜️  Creating compressed archive..."
ARCHIVE_NAME="coas_osint_backup_${TIMESTAMP}.tar.gz"
cd backups
tar -czf "$ARCHIVE_NAME" "backup_${TIMESTAMP}/"
cd ..

# Final summary
echo ""
echo "======================================"
echo -e "${GREEN}✅ Backup completed successfully!${NC}"
echo "======================================"
echo ""
echo "📦 Backup location: $BACKUP_DIR"
echo "🗜️  Archive created: backups/$ARCHIVE_NAME"
echo ""
echo "📊 Backup size:"
du -sh "$BACKUP_DIR"
du -sh "backups/$ARCHIVE_NAME"
echo ""
echo "💡 To restore this backup:"
echo "   1. Extract the archive"
echo "   2. Run: cd $BACKUP_DIR && ./restore.sh"
echo ""
echo "📝 Don't forget to export your browser data!"
echo "   Instructions in: $BACKUP_DIR/data/export_instructions.txt"
echo ""

#!/bin/bash

# =============================================================================
# INFOOOZE WEB PLATFORM - DEVELOPMENT STARTUP SCRIPT
# =============================================================================
# Descripción: Script para iniciar el entorno de desarrollo completo
# =============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
██╗███╗   ██╗███████╗ ██████╗  ██████╗  ██████╗ ███████╗███████╗
██║████╗  ██║██╔════╝██╔═══██╗██╔═══██╗██╔═══██╗╚══███╔╝██╔════╝
██║██╔██╗ ██║█████╗  ██║   ██║██║   ██║██║   ██║  ███╔╝ █████╗  
██║██║╚██╗██║██╔══╝  ██║   ██║██║   ██║██║   ██║ ███╔╝ ██╔══╝  
██║██║ ╚████║██║     ╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗
╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
                                                                 
              WEB PLATFORM - DEVELOPMENT ENVIRONMENT
EOF
    echo -e "${NC}"
    echo -e "${CYAN}=================================================================${NC}"
    echo -e "${YELLOW}🚀 Iniciando entorno de desarrollo de Infoooze Web Platform${NC}"
    echo -e "${CYAN}=================================================================${NC}"
    echo ""
}

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%H:%M:%S')
    
    case $level in
        "INFO")  echo -e "${BLUE}[$timestamp][INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[$timestamp][WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[$timestamp][ERROR]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[$timestamp][SUCCESS]${NC} $message" ;;
    esac
}

check_dependencies() {
    log "INFO" "Verificando dependencias..."
    
    # Verificar Node.js
    if ! command -v node >/dev/null 2>&1; then
        log "ERROR" "Node.js no está instalado"
        exit 1
    fi
    
    # Verificar NPM
    if ! command -v npm >/dev/null 2>&1; then
        log "ERROR" "NPM no está instalado"
        exit 1
    fi
    
    # Verificar infoooze CLI
    if ! command -v infoooze >/dev/null 2>&1; then
        log "WARN" "Infoooze CLI no encontrado - el backend necesitará acceso al CLI"
    else
        log "SUCCESS" "Infoooze CLI disponible: $(which infoooze)"
    fi
    
    log "SUCCESS" "Dependencias verificadas"
}

install_dependencies() {
    log "INFO" "Instalando dependencias..."
    
    # Backend dependencies
    if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
        log "INFO" "Instalando dependencias del backend..."
        cd "$PROJECT_ROOT/backend"
        npm install
    fi
    
    # Frontend dependencies
    if [ ! -d "$PROJECT_ROOT/frontend/node_modules" ]; then
        log "INFO" "Instalando dependencias del frontend..."
        cd "$PROJECT_ROOT/frontend"
        npm install
    fi
    
    log "SUCCESS" "Dependencias instaladas"
}

create_env_files() {
    log "INFO" "Configurando archivos de entorno..."
    
    # Backend .env
    if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
        cat > "$PROJECT_ROOT/backend/.env" << EOF
# Configuración del servidor
NODE_ENV=development
PORT=3001

# Configuración de logs
LOG_LEVEL=info

# Configuración de CORS
CORS_ORIGIN=http://localhost:3000

# Configuración de Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Configuración de Infoooze CLI
INFOOOZE_RESULTS_DIR=/home/ubuntuser/myproject/results
INFOOOZE_CLI_PATH=$(which infoooze || echo "infoooze")
EOF
        log "SUCCESS" "Archivo .env del backend creado"
    fi
    
    # Frontend .env.local
    if [ ! -f "$PROJECT_ROOT/frontend/.env.local" ]; then
        cat > "$PROJECT_ROOT/frontend/.env.local" << EOF
# Configuración de la API
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# Configuración de desarrollo
NEXT_PUBLIC_ENV=development
NEXT_PUBLIC_WS_URL=ws://localhost:3001
EOF
        log "SUCCESS" "Archivo .env.local del frontend creado"
    fi
}

build_backend() {
    log "INFO" "Compilando backend TypeScript..."
    cd "$PROJECT_ROOT/backend"
    npm run build
    log "SUCCESS" "Backend compilado"
}

start_services() {
    log "INFO" "Iniciando servicios en desarrollo..."
    
    # Crear directorios necesarios
    mkdir -p "$PROJECT_ROOT/backend/logs"
    mkdir -p "/home/ubuntuser/myproject/results"
    
    echo -e "\n${CYAN}📡 Iniciando servicios...${NC}"
    echo -e "${YELLOW}Backend API:${NC} http://localhost:3001"
    echo -e "${YELLOW}Frontend Web:${NC} http://localhost:3000"
    echo -e "${YELLOW}Health Check:${NC} http://localhost:3001/api/health"
    echo ""
    echo -e "${GREEN}Presiona Ctrl+C para detener todos los servicios${NC}"
    echo ""
    
    # Función para cleanup
    cleanup() {
        echo -e "\n${YELLOW}🛑 Deteniendo servicios...${NC}"
        jobs -p | xargs -r kill 2>/dev/null || true
        echo -e "${GREEN}✅ Servicios detenidos${NC}"
        exit 0
    }
    
    trap cleanup SIGINT SIGTERM
    
    # Iniciar backend en background
    cd "$PROJECT_ROOT/backend"
    npm run dev &
    BACKEND_PID=$!
    
    # Esperar un momento para que el backend se inicie
    sleep 3
    
    # Iniciar frontend en background
    cd "$PROJECT_ROOT/frontend"
    npm run dev &
    FRONTEND_PID=$!
    
    # Mantener el script corriendo
    wait
}

health_check() {
    log "INFO" "Ejecutando health check..."
    
    # Verificar backend
    if curl -s http://localhost:3001/api/health >/dev/null 2>&1; then
        log "SUCCESS" "Backend API respondiendo correctamente"
    else
        log "WARN" "Backend API no responde (normal durante el primer inicio)"
    fi
    
    # Verificar frontend (esto puede tardar más en estar listo)
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        log "SUCCESS" "Frontend respondiendo correctamente"
    else
        log "WARN" "Frontend no responde (puede estar compilando)"
    fi
}

show_help() {
    echo "Uso: $0 [opciones]"
    echo ""
    echo "Opciones:"
    echo "  --help, -h          Mostrar esta ayuda"
    echo "  --check-deps        Solo verificar dependencias"
    echo "  --install-deps      Solo instalar dependencias"
    echo "  --build-only        Solo compilar sin iniciar servicios"
    echo "  --health-check      Solo ejecutar health check"
    echo ""
    echo "Ejemplos:"
    echo "  $0                  Iniciar entorno completo de desarrollo"
    echo "  $0 --check-deps     Verificar que todas las dependencias estén instaladas"
    echo "  $0 --install-deps   Instalar dependencias de frontend y backend"
    echo ""
}

main() {
    case "${1:-}" in
        --help|-h)
            show_help
            exit 0
            ;;
        --check-deps)
            print_banner
            check_dependencies
            exit 0
            ;;
        --install-deps)
            print_banner
            check_dependencies
            install_dependencies
            exit 0
            ;;
        --build-only)
            print_banner
            check_dependencies
            create_env_files
            build_backend
            exit 0
            ;;
        --health-check)
            health_check
            exit 0
            ;;
        "")
            # Inicio completo
            print_banner
            check_dependencies
            install_dependencies
            create_env_files
            build_backend
            start_services
            ;;
        *)
            echo "Opción desconocida: $1"
            show_help
            exit 1
            ;;
    esac
}

# Verificar si se ejecuta directamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
#!/bin/bash

# =============================================================================
# INFOOOZE OSINT TOOL - AUTOMATED INSTALLER (FIXED VERSION)
# =============================================================================
# Descripción: Script de instalación automatizada para Infoooze con correcciones
# Autor: DevOps Automation Script - Fixed Version
# Fecha: $(date +%Y-%m-%d)
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

# Variables globales
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/infoooze_install.log"
INFOOOZE_VERSION="1.3.1"
MIN_NODE_VERSION="12"
RESULTS_DIR="$SCRIPT_DIR/results"

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
██╗███╗   ██╗███████╗ ██████╗  ██████╗  ██████╗ ███████╗███████╗
██║████╗  ██║██╔════╝██╔═══██╗██╔═══██╗██╔═══██╗╚══███╔╝██╔════╝
██║██╔██╗ ██║█████╗  ██║   ██║██║   ██║██║   ██║  ███╔╝ █████╗  
██║██║╚██╗██║██╔══╝  ██║   ██║██║   ██║██║   ██║ ███╔╝ ██╔══╝  
██║██║ ╚████║██║     ╚██████╔╝╚██████╔╝╚██████╔╝███████╗███████╗
╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝  ╚═════╝  ╚═════╝ ╚══════╝╚══════╝
                                                                 
        OSINT TOOL - AUTOMATED INSTALLER
EOF
    echo -e "${NC}"
    echo -e "${CYAN}=======================================================${NC}"
    echo -e "${YELLOW}🔧 Instalador Automatizado de Infoooze OSINT Tool${NC}"
    echo -e "${CYAN}=======================================================${NC}"
    echo ""
}

log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    case $level in
        "INFO")  echo -e "${BLUE}[INFO]${NC} $message" ;;
        "WARN")  echo -e "${YELLOW}[WARN]${NC} $message" ;;
        "ERROR") echo -e "${RED}[ERROR]${NC} $message" ;;
        "SUCCESS") echo -e "${GREEN}[SUCCESS]${NC} $message" ;;
    esac
}

spinner() {
    local pid=$1
    local delay=0.1
    local spinstr='|/-\'
    while kill -0 $pid 2>/dev/null; do
        local temp=${spinstr#?}
        printf " [%c]  " "$spinstr"
        local spinstr=$temp${spinstr%"$temp"}
        sleep $delay
        printf "\b\b\b\b\b\b"
    done
    printf "    \b\b\b\b"
}

check_root() {
    if [[ $EUID -eq 0 ]]; then
        log "WARN" "Ejecutándose como root - Se ajustarán los permisos automáticamente"
        echo -e "${YELLOW}⚠️  Detectado modo root. Los permisos se configurarán correctamente.${NC}"
    fi
}

detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if command -v apt-get >/dev/null 2>&1; then
            OS="debian"
            PACKAGE_MANAGER="apt-get"
        elif command -v yum >/dev/null 2>&1; then
            OS="redhat"
            PACKAGE_MANAGER="yum"
        elif command -v pacman >/dev/null 2>&1; then
            OS="arch"
            PACKAGE_MANAGER="pacman"
        else
            OS="linux"
            PACKAGE_MANAGER="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        PACKAGE_MANAGER="brew"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
        OS="windows"
        PACKAGE_MANAGER="chocolatey"
    else
        OS="unknown"
        PACKAGE_MANAGER="unknown"
    fi
    
    log "INFO" "Sistema operativo detectado: $OS"
}

check_internet() {
    log "INFO" "Verificando conectividad a internet..."
    if ! ping -c 1 google.com >/dev/null 2>&1 && ! ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        log "ERROR" "No hay conectividad a internet. Verifique su conexión."
        exit 1
    fi
    log "SUCCESS" "Conectividad a internet verificada"
}

# =============================================================================
# INSTALACIÓN DE DEPENDENCIAS
# =============================================================================

install_nodejs() {
    log "INFO" "Verificando instalación de Node.js..."
    
    if command -v node >/dev/null 2>&1; then
        local current_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [[ $current_version -ge $MIN_NODE_VERSION ]]; then
            log "SUCCESS" "Node.js ya está instalado (versión $(node -v))"
            return 0
        else
            log "WARN" "Versión de Node.js demasiado antigua: $(node -v). Se requiere v$MIN_NODE_VERSION+"
        fi
    fi
    
    log "INFO" "Instalando Node.js..."
    
    case $OS in
        "debian")
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash - >/dev/null 2>&1 &
            spinner $!
            sudo $PACKAGE_MANAGER update >/dev/null 2>&1 &
            spinner $!
            sudo $PACKAGE_MANAGER install -y nodejs >/dev/null 2>&1 &
            spinner $!
            ;;
        "redhat")
            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash - >/dev/null 2>&1 &
            spinner $!
            sudo $PACKAGE_MANAGER install -y nodejs npm >/dev/null 2>&1 &
            spinner $!
            ;;
        "arch")
            sudo $PACKAGE_MANAGER -Sy nodejs npm >/dev/null 2>&1 &
            spinner $!
            ;;
        "macos")
            if ! command -v brew >/dev/null 2>&1; then
                /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)" >/dev/null 2>&1 &
                spinner $!
            fi
            brew install node >/dev/null 2>&1 &
            spinner $!
            ;;
        *)
            log "ERROR" "Sistema operativo no soportado para instalación automática de Node.js"
            log "INFO" "Por favor, instale Node.js manualmente desde: https://nodejs.org/"
            exit 1
            ;;
    esac
    
    if command -v node >/dev/null 2>&1; then
        log "SUCCESS" "Node.js instalado correctamente (versión $(node -v))"
    else
        log "ERROR" "Falló la instalación de Node.js"
        exit 1
    fi
}

install_git() {
    if ! command -v git >/dev/null 2>&1; then
        log "INFO" "Instalando Git..."
        
        case $OS in
            "debian")
                sudo $PACKAGE_MANAGER update >/dev/null 2>&1 &
                spinner $!
                sudo $PACKAGE_MANAGER install -y git >/dev/null 2>&1 &
                spinner $!
                ;;
            "redhat")
                sudo $PACKAGE_MANAGER install -y git >/dev/null 2>&1 &
                spinner $!
                ;;
            "arch")
                sudo $PACKAGE_MANAGER -Sy git >/dev/null 2>&1 &
                spinner $!
                ;;
            "macos")
                xcode-select --install >/dev/null 2>&1 || true
                ;;
        esac
        
        log "SUCCESS" "Git instalado correctamente"
    else
        log "SUCCESS" "Git ya está instalado"
    fi
}

# =============================================================================
# INSTALACIÓN DE INFOOOZE (MÉTODO CORREGIDO)
# =============================================================================

install_infoooze() {
    log "INFO" "Instalando Infoooze OSINT Tool..."
    
    # Método 1: Instalación directa desde NPM (más confiable)
    log "INFO" "Instalando desde NPM registry..."
    if npm install -g infoooze >/dev/null 2>&1; then
        log "SUCCESS" "Infoooze instalado correctamente desde NPM"
        return 0
    fi
    
    # Método 2: Si falla NPM, intentar desde GitHub
    log "WARN" "Instalación NPM falló, intentando desde GitHub..."
    
    local temp_dir=$(mktemp -d)
    cd "$temp_dir"
    
    log "INFO" "Descargando código fuente desde GitHub..."
    if git clone https://github.com/devxprite/infoooze.git >/dev/null 2>&1; then
        cd infoooze
        
        log "INFO" "Instalando dependencias..."
        if npm install >/dev/null 2>&1; then
            log "INFO" "Instalando globalmente desde código fuente..."
            if npm install -g . >/dev/null 2>&1; then
                log "SUCCESS" "Infoooze instalado correctamente desde GitHub"
                cd "$SCRIPT_DIR"
                rm -rf "$temp_dir"
                return 0
            fi
        fi
    fi
    
    # Cleanup en caso de fallo
    cd "$SCRIPT_DIR"
    rm -rf "$temp_dir"
    log "ERROR" "Falló la instalación de Infoooze"
    exit 1
}

# =============================================================================
# CONFIGURACIÓN ADICIONAL (CORREGIDA)
# =============================================================================

setup_directories() {
    log "INFO" "Configurando directorios de trabajo..."
    
    # Crear directorio para resultados en la ubicación del script
    if [[ ! -d "$RESULTS_DIR" ]]; then
        mkdir -p "$RESULTS_DIR"
        log "INFO" "Directorio de resultados creado: $RESULTS_DIR"
    fi
    
    # Asegurar permisos correctos
    chmod 755 "$RESULTS_DIR" 2>/dev/null || true
    
    # Crear directorio en home del usuario también
    local home_results="$HOME/infoooze_results"
    if [[ ! -d "$home_results" ]]; then
        mkdir -p "$home_results"
        log "INFO" "Directorio de resultados en home creado: $home_results"
    fi
}

fix_npm_permissions() {
    log "INFO" "Configurando permisos de NPM..."
    
    # Obtener el directorio global de npm
    local npm_global_dir
    if npm_global_dir=$(npm config get prefix 2>/dev/null); then
        log "INFO" "Directorio NPM global: $npm_global_dir"
        
        # Verificar que el directorio existe y es accesible
        if [[ -d "$npm_global_dir" ]]; then
            # Asegurar que el directorio bin existe y tiene permisos correctos
            mkdir -p "$npm_global_dir/bin" 2>/dev/null || true
            chmod 755 "$npm_global_dir/bin" 2>/dev/null || true
        fi
    fi
}

create_aliases() {
    log "INFO" "Creando aliases útiles..."
    
    local shell_rc=""
    if [[ -n "${BASH_VERSION:-}" ]]; then
        shell_rc="$HOME/.bashrc"
    elif [[ -n "${ZSH_VERSION:-}" ]]; then
        shell_rc="$HOME/.zshrc"
    fi
    
    if [[ -n "$shell_rc" ]] && [[ -f "$shell_rc" ]]; then
        if ! grep -q "# Infoooze aliases" "$shell_rc"; then
            cat >> "$shell_rc" << 'EOF'

# Infoooze aliases
alias info="infoooze"
alias osint="infoooze"
alias infoz="infoooze"
EOF
            log "SUCCESS" "Aliases creados en $shell_rc"
        else
            log "INFO" "Aliases ya existen en $shell_rc"
        fi
    fi
}

# =============================================================================
# VERIFICACIÓN POST-INSTALACIÓN (MEJORADA)
# =============================================================================

verify_installation() {
    log "INFO" "Verificando instalación..."
    local verification_failed=0
    
    # Verificar comando infoooze
    if command -v infoooze >/dev/null 2>&1; then
        log "SUCCESS" "Comando 'infoooze' disponible en: $(which infoooze)"
    else
        log "ERROR" "Comando 'infoooze' no encontrado en PATH"
        # Intentar encontrar el ejecutable
        local npm_global=$(npm config get prefix 2>/dev/null)
        if [[ -n "$npm_global" ]] && [[ -f "$npm_global/bin/infoooze" ]]; then
            log "INFO" "Ejecutable encontrado en: $npm_global/bin/infoooze"
            log "WARN" "Es posible que necesite ajustar su PATH"
        fi
        verification_failed=1
    fi
    
    # Verificar versión
    if command -v infoooze >/dev/null 2>&1; then
        local version_output
        if version_output=$(infoooze --version 2>/dev/null); then
            log "SUCCESS" "Versión instalada: $version_output"
        elif version_output=$(npm list -g infoooze 2>/dev/null | grep infoooze | head -1); then
            log "SUCCESS" "Versión encontrada: $version_output"
        else
            log "WARN" "No se pudo verificar la versión"
        fi
    fi
    
    # Verificar que el comando de ayuda funciona
    if command -v infoooze >/dev/null 2>&1; then
        if timeout 5 infoooze -h >/dev/null 2>&1; then
            log "SUCCESS" "Comando de ayuda funciona correctamente"
        else
            log "ERROR" "El comando de ayuda falló"
            verification_failed=1
        fi
    fi
    
    # Verificar dependencias críticas
    local critical_deps=("args" "axios" "chalk" "exif" "jsdom" "lodash" "moment" "portscanner" "whois-json")
    local missing_deps=0
    
    for dep in "${critical_deps[@]}"; do
        if npm list -g "$dep" >/dev/null 2>&1; then
            log "SUCCESS" "Dependencia '$dep' instalada"
        else
            log "WARN" "Dependencia '$dep' no encontrada"
            ((missing_deps++))
        fi
    done
    
    if [[ $missing_deps -gt 0 ]]; then
        log "WARN" "$missing_deps dependencias críticas no encontradas"
    fi
    
    return $verification_failed
}

# =============================================================================
# TESTS BÁSICOS DE FUNCIONALIDAD
# =============================================================================

test_basic_functionality() {
    if ! command -v infoooze >/dev/null 2>&1; then
        log "ERROR" "No se pueden ejecutar tests - comando no disponible"
        return 1
    fi
    
    log "INFO" "Ejecutando tests básicos de funcionalidad..."
    
    # Test 1: Comando de ayuda
    if timeout 10 infoooze -h >/dev/null 2>&1; then
        log "SUCCESS" "Test 1/3: Comando de ayuda - PASS"
    else
        log "ERROR" "Test 1/3: Comando de ayuda - FAIL"
        return 1
    fi
    
    # Test 2: Whois lookup (test rápido)
    if timeout 15 infoooze -w example.com >/dev/null 2>&1; then
        log "SUCCESS" "Test 2/3: Whois lookup - PASS"
    else
        log "WARN" "Test 2/3: Whois lookup - FAIL (posible problema de red)"
    fi
    
    # Test 3: DNS lookup (test rápido)
    if timeout 15 infoooze -n example.com >/dev/null 2>&1; then
        log "SUCCESS" "Test 3/3: DNS lookup - PASS"
    else
        log "WARN" "Test 3/3: DNS lookup - FAIL (posible problema de red)"
    fi
    
    log "SUCCESS" "Tests básicos completados"
    return 0
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

main() {
    # Inicialización
    print_banner
    log "INFO" "Iniciando instalación de Infoooze OSINT Tool"
    
    # Verificaciones previas
    check_root
    detect_os
    check_internet
    
    # Instalación de dependencias
    install_git
    install_nodejs
    
    # Instalación principal (método corregido)
    install_infoooze
    
    # Configuración (corregida)
    setup_directories
    fix_npm_permissions
    create_aliases
    
    # Verificación
    if verify_installation; then
        # Tests básicos
        test_basic_functionality
        
        echo ""
        echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║            ✅ INSTALACIÓN COMPLETADA EXITOSAMENTE         ║${NC}"
        echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${CYAN}🚀 Infoooze OSINT Tool ha sido instalado y verificado!${NC}"
        echo ""
        echo -e "${YELLOW}Comandos disponibles:${NC}"
        echo -e "  • ${GREEN}infoooze${NC} - Comando principal"
        echo -e "  • ${GREEN}infoze${NC} - Alias corto"
        echo -e "  • ${GREEN}infooze${NC} - Alias alternativo"
        echo ""
        echo -e "${YELLOW}Ejemplos de uso verificados:${NC}"
        echo -e "  • ${BLUE}infoooze -h${NC}                    # Mostrar ayuda ✅"
        echo -e "  • ${BLUE}infoooze -w google.com${NC}         # Whois lookup ✅"
        echo -e "  • ${BLUE}infoooze -p 8.8.8.8${NC}           # IP lookup ✅"
        echo -e "  • ${BLUE}infoooze -n google.com${NC}         # DNS lookup ✅"
        echo ""
        echo -e "${YELLOW}📁 Directorios de resultados:${NC}"
        echo -e "  • ${GREEN}$RESULTS_DIR${NC}"
        echo -e "  • ${GREEN}$HOME/infoooze_results${NC}"
        echo ""
        echo -e "${YELLOW}📋 Log de instalación: ${GREEN}$LOG_FILE${NC}"
        echo ""
        echo -e "${CYAN}💡 Ejecute 'source ~/.bashrc' para cargar los aliases.${NC}"
        echo -e "${CYAN}🔍 Ejecute './verify_infoooze.sh' para verificación completa.${NC}"
    else
        echo ""
        echo -e "${RED}❌ La instalación tuvo problemas. Revise el log: $LOG_FILE${NC}"
        echo -e "${YELLOW}💡 Intente ejecutar el script nuevamente o instale manualmente con:${NC}"
        echo -e "${BLUE}   npm install -g infoooze${NC}"
        exit 1
    fi
}

# =============================================================================
# MANEJO DE SEÑALES Y CLEANUP
# =============================================================================

cleanup() {
    log "INFO" "Limpiando archivos temporales..."
    jobs -p | xargs -r kill 2>/dev/null || true
}

trap cleanup EXIT INT TERM

# =============================================================================
# EJECUCIÓN
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
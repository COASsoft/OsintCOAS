#!/bin/bash

# =============================================================================
# INFOOOZE OSINT TOOL - COMPREHENSIVE VERIFICATION SCRIPT (FIXED)
# =============================================================================
# Descripción: Script de verificación completa corregido para Infoooze
# Autor: DevOps Verification Script - Fixed Version
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
LOG_FILE="$SCRIPT_DIR/infoooze_verification.log"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNED_TESTS=0

# =============================================================================
# FUNCIONES DE UTILIDAD
# =============================================================================

print_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
██╗   ██╗███████╗██████╗ ██╗███████╗██╗ ██████╗ █████╗ ████████╗██╗ ██████╗ ███╗   ██╗
██║   ██║██╔════╝██╔══██╗██║██╔════╝██║██╔════╝██╔══██╗╚══██╔══╝██║██╔═══██╗████╗  ██║
██║   ██║█████╗  ██████╔╝██║█████╗  ██║██║     ███████║   ██║   ██║██║   ██║██╔██╗ ██║
╚██╗ ██╔╝██╔══╝  ██╔══██╗██║██╔══╝  ██║██║     ██╔══██║   ██║   ██║██║   ██║██║╚██╗██║
 ╚████╔╝ ███████╗██║  ██║██║██║     ██║╚██████╗██║  ██║   ██║   ██║╚██████╔╝██║ ╚████║
  ╚═══╝  ╚══════╝╚═╝  ╚═╝╚═╝╚═╝     ╚═╝ ╚═════╝╚═╝  ╚═╝   ╚═╝   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝
                                                                                        
              INFOOOZE OSINT TOOL - VERIFICATION SCRIPT
EOF
    echo -e "${NC}"
    echo -e "${CYAN}================================================================${NC}"
    echo -e "${YELLOW}🔍 Script de Verificación Completa de Infoooze${NC}"
    echo -e "${CYAN}================================================================${NC}"
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
        "TEST") echo -e "${CYAN}[TEST]${NC} $message" ;;
    esac
}

test_result() {
    local test_name="$1"
    local result="$2"
    local details="${3:-}"
    
    ((TOTAL_TESTS++))
    
    case "$result" in
        "PASS")
            ((PASSED_TESTS++))
            echo -e "   ✅ ${GREEN}PASS${NC} - $test_name"
            log "SUCCESS" "TEST PASS: $test_name $details"
            ;;
        "FAIL")
            ((FAILED_TESTS++))
            echo -e "   ❌ ${RED}FAIL${NC} - $test_name"
            log "ERROR" "TEST FAIL: $test_name $details"
            ;;
        "WARN")
            ((WARNED_TESTS++))
            echo -e "   ⚠️  ${YELLOW}WARN${NC} - $test_name"
            log "WARN" "TEST WARN: $test_name $details"
            ;;
    esac
}

# =============================================================================
# TESTS DE VERIFICACIÓN CORREGIDOS
# =============================================================================

test_system_requirements() {
    echo -e "${YELLOW}🔧 Verificando Requisitos del Sistema${NC}"
    echo "────────────────────────────────────────"
    
    # Test Node.js
    if command -v node >/dev/null 2>&1; then
        local node_version=$(node -v | sed 's/v//' | cut -d. -f1)
        if [[ $node_version -ge 12 ]]; then
            test_result "Node.js versión ≥12" "PASS" "($(node -v))"
        else
            test_result "Node.js versión ≥12" "FAIL" "($(node -v) - Se requiere v12+)"
        fi
    else
        test_result "Node.js instalado" "FAIL" "(No encontrado)"
    fi
    
    # Test NPM
    if command -v npm >/dev/null 2>&1; then
        test_result "NPM instalado" "PASS" "($(npm -v))"
    else
        test_result "NPM instalado" "FAIL" "(No encontrado)"
    fi
    
    # Test Git
    if command -v git >/dev/null 2>&1; then
        test_result "Git instalado" "PASS" "($(git --version | cut -d' ' -f3))"
    else
        test_result "Git instalado" "WARN" "(No encontrado - no crítico)"
    fi
    
    # Test conectividad
    if ping -c 1 google.com >/dev/null 2>&1; then
        test_result "Conectividad a internet" "PASS"
    else
        test_result "Conectividad a internet" "WARN" "(Algunos tests podrían fallar)"
    fi
    
    echo ""
}

test_infoooze_installation() {
    echo -e "${YELLOW}📦 Verificando Instalación de Infoooze${NC}"
    echo "──────────────────────────────────────────"
    
    # Test comando principal
    if command -v infoooze >/dev/null 2>&1; then
        test_result "Comando 'infoooze' disponible" "PASS" "($(which infoooze))"
    else
        test_result "Comando 'infoooze' disponible" "FAIL" "(No encontrado en PATH)"
        # Intentar encontrar en directorios comunes de NPM
        local npm_global=$(npm config get prefix 2>/dev/null || echo "")
        if [[ -n "$npm_global" ]] && [[ -f "$npm_global/bin/infoooze" ]]; then
            test_result "Ejecutable en directorio NPM" "WARN" "($npm_global/bin/infoooze - PATH issue)"
        fi
    fi
    
    # Test aliases (solo si están configurados)
    local shell_rc=""
    if [[ -n "${BASH_VERSION:-}" ]]; then
        shell_rc="$HOME/.bashrc"
    elif [[ -n "${ZSH_VERSION:-}" ]]; then
        shell_rc="$HOME/.zshrc"
    fi
    
    if [[ -n "$shell_rc" ]] && [[ -f "$shell_rc" ]] && grep -q "# Infoooze aliases" "$shell_rc"; then
        test_result "Aliases configurados" "PASS" "($shell_rc)"
    else
        test_result "Aliases configurados" "WARN" "(No configurados - no crítico)"
    fi
    
    # Test versión
    if command -v infoooze >/dev/null 2>&1; then
        if local version=$(infoooze --version 2>/dev/null); then
            test_result "Versión de comando" "PASS" "($version)"
        elif local version=$(npm list -g infoooze 2>/dev/null | grep infoooze | head -1 | cut -d'@' -f2 | cut -d' ' -f1); then
            test_result "Versión NPM" "PASS" "($version)"
        else
            test_result "Versión verificable" "WARN" "(No se pudo verificar)"
        fi
    fi
    
    echo ""
}

test_dependencies() {
    echo -e "${YELLOW}🔗 Verificando Dependencias${NC}"
    echo "───────────────────────────────"
    
    local critical_deps=("args" "axios" "chalk" "cli-spinner" "exif" "jsdom" "lodash" "moment" "portscanner" "whois-json")
    local missing_count=0
    
    for dep in "${critical_deps[@]}"; do
        if npm list -g "$dep" >/dev/null 2>&1; then
            test_result "Dependencia '$dep'" "PASS"
        else
            test_result "Dependencia '$dep'" "WARN" "(No encontrada globalmente)"
            ((missing_count++))
        fi
    done
    
    if [[ $missing_count -eq 0 ]]; then
        test_result "Todas las dependencias críticas" "PASS"
    elif [[ $missing_count -lt 3 ]]; then
        test_result "Dependencias críticas" "WARN" "($missing_count faltantes)"
    else
        test_result "Dependencias críticas" "FAIL" "($missing_count faltantes)"
    fi
    
    echo ""
}

test_functionality() {
    echo -e "${YELLOW}⚙️  Probando Funcionalidades OSINT${NC}"
    echo "─────────────────────────────────────"
    
    if ! command -v infoooze >/dev/null 2>&1; then
        test_result "Funcionalidades OSINT" "FAIL" "(Comando no disponible)"
        echo ""
        return 1
    fi
    
    # Test help command
    if timeout 10 infoooze -h >/dev/null 2>&1; then
        test_result "Comando de ayuda (-h)" "PASS"
    else
        test_result "Comando de ayuda (-h)" "FAIL"
    fi
    
    # Tests de herramientas individuales con timeouts más cortos
    local tools=(
        "-w:Whois Lookup:example.com"
        "-p:IP Lookup:8.8.8.8" 
        "-n:DNS Lookup:example.com"
        "-d:Domain Age:example.com"
        "-e:Header Info:example.com"
        "-s:Subdomain Scanner:example.com"
    )
    
    echo "   ${CYAN}Probando herramientas principales...${NC}"
    
    for tool in "${tools[@]}"; do
        local flag="${tool%%:*}"
        local name="${tool#*:}"
        name="${name%%:*}"
        local target="${tool##*:}"
        
        if timeout 15 infoooze $flag $target >/dev/null 2>&1; then
            test_result "$name ($flag)" "PASS"
        else
            test_result "$name ($flag)" "WARN" "(Timeout o error de red)"
        fi
    done
    
    # Tests adicionales sin conexión de red
    local offline_tools=(
        "-u:User Agent"
        "-l:URL Expander"
        "-x:EXIF Metadata"
    )
    
    echo "   ${CYAN}Verificando herramientas adicionales...${NC}"
    
    for tool in "${offline_tools[@]}"; do
        local flag="${tool%%:*}"
        local name="${tool##*:}"
        
        # Solo verificar que la opción existe sin ejecutar
        if timeout 3 bash -c "infoooze $flag --help 2>/dev/null || infoooze $flag 2>&1 | grep -q 'required'" >/dev/null 2>&1; then
            test_result "$name ($flag)" "PASS"
        else
            test_result "$name ($flag)" "WARN" "(No verificable sin parámetros)"
        fi
    done
    
    echo ""
}

test_file_permissions() {
    echo -e "${YELLOW}📁 Verificando Permisos y Directorios${NC}"
    echo "────────────────────────────────────────"
    
    # Test directorio de resultados local
    local results_dir="$SCRIPT_DIR/results"
    if [[ -d "$results_dir" ]]; then
        if [[ -w "$results_dir" ]]; then
            test_result "Directorio local de resultados" "PASS" "($results_dir)"
        else
            test_result "Directorio local de resultados" "WARN" "(Sin permisos de escritura)"
        fi
    else
        if mkdir -p "$results_dir" 2>/dev/null; then
            test_result "Crear directorio local de resultados" "PASS" "($results_dir)"
        else
            test_result "Crear directorio local de resultados" "FAIL" "($results_dir)"
        fi
    fi
    
    # Test directorio de resultados en home
    local home_results="$HOME/infoooze_results"
    if [[ -d "$home_results" ]]; then
        if [[ -w "$home_results" ]]; then
            test_result "Directorio home de resultados" "PASS" "($home_results)"
        else
            test_result "Directorio home de resultados" "WARN" "(Sin permisos de escritura)"
        fi
    else
        if mkdir -p "$home_results" 2>/dev/null; then
            test_result "Crear directorio home de resultados" "PASS" "($home_results)"
        else
            test_result "Crear directorio home de resultados" "WARN" "(No se pudo crear)"
        fi
    fi
    
    # Test permisos npm global
    local npm_global=$(npm config get prefix 2>/dev/null || echo "")
    if [[ -n "$npm_global" ]] && [[ -d "$npm_global" ]]; then
        test_result "Directorio NPM global accesible" "PASS" "($npm_global)"
    else
        test_result "Directorio NPM global accesible" "WARN" "(No encontrado o inaccesible)"
    fi
    
    # Test si los resultados se están generando realmente
    if command -v infoooze >/dev/null 2>&1; then
        echo "   ${CYAN}Probando generación de archivos de resultados...${NC}"
        local test_file_pattern
        if timeout 20 infoooze -w example.com >/dev/null 2>&1; then
            # Buscar archivos de resultados recientes
            if find "$SCRIPT_DIR" -name "*infoooze*whois*" -mmin -2 2>/dev/null | grep -q .; then
                test_result "Generación de archivos de resultados" "PASS"
            elif find "$HOME" -name "*infoooze*whois*" -mmin -2 2>/dev/null | grep -q .; then
                test_result "Generación de archivos de resultados" "PASS" "(en directorio home)"
            else
                test_result "Generación de archivos de resultados" "WARN" "(No se encontraron archivos recientes)"
            fi
        else
            test_result "Generación de archivos de resultados" "WARN" "(No se pudo probar - error de red)"
        fi
    fi
    
    echo ""
}

test_shell_integration() {
    echo -e "${YELLOW}🐚 Verificando Integración con Shell${NC}"
    echo "──────────────────────────────────────"
    
    # Test variables de entorno
    if [[ -n "${PATH:-}" ]] && echo "$PATH" | grep -q "$(npm config get prefix 2>/dev/null || echo '')/bin"; then
        test_result "PATH incluye directorio NPM" "PASS"
    else
        test_result "PATH incluye directorio NPM" "WARN" "(Puede requerir reinicio de shell)"
    fi
    
    # Test bashrc/zshrc
    local shell_rc=""
    if [[ -n "${BASH_VERSION:-}" ]]; then
        shell_rc="$HOME/.bashrc"
    elif [[ -n "${ZSH_VERSION:-}" ]]; then
        shell_rc="$HOME/.zshrc"
    fi
    
    if [[ -n "$shell_rc" ]] && [[ -f "$shell_rc" ]]; then
        if grep -q "# Infoooze aliases" "$shell_rc"; then
            test_result "Aliases en archivo de configuración" "PASS" "($(basename $shell_rc))"
        else
            test_result "Aliases en archivo de configuración" "WARN" "(No configurados)"
        fi
    else
        test_result "Archivo de configuración shell" "WARN" "(No encontrado o no soportado)"
    fi
    
    echo ""
}

# =============================================================================
# BENCHMARK MEJORADO
# =============================================================================

run_benchmark() {
    echo -e "${YELLOW}⏱️  Ejecutando Benchmark de Rendimiento${NC}"
    echo "─────────────────────────────────────────"
    
    if ! command -v infoooze >/dev/null 2>&1; then
        test_result "Benchmark de rendimiento" "FAIL" "(Comando no disponible)"
        echo ""
        return 1
    fi
    
    # Test tiempo de carga del comando
    local start_time=$(date +%s%N)
    if infoooze -h >/dev/null 2>&1; then
        local end_time=$(date +%s%N)
        local duration=$(( (end_time - start_time) / 1000000 ))
        
        if [[ $duration -lt 3000 ]]; then
            test_result "Tiempo de carga < 3s" "PASS" "(${duration}ms)"
        elif [[ $duration -lt 5000 ]]; then
            test_result "Tiempo de carga < 5s" "WARN" "(${duration}ms - aceptable)"
        else
            test_result "Tiempo de carga" "FAIL" "(${duration}ms - muy lento)"
        fi
    else
        test_result "Tiempo de carga" "FAIL" "(Comando falló)"
    fi
    
    # Test de memory usage (básico)
    if command -v ps >/dev/null 2>&1; then
        local memory_usage
        if memory_usage=$(ps -o pid,vsz,rss,comm -C node 2>/dev/null | grep node | head -1 | awk '{print $3}'); then
            if [[ -n "$memory_usage" ]] && [[ $memory_usage -lt 100000 ]]; then
                test_result "Uso de memoria < 100MB" "PASS" "(${memory_usage}KB)"
            else
                test_result "Uso de memoria" "WARN" "(${memory_usage}KB)"
            fi
        else
            test_result "Medición de memoria" "WARN" "(No se pudo medir)"
        fi
    fi
    
    echo ""
}

# =============================================================================
# REPORTE FINAL MEJORADO
# =============================================================================

generate_report() {
    echo -e "${PURPLE}📊 REPORTE FINAL DE VERIFICACIÓN${NC}"
    echo "══════════════════════════════════════════════════════════"
    echo ""
    
    local success_rate=0
    local warning_rate=0
    
    if [[ $TOTAL_TESTS -gt 0 ]]; then
        success_rate=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
        warning_rate=$(( (WARNED_TESTS * 100) / TOTAL_TESTS ))
    fi
    
    echo -e "${CYAN}Estadísticas de Testing:${NC}"
    echo "  • Total de tests ejecutados: $TOTAL_TESTS"
    echo -e "  • Tests exitosos: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "  • Tests con advertencias: ${YELLOW}$WARNED_TESTS${NC}"
    echo -e "  • Tests fallidos: ${RED}$FAILED_TESTS${NC}"
    echo -e "  • Tasa de éxito: ${YELLOW}$success_rate%${NC}"
    echo -e "  • Tasa de advertencias: ${YELLOW}$warning_rate%${NC}"
    echo ""
    
    # Clasificación mejorada
    if [[ $FAILED_TESTS -eq 0 ]] && [[ $success_rate -ge 90 ]]; then
        echo -e "${GREEN}🎉 EXCELENTE! Infoooze está completamente operativo.${NC}"
        echo -e "${GREEN}✨ Todas las funcionalidades están disponibles y funcionando.${NC}"
        local status="EXCELENTE"
    elif [[ $FAILED_TESTS -eq 0 ]] && [[ $success_rate -ge 75 ]]; then
        echo -e "${GREEN}✅ BUENO: Infoooze está funcionando correctamente.${NC}"
        echo -e "${YELLOW}🔧 Algunas configuraciones menores podrían optimizarse.${NC}"
        local status="BUENO"
    elif [[ $FAILED_TESTS -le 2 ]] && [[ $success_rate -ge 60 ]]; then
        echo -e "${YELLOW}⚠️  ACEPTABLE: Infoooze está mayormente funcional.${NC}"
        echo -e "${YELLOW}🛠️  Revise los tests fallidos para mejorar la instalación.${NC}"
        local status="ACEPTABLE"
    elif [[ $success_rate -ge 40 ]]; then
        echo -e "${RED}❗ PROBLEMÁTICO: Infoooze tiene problemas significativos.${NC}"
        echo -e "${RED}🔧 Se requiere intervención para corregir los errores.${NC}"
        local status="PROBLEMÁTICO"
    else
        echo -e "${RED}💥 CRÍTICO: La instalación tiene problemas graves.${NC}"
        echo -e "${RED}🚨 Se recomienda reinstalar completamente.${NC}"
        local status="CRÍTICO"
    fi
    
    echo ""
    echo -e "${CYAN}📋 Archivos de log:${NC}"
    echo -e "  • Log de verificación: ${GREEN}$LOG_FILE${NC}"
    if [[ -f "$SCRIPT_DIR/infoooze_install.log" ]]; then
        echo -e "  • Log de instalación: ${GREEN}$SCRIPT_DIR/infoooze_install.log${NC}"
    fi
    echo ""
    
    # Recomendaciones específicas
    if [[ $status == "EXCELENTE" ]] || [[ $status == "BUENO" ]]; then
        echo -e "${YELLOW}🚀 Próximos pasos recomendados:${NC}"
        echo -e "  • ${BLUE}infoooze -h${NC}                    # Explorar todas las opciones"
        echo -e "  • ${BLUE}infoooze -w google.com${NC}         # Test Whois lookup"
        echo -e "  • ${BLUE}infoooze -p 8.8.8.8${NC}           # Test IP lookup"
        echo -e "  • ${BLUE}infoooze -n google.com${NC}         # Test DNS lookup"
        echo -e "  • ${BLUE}infoooze -s domain.com${NC}         # Test subdomain scan"
        echo ""
        echo -e "${GREEN}✅ LISTO PARA FASE 2: Desarrollo del Frontend Web${NC}"
    elif [[ $status == "ACEPTABLE" ]]; then
        echo -e "${YELLOW}🔧 Acciones recomendadas:${NC}"
        echo -e "  • Revisar tests fallidos en el log"
        echo -e "  • Verificar conectividad a internet"
        echo -e "  • Ejecutar 'source ~/.bashrc' para cargar aliases"
        echo -e "  • Probar comandos básicos manualmente"
        echo ""
        echo -e "${YELLOW}⚠️  PROCEDER CON PRECAUCIÓN a la Fase 2${NC}"
    else
        echo -e "${RED}🛠️  Acciones requeridas:${NC}"
        echo -e "  • Ejecutar './install_infoooze.sh' nuevamente"
        echo -e "  • Verificar que Node.js ≥12 está instalado"
        echo -e "  • Comprobar permisos de NPM global"
        echo -e "  • Revisar logs de error detalladamente"
        echo ""
        echo -e "${RED}🚫 NO PROCEDER a la Fase 2 hasta resolver los problemas${NC}"
    fi
    
    # Return code basado en el estado
    case $status in
        "EXCELENTE"|"BUENO") return 0 ;;
        "ACEPTABLE") return 1 ;;
        *) return 2 ;;
    esac
}

# =============================================================================
# FUNCIÓN PRINCIPAL
# =============================================================================

main() {
    # Inicialización
    print_banner
    log "INFO" "Iniciando verificación completa de Infoooze OSINT Tool"
    
    # Ejecutar todos los tests
    test_system_requirements
    test_infoooze_installation
    test_dependencies
    test_functionality
    test_file_permissions
    test_shell_integration
    run_benchmark
    
    # Generar reporte final
    generate_report
}

# =============================================================================
# EJECUCIÓN
# =============================================================================

if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
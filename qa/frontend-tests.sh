#!/bin/bash

# =============================================================================
# Frontend Test Suite para Infoooze Web Platform
# =============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Archivo de log
LOG_FILE="qa-frontend-results-$(date +%Y%m%d-%H%M%S).log"

log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Test de página
test_page() {
    local path="$1"
    local description="$2"
    local expected_content="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${BLUE}[TEST $TOTAL_TESTS]${NC} $description"
    log "  URL: $FRONTEND_URL$path"
    
    # Obtener página
    response=$(curl -s -L "$FRONTEND_URL$path")
    status_code=$(curl -s -o /dev/null -w '%{http_code}' -L "$FRONTEND_URL$path")
    
    if [ "$status_code" = "200" ]; then
        log "  ${GREEN}✓${NC} Página cargada (HTTP 200)"
        
        # Verificar contenido esperado
        if echo "$response" | grep -q "$expected_content"; then
            log "  ${GREEN}✓ PASS${NC} - Contenido encontrado: '$expected_content'"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            log "  ${RED}✗ FAIL${NC} - Contenido no encontrado: '$expected_content'"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        log "  ${RED}✗ FAIL${NC} - Status: $status_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test de assets
test_asset() {
    local path="$1"
    local description="$2"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${BLUE}[ASSET TEST]${NC} $description"
    
    status_code=$(curl -s -o /dev/null -w '%{http_code}' "$FRONTEND_URL$path")
    
    if [ "$status_code" = "200" ]; then
        log "  ${GREEN}✓ PASS${NC} - Asset disponible"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log "  ${RED}✗ FAIL${NC} - Status: $status_code"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Test de performance
test_load_time() {
    local path="$1"
    local max_time="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${BLUE}[PERFORMANCE]${NC} $description"
    
    time_total=$(curl -s -o /dev/null -w '%{time_total}' "$FRONTEND_URL$path")
    time_ms=$(echo "$time_total * 1000" | bc | cut -d. -f1)
    
    if [ "$time_ms" -le "$max_time" ]; then
        log "  ${GREEN}✓ PASS${NC} - Tiempo: ${time_ms}ms (máx: ${max_time}ms)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log "  ${RED}✗ FAIL${NC} - Tiempo: ${time_ms}ms (máx: ${max_time}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# =============================================================================
# INICIO DE PRUEBAS
# =============================================================================

log "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "${YELLOW}     SUITE DE PRUEBAS FRONTEND - INFOOOZE WEB PLATFORM${NC}"
log "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "Timestamp: $(date)"
log "Frontend URL: $FRONTEND_URL"

# =============================================================================
# 1. PRUEBAS DE PÁGINAS PRINCIPALES
# =============================================================================

log "\n${YELLOW}▶ PÁGINAS PRINCIPALES${NC}"

test_page "/" "Dashboard principal" "Dashboard"
test_page "/" "Estadísticas en dashboard" "Total Scans"
test_page "/" "Gráfico de herramientas" "Tool Usage"

test_page "/tools" "Página de herramientas" "OSINT Tools"
test_page "/tools" "Grid de herramientas" "Available Tools"
test_page "/tools" "Filtros de búsqueda" "Search tools"

# =============================================================================
# 2. VERIFICACIÓN DE COMPONENTES
# =============================================================================

log "\n${YELLOW}▶ COMPONENTES UI${NC}"

# Verificar que el HTML tiene estructura Next.js
response=$(curl -s "$FRONTEND_URL")

if echo "$response" | grep -q "__next"; then
    log "${GREEN}✓${NC} Next.js renderizado correctamente"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "${RED}✗${NC} Next.js no detectado"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if echo "$response" | grep -q "data-reactroot"; then
    log "${GREEN}✓${NC} React renderizado correctamente"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "${RED}✗${NC} React no detectado"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# =============================================================================
# 3. PRUEBAS DE ASSETS Y RECURSOS
# =============================================================================

log "\n${YELLOW}▶ ASSETS Y RECURSOS${NC}"

# Verificar que los assets de Next.js se cargan
test_asset "/_next/static/css/" "CSS de Next.js"
test_asset "/_next/static/chunks/" "JavaScript chunks"

# =============================================================================
# 4. PRUEBAS DE PERFORMANCE
# =============================================================================

log "\n${YELLOW}▶ PERFORMANCE TESTS${NC}"

test_load_time "/" 3000 "Dashboard < 3s"
test_load_time "/tools" 3000 "Herramientas < 3s"

# =============================================================================
# 5. PRUEBAS DE RESPONSIVE
# =============================================================================

log "\n${YELLOW}▶ RESPONSIVE TESTS${NC}"

# Test con diferentes user agents
MOBILE_UA="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"

log "\n${BLUE}[MOBILE TEST]${NC} Verificando versión móvil"
mobile_response=$(curl -s -H "User-Agent: $MOBILE_UA" "$FRONTEND_URL")
if echo "$mobile_response" | grep -q "viewport"; then
    log "  ${GREEN}✓ PASS${NC} - Meta viewport presente"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "  ${RED}✗ FAIL${NC} - Meta viewport no encontrado"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# =============================================================================
# 6. PRUEBAS DE SEO
# =============================================================================

log "\n${YELLOW}▶ SEO TESTS${NC}"

response=$(curl -s "$FRONTEND_URL")

# Verificar meta tags
if echo "$response" | grep -q "<title>"; then
    log "${GREEN}✓${NC} Title tag presente"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "${RED}✗${NC} Title tag faltante"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if echo "$response" | grep -q 'name="description"'; then
    log "${GREEN}✓${NC} Meta description presente"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "${YELLOW}⚠${NC} Meta description faltante"
fi

# =============================================================================
# 7. PRUEBAS DE ACCESIBILIDAD
# =============================================================================

log "\n${YELLOW}▶ ACCESSIBILITY TESTS${NC}"

# Verificar elementos de accesibilidad básicos
if echo "$response" | grep -q 'lang='; then
    log "${GREEN}✓${NC} Atributo lang presente"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "${RED}✗${NC} Atributo lang faltante"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

if echo "$response" | grep -q 'alt='; then
    log "${GREEN}✓${NC} Atributos alt en imágenes"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    log "${YELLOW}⚠${NC} Posibles imágenes sin alt"
fi

# =============================================================================
# RESUMEN
# =============================================================================

log "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "${YELLOW}                    RESUMEN DE PRUEBAS${NC}"
log "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "Total de pruebas: $TOTAL_TESTS"
log "${GREEN}Pruebas pasadas: $PASSED_TESTS${NC}"
log "${RED}Pruebas fallidas: $FAILED_TESTS${NC}"

if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    log "\nTasa de éxito: ${SUCCESS_RATE}%"
    
    if [ $SUCCESS_RATE -ge 90 ]; then
        log "\n${GREEN}✅ FRONTEND QA EXITOSO${NC}"
        exit 0
    else
        log "\n${RED}❌ FRONTEND QA CON ERRORES${NC}"
        exit 1
    fi
fi

log "\nResultados guardados en: $LOG_FILE"
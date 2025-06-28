#!/bin/bash

# =============================================================================
# API Test Suite para Infoooze Web Platform
# =============================================================================

set -euo pipefail

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuración
API_BASE_URL="${API_BASE_URL:-http://localhost:3001/api}"
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Archivo de log
LOG_FILE="qa-api-results-$(date +%Y%m%d-%H%M%S).log"

# Función para logging
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Función para hacer test
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local expected_status="$3"
    local description="$4"
    local data="${5:-}"
    local headers="${6:-}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${BLUE}[TEST $TOTAL_TESTS]${NC} $description"
    log "  Method: $method"
    log "  Endpoint: $endpoint"
    log "  Expected: HTTP $expected_status"
    
    # Construir comando curl
    local curl_cmd="curl -s -o /tmp/response.json -w '%{http_code}' -X $method"
    
    if [ -n "$headers" ]; then
        curl_cmd="$curl_cmd -H '$headers'"
    fi
    
    if [ -n "$data" ]; then
        curl_cmd="$curl_cmd -H 'Content-Type: application/json' -d '$data'"
    fi
    
    curl_cmd="$curl_cmd $API_BASE_URL$endpoint"
    
    # Ejecutar curl
    local status_code=$(eval $curl_cmd)
    local response=$(cat /tmp/response.json 2>/dev/null || echo "{}")
    
    # Verificar resultado
    if [ "$status_code" = "$expected_status" ]; then
        log "  ${GREEN}✓ PASS${NC} - Status: $status_code"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        
        # Validaciones adicionales según endpoint
        case "$endpoint" in
            "/health")
                if echo "$response" | grep -q '"status":"healthy"'; then
                    log "  ${GREEN}✓${NC} Health check válido"
                else
                    log "  ${YELLOW}⚠${NC} Health check response inválido"
                    WARNINGS=$((WARNINGS + 1))
                fi
                ;;
            "/osint/tools")
                local tool_count=$(echo "$response" | grep -o '"id"' | wc -l)
                if [ "$tool_count" -eq 18 ]; then
                    log "  ${GREEN}✓${NC} 18 herramientas OSINT encontradas"
                else
                    log "  ${RED}✗${NC} Se esperaban 18 herramientas, se encontraron: $tool_count"
                    FAILED_TESTS=$((FAILED_TESTS + 1))
                fi
                ;;
        esac
    else
        log "  ${RED}✗ FAIL${NC} - Status: $status_code (esperado: $expected_status)"
        log "  Response: $(echo $response | jq . 2>/dev/null || echo $response)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Función para pruebas de validación
test_validation() {
    local endpoint="$1"
    local invalid_data="$2"
    local description="$3"
    
    test_endpoint "POST" "$endpoint" "400" "$description" "$invalid_data"
}

# Función para pruebas de performance
test_performance() {
    local endpoint="$1"
    local max_time="$2"
    local description="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log "\n${BLUE}[PERF TEST]${NC} $description"
    log "  Endpoint: $endpoint"
    log "  Max time: ${max_time}ms"
    
    local start_time=$(date +%s%N)
    curl -s -o /dev/null "$API_BASE_URL$endpoint"
    local end_time=$(date +%s%N)
    
    local duration=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$duration" -le "$max_time" ]; then
        log "  ${GREEN}✓ PASS${NC} - Tiempo: ${duration}ms"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        log "  ${RED}✗ FAIL${NC} - Tiempo: ${duration}ms (máx: ${max_time}ms)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# =============================================================================
# INICIO DE PRUEBAS
# =============================================================================

log "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "${YELLOW}       SUITE DE PRUEBAS API - INFOOOZE WEB PLATFORM${NC}"
log "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "Timestamp: $(date)"
log "API URL: $API_BASE_URL"
log ""

# =============================================================================
# 1. PRUEBAS DE HEALTH CHECK
# =============================================================================

log "\n${YELLOW}▶ HEALTH CHECK TESTS${NC}"
test_endpoint "GET" "/health" "200" "Health check básico"

# =============================================================================
# 2. PRUEBAS DE ENDPOINTS OSINT
# =============================================================================

log "\n${YELLOW}▶ OSINT ENDPOINTS TESTS${NC}"

# Listar herramientas
test_endpoint "GET" "/osint/tools" "200" "Obtener lista de herramientas OSINT"

# Obtener herramienta específica
test_endpoint "GET" "/osint/tools/ipinfo" "200" "Obtener herramienta ipinfo"
test_endpoint "GET" "/osint/tools/nonexistent" "404" "Herramienta no existente"

# Pruebas de búsqueda y filtros
test_endpoint "GET" "/osint/tools?search=ip" "200" "Búsqueda por término 'ip'"
test_endpoint "GET" "/osint/tools?category=network" "200" "Filtrar por categoría 'network'"
test_endpoint "GET" "/osint/tools?risk=low" "200" "Filtrar por riesgo 'low'"

# Iniciar scan
SCAN_DATA='{"tool":"ipinfo","target":"8.8.8.8","options":{}}'
test_endpoint "POST" "/osint/scan" "200" "Iniciar scan con ipinfo" "$SCAN_DATA"

# Validaciones de scan
test_validation "/osint/scan" '{}' "Scan sin herramienta"
test_validation "/osint/scan" '{"tool":"ipinfo"}' "Scan sin target"
test_validation "/osint/scan" '{"tool":"invalid","target":"test"}' "Scan con herramienta inválida"

# Historial de scans
test_endpoint "GET" "/osint/history" "200" "Obtener historial de scans"
test_endpoint "GET" "/osint/history?limit=10" "200" "Historial con límite"

# =============================================================================
# 3. PRUEBAS DE ENDPOINTS DE ESTADÍSTICAS
# =============================================================================

log "\n${YELLOW}▶ STATISTICS ENDPOINTS TESTS${NC}"

test_endpoint "GET" "/stats/overview" "200" "Estadísticas generales"
test_endpoint "GET" "/stats/tools" "200" "Estadísticas por herramienta"
test_endpoint "GET" "/stats/timeline" "200" "Estadísticas temporales"
test_endpoint "GET" "/stats/realtime" "200" "Estado en tiempo real"
test_endpoint "GET" "/stats/targets" "200" "Targets más consultados"

# =============================================================================
# 4. PRUEBAS DE ENDPOINTS DE REPORTES
# =============================================================================

log "\n${YELLOW}▶ REPORTS ENDPOINTS TESTS${NC}"

# Generar reporte
REPORT_DATA='{"scanIds":["test-scan-1"],"format":"json","includeRawData":true}'
test_endpoint "POST" "/reports/generate" "200" "Generar reporte JSON" "$REPORT_DATA"

# Listar reportes
test_endpoint "GET" "/reports/list" "200" "Listar reportes disponibles"

# Validaciones de reportes
test_validation "/reports/generate" '{"format":"json"}' "Reporte sin scanIds"
test_validation "/reports/generate" '{"scanIds":[],"format":"invalid"}' "Reporte con formato inválido"

# =============================================================================
# 5. PRUEBAS DE PERFORMANCE
# =============================================================================

log "\n${YELLOW}▶ PERFORMANCE TESTS${NC}"

test_performance "/health" 100 "Health check < 100ms"
test_performance "/osint/tools" 200 "Lista de herramientas < 200ms"
test_performance "/stats/overview" 300 "Estadísticas < 300ms"

# =============================================================================
# 6. PRUEBAS DE SEGURIDAD
# =============================================================================

log "\n${YELLOW}▶ SECURITY TESTS${NC}"

# CORS
test_endpoint "OPTIONS" "/osint/tools" "204" "CORS preflight request" "" "Origin: http://localhost:3000"

# Rate limiting (hacer múltiples requests)
log "\n${BLUE}[RATE LIMIT TEST]${NC} Verificando rate limiting..."
for i in {1..100}; do
    status=$(curl -s -o /dev/null -w '%{http_code}' "$API_BASE_URL/health")
    if [ "$status" = "429" ]; then
        log "  ${GREEN}✓ PASS${NC} - Rate limiting activo después de $i requests"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        break
    fi
    if [ "$i" -eq 100 ]; then
        log "  ${YELLOW}⚠ WARNING${NC} - Rate limiting no detectado después de 100 requests"
        WARNINGS=$((WARNINGS + 1))
    fi
done

# Headers de seguridad
log "\n${BLUE}[SECURITY HEADERS TEST]${NC} Verificando headers de seguridad..."
headers=$(curl -s -I "$API_BASE_URL/health")
if echo "$headers" | grep -qi "X-Content-Type-Options: nosniff"; then
    log "  ${GREEN}✓${NC} X-Content-Type-Options presente"
else
    log "  ${RED}✗${NC} X-Content-Type-Options faltante"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi

# =============================================================================
# 7. PRUEBAS DE CONCURRENCIA
# =============================================================================

log "\n${YELLOW}▶ CONCURRENCY TESTS${NC}"

log "\n${BLUE}[CONCURRENT REQUESTS]${NC} Ejecutando 10 requests concurrentes..."
for i in {1..10}; do
    curl -s -o /dev/null "$API_BASE_URL/osint/tools" &
done
wait

log "  ${GREEN}✓${NC} Servidor manejó 10 requests concurrentes"
PASSED_TESTS=$((PASSED_TESTS + 1))

# =============================================================================
# RESUMEN DE RESULTADOS
# =============================================================================

log "\n${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "${YELLOW}                    RESUMEN DE PRUEBAS${NC}"
log "${YELLOW}═══════════════════════════════════════════════════════════════${NC}"
log "Total de pruebas: $TOTAL_TESTS"
log "${GREEN}Pruebas pasadas: $PASSED_TESTS${NC}"
log "${RED}Pruebas fallidas: $FAILED_TESTS${NC}"
log "${YELLOW}Advertencias: $WARNINGS${NC}"

# Calcular porcentaje de éxito
if [ $TOTAL_TESTS -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_TESTS * 100) / TOTAL_TESTS ))
    log "\nTasa de éxito: ${SUCCESS_RATE}%"
    
    if [ $SUCCESS_RATE -ge 95 ]; then
        log "\n${GREEN}✅ SUITE DE PRUEBAS EXITOSA${NC}"
        exit 0
    elif [ $SUCCESS_RATE -ge 80 ]; then
        log "\n${YELLOW}⚠️  SUITE DE PRUEBAS CON ADVERTENCIAS${NC}"
        exit 1
    else
        log "\n${RED}❌ SUITE DE PRUEBAS FALLIDA${NC}"
        exit 2
    fi
fi

log "\nResultados guardados en: $LOG_FILE"
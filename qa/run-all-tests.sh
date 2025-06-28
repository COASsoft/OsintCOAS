#!/bin/bash

# =============================================================================
# Master QA Test Suite para Infoooze Web Platform
# =============================================================================

set -euo pipefail

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Directorios
BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
QA_DIR="$BASE_DIR/qa"
RESULTS_DIR="$QA_DIR/results"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Crear directorio de resultados
mkdir -p "$RESULTS_DIR"

# Log file principal
MASTER_LOG="$RESULTS_DIR/qa-master-$TIMESTAMP.log"

log() {
    echo -e "$1" | tee -a "$MASTER_LOG"
}

# Verificar servicios
check_services() {
    log "\n${YELLOW}▶ VERIFICANDO SERVICIOS${NC}"
    
    # Backend
    if curl -s -f http://localhost:3001/api/health > /dev/null; then
        log "  ${GREEN}✓${NC} Backend está activo"
    else
        log "  ${RED}✗${NC} Backend no responde"
        log "  ${YELLOW}Intentando iniciar servicios...${NC}"
        cd "$BASE_DIR" && ./scripts/start-dev.sh &
        sleep 10
    fi
    
    # Frontend
    if curl -s -f http://localhost:3000 > /dev/null; then
        log "  ${GREEN}✓${NC} Frontend está activo"
    else
        log "  ${RED}✗${NC} Frontend no responde"
    fi
}

# Función para ejecutar suite de pruebas
run_test_suite() {
    local suite_name="$1"
    local script_path="$2"
    local log_file="$RESULTS_DIR/${suite_name}-$TIMESTAMP.log"
    
    log "\n${CYAN}════════════════════════════════════════════════════${NC}"
    log "${CYAN}   Ejecutando: $suite_name${NC}"
    log "${CYAN}════════════════════════════════════════════════════${NC}"
    
    if [ -f "$script_path" ]; then
        if bash "$script_path" > "$log_file" 2>&1; then
            log "${GREEN}✅ $suite_name - EXITOSO${NC}"
            return 0
        else
            log "${RED}❌ $suite_name - FALLÓ${NC}"
            log "   Ver detalles en: $log_file"
            return 1
        fi
    else
        log "${YELLOW}⚠️  $suite_name - Script no encontrado${NC}"
        return 1
    fi
}

# =============================================================================
# INICIO DE QA COMPLETO
# =============================================================================

log "${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
log "${YELLOW}║          QA COMPLETO - INFOOOZE WEB PLATFORM                 ║${NC}"
log "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"
log "Timestamp: $(date)"
log "Directorio base: $BASE_DIR"

# Verificar servicios
check_services

# Variables para tracking
TOTAL_SUITES=0
PASSED_SUITES=0
FAILED_SUITES=0

# =============================================================================
# 1. PRUEBAS DE API
# =============================================================================

if run_test_suite "API Tests" "$QA_DIR/api-tests.sh"; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

# =============================================================================
# 2. PRUEBAS DE FRONTEND
# =============================================================================

if run_test_suite "Frontend Tests" "$QA_DIR/frontend-tests.sh"; then
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

# =============================================================================
# 3. PRUEBAS UNITARIAS BACKEND
# =============================================================================

log "\n${CYAN}════════════════════════════════════════════════════${NC}"
log "${CYAN}   Ejecutando: Backend Unit Tests${NC}"
log "${CYAN}════════════════════════════════════════════════════${NC}"

cd "$BASE_DIR/backend"
if npm test > "$RESULTS_DIR/backend-unit-tests-$TIMESTAMP.log" 2>&1; then
    log "${GREEN}✅ Backend Unit Tests - EXITOSO${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    log "${RED}❌ Backend Unit Tests - FALLÓ${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

# =============================================================================
# 4. PRUEBAS DE INTEGRACIÓN
# =============================================================================

log "\n${CYAN}════════════════════════════════════════════════════${NC}"
log "${CYAN}   Ejecutando: Integration Tests${NC}"
log "${CYAN}════════════════════════════════════════════════════${NC}"

# Crear y ejecutar pruebas de integración
cat > "$QA_DIR/integration-test.sh" << 'EOF'
#!/bin/bash

# Test de integración completa
API_URL="http://localhost:3001/api"
FRONTEND_URL="http://localhost:3000"

echo "=== INTEGRATION TEST: Frontend -> Backend ==="

# 1. Frontend carga dashboard
DASHBOARD=$(curl -s "$FRONTEND_URL" | grep -c "Dashboard")
if [ "$DASHBOARD" -gt 0 ]; then
    echo "✓ Dashboard carga correctamente"
else
    echo "✗ Dashboard no carga"
    exit 1
fi

# 2. API responde a frontend
STATS=$(curl -s "$API_URL/stats/overview")
if echo "$STATS" | grep -q "totalScans"; then
    echo "✓ API de estadísticas responde"
else
    echo "✗ API de estadísticas falla"
    exit 1
fi

# 3. Flujo completo: listar herramientas y ejecutar scan
TOOLS=$(curl -s "$API_URL/osint/tools")
if echo "$TOOLS" | grep -q "ipinfo"; then
    echo "✓ Herramientas OSINT disponibles"
    
    # Ejecutar scan de prueba
    SCAN_RESULT=$(curl -s -X POST "$API_URL/osint/scan" \
        -H "Content-Type: application/json" \
        -d '{"tool":"ipinfo","target":"8.8.8.8"}')
    
    if echo "$SCAN_RESULT" | grep -q "scanId"; then
        echo "✓ Scan ejecutado exitosamente"
    else
        echo "✗ Scan falló"
        exit 1
    fi
else
    echo "✗ No se pudieron obtener herramientas"
    exit 1
fi

echo "=== TODAS LAS PRUEBAS DE INTEGRACIÓN PASARON ==="
EOF

chmod +x "$QA_DIR/integration-test.sh"

if bash "$QA_DIR/integration-test.sh" > "$RESULTS_DIR/integration-tests-$TIMESTAMP.log" 2>&1; then
    log "${GREEN}✅ Integration Tests - EXITOSO${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    log "${RED}❌ Integration Tests - FALLÓ${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

# =============================================================================
# 5. PRUEBAS DE SEGURIDAD
# =============================================================================

log "\n${CYAN}════════════════════════════════════════════════════${NC}"
log "${CYAN}   Ejecutando: Security Tests${NC}"
log "${CYAN}════════════════════════════════════════════════════${NC}"

# Test básicos de seguridad
SECURITY_PASS=true

# SQL Injection test
if curl -s "http://localhost:3001/api/osint/tools/'; DROP TABLE users; --" | grep -q "404"; then
    log "  ${GREEN}✓${NC} Protegido contra SQL Injection"
else
    log "  ${RED}✗${NC} Vulnerable a SQL Injection"
    SECURITY_PASS=false
fi

# XSS test
if curl -s "http://localhost:3001/api/osint/tools/<script>alert('xss')</script>" | grep -q "404"; then
    log "  ${GREEN}✓${NC} Protegido contra XSS"
else
    log "  ${RED}✗${NC} Vulnerable a XSS"
    SECURITY_PASS=false
fi

# Headers de seguridad
HEADERS=$(curl -s -I http://localhost:3001/api/health)
if echo "$HEADERS" | grep -qi "X-Content-Type-Options"; then
    log "  ${GREEN}✓${NC} Headers de seguridad presentes"
else
    log "  ${RED}✗${NC} Headers de seguridad faltantes"
    SECURITY_PASS=false
fi

if [ "$SECURITY_PASS" = true ]; then
    log "${GREEN}✅ Security Tests - EXITOSO${NC}"
    PASSED_SUITES=$((PASSED_SUITES + 1))
else
    log "${RED}❌ Security Tests - FALLÓ${NC}"
    FAILED_SUITES=$((FAILED_SUITES + 1))
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

# =============================================================================
# 6. PRUEBAS DE CARGA
# =============================================================================

log "\n${CYAN}════════════════════════════════════════════════════${NC}"
log "${CYAN}   Ejecutando: Load Tests${NC}"
log "${CYAN}════════════════════════════════════════════════════${NC}"

# Test de carga simple con ab (Apache Bench) si está disponible
if command -v ab &> /dev/null; then
    log "  Ejecutando prueba de carga con 100 requests..."
    if ab -n 100 -c 10 -t 10 http://localhost:3001/api/health > "$RESULTS_DIR/load-test-$TIMESTAMP.log" 2>&1; then
        log "${GREEN}✅ Load Tests - EXITOSO${NC}"
        PASSED_SUITES=$((PASSED_SUITES + 1))
    else
        log "${RED}❌ Load Tests - FALLÓ${NC}"
        FAILED_SUITES=$((FAILED_SUITES + 1))
    fi
else
    log "${YELLOW}⚠️  Load Tests - ab no instalado, saltando${NC}"
fi
TOTAL_SUITES=$((TOTAL_SUITES + 1))

# =============================================================================
# GENERAR REPORTE FINAL
# =============================================================================

log "\n${YELLOW}╔══════════════════════════════════════════════════════════════╗${NC}"
log "${YELLOW}║                     RESUMEN DE QA                             ║${NC}"
log "${YELLOW}╚══════════════════════════════════════════════════════════════╝${NC}"

log "\nSuites ejecutadas: $TOTAL_SUITES"
log "${GREEN}Exitosas: $PASSED_SUITES${NC}"
log "${RED}Fallidas: $FAILED_SUITES${NC}"

# Calcular porcentaje
if [ $TOTAL_SUITES -gt 0 ]; then
    SUCCESS_RATE=$(( (PASSED_SUITES * 100) / TOTAL_SUITES ))
    log "\nTasa de éxito: ${SUCCESS_RATE}%"
    
    if [ $SUCCESS_RATE -eq 100 ]; then
        log "\n${GREEN}✅ QA COMPLETO - TODOS LOS TESTS PASARON${NC}"
        EXIT_CODE=0
    elif [ $SUCCESS_RATE -ge 80 ]; then
        log "\n${YELLOW}⚠️  QA COMPLETO - ALGUNOS TESTS FALLARON${NC}"
        EXIT_CODE=1
    else
        log "\n${RED}❌ QA COMPLETO - MÚLTIPLES FALLOS DETECTADOS${NC}"
        EXIT_CODE=2
    fi
fi

# Generar reporte HTML
cat > "$RESULTS_DIR/qa-report-$TIMESTAMP.html" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>QA Report - Infoooze Web Platform</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #2c3e50; color: white; padding: 20px; }
        .success { color: #27ae60; }
        .failure { color: #e74c3c; }
        .warning { color: #f39c12; }
        .suite { margin: 20px 0; padding: 10px; border: 1px solid #ddd; }
        .summary { background: #ecf0f1; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>QA Report - Infoooze Web Platform</h1>
        <p>Generated: $(date)</p>
    </div>
    
    <div class="summary">
        <h2>Summary</h2>
        <p>Total Suites: $TOTAL_SUITES</p>
        <p class="success">Passed: $PASSED_SUITES</p>
        <p class="failure">Failed: $FAILED_SUITES</p>
        <p>Success Rate: ${SUCCESS_RATE}%</p>
    </div>
    
    <div class="suite">
        <h3>Test Results</h3>
        <ul>
            <li>API Tests</li>
            <li>Frontend Tests</li>
            <li>Unit Tests</li>
            <li>Integration Tests</li>
            <li>Security Tests</li>
            <li>Load Tests</li>
        </ul>
    </div>
    
    <p>Full logs available in: $RESULTS_DIR</p>
</body>
</html>
EOF

log "\n📊 Reporte HTML generado: $RESULTS_DIR/qa-report-$TIMESTAMP.html"
log "📁 Todos los logs en: $RESULTS_DIR"

exit $EXIT_CODE
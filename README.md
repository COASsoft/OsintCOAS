# 🔍 COAS TEAM OSINT Platform

## 🎯 Descripción
Plataforma profesional de OSINT (Open Source Intelligence) con 34 herramientas especializadas para recopilar y analizar información de fuentes abiertas. Diseñada para investigadores de seguridad, analistas y profesionales de ciberseguridad.

![image](https://github.com/user-attachments/assets/78b0119a-a21e-4fce-b7f2-f38c1a2e53be)


## ✨ Características Principales

### 🛠️ 34 Herramientas OSINT
Organizadas en 6 categorías principales:
- **Dominios y Web**: WHOIS, DNS, subdominios, headers HTTP
- **Redes e IPs**: Geolocalización, puertos, traceroute
- **Redes Sociales**: Instagram, GitHub, búsqueda de usuarios
- **Criptomonedas**: Análisis de wallets Ethereum y Bitcoin
- **Análisis de Datos**: EXIF, expansión de URLs, análisis de teléfonos
- **Seguridad**: SSL/TLS, análisis de malware, reputación de IPs

### 📊 Dashboard en Tiempo Real
- Estadísticas de uso y rendimiento
- Actividad reciente y tendencias
- Visualización de datos con gráficos interactivos
- Métricas de éxito y fallos

### 📄 Sistema de Reportes Profesional
- Generación automática post-escaneo
- Exportación en múltiples formatos: PDF, JSON, CSV, HTML
- Plantillas personalizables
- Historial completo de escaneos

### 🔌 Integraciones con APIs Reales
- **Moralis**: Análisis de criptomonedas
- **GitHub API**: Reconocimiento de repositorios
- **IPInfo.io**: Geolocalización avanzada
- **VirusTotal**: Análisis de malware (próximamente)

## 🏗️ Arquitectura Técnica

```
OsintCOAS/
├── frontend/               # Next.js 14 + TypeScript
│   ├── src/app/           # Páginas y rutas
│   ├── src/components/    # Componentes React
│   └── src/lib/           # Lógica de negocio
├── backend/               # Node.js + Express + TypeScript
│   ├── src/routes/        # Endpoints API
│   └── src/server.ts      # Servidor principal
├── run-backend-simple.js  # Backend simplificado
└── docker-compose.yml     # Orquestación de servicios
```

### Stack Tecnológico
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Recharts
- **Backend**: Node.js, Express, Socket.io
- **Almacenamiento**: LocalStorage (cliente), Sistema de archivos
- **Deployment**: Docker, Docker Compose

## 🚀 Instalación

### Requisitos Previos
- Node.js ≥ 16.0.0
- NPM ≥ 8.0.0
- Git (recomendado)

### 🌟 Instalación Completa (Recomendada)

**Para equipos nuevos - Instala TODO desde cero:**

```bash
# Clonar repositorio
git clone https://github.com/COASsoft/OsintCOAS.git
cd OsintCOAS/fase2

# Instalación completa (Infoooze + Plataforma Web)
./install-complete.sh

# Iniciar aplicación
./start.sh
```

Este script instala:
- ✅ Infoooze OSINT CLI (18 herramientas base)
- ✅ Plataforma Web COAS (34 herramientas integradas)
- ✅ Todas las dependencias necesarias
- ✅ Scripts de control (start/stop)

### 🔧 Instalación Solo Plataforma Web

**Si ya tienes Infoooze instalado:**

```bash
# Solo la plataforma web
./install.sh

# Iniciar aplicación
./start.sh
```

### 🐳 Instalación con Docker

```bash
# Solo backend y frontend
docker-compose up backend frontend

# Stack completo (requiere nginx.conf)
docker-compose up --build
```

### 📋 Verificación de Instalación

```bash
# Probar que todo funciona
./test-platform.sh

# Verificar Infoooze manualmente
infoooze -h
infoooze -w example.com
```

### 🐳 Información adicional sobre Docker

**Servicios incluidos en docker-compose.yml:**
- Backend (Node.js) - Puerto 3001
- Frontend (Next.js) - Puerto 3000  
- Nginx (Proxy reverso) - Puerto 80 [Opcional]
- Redis (Caché) - Puerto 6379 [Opcional]

**Comandos Docker útiles:**
```bash
# Solo backend y frontend (recomendado)
docker-compose up backend frontend

# Ver logs
docker-compose logs -f

# Parar todo
docker-compose down
```

**Nota**: Para desarrollo rápido, recomendamos usar la instalación local (`./install-complete.sh + ./start.sh`). Docker es ideal para despliegues en producción.

## 📖 Uso

### Acceder a la Plataforma
1. Abrir navegador en `http://localhost:3000`
2. Dashboard principal con estadísticas
3. Navegar a "Tools" para ver las 34 herramientas
4. Ejecutar herramientas y ver resultados en tiempo real

### Ejemplos de Uso
```bash
# Análisis de dominio
- Seleccionar "WHOIS Lookup"
- Ingresar dominio: example.com
- Ver resultados detallados

# Reconocimiento de usuario
- Seleccionar "User Reconnaissance"
- Ingresar username
- Obtener perfiles en múltiples plataformas
```

## 🔧 Configuración

### Variables de Entorno
Crear archivo `.env` en frontend y backend:
```env
# API Keys (opcional)
MORALIS_API_KEY=your_key_here
IPINFO_TOKEN=your_token_here
GITHUB_TOKEN=your_token_here
```

### Personalización
- Estilos: `frontend/src/app/globals.css`
- Herramientas: `frontend/src/lib/osint-tools.ts`
- API: `backend/src/routes/osint.ts`

## 📊 API REST

### Endpoints Principales
```
POST /api/osint/execute    # Ejecutar herramienta
GET  /api/stats/overview   # Estadísticas generales
GET  /api/reports          # Listar reportes
POST /api/reports/generate # Generar reporte
```

### Ejemplo de Petición
```javascript
fetch('http://localhost:3001/api/osint/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tool: 'whois',
    target: 'example.com'
  })
})
```

## 🛡️ Seguridad

- Rate limiting implementado
- Validación de inputs
- Sanitización de datos
- CORS configurado
- Headers de seguridad con Helmet

## 🧪 Testing

```bash
# Prueba rápida de la plataforma
./test-platform.sh

# Tests del backend
cd backend
npm test

# Tests de la API
cd qa
./run-all-tests.sh

# Pruebas manuales de Infoooze
infoooze -h
infoooze -w google.com
infoooze -p 8.8.8.8
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. "infoooze command not found"
```bash
# Instalar Infoooze
npm install -g infoooze

# O usar instalación completa
./install-complete.sh
```

#### 2. "Frontend failed to start"
```bash
# Reinstalar dependencias del frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### 3. "Backend API not responding"
```bash
# Verificar que el puerto 3001 esté libre
lsof -i :3001
kill -9 <PID>

# Reiniciar backend
./stop.sh
./start.sh
```

#### 4. "Permission denied" en scripts
```bash
# Dar permisos de ejecución
chmod +x *.sh
chmod +x qa/*.sh
```

### Comandos Útiles

```bash
# Control de la plataforma
./start.sh              # Iniciar todo
./stop.sh               # Detener todo
./test-platform.sh      # Probar funcionamiento

# Ver logs en tiempo real
tail -f backend.log
tail -f frontend.log

# Estado de procesos
ps aux | grep node

# Verificar puertos
lsof -i :3000
lsof -i :3001

# Limpiar instalación
./stop.sh
rm -rf frontend/node_modules
rm -rf backend/node_modules
./install-complete.sh
```

## 📈 Rendimiento

- Caché de resultados para optimización
- Procesamiento asíncrono
- WebSocket para actualizaciones en tiempo real
- Lazy loading de componentes

## 🤝 Contribuir

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/NuevaCaracteristica`)
3. Commit cambios (`git commit -m 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/NuevaCaracteristica`)
5. Abrir Pull Request

## 📋 Roadmap

- [ ] Autenticación y roles de usuario
- [ ] Base de datos PostgreSQL
- [ ] Más integraciones de APIs
- [ ] Análisis de malware avanzado
- [ ] Exportación a SIEM
- [ ] Modo oscuro nativo
- [ ] Aplicación móvil

## ⚖️ Licencia

Este proyecto está bajo la Licencia MIT. Ver archivo `LICENSE` para más detalles.

## 🙏 Agradecimientos

- Comunidad OSINT
- Contribuidores del proyecto
- APIs públicas utilizadas

---

**COAS TEAM** - Herramientas profesionales de ciberseguridad

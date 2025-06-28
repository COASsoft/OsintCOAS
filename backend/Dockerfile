# Backend Dockerfile para Infoooze API
FROM node:18-alpine

# Crear directorio de la aplicación
WORKDIR /app

# Instalar dependencias del sistema necesarias para infoooze
RUN apk add --no-cache \
    git \
    curl \
    bash \
    python3 \
    make \
    g++

# Copiar archivos de dependencias
COPY package*.json ./
COPY tsconfig.json ./

# Instalar dependencias de Node.js
RUN npm ci --only=production

# Instalar infoooze globalmente
RUN npm install -g infoooze

# Copiar código fuente
COPY src/ ./src/

# Compilar TypeScript
RUN npm run build

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs
RUN adduser -S backend -u 1001

# Crear directorios necesarios
RUN mkdir -p /app/logs /app/results
RUN chown -R backend:nodejs /app

# Cambiar a usuario no-root
USER backend

# Exponer puerto
EXPOSE 3001

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Comando de inicio
CMD ["node", "dist/server.js"]
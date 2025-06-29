# Frontend Dockerfile para Infoooze Web Platform
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache libc6-compat

# Establecer directorio de trabajo
WORKDIR /app

# Etapa de dependencias
FROM base AS deps

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci

# Etapa de construcción
FROM base AS builder
WORKDIR /app

# Copiar dependencias instaladas
COPY --from=deps /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Configurar variables de entorno para build
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# Construir la aplicación
RUN npm run build

# Etapa de producción
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Crear usuario no-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos necesarios para producción
COPY --from=builder /app/public ./public

# Configurar permisos para archivos estáticos
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copiar archivos de construcción
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Cambiar a usuario no-root
USER nextjs

# Exponer puerto
EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000 || exit 1

# Comando de inicio
CMD ["node", "server.js"]
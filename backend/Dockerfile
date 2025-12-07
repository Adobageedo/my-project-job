# =====================================================
# Dockerfile multi-stage pour production
# =====================================================

# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./
COPY prisma ./prisma/

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier le code source
COPY . .

# Générer Prisma Client
RUN npx prisma generate

# Build l'application
RUN npm run build

# Stage 2: Production
FROM node:18-alpine

WORKDIR /app

# Installer seulement les outils nécessaires
RUN apk add --no-cache tini

# Créer user non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

# Copier package.json
COPY package*.json ./
COPY prisma ./prisma/

# Installer seulement les dépendances de production
RUN npm ci --only=production && npm cache clean --force

# Générer Prisma Client
RUN npx prisma generate

# Copier le build depuis le stage builder
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

# Copier les templates d'emails si utilisés
COPY --chown=nestjs:nodejs ./src/modules/email/templates ./dist/modules/email/templates

# Changer vers user non-root
USER nestjs

# Exposer le port
EXPOSE 3000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Utiliser tini pour gérer les signaux
ENTRYPOINT ["/sbin/tini", "--"]

# Démarrer l'application
CMD ["node", "dist/main.js"]

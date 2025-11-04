# ---- Builder stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Cache busting - force rebuild when this changes
ARG CACHEBUST=1
RUN echo "Cache bust: $CACHEBUST"

# Install all deps for build (including devDependencies for TypeScript)
COPY package*.json ./
RUN rm -rf node_modules package-lock.json && npm install && \
    echo "===== Checking axios installation =====" && \
    ls -la node_modules | grep axios && \
    npm list axios

# Copy sources and tsconfig
COPY tsconfig.json ./
COPY src ./src

# Build TypeScript
RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps (omit optional like sqlite3 to avoid build issues on Alpine)
COPY package*.json ./
RUN npm install --omit=dev --omit=optional

# Copy built files
COPY --from=builder /app/dist ./dist

# Prepare data dir (optional)
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Healthcheck via node fetch (no curl dependency)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "const p=process.env.PORT||3000; fetch('http://localhost:'+p+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]

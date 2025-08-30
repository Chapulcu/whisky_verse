# Multi-stage build for optimized production
FROM node:18-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install all dependencies (including dev for build)
RUN npm install

# Copy source code
COPY . .

# Build the application without TypeScript checks
ENV NODE_ENV=production
RUN npx vite build

# Production stage
FROM nginx:alpine

# Install curl for healthcheck
RUN apk add --no-cache curl

# Copy built app to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy startup script
COPY docker/startup.sh /docker-entrypoint.d/40-envsubst-on-templates.sh
RUN chmod +x /docker-entrypoint.d/40-envsubst-on-templates.sh

# Expose port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Add build info
LABEL version="1.0.0" \
      description="WhiskyVerse - Whisky Community Platform" \
      maintainer="WhiskyVerse Team"

CMD ["nginx", "-g", "daemon off;"]
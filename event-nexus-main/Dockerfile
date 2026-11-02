# syntax=docker/dockerfile:1

# ─── Stage 1: Build ─────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy application source
COPY . .

# Build arguments for Vite environment variables
ARG VITE_FIREBASE_API_KEY=AIzaSyDBhQj_lcw7jaS8ytOYenmgZaharglauG8
ARG VITE_FIREBASE_AUTH_DOMAIN=event-management-portal-b5e4e.firebaseapp.com
ARG VITE_FIREBASE_PROJECT_ID=event-management-portal-b5e4e
ARG VITE_FIREBASE_STORAGE_BUCKET=event-management-portal-b5e4e.firebasestorage.app
ARG VITE_FIREBASE_MESSAGING_SENDER_ID=127861963890
ARG VITE_FIREBASE_APP_ID=1:127861963890:web:473c77af7f4a993b0b96eb
ARG VITE_API_BASE_URL=http://localhost:5000/api

ENV VITE_FIREBASE_API_KEY=$VITE_FIREBASE_API_KEY
ENV VITE_FIREBASE_AUTH_DOMAIN=$VITE_FIREBASE_AUTH_DOMAIN
ENV VITE_FIREBASE_PROJECT_ID=$VITE_FIREBASE_PROJECT_ID
ENV VITE_FIREBASE_STORAGE_BUCKET=$VITE_FIREBASE_STORAGE_BUCKET
ENV VITE_FIREBASE_MESSAGING_SENDER_ID=$VITE_FIREBASE_MESSAGING_SENDER_ID
ENV VITE_FIREBASE_APP_ID=$VITE_FIREBASE_APP_ID
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

# Build optimized static production bundle
RUN npm run build

# ─── Stage 2: Serve with Nginx ──────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx website
RUN rm -rf /usr/share/nginx/html/*

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]


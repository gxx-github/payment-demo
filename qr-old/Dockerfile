## ===== Stage 1: Build the app =====
ARG TARGETPLATFORM
ARG BUILDPLATFORM

FROM --platform=$BUILDPLATFORM node:20-alpine AS builder
# Set working directory
WORKDIR /app

# Install dependencies first (leverage Docker layer caching)
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Build for production
RUN yarn build


## ===== Stage 2: Run with Nginx =====
FROM --platform=$TARGETPLATFORM nginx:alpine

# Nginx config to serve on port 80/443 and support SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets
COPY --from=builder /app/build /usr/share/nginx/html

# Expose ports 80 and 443
EXPOSE 80 443

# Healthcheck (using HTTP endpoint)
HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://127.0.0.1:80/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]



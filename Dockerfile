# Build stage
FROM node:18 as build

# Set working directory
WORKDIR /app

# Copy frontend package files first for better caching
COPY frontend/package.json frontend/package-lock.json ./

# Install dependencies with legacy peer deps flag to avoid conflicts
RUN npm ci --legacy-peer-deps

# Copy frontend source code
COPY frontend/ ./

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy build files to nginx
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"] 
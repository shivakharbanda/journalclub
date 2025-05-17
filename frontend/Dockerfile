# ---------- Build Stage ----------
FROM node:18-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source files
COPY . .

# Build Vite project (output goes to /app/dist)
RUN npm run build


# ---------- Production Serve Stage ----------
FROM nginx:stable-alpine AS production

# Copy static assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy default Nginx config (optional override)
# COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

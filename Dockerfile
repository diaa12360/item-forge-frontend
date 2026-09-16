# syntax=docker/dockerfile:1

# ---- Build: compile the Angular app to static files ----
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json .npmrc ./
RUN npm ci

COPY . .

# The API base URL is BUILD-time: it is compiled into the bundle, so
# `docker run -e API_BASE_URL=...` does nothing. Rebuild to change it:
#   docker build --build-arg API_BASE_URL=https://api.example.com/api/v1 -t itemforge-web .
ARG API_BASE_URL=http://localhost:8000/api/v1
RUN printf "export const environment = {\n  apiBaseUrl: '%s',\n};\n" "$API_BASE_URL" > src/environments/environment.ts \
    && npm run build

# ---- Serve: nginx as a non-root user on 8080 ----
FROM nginx:alpine AS serve

COPY nginx.conf /etc/nginx/nginx.conf
RUN rm -f /etc/nginx/conf.d/default.conf

COPY --from=build /app/dist/frontend-angular/browser /usr/share/nginx/html

RUN chown -R nginx:nginx /usr/share/nginx/html \
    && touch /tmp/nginx.pid \
    && chown nginx:nginx /tmp/nginx.pid
USER nginx

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:8080/ || exit 1

CMD ["nginx", "-g", "daemon off;"]

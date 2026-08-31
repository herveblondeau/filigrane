# Stage 1: build Vite bundle
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:1.27-alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
# nginx.conf is rendered at container start by the image's envsubst entrypoint:
# /etc/nginx/templates/*.template -> $NGINX_ENVSUBST_OUTPUT_DIR, substituting only
# defined env vars (WORKFLOW_API_URL, WORKFLOW_API_KEY), leaving nginx's own $vars.
COPY nginx.conf.template /etc/nginx/templates/nginx.conf.template
ENV NGINX_ENVSUBST_OUTPUT_DIR=/etc/nginx
EXPOSE 80

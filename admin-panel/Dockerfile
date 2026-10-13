FROM node:20-bookworm-slim AS build

WORKDIR /app

ARG REACT_APP_API_URL=
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV CI=false

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:1.27-alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.sh
COPY --from=build /app/build /usr/share/nginx/html

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=20s --timeout=5s --retries=8 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]

FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# Vite 在构建时把 key 内联进前端包（PrimeUI 授权密钥属于前端公开配置）
ARG VITE_PRIMEUI_LICENSE_KEY=
ENV VITE_PRIMEUI_LICENSE_KEY=$VITE_PRIMEUI_LICENSE_KEY
RUN bun run build-only

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173

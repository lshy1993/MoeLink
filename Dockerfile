FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
# 构建上下文里如果带入了 node_modules（上传时符号链接可能被解引用成普通文件，
# 导致 .bin/vite 里的 import('../dist/node/cli.js') 解析到错误位置），强制重装。
RUN if [ ! -L node_modules/.bin/vite ]; then rm -rf node_modules && bun install --frozen-lockfile; fi

# Vite 在构建时把 key 内联进前端包（PrimeUI 授权密钥属于前端公开配置）
ARG VITE_PRIMEUI_LICENSE_KEY=
ENV VITE_PRIMEUI_LICENSE_KEY=$VITE_PRIMEUI_LICENSE_KEY
# 直接执行 Vite 真实入口，不再经过 node_modules/.bin 符号链接
RUN bun node_modules/vite/bin/vite.js build

FROM nginx:alpine

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 5173

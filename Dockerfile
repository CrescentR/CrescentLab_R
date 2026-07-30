# syntax=docker/dockerfile:1

ARG GO_IMAGE=m.daocloud.io/docker.io/library/golang:1.26-alpine
ARG ALPINE_IMAGE=m.daocloud.io/docker.io/library/alpine:3.22
ARG NODE_IMAGE=m.daocloud.io/docker.io/library/node:24-slim

FROM ${GO_IMAGE} AS backend-build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/crescentlab ./main.go

FROM ${ALPINE_IMAGE} AS backend
WORKDIR /app
RUN apk add --no-cache ca-certificates \
  && addgroup -S crescentlab \
  && adduser -S crescentlab -G crescentlab \
  && mkdir -p /app/data \
  && chown -R crescentlab:crescentlab /app
COPY --from=backend-build /out/crescentlab /app/crescentlab
COPY default_files /app/default_files
USER crescentlab
EXPOSE 8091
CMD ["/app/crescentlab"]

FROM ${NODE_IMAGE} AS frontend-build
WORKDIR /src/frontend
ARG BACKEND_URL=http://backend:8091
ARG NPM_REGISTRY=https://registry.npmmirror.com
ENV BACKEND_URL=${BACKEND_URL}
RUN corepack enable && corepack prepare pnpm@10.28.2 --activate
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm config set registry "${NPM_REGISTRY}" \
  && pnpm install --frozen-lockfile
COPY frontend ./
RUN pnpm run build

FROM ${NODE_IMAGE} AS frontend
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=frontend-build --chown=node:node /src/frontend/.next/standalone ./
COPY --from=frontend-build --chown=node:node /src/frontend/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]

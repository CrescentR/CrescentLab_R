# syntax=docker/dockerfile:1

ARG GO_VERSION=1.26
ARG NODE_VERSION=24

FROM golang:${GO_VERSION}-alpine AS backend-build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o /out/crescentlab ./main.go

FROM alpine:3.22 AS backend
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

FROM node:${NODE_VERSION}-alpine AS frontend-build
WORKDIR /src/frontend
ARG BACKEND_URL=http://backend:8091
ENV BACKEND_URL=${BACKEND_URL}
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend ./
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS frontend
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000
RUN addgroup -S crescentlab \
  && adduser -S crescentlab -G crescentlab \
  && chown -R crescentlab:crescentlab /app
COPY --from=frontend-build --chown=crescentlab:crescentlab /src/frontend/.next/standalone ./
COPY --from=frontend-build --chown=crescentlab:crescentlab /src/frontend/.next/static ./.next/static
USER crescentlab
EXPOSE 3000
CMD ["node", "server.js"]

# syntax=docker/dockerfile:1

# --- Build stage: compile TypeScript with full dev dependencies ---
FROM node:24-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# --- Production stage: runtime image with compiled output only ---
FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production
ENV HUSKY=0

COPY package.json package-lock.json ./

RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

COPY --from=builder /app/dist ./dist

USER node

EXPOSE 3000

CMD ["node", "dist/main"]

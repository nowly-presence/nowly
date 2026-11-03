FROM node:26-alpine AS base

RUN npm install --global pnpm@11.25.0
RUN apk add --no-cache git

WORKDIR /app

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/api build

CMD ["sh", "-c", "pnpm --filter @nowly/database migrate && cd /app/apps/api && exec node dist/index.js"]

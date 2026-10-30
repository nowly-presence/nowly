FROM node:26-alpine AS base

RUN npm install --global pnpm@11.25.0
RUN apk add --no-cache git

WORKDIR /app

COPY . .

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/api exec prisma generate && \
    pnpm --filter @nowly/api build

# Apply pending migrations against DATABASE_URL at runtime, then start the API.
CMD ["sh", "-c", "cd /app/apps/api && sh migrate-deploy.sh && exec node dist/index.js"]

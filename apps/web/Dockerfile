FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache git

WORKDIR /app

COPY . .

RUN rm -rf packages/sdk && \
    git clone --depth 1 --branch stable https://github.com/nowly-presence/sdk.git packages/sdk && \
    rm -rf packages/sdk/.git && \
    rm -rf packages/cli packages/presences packages/internal-cli

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/sdk build && \
    pnpm --filter @nowly/web build

CMD ["pnpm", "--filter", "@nowly/web", "start"]

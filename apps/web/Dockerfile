FROM node:22-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate
RUN apk add --no-cache git

WORKDIR /app

COPY . .

RUN rm -rf packages/sdk && \
    git clone --depth 1 --branch stable https://github.com/nowly-presence/sdk.git packages/sdk && \
    rm -rf packages/sdk/.git

RUN pnpm install --frozen-lockfile && \
    pnpm --filter @nowly/web build

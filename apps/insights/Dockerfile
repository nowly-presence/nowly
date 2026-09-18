FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
RUN apk add --no-cache git

WORKDIR /app

COPY . .

RUN rm -rf packages/sdk && \
    git clone --depth 1 --branch stable https://github.com/nowly-presence/sdk.git packages/sdk && \
    rm -rf packages/sdk/.git && \
    rm -rf packages/cli packages/presences packages/internal-cli

ARG NEXT_PUBLIC_API_URL_DEV=https://dev.api.nowly.me
ARG NEXT_PUBLIC_API_URL_PROD=https://api.nowly.me

ENV NEXT_PUBLIC_API_URL_DEV=$NEXT_PUBLIC_API_URL_DEV \
    NEXT_PUBLIC_API_URL_PROD=$NEXT_PUBLIC_API_URL_PROD \
    NODE_ENV=production \
    PORT=3003 \
    HOSTNAME=0.0.0.0

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/insights build

EXPOSE 3003

CMD ["sh", "-c", "pnpm --filter @nowly/insights exec next start -H 0.0.0.0 -p ${PORT:-3003}"]

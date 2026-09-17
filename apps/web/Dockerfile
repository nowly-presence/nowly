FROM node:22-alpine AS base

RUN corepack enable && corepack prepare pnpm@11.25.0 --activate
RUN apk add --no-cache git

WORKDIR /app

COPY . .

RUN rm -rf packages/sdk && \
    git clone --depth 1 --branch stable https://github.com/nowly-presence/sdk.git packages/sdk && \
    rm -rf packages/sdk/.git && \
    rm -rf packages/cli packages/presences packages/internal-cli

ARG NEXT_PUBLIC_API_BASE_URL=https://api.nowly.me
ARG NEXT_PUBLIC_BASE_URL=https://nowly.me
ARG NEXT_PUBLIC_DOCS_BASE_URL=https://docs.nowly.me
ARG NEXT_PUBLIC_EXTENSION_ID=kmnlnfldimgneaopdihplkebobckcjpf
ARG PRESENCE_API_URL=https://api.nowly.me
ARG NEXT_PUBLIC_ADSENSE_ENABLED=false
ARG NEXT_PUBLIC_ADSENSE_CLIENT_ID=
ARG NEXT_PUBLIC_ADSENSE_LANDING_SLOT=
ARG NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT=

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_DOCS_BASE_URL=$NEXT_PUBLIC_DOCS_BASE_URL \
    NEXT_PUBLIC_EXTENSION_ID=$NEXT_PUBLIC_EXTENSION_ID \
    PRESENCE_API_URL=$PRESENCE_API_URL \
    NEXT_PUBLIC_ADSENSE_ENABLED=$NEXT_PUBLIC_ADSENSE_ENABLED \
    NEXT_PUBLIC_ADSENSE_CLIENT_ID=$NEXT_PUBLIC_ADSENSE_CLIENT_ID \
    NEXT_PUBLIC_ADSENSE_LANDING_SLOT=$NEXT_PUBLIC_ADSENSE_LANDING_SLOT \
    NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT=$NEXT_PUBLIC_ADSENSE_LIBRARY_SLOT \
    SKIP_ENV_VALIDATION=true \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/web build

EXPOSE 3000

CMD ["pnpm", "--filter", "@nowly/web", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3000"]

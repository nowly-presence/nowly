FROM node:26-alpine AS base

RUN npm install --global pnpm@11.25.0
RUN apk add --no-cache git

WORKDIR /app

COPY . .

ARG NEXT_PUBLIC_DOCS_BASE_PATH=
ARG NEXT_PUBLIC_DOCS_BASE_URL=https://docs.nowly.me

ENV NEXT_PUBLIC_DOCS_BASE_PATH=$NEXT_PUBLIC_DOCS_BASE_PATH \
    NEXT_PUBLIC_DOCS_BASE_URL=$NEXT_PUBLIC_DOCS_BASE_URL

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/docs build

CMD ["pnpm", "--filter", "@nowly/docs", "start"]

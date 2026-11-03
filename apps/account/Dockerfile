FROM node:26-alpine AS base

RUN npm install --global pnpm@11.25.0
RUN apk add --no-cache git

WORKDIR /app

COPY . .

ARG NEXT_PUBLIC_API_BASE_URL=https://api.nowly.me
ARG NEXT_PUBLIC_BASE_URL=https://nowly.me
ARG NEXT_PUBLIC_SUBMISSION_IMAGES_ORIGIN=https://cdn.nowly.me

ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL \
    NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_SUBMISSION_IMAGES_ORIGIN=$NEXT_PUBLIC_SUBMISSION_IMAGES_ORIGIN \
    NODE_ENV=production \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN pnpm install --no-frozen-lockfile && \
    pnpm --filter @nowly/account build

EXPOSE 3000

CMD ["sh", "-c", "pnpm --filter @nowly/account exec next start -H 0.0.0.0 -p ${PORT:-3000}"]

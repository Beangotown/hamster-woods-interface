FROM node:20-alpine AS base

ARG web=/opt/workspace/hamster-example
ARG external_port=3000

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat git
WORKDIR ${web}

# Install dependencies based on the preferred package manager
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN yarn --frozen-lockfile

# Rebuild the source code only when needed∏
FROM base AS builder
WORKDIR ${web}
COPY --from=deps ${web}/node_modules ./node_modules
COPY . .

# Next.js collects completely anonymous telemetry data about general usage.
# Learn more here: https://nextjs.org/telemetry
# Uncomment the following line in case you want to disable telemetry during the build.
ENV NEXT_TELEMETRY_DISABLED=1

# TODO - remove $ENVIRONMENT from CI builds after confirming no dependency
ARG ENVIRONMENT
ARG APP_ENV
RUN echo "...Building for ${ENVIRONMENT} / ${APP_ENV}"

# more standardised build script, refer to package.json
RUN NODE_OPTIONS=--max-old-space-size=8192 \
    NEXT_PUBLIC_STANDALONE=1 \
    NEXT_PUBLIC_APP_ENV="$APP_ENV" \
    npx next build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR ${web}

ENV NODE_ENV=production
# Uncomment the following line in case you want to disable telemetry during runtime.
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next
RUN ls .next

# https://nextjs.org/docs/14/pages/api-reference/next-config-js/output
COPY --from=builder --chown=nextjs:nodejs ${web}/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs ${web}/public ./public/
COPY --from=builder --chown=nextjs:nodejs ${web}/.next/static ./.next/static

USER nextjs

EXPOSE ${external_port}

ENV PORT=${external_port}

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
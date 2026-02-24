# Stage 1: Deps
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./

RUN npm install

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache libc6-compat

RUN addgroup -S nodebusers && adduser -S nodeuser -G nodebusers


COPY --from=builder --chown=nodeuser:nodebusers /app/public ./public
COPY --from=builder --chown=nodeuser:nodebusers /app/.next/standalone ./
COPY --from=builder --chown=nodeuser:nodebusers /app/.next/static ./.next/static

USER nodeuser
EXPOSE 3000
ENV PORT=3000
CMD ["node", "server.js"]
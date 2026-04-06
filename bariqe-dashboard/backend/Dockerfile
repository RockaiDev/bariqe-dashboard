# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
RUN npm prune --production

# Stage 2: Run
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup -S nodebusers && adduser -S nodeuser -G nodebusers &&\
    mkdir -p /app/uploads && \
    chown -R nodeuser:nodebusers /app && \
    chmod 750 /app && \
    chmod 770 /app/uploads

COPY --from=builder --chown=nodeuser:nodebusers /app/package*.json ./
COPY --from=builder --chown=nodeuser:nodebusers /app/node_modules ./node_modules
COPY --from=builder --chown=nodeuser:nodebusers /app/dist ./dist

USER nodeuser

CMD ["node", "dist/app.js"] 
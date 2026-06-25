# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json tsconfig.json ./
COPY prisma ./prisma/
RUN npm ci
RUN npx prisma generate
COPY src ./src
RUN npm run build

# Stage 2: Runtime
FROM node:20-alpine
WORKDIR /usr/src/app
RUN apk add --no-cache openssl
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev && npx prisma generate
COPY --from=builder /usr/src/app/dist ./dist
ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000
CMD ["npm", "start"]

# syntax=docker/dockerfile:1
# Production image for the Tristaravel web app (React Router 7 SSR + Hono server).
#
# Railway (and most container hosts) will detect this Dockerfile and use it
# automatically. Two stages: the build stage uses the full node image (which has
# the toolchain argon2's native module may need); the runtime stage is slim.
# Bun is used for install/build to match the committed bun.lock.

# ---- Build stage ----
FROM node:22 AS build
WORKDIR /app
RUN npm install -g bun
# Install deps first (cached unless package.json / bun.lock change).
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
# Then copy the source and build.
COPY . .
RUN bun run build

# ---- Runtime stage ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# The Hono server reads process.env.PORT; hosts like Railway inject it at runtime.
ENV PORT=3000
COPY --from=build /app/build ./build
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./package.json
# Included so you can run the admin driver-creation script and (re)apply the DB
# schema from inside the container if you ever need to.
COPY --from=build /app/scripts ./scripts
COPY --from=build /app/db ./db
EXPOSE 3000
CMD ["node", "./build/server/index.js"]

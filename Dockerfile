# ---- build ----
FROM node:24-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nitro externalizes a handful of deps it can't inline (e.g. the OG-image renderer)
# into a minimal .output/server/package.json, meant to be `npm install`ed at deploy
# time. For the renderer's platform-specific native binary it sometimes hard-pins the
# wrong platform variant (e.g. asks for the glibc build on this musl image) — strip
# those pinned sub-packages and keep only the umbrella package, whose own
# optionalDependencies field lets a normal `npm install` pick the right native binary
# for whatever platform is actually running it, exactly as it did for this build.
RUN node -e " \
  const fs = require('fs'); \
  const p = '.output/server/package.json'; \
  const pkg = JSON.parse(fs.readFileSync(p, 'utf8')); \
  pkg.dependencies = pkg.dependencies || {}; \
  for (const dep of Object.keys(pkg.dependencies)) { \
    if (/^@takumi-rs\/core-/.test(dep)) delete pkg.dependencies[dep]; \
  } \
  fs.writeFileSync(p, JSON.stringify(pkg, null, 2)); \
"
RUN cd .output/server && npm install --omit=dev --no-audit --no-fund

# ---- runtime ----
FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NITRO_PORT=3000
ENV NITRO_HOST=0.0.0.0

COPY --from=build /app/.output ./.output
COPY --from=build /app/scripts ./scripts

EXPOSE 3000
CMD ["node", "--disable-warning=ExperimentalWarning", ".output/server/index.mjs"]

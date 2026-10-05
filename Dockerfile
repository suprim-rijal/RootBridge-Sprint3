# One image with the API and the built website.
#   docker build -t rootbridge .
#   docker run -p 5000:5000 --env-file backend/.env rootbridge
FROM node:20-alpine AS web
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY backend/package*.json backend/
RUN npm --prefix backend ci --omit=dev
COPY backend/ backend/
COPY --from=web /app/frontend/dist frontend/dist
# The seed script reads the course content from these files.
COPY frontend/src/data frontend/src/data
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s \
  CMD wget -qO- http://127.0.0.1:5000/api/health || exit 1
CMD ["node", "backend/server.js"]

FROM node:20-alpine AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ .
RUN npm run build

FROM node:20-alpine AS server-build
WORKDIR /app/server
COPY server/package*.json ./
RUN npm install --ignore-scripts
COPY server/ .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=server-build /app/server/dist ./dist
COPY --from=server-build /app/server/node_modules ./node_modules
COPY --from=client-build /app/client/dist ./client/dist

ENV NODE_ENV=production
EXPOSE 3000

CMD ["node", "dist/index.js"]

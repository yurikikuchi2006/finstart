FROM node:24-bookworm-slim
WORKDIR /app
RUN npm install --global pnpm@9
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
COPY --chown=node:node . .
ENV NODE_ENV=production HOST=0.0.0.0 PORT=3000
USER node
EXPOSE 3000
CMD ["node", "server/index.js"]

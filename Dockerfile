FROM node:22-alpine

WORKDIR /app

# Install dependencies including build tools
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Compile Tailwind CSS v4 asset bundle and prune devDependencies
RUN npm run build:css && npm prune --omit=dev

# Set production environment and non-root user
ENV NODE_ENV=production
USER node

EXPOSE 5000

CMD ["npm", "start"]

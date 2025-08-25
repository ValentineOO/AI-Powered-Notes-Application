FROM node:20-alpine

WORKDIR /app

# Copy package files first for better caching
COPY package*.json ./
RUN npm ci

# Copy source code (this layer changes most often)
COPY . .

# Install serve globally for production fallback
RUN npm install -g serve

EXPOSE 3000

# Use development mode if node_modules volume is mounted, otherwise production
CMD ["sh", "-c", "if [ -d '/app/node_modules' ]; then npm run dev -- --host 0.0.0.0 --port 3000; else npm run build && serve -s dist -l 3000; fi"]

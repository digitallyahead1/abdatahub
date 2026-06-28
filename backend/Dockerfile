FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3001

# Start application
CMD ["npm", "run", "start:prod"]

# Use a specific Linux Node image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the rest of your server code
COPY . .

# Expose the app port
EXPOSE 10000

# Start the server
CMD ["node", "index.js"]
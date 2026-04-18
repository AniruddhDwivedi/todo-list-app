# backend/Dockerfile
FROM node:20-slim

# Create app directory
WORKDIR /app

# Install dependencies first (better for caching)
COPY package*.json ./
RUN npm install

# Copy the rest of the code
COPY . .

# Expose the port your Express app runs on
EXPOSE 3001

# Start the server
CMD ["npm", "run", "server"]
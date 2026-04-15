# frontend/Dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite's default dev port
EXPOSE 5173

# Start Vite and make it accessible outside the container
CMD ["npm", "run", "dev", "--", "--host"]
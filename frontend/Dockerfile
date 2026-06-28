FROM node:20-alpine

WORKDIR /app

# Copy package definitions first to optimize Docker layer cache
COPY package.json package-lock.json ./

# Install package dependencies
RUN npm ci

# Copy the rest of the application files
COPY . .

# Expose Vite dev port
EXPOSE 5173

# Run the dev command
CMD ["npm", "run", "dev"]

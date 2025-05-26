# Base image
FROM node:24-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package.json and install
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose backend port
EXPOSE 5000

# Start the app
# CMD ["node", "index.js"]
#  If you use nodemon during development, replace CMD with:
CMD ["npx", "nodemon", "index.js"]

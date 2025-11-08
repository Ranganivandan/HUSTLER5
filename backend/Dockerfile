# syntax=docker/dockerfile:1
FROM node:20-alpine

WORKDIR /usr/src/app

# Install deps first
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# Copy the rest
COPY . .

# Generate Prisma client
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "dev"]

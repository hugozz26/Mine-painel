FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# Run migrations and seed, then start
CMD ["sh", "-c", "npx prisma migrate deploy && npm run seed && npm start"]

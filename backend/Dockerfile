FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

# Тепер копіює весь вихідний код і компілюємо tsc -> dist/
COPY . .
RUN npm run build


# фінальний образ
FROM node:20-alpine AS runtime

WORKDIR /app

# Запускає не від root 
ENV NODE_ENV=production

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# копіює тільки зібраний код з попереднього stage
COPY --from=build /app/dist ./dist

# App Runner за замовчуванням слухає 8080 але мій server.ts бере порт з env
ENV PORT=8080
EXPOSE 8080

CMD ["node", "dist/server.js"]
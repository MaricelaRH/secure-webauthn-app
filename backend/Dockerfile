FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY backend ./backend
COPY ../frontend /app/frontend

EXPOSE 3000

CMD ["node", "backend/server.js"]

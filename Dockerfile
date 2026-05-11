FROM node:20-alpine

# creating app directory
WORKDIR /app

COPY package.json pnpm-lock.yaml ./

RUN npm install -g pnpm

RUN pnpm install


# copying project files
COPY . .

#building typescript
RUN pnpm tsc 

CMD [ "node", "dist/index.js" ]

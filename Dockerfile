FROM node:12.10 AS base

RUN mkdir -p /app/node_modules && chown -R node:node /app

# Create app directory
WORKDIR /app

USER node
# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

# Bundle app source
COPY . .

RUN npm install

RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production

CMD [ "npm", "start" ]


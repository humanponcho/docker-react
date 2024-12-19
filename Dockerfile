FROM node:14-alpine as builder
WORKDIR '/app'
COPY package*.json .
RUN npm install
COPY . .
RUN npm run build

# Add a stage to run tests
FROM node:14-alpine as tester
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
RUN npm test -- --coverage

FROM nginx:alpine
COPY  --from=builder /app/build /usr/share/nginx/html
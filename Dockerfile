FROM node:alpine as builder
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
RUN npm run build

# Add a stage to run tests
FROM node:alpine as tester
WORKDIR '/app'
COPY package.json .
RUN npm install
COPY . .
CMD ["npm", "test", "--", "--coverage"]

FROM nginx
COPY  --from=builder /app/build /usr/share/nginx/html
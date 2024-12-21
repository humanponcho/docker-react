# Code Citations

## License: MIT
https://github.com/cristip/septica/tree/5adc8c642e7510de1ff404de7cbded2286ee6eb9/docker-compose.yml

```
services:
  web:
    build: 
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - /app/node_modules
      - .:/app
  tests:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - /app/node_modules
      - .
```


# facts-api

An Express API that returns random facts, built for the BED2 Cloud and Deployment Services CA. It is tested, containerised, and deployed to Azure App Service through a GitHub Actions pipeline.

## Endpoints

| Endpoint      | Returns                                              |
| ------------- | ---------------------------------------------------- |
| `GET /health` | `{ "status": "ok", "environment": "<ENVIRONMENT>" }` |
| `GET /fact`   | `{ "fact": "<a random fact>" }`                      |

## Running it

Copy `.env.example` to `.env` and set `ENVIRONMENT`, then:

```bash
npm install
npm start        # http://localhost:3000
npm test         # jest + supertest
```

With Docker Compose:

```bash
docker compose up --build
```

## Deployment

Every push to `main` runs the tests, then builds the image and pushes it to Azure Container Registry, tagged `latest` and the short commit SHA. A registry webhook tells App Service to pull the new `latest` and restart.

Live at https://facts-alpisi06018.azurewebsites.net/fact

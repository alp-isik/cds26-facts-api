# facts-api

An Express API with one endpoint and none of the machinery around it. This is the starting point for the BED2 Cloud and Deployment Services course assignment.

The full brief is in [cds-spec.md](cds-spec.md). Read it before changing anything.

## Running it

```bash
npm install
npm start
```

It listens on port 3000.

| Endpoint | Returns |
|---|---|
| `GET /health` | `{ "status": "ok", "environment": "default" }` |

## What is missing

All of it is missing on purpose, and putting it there is the assignment:

- The `environment` value in the `/health` response is a literal in the source.
- There is no `dotenv`, and nothing loads the `.env` file that is sitting in the repository.
- There is no `.gitignore`, which is why that `.env` is committed, along with the fake API key in it.
- There is no `Dockerfile`, no `.dockerignore`, no Compose file and no workflow.
- There are no tests, and no test framework in `package.json`.
- There are no facts.

# BED2 Cloud and Deployment Services - Course Assignment

> You are given a small working API and asked to make it deployable, deploy it, and then automate it. 

> It has three parts: a practical worth 70 marks, seven written questions worth 20, and a ten-question quiz worth 10. All of it is submitted as one PDF along with your Git repository.

## 1. The scenario

A startup has approached you for help with an API they cannot deploy.

It is a brownfield project *[an existing codebase you inherit rather than start]*. It runs on a developer's laptop and nowhere else: the configuration is hardcoded, the secrets are committed, there is nothing that builds it, and nothing that proves it still works after a change. 

They want it running in the cloud, and they want it to get there through a pipeline rather than through somebody's terminal.

They also want to create the facts endpoint they have been asking for since the project started.

You have three jobs, and they are the three parts of this assignment.

1. Get the project into a state where it can be deployed at all.
2. Deploy it, and then automate the deployment so that pushing code is the only manual step left.
3. Explain to the rest of the team how the thing you built works, because you will not be the one maintaining it either.

## 2. What you are given

The starter repository:

```
facts-api/
├── README.md
├── cds-spec.md
├── package.json
├── package-lock.json
├── .env            # committed, and contains a fake secret
└── src/
    ├── app.js
    └── server.js
```

One endpoint, working:

| Endpoint | Returns |
|---|---|
| `GET /health` | `{ "status": "ok", "environment": "default" }` |

The project is in the following state:

- `ENVIRONMENT` is a literal in the source. The `environment` field in the `/health` response is the hardcoded string `"default"`, not a value read from anywhere.
- There is no `dotenv` package, and nothing loads a `.env` file.
- There is no `.gitignore`. The `.env` file is committed, and there is a fake API key in it.
- There is no `Dockerfile`, no `.dockerignore`, no Compose file, no workflow.
- There are no tests, and `jest` and `supertest` are not in `package.json`.

Start by creating your own repository, `cds26-facts-api`, from this starter. You can delete the `.git` folder in this project, create your own private repository, and add the instructor as a Contributor: https://github.com/NicholasLennox 

## 3. Names

You work in your own subscription.

Some names must be **globally unique across all of Azure**, which is why both carry your Noroff username. If your Noroff email is `johsmi05322@stud.noroff.no`, your username is `johsmi05322`.

| Thing | Name | Notes |
|---|---|---|
| GitHub repository | `cds26-facts-api` | Yours, and it can be private |
| Resource group | `CDS26` | Deleting it is the cleanup step |
| Container registry | `cds26johsmi05322` | **Globally unique.** ACR names are alphanumeric only - no hyphens - and 5 to 50 characters |
| Login server | `cds26johsmi05322.azurecr.io` | Derived from the registry name |
| Image repository | `facts-api` | The same for everyone |
| Tags | `latest` and the 7-character short commit SHA | Both pushed on every build |
| App Service | `facts-johsmi05322` | **Globally unique.** Becomes `https://facts-johsmi05322.azurewebsites.net` |
| App Service plan | `CDS26-plan` | F1 (free) |
| Region | West Europe | Prefer it. If a validation error mentions policy, try another region - Azure for Students restricts some of them, and any region that works is accepted |

**If you are on an Apple Silicon Mac**, App Service runs `linux/amd64` images only. An image built locally on an M-series machine is `arm64`. It will run perfectly under Compose in stage 4 and then refuse to start on App Service in stage 6, several steps later. The workflow you write in stage 5 builds on a GitHub runner, which is `amd64`, so the image that reaches Azure is the right one. Do not push a locally built image to the registry.

## 4. Part A: practical steps (70 marks)

Eight stages, in order. Each one fixes one thing.

### 4.1 Stage 1 - Extract the configuration (8 marks)

Move `ENVIRONMENT` out of the source and into the environment.

- Add `dotenv`, and load it before anything reads configuration.
- `ENVIRONMENT` comes from `process.env`, with a fallback (`'default'`) so the application still starts when nothing is set.
- `GET /health` reports the environment it was actually given, not a literal.
- Add a `.gitignore`. Decide what belongs in it.
- Set `ENVIRONMENT=development` in your local `.env`.
- Commit a `.env.example`.
- Get the committed `.env`, and the fake secret in it, out of the repository.

`.env.example` is the file that tells the next person which variables the application reads. What you put in it is your decision.

Adding `.env` to `.gitignore` does nothing to a file Git is already tracking - the ignore list only applies to files Git has never seen. Stop tracking it first:

```bash
git rm --cached .env      # stop tracking it, keep the file on disk
git commit -m "Stop tracking .env"
git push
```

Then look at the repository on GitHub and confirm the file has gone.

### 4.2 Stage 2 - Write the tests (10 marks)

Add `jest` and `supertest` as **dev dependencies**, add a `test` script to `package.json`, and write three tests.

| Test | What it must prove |
|---|---|
| 1 | `GET /health` answers with status code `200` |
| 2 | The `/health` body reports `status` as `"ok"` |
| 3 | The `/health` body reports the environment it was given through the environment, and not the fallback |

**Screenshot 1:** the tests passing locally, with the command and the summary line visible.

### 4.3 Stage 3 - Write the Dockerfile (10 marks)

- Choose a base image and pin it to a specific version. `latest` is not a version.
- Order the copy and install steps so that a change to the source does not reinstall the dependencies.
- Install production dependencies only.
- Add a `.dockerignore`. Decide what belongs in it.
- `EXPOSE` the port the application listens on.
- `CMD` starts the application.

Build the image and run a container from it before moving on.

### 4.4 Stage 4 - Run it with Compose (6 marks)

Write a `docker-compose.yml` with a single service that builds from your Dockerfile, publishes the port, and injects `ENVIRONMENT=local` through the `environment:` block.

Bring it up and call `/health`. It must report `local` - a value that appears nowhere in your source, nowhere in your `.env`, and nowhere in your Dockerfile.

**Screenshot 2:** `docker compose up` running, and the `/health` response showing `local`. One image with both windows visible is preferred. Two separate images are accepted.

### 4.5 Stage 5 - Build it in a pipeline (12 marks)

Create the registry first: an Azure Container Registry named `cds26<username>` in the `CDS26` resource group, Basic tier, with the **admin user** enabled. Copy the login server, username and password.

Add those three values to your GitHub repository as **repository secrets**. No credential appears in any file you commit.

Then write `.github/workflows/CI.yml` with two jobs:

| Job | What it does |
|---|---|
| `test` | Checks out the code, sets up Node, installs dependencies, runs the tests |
| `build-and-push` | Declares `needs: test`. Logs in to ACR with the secrets, builds the image, and pushes it under **two tags**: `latest` and the 7-character short commit SHA |

Trigger it on push to `main`.

**Screenshot 3:** the Actions run, both jobs green, with `test` shown before `build-and-push`.

**Screenshot 4:** the ACR repository showing both tags against the same build.

### 4.6 Stage 6 - Deploy it and automate the deployment (12 marks)

Create the App Service Web App named `facts-<username>` in `CDS26`, on a new F1 plan called `CDS26-plan`, deploying a **container** from your registry and pulling `facts-api:latest`.

Then:

- Confirm the registry credentials are present as app settings on the **Environment variables** blade. Azure usually writes `DOCKER_REGISTRY_SERVER_URL`, `_USERNAME` and `_PASSWORD` for you when you choose the image through the portal. Check that they are there.
- Add `ENVIRONMENT=production` as an app setting.
- Enable **SCM basic auth** on the app, under Configuration. Do this **before** the next step.
- Turn **Continuous deployment** on in the Deployment Center.
- Confirm a webhook now exists in the registry, and that its scope names the repository and tag the app is pulling.

**Screenshot 5:** the **Environment variables** blade showing the registry credentials and `ENVIRONMENT`.

**Screenshot 6:** the **Deployment Center** showing continuous deployment enabled, and the image and tag being pulled.

**Screenshot 7:** the registry's **Webhooks** blade showing the webhook and its scope.

**Screenshot 8:** `/health` on your App Service URL, reporting `production`.

### 4.7 Stage 7 - Ship a new feature (10 marks)

The API is called `facts-api` and has no facts in it. Add them.

| Endpoint | Returns |
|---|---|
| `GET /fact` | A single fact, chosen at random |

Where the facts come from is your decision - nothing here needs a database.

Add a test for it. Then:

1. Bring it up under Compose and check it, with your tests passing before you go anywhere near `git push`.
2. Commit and push to `main`.
3. Watch the pipeline run.
4. Wait for the App Service to pull the new image and restart. This takes a few minutes. The Deployment Center logs and the log stream are where you watch it, and the Kudu SCM service under **Advanced Tools** shows you the same thing in more detail (and more clearly).
5. Call `/fact` on your App Service URL.

**Screenshot 9:** the webhook event log showing a `202` against your most recent push.

**Screenshot 10:** `/fact` answering on your App Service URL.

The event log accumulates entries from your whole setup, and the earlier ones are not what is being asked for. Capture the row against your most recent push.

### 4.8 Stage 8 - Read the bill (2 marks)

Open **Cost analysis** on the `CDS26` resource group, scope it to the year, and capture the accumulated cost and the forecast.

**Screenshot 11:** cost analysis for `CDS26`, scoped to the year, showing both.

**NOTE:** Azure takes several hours to report usage and sometimes longer than a day, and almost everything you have deployed is on a free tier. A zero, or a dash where a figure would be, is the expected result and is a complete answer. What is being asked is whether you can scope a cost to a resource group and read the projection, not whether you spent anything.

### 4.9 Cleanup

Once you have every screenshot, delete the `CDS26` resource group. That removes the registry, the App Service and the plan in one action.

Do this **after** you have submitted. If the resource group is gone and something in your submission needs checking, there is nothing left to check it against.

### 4.10 The screenshots, in order

The document carries these eleven, numbered.

| # | Screenshot | Stage |
|---|---|---|
| 1 | Tests passing locally, command and summary visible | 2 |
| 2 | Compose running, `/health` reporting `local` | 4 |
| 3 | Actions run, both jobs green, `test` before `build-and-push` | 5 |
| 4 | ACR repository showing `latest` and the short SHA | 5 |
| 5 | **Environment variables** blade: registry credentials and `ENVIRONMENT` | 6 |
| 6 | **Deployment Center**: continuous deployment on, image and tag | 6 |
| 7 | Registry **Webhooks** blade: the webhook and its scope | 6 |
| 8 | `/health` on the App Service URL, reporting `production` | 6 |
| 9 | Webhook event log: `202` against your most recent push | 7 |
| 10 | `/fact` answering on the App Service URL | 7 |
| 11 | Cost analysis for `CDS26`, scoped to the year, accumulated and forecast | 8 |

### 4.11 Marks

| Stage | Marks |
|---|---|
| 1. Extract the configuration | 8 |
| 2. Write the tests | 10 |
| 3. Write the Dockerfile | 10 |
| 4. Run it with Compose | 6 |
| 5. Build it in a pipeline | 12 |
| 6. Deploy it and automate the deployment | 12 |
| 7. Ship a new feature | 10 |
| 8. Read the bill | 2 |
| **Total** | **70** |

## 5. Part B: the long-form questions (20 marks)

You are not going to be the only person who touches this service. These are the questions the rest of the team would ask you, and the answers are what stops the next person having to work it out from the files.

Every one of them is about something the practical put you through.

The mark value tells you how much to write. For example: a 2-mark answer is a short paragraph.

| Q | Topic | Marks | Guide length |
|---|---|---|---|
| 1 | Build-time and run-time configuration | 3 | 150-250 words |
| 2 | Dev dependencies in two places | 2 | 100-150 words |
| 3 | From a push to a live URL | 5 | 300-400 words, or a diagram plus 150 |
| 4 | Reading a webhook response | 3 | 150-250 words |
| 5 | The same system on another provider | 3 | 200-300 words, plus citations |
| 6 | What the SLA actually promises | 2 | 100-200 words, plus a citation |
| 7 | Where the gate sits | 2 | 100-150 words |

**1.** *(3 marks)* Configuration can be fixed into an image when it is built, or supplied to a container when it is run. Explain the difference between the two, and why run-time configuration is what anything deployed generally uses.

**2.** *(2 marks)* Your Dockerfile installs production dependencies only, so the image contains no dev dependencies. Your CI workflow installs everything, so the test job has them. Explain why both of those are correct, and say what specifically goes wrong in each place if the two are swapped.

**3.** *(5 marks)* Describe everything that happens between a developer running `git push` and the new code answering requests on the public URL, in the setup you built. Name what triggers each step, and what would have to be true for that step to happen at all.

You can submit a diagram as part of this answer. If you do, label the arrows with what causes each one.

**4.** *(3 marks)* Your registry's webhook event log shows a `202` against your most recent push. What has happened at the moment that status is returned, and what has not? What would a `401` mean instead, and what would you check first?

**5.** *(3 marks)* The same application could be delivered on AWS or on Google Cloud. Pick one. Name the service you would use at each step of the workflow you built - registry, hosting, and the identity the pipeline authenticates with - and identify at least one place where the shape of the work changes rather than just the name.

**Cite the provider documentation you used.** An answer with no citation loses a mark regardless of how good the rest of it is.

**6.** *(2 marks)* Find the SLA for Azure App Service on a paid tier. State the committed monthly uptime and what that allows in minutes of downtime per month. Say what you receive if the provider misses it, and name one thing the SLA does not cover.

**Cite the document you read.**

**7.** *(2 marks)* Your workflow runs on push to `main`. That does not stop broken code reaching `main`. Explain what changes if the same workflow runs on pull requests into `main` instead. What does that protect against, and what does it still not protect against?

## 6. Part C: the quiz (10 marks)

Ten multiple-choice questions, one mark each.

It is recommended to answer them last. Nothing stops you doing them first, but the practical and the long-form questions will have refreshed most of what they cover.

The questions are in the submission template, each with space for your answer. Give one letter per question.

## 7. What you submit

Work in [submission-template.md](submission-template.md). It carries every heading, every numbered screenshot slot, all seven questions and all ten quiz questions, in the order they are marked in. Export it as **one PDF**, named `<noroff-username>_CDS_CA_1.pdf`. For `johsmi05322@stud.noroff.no` that is `johsmi05322_CDS_CA_1.pdf`.

It contains, in order:

1. **Front matter** - your name, your Noroff username, and the link to your `cds26-facts-api` repository.
2. **The eleven screenshots**, numbered, in the order in §4.10.
3. **The seven long-form answers**, numbered.
4. **The ten quiz answers**, one letter each.

**Only commits made before the deadline count.**

## 8. Marks at a glance

| Part | What it is | Marks |
|---|---|---|
| A | The practical | 70 |
| B | Seven long-form questions | 20 |
| C | Ten quiz questions | 10 |
| | **Total** | **100** |

## 9. Sources

Documentation you may need:

1. Docker, *Dockerfile reference* - [docs.docker.com/reference/dockerfile](https://docs.docker.com/reference/dockerfile/)
2. Docker, *Docker Compose* - [docs.docker.com/compose](https://docs.docker.com/compose/)
3. GitHub, *GitHub Actions documentation* - [docs.github.com/en/actions](https://docs.github.com/en/actions)
4. Microsoft Learn, *Azure Container Registry webhooks* - [learn.microsoft.com/en-us/azure/container-registry/container-registry-webhook](https://learn.microsoft.com/en-us/azure/container-registry/container-registry-webhook)
5. Microsoft Learn, *Configure a custom container for App Service* - [learn.microsoft.com/en-us/azure/app-service/configure-custom-container](https://learn.microsoft.com/en-us/azure/app-service/configure-custom-container)
6. npm, *dotenv* - [npmjs.com/package/dotenv](https://www.npmjs.com/package/dotenv)
7. *Jest* - [jestjs.io](https://jestjs.io/)
8. *SuperTest* - [github.com/ladjs/supertest](https://github.com/ladjs/supertest)

### 9.1 Where to start on questions 5 and 6

These may help. Both questions ask you to cite the document you read, so follow them through official documentation.

9. Microsoft, *Service Level Agreements for Online Services* - [microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services](https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services)
10. Microsoft Learn, *How to Read a Service-Level Agreement* - [learn.microsoft.com/en-us/azure/reliability/concept-service-level-agreements](https://learn.microsoft.com/en-us/azure/reliability/concept-service-level-agreements)
11. AWS, *Documentation* - [docs.aws.amazon.com](https://docs.aws.amazon.com/) and *Service Level Agreements* - [aws.amazon.com/legal/service-level-agreements](https://aws.amazon.com/legal/service-level-agreements/)
12. Google Cloud, *Documentation* - [cloud.google.com/docs](https://cloud.google.com/docs) and *Service Level Agreements* - [cloud.google.com/terms/sla](https://cloud.google.com/terms/sla)

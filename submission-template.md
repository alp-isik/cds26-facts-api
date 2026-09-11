# BED2 Cloud and Deployment Services - CA submission

> Fill this in and export it as one PDF named `<noroff-username>_CDS_CA_1.pdf`. Replace every italic placeholder, including the image paths. Keep the numbering and the order - it is the order the work is marked in, and a marker who cannot find a screenshot cannot award the row it was evidence for.
>
> The brief is in [cds-spec.md](cds-spec.md). Read it first.

## 1. Front matter

| Field           | Your answer                                 |
| --------------- | ------------------------------------------- |
| Name            | Alp ISIK                                    |
| Noroff username | alpisi06018                                 |
| Repository URL  | https://github.com/alp-isik/cds26-facts-api |

The repository must be private, with `NicholasLennox` added as a Contributor. Only commits made before the deadline count.

## 2. Part A: the practical (70 marks)

Eleven screenshots, numbered and in order. Put each image where its placeholder is.

### 2.1 Screenshot 1 - Tests passing locally

_Stage 2. The command and the summary line both visible._

![Screenshot 1](images/screenshot-01.png)

### 2.2 Screenshot 2 - Compose running, `/health` reporting `local`

_Stage 4. One image with both windows visible is preferred. Two separate images are accepted._

![Screenshot 2](images/screenshot-02.png)

### 2.3 Screenshot 3 - The Actions run

_Stage 5. Both jobs green, with `test` shown before `build-and-push`._

![Screenshot 3](images/screenshot-03.png)

### 2.4 Screenshot 4 - The ACR repository

_Stage 5. Both tags, `latest` and the 7-character short SHA, against the same build._

![Screenshot 4](images/screenshot-04.png)

### 2.5 Screenshot 5 - The Environment variables blade

_Stage 6. The registry credentials and `ENVIRONMENT`._

![Screenshot 5](images/screenshot-05.png)

### 2.6 Screenshot 6 - The Deployment Center

_Stage 6. Continuous deployment enabled, and the image and tag being pulled._

![Screenshot 6](images/screenshot-06.png)

### 2.7 Screenshot 7 - The registry's Webhooks blade

_Stage 6. The webhook and its scope._

![Screenshot 7](images/screenshot-07.png)

### 2.8 Screenshot 8 - `/health` on the App Service URL

_Stage 6. Reporting `production`._

![Screenshot 8](images/screenshot-08.png)

### 2.9 Screenshot 9 - The webhook event log

_Stage 7. A `202` against your most recent push._

![Screenshot 9](images/screenshot-09.png)

### 2.10 Screenshot 10 - `/fact` on the App Service URL

_Stage 7._

![Screenshot 10](images/screenshot-10.png)

### 2.11 Screenshot 11 - Cost analysis for `CDS26`

_Stage 8. Scoped to the year, with the accumulated cost and the forecast both visible. A zero, or a dash where a figure would be, is a complete answer._

![Screenshot 11](images/screenshot-11.png)

## 3. Part B: the long-form questions (20 marks)

The mark value tells you how much to write. The guide length is a guide, not a limit.

### 3.1 Question 1 - Build-time and run-time configuration (3 marks)

_~ 150-250 words._

Configuration can be fixed into an image when it is built, or supplied to a container when it is run. Explain the difference between the two, and why run-time configuration is what anything deployed generally uses.

**Answer:**

Build-time configuration is fixed into the image when it is built, for example with an ENV line in the Dockerfile or by copying a .env file into it. Every container started from that image gets the same values, and changing one means rebuilding and pushing the image again. Run-time configuration is supplied when the container starts, through docker run -e, the environment: block in Compose, or app settings in App Service. The image stays the same and only the values around it change.

My setup shows this. The same image reported "default" under a plain docker run, "local" under Compose and "production" on App Service, without being rebuilt in between. The CI test job works the same way, since it sets ENVIRONMENT itself instead of reading a file.

Anything deployed generally uses run-time configuration for three reasons. First, the image that was tested is the exact image that runs in every environment, so nothing changes between testing and production. Second, it keeps secrets out of the image: anyone who can pull an image can read its layers, which is why .env is listed in my .dockerignore. Third, changing a setting only needs a restart, not a new build and deploy.

### 3.2 Question 2 - Dev dependencies in two places (2 marks)

_~ 100-150 words._

Your Dockerfile installs production dependencies only, so the image contains no dev dependencies. Your CI workflow installs everything, so the test job has them. Explain why both of those are correct, and say what specifically goes wrong in each place if the two are swapped.

**Answer:**

The two installs happen in different places for different jobs. The CI test job installs everything on a GitHub runner, a temporary virtual machine, and runs npm test there, so it needs Jest and SuperTest. The image only has to run the finished app, which needs Express and dotenv and nothing else. The tests have already done their work before the image is built, and in production those files would sit untouched.

If the two are swapped, the CI job installs production dependencies only, Jest is missing, and npm test fails. The test job goes red, and since build-and-push declares needs: test, nothing is built or deployed. The image would still run, but it would carry the testing tools into production: a bigger image that takes more storage, pulls more slowly, and adds packages that could contain vulnerabilities.

### 3.3 Question 3 - From a push to a live URL (5 marks)

_~ 300-400 words, or a diagram plus 150._

Describe everything that happens between a developer running `git push` and the new code answering requests on the public URL, in the setup you built. Name what triggers each step, and what would have to be true for that step to happen at all.

You can submit a diagram as part of this answer. If you do, label the arrows with what causes each one.

**Answer:**

It starts when I run git push to main. That push is the trigger for my GitHub Actions workflow, because CI.yml is set to run on pushes to the main branch. For this to happen, the file has to sit in .github/workflows/ and I need push access to the repository.

The workflow runs two jobs. The test job starts first on a fresh GitHub runner: it checks out the code, sets up Node, installs every dependency and runs npm test, with ENVIRONMENT set in the job itself since there is no .env file on the runner. The build-and-push job only starts because it declares needs: test, so it runs only if every test passes. It logs in to my Azure Container Registry using three repository secrets, which only works if the secrets are correct and the registry's admin user is enabled. It then builds the image from my Dockerfile, tags it twice, as latest and as the 7-character commit SHA, and pushes both tags to the facts-api repository in the registry.

The push to the registry is the next trigger. The registry has a webhook with the action push and the scope facts-api:latest, so when the new latest tag arrives, the registry sends a request to my App Service. This only happens because the scope matches the tag exactly, and because the webhook exists at all: Azure created it when I turned on continuous deployment, which requires SCM basic authentication to be enabled on the app.

When App Service accepts that request, it pulls the new facts-api:latest image from the registry, using the DOCKER_REGISTRY_SERVER settings stored on the app to authenticate. It then stops the old container and starts a new one from the new image, which takes a few minutes. The new container reads ENVIRONMENT=production from the app settings and listens on port 3000, and App Service forwards traffic from the public URL to it. From that point the new code, such as the /fact endpoint, answers requests at facts-alpisi06018.azurewebsites.net.

### 3.4 Question 4 - Reading a webhook response (3 marks)

_~ 150-250 words._

Your registry's webhook event log shows a `202` against your most recent push. What has happened at the moment that status is returned, and what has not? What would a `401` mean instead, and what would you check first?

**Answer:**

A 202 means Accepted. When my registry received the new facts-api:latest image, the webhook sent a request to my App Service's deployment endpoint, and App Service answered 202: it received the request, the credentials in it were valid, and it has queued a redeploy.

What has not happened yet is the actual deployment. At the moment the 202 comes back, App Service has not pulled the new image, has not restarted the container, and the new code is not live. Those steps happen afterwards and take a few minutes, and they can still fail, for example if the image cannot be pulled or the new container crashes on startup. A 202 only proves the message was delivered and accepted, not that the deploy succeeded. To see what happened after it, I would watch the Deployment Center logs, the log stream, or Kudu under Advanced Tools, which show the pull and the container start in detail.

A 401 would mean Unauthorized: the request reached App Service, but the credentials in the webhook were rejected, so no deploy was queued at all. The first thing I would check is that SCM basic authentication is still enabled on the app, since the webhook depends on it. If it is on, the deployment credentials may have changed since the webhook was created, so I would save the Deployment Center settings again to have Azure regenerate the webhook with current credentials.

### 3.5 Question 5 - The same system on another provider (3 marks)

_~ 200-300 words, plus citations._

The same application could be delivered on AWS or on Google Cloud. Pick one. Name the service you would use at each step of the workflow you built - registry, hosting, and the identity the pipeline authenticates with - and identify at least one place where the shape of the work changes rather than just the name.

**Answer:**

I would pick AWS. I have not used it before, but reading the documentation, most of my setup carries over as the same thing under a different name. The application code, the Dockerfile and the test job would not change at all. The image would go to Amazon Elastic Container Registry (ECR) instead of Azure Container Registry, and it would be hosted on Amazon ECS Express Mode instead of App Service. Express Mode takes a container image and gives back a running service with a public URL, load balancing and scaling, which is the same job App Service does for me now. AWS's older App Service equivalent, App Runner, no longer accepts new customers, and AWS points to Express Mode instead.

The part that actually changes shape is how the pipeline logs in. In my Azure setup, the workflow logs in to the registry with a username and password that I copied from the portal and saved as GitHub secrets. On AWS, the recommended way is that no password is stored at all. The pipeline's identity is an IAM role that trusts GitHub, and for each workflow run GitHub hands the job a short-lived token that AWS exchanges for temporary credentials. Even the Docker login to ECR uses a token that expires after 12 hours. So the steps in my workflow would look almost the same, but instead of storing a secret, I would set up trust between GitHub and AWS once, and the credentials would never live anywhere permanently.

**Citation:**

- AWS, "Amazon ECS Express Mode", https://docs.aws.amazon.com/AmazonECS/latest/developerguide/express-service-overview.html
- AWS, "AWS App Runner availability change", https://docs.aws.amazon.com/apprunner/latest/dg/apprunner-availability-change.html
- GitHub, "Configuring OpenID Connect in Amazon Web Services", https://docs.github.com/actions/security-for-github-actions/security-hardening-your-deployments/configuring-openid-connect-in-amazon-web-services
- AWS, "Private registry authentication in Amazon ECR", https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html

### 3.6 Question 6 - What the SLA actually promises (2 marks)

_~ 100-200 words, plus a citation._

Find the SLA for Azure App Service on a paid tier. State the committed monthly uptime and what that allows in minutes of downtime per month. Say what you receive if the provider misses it, and name one thing the SLA does not cover.

**Answer:**

An SLA, or Service Level Agreement, is the provider's written promise about how available a service will be, and what the customer gets if that promise is broken.

For Azure App Service on a paid tier, Microsoft commits to 99.95% monthly uptime. In a 30-day month (43,200 minutes), that allows about 21.6 minutes of downtime before the commitment is broken.

If Microsoft misses it, the customer does not get money back directly. Instead they can claim a service credit, a discount on that month's App Service bill: roughly 10% for a small miss, rising for bigger outages, up to the full month for severe ones. The credit has to be claimed; it is not applied automatically.

The SLA does not cover the Free and Shared tiers at all, so my own app on the F1 tier has no uptime commitment. It also does not cover downtime caused by factors outside Microsoft's reasonable control, or by the customer's own code or configuration, such as a container that crashes on startup.

**Citation:**

Microsoft, "Service Level Agreement for Microsoft Online Services (WW)", September 2026, https://www.microsoft.com/licensing/docs/view/Service-Level-Agreements-SLA-for-Online-Services

### 3.7 Question 7 - Where the gate sits (2 marks)

_~ 100-150 words._

Your workflow runs on push to `main`. That does not stop broken code reaching `main`. Explain what changes if the same workflow runs on pull requests into `main` instead. What does that protect against, and what does it still not protect against?

**Answer:**

Right now my workflow only runs after code is already on main, so broken code can already be sitting on the branch everyone works from. The pipeline stops it from being deployed, but not from reaching main.

If the same workflow runs on pull requests into main, the tests run on the proposed change before it is merged. Combined with a branch protection rule that requires the test job to pass, a pull request with failing tests cannot be merged. The build-and-push job should still only run on pushes to main, otherwise unreviewed code from a pull request would be pushed as latest and deployed automatically.

This protects main from code that fails the tests. It does not protect against bugs the tests do not check for, or against problems outside the code, such as a wrong secret or a missing app setting in Azure.

## 4. Part C: the quiz (10 marks)

Ten questions, one mark each. One letter per question. Put your letter on the **Answer** line under each question, and repeat all ten in the grid in §4.11.

### 4.1 Question 1

Two articles are published in the same week. One is headed "Microsoft leads the cloud market", the other "AWS leads the cloud market". Both cite market research firms, and both report figures for the same quarter. What best explains the two headlines?

- **A.** Only one can be correct, since the market has a single leader.
- **B.** The figures come from published accounts, so one of them contains an error.
- **C.** They are counting different markets, and infrastructure and SaaS have different leaders.
- **D.** Estimates move each quarter, so the two were measured at different times.

**Answer:**
C

### 4.2 Question 2

A dental practice moves its appointment system from IaaS to PaaS. Which responsibility passes to the provider?

- **A.** Applying operating system security updates.
- **B.** Deciding who in the practice can see which patient record.
- **C.** Keeping their appointment code free of bugs.
- **D.** Choosing how much capacity to pay for.

**Answer:**
A

### 4.3 Question 3

A seed bank's IT lead tells the board that the organisation is "moving to the public cloud, which means we are moving to SaaS." Why is that reasoning wrong?

- **A.** Public cloud means renting infrastructure, so the move is to IaaS rather than SaaS.
- **B.** SaaS is bought from a vendor rather than deployed, so an organisation cannot "move to" it at all.
- **C.** SaaS requires a private cloud, because the vendor holds the data.
- **D.** Deployment model says who else is on the hardware; service model says how much of the stack you rent, and neither implies the other.

**Answer:**
D

### 4.4 Question 4

A laundrette chain runs its booking system on PaaS. A customer list leaks after one of its developers leaves a storage container set to public. The platform ran normally throughout. Who is accountable?

- **A.** The provider, since on PaaS it manages the platform the storage sits on.
- **B.** The customer, because access configuration and data stay with them in every model.
- **C.** Shared, because the storage service is the provider's product.
- **D.** The provider, because the SLA was not met while data was exposed.

**Answer:**
B

### 4.5 Question 5

A bookbinder's accountant is pleased that moving to a cloud provider turned a large one-off purchase into a predictable monthly charge. What has the bookbinder given up in exchange?

- **A.** The ability to scale capacity up and down with demand.
- **B.** Ownership of the data, which now belongs to the provider.
- **C.** Any way of forecasting what the service will cost.
- **D.** An owned asset written off over its life, replaced by a cost that never ends.

**Answer:**
D

### 4.6 Question 6

A wind farm's monitoring team runs six services, each in its own container, on one Linux host. A colleague says that means six operating systems on one machine. Why is that wrong?

- **A.** Each container runs a cut-down operating system instead of a full one.
- **B.** They share the host's kernel and carry only each service's own libraries and files.
- **C.** There is one operating system per host regardless, because the hypervisor supplies it.
- **D.** There are seven, once the host's own is counted.

**Answer:**
B

### 4.7 Question 7

A fish market's price-feed API listens on port 4000, and its Dockerfile contains `EXPOSE 4000`. A developer runs `docker run -d fishprices` and cannot reach the API at `localhost:4000` in a browser. What is wrong?

- **A.** `EXPOSE` documents the port, and nothing was published to the host, so `-p 4000:4000` is missing.
- **B.** `EXPOSE` publishes the port, so the application must not be listening on it.
- **C.** The container has to join a user-defined network before the host can reach it.
- **D.** `EXPOSE` takes effect only when the image is run through Compose.

**Answer:**
A

### 4.8 Question 8

A choir-booking API builds without error, but the image comes out at 900 MB and the container crashes on start with a message about a native module built for a different platform. The developer builds on a Mac, and the repository has no `.dockerignore`. What happened?

- **A.** The base image is too large and should be swapped for an Alpine variant.
- **B.** `npm ci` installed the wrong architecture, because the lockfile was copied first.
- **C.** The local `node_modules` was copied in and overwrote what `npm ci` had installed.
- **D.** `--omit=dev` was missing, so the dev dependencies ended up in the image.

**Answer:**
C

### 4.9 Question 9

A tide-table API is a single service with no database. `docker run -e ENVIRONMENT=local -p 3000:3000 tides` starts it, and so does a one-service `docker-compose.yml`. What does Compose give the team that the `docker run` line does not?

- **A.** It builds and runs in one command, which is fewer keystrokes than two.
- **B.** The run configuration is written down in a committed file, so it is identical for everyone.
- **C.** It injects environment variables, which `docker run` cannot do.
- **D.** It restarts the container automatically whenever the source changes.

**Answer:**
B

### 4.10 Question 10

An insurance claims desk's pipeline pushes every build to the registry tagged `latest`, and nothing else. Production pulls `latest`. A release goes bad and they want the previous image back. What stops them?

- **A.** `latest` is a reserved tag and images carrying it cannot be pulled by digest.
- **B.** The registry deletes an image as soon as a later build overwrites its tag.
- **C.** Every build moved `latest` onto a new image, so no tag names the previous one.
- **D.** App Service stores only the image it is running, so the old one is gone.

**Answer:**
C

### 4.11 Answer grid

This grid is what is marked. If it disagrees with a letter you wrote above, the grid wins.

| Q          | 1   | 2   | 3   | 4   | 5   | 6   | 7   | 8   | 9   | 10  |
| ---------- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Answer** | C   | A   | D   | B   | D   | B   | A   | C   | B   | C   |

## 5. Before you submit

- [x] Every italic placeholder replaced, and the eleven screenshots are images.
- [x] The repository link at the top works, and `NicholasLennox` is a Contributor.
- [x] Screenshot 9 is the `202` against your **most recent** push, not an earlier row.
- [x] Questions 5 and 6 each carry a citation.
- [x] The answer grid in §4.11 has ten letters in it.
- [x] Exported as one PDF, named `alpisi06018_CDS_CA_1.pdf`.
- [x] The `CDS26` resource group is still there. Delete it **after** you submit.

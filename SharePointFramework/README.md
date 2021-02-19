# 1. The SPFx solutions

_Due to the number of components, we decided to separate the components into 3 different solutions._

## [@Shared](./@Shared/README.md) [![version](https://img.shields.io/badge/version-1.2.9-yellow.svg)](https://semver.org)

Shared `functions` used by all the solutions.

Build by `npm` script `build` and watch changes with `watch`.

_Published to **npm** as `pp365-shared`_

## [PortfolioWebParts](./PortfolioWebParts/README.md) [![version](https://img.shields.io/badge/version-1.2.6-yellow.svg)](https://semver.org)

| Solution name            | ID                                   |
| ------------------------ | ------------------------------------ |
| `pp-portfolio-web-parts` | 00483367-68e2-4977-9cc3-6cf0de623daa |



Web parts for `portfolio` level of the portal.

Build by `npm` script `package`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-projectwebparts`

## [ProjectExtensions](./ProjectExtensions/README.md) [![version](https://img.shields.io/badge/version-1.2.6-yellow.svg)](https://semver.org)

| Solution name          | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-extensons` | fe723971-d5c2-4698-91e3-c16e2f72fb5b |



Extension for the `project` level of the portal.

Build by `npm` script `package`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-projectextensions`_

## [ProjectWebParts](./ProjectWebParts/README.md) [![version](https://img.shields.io/badge/version-1.2.8-yellow.svg)](https://semver.org)

| Solution name          | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-web-parts` | b69cb2f2-762d-425d-8e0b-d59c08918831 |



Web parts for `project` level of the portal.

Build by `npm` script `package`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-projectwebparts`_`_

# 2. Component overview

| Name                        | Id                                   | -    | Solution          |
| --------------------------- | ------------------------------------ | ---- | ----------------- |
| BenefitsOverviewWebPart     | 5f925484-cfb4-42ce-9f90-79a874bb8a68 |      | PortfolioWebParts |
| LatestProjectsWebPart       | 941fd73c-b957-41c3-8d4f-082268407f10 |      | PortfolioWebParts |
| PortfolioAggregationWebPart | 6c0e484d-f6da-40d4-81fc-ec1389ef29a8 |      | PortfolioWebParts |
| PortfolioInsightsWebPart    | 875ca87a-e331-4ffb-bc69-0272fdf80e41 |      | PortfolioWebParts |
| PortfolioOverviewWebPart    | e58e3d32-057a-4418-97ce-172b92482ba2 |      | PortfolioWebParts |
| ProjectListWebPart          | 54fbeb7d-e463-4dcc-8873-50a3ab2f0f68 |      | PortfolioWebParts |
| ResourceAllocationWebPart   | 2ef269b2-6370-4841-8b35-2185b7ccb22a |      | PortfolioWebParts |
| ProjectSetup                | ce34553d-ab47-4107-8dd1-e980d953996d |      | ProjectExtensions |
| ProjectUpgrade              | 453a6c1e-e1d0-4b12-a3fc-690a36da1f0c |      | ProjectExtensions |
| TemplateSelectorCommand     | c9080212-e63e-47cc-8278-00ad38c3f5a5 |      | ProjectExtensions |
| ProjectInformationWebPart   | b8bec0be-2354-443d-a3ca-24b36e8ea7dc |      | ProjectWebParts   |
| ProjectPhasesWebPart        | 4449d3dc-fa58-4982-b87c-5a893114e7b7 |      | ProjectWebParts   |
| ProjectStatusWebPart        | 681ad0dc-ddb5-4dba-a5d6-a42f6d1c90a6 |      | ProjectWebParts   |
| RiskMatrixWebPart           | e536ae15-0748-4d96-b160-3abb30f1b71e |      | ProjectWebParts   |

# 3. Build, package and deploy

## Build for development

To work with the various solutions, you have to to the following

1. Ensure you have `pnpm` or `npm` installed
2. Build the Shared solution. Navigate to "@Shared" and run `pnpm i --shamefully-hoist` followed by `pnpm run-script build`
3. Navigate to [ProjectWebParts](./ProjectWebParts) and run `npm i` followed by `pnpm run-script package`
4. Navigate to [PortfolioWebParts](./PortfolioWebParts) and run `npm i` followed by `pnpm run-script package`
5. Navigate to [ProjectExtensions](./ProjectExtensions) and run `npm i` followed by `pnpm run-script package`

## Package and deploy

To be able to `package` and `deploy` directly you need to create a file `env.json` under `SharePointFramework/{solution}/config`. Take a look at `SharePointFramework/{solution}/config/env.sample.json`.

When `env.json` is filled out and ready to go you can run the `npm` script `package-deploy`.

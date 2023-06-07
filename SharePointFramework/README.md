# 1. The SPFx solutions

_Due to the number of components, we decided to separate the components into 5 different solutions._

## [shared-library](./shared-library/README.md)

Shared code for the SharePoint Framework solutions in Prosjektportalen 365.

_Published to **npm** as `pp365-shared-library`_

## [PortfolioExtensions](./PortfolioExtensions/README.md)

| Solution name            | ID                                               |
| ------------------------ | ------------------------------------------------ |
| `pp-portfolio-extensons` | a3bf3315-0710-41f9-8836-2b61396d032fc16e2f72fb5b |

Extension for the `portfolio` level of the portal.

Watch changes with npm script `watch`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-portfolioextensions`_

## [PortfolioWebParts](./PortfolioWebParts/README.md)

| Solution name            | ID                                   |
| ------------------------ | ------------------------------------ |
| `pp-portfolio-web-parts` | 00483367-68e2-4977-9cc3-6cf0de623daa |

Web parts for portfolio level of the portal.

Watch changes with npm script `watch`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-projectwebparts`_

## [ProgramWebParts](./ProgramWebParts/README.md)

| Solution name          | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-program-web-parts` | 8a9a0f4a-2e2f-4f13-aceb-867f82bd77eb |

Web parts for project level of the portal.

Watch changes with npm script `watch`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-programwebparts`_

## [ProjectExtensions](./ProjectExtensions/README.md)

| Solution name          | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-extensons` | fe723971-d5c2-4698-91e3-c16e2f72fb5b |

Extension for the project level of the portal.

Watch changes with npm script `watch`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-projectextensions`_

## [ProjectWebParts](./ProjectWebParts/README.md)

| Solution name          | ID                                   |
| ---------------------- | ------------------------------------ |
| `pp-project-web-parts` | b69cb2f2-762d-425d-8e0b-d59c08918831 |

Web parts for `project` level of the portal.

Watch changes with npm script `watch`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

_Published to **npm** as `pp365-projectwebparts`_

# 2. Component overview

| Name                          | Id                                   | Solution            |
| ----------------------------- | ------------------------------------ | ------------------- |
| IdeaProcessingCommand         | 5af28222-4bf8-419c-9533-5a31967b9f20 | PortfolioExtensions |
| IdeaProjectDataCommand        | b13831c6-c4f8-4bbc-9da3-bd5f960f7e2b | PortfolioExtensions |
| IdeaRegistrationCommand       | c93a4a2a-f5f0-41ee-9ab6-04ad85004d20 | PortfolioExtensions |
| LatestProjectsWebPart         | 941fd73c-b957-41c3-8d4f-082268407f10 | PortfolioWebParts   |
| PortfolioAggregationWebPart   | 6c0e484d-f6da-40d4-81fc-ec1389ef29a8 | PortfolioWebParts   |
| PortfolioInsightsWebPart      | 875ca87a-e331-4ffb-bc69-0272fdf80e41 | PortfolioWebParts   |
| PortfolioOverviewWebPart      | e58e3d32-057a-4418-97ce-172b92482ba2 | PortfolioWebParts   |
| ProjectListWebPart            | 54fbeb7d-e463-4dcc-8873-50a3ab2f0f68 | PortfolioWebParts   |
| ResourceAllocationWebPart     | 2ef269b2-6370-4841-8b35-2185b7ccb22a | PortfolioWebParts   |
| ProjectTimelineWebPart        | 7284c568-f66c-4218-bb2c-3734a3cfa581 | PortfolioWebParts   |
| ProgramAdministrationWebpart  | 9570e369-21a6-4bf5-8198-13506499de52 | ProgramWebParts     |
| ProgramAggregationWebPart     | 37c7e990-483d-4f70-b9b9-def1790817e7 | ProgramWebParts     |
| ProgramProjectOverviewWebPart | 01417142-67c8-498b-a6da-6e78003023dd | ProgramWebParts     |
| ProgramTimelineWebPart        | f97a38ab-78c2-400e-899f-b0d4cda76166 | ProgramWebParts     |
| ProjectSetup                  | ce34553d-ab47-4107-8dd1-e980d953996d | ProjectExtensions   |
| ProjectUpgrade                | 453a6c1e-e1d0-4b12-a3fc-690a36da1f0c | ProjectExtensions   |
| TemplateSelectorCommand       | c9080212-e63e-47cc-8278-00ad38c3f5a5 | ProjectExtensions   |
| ProjectInformationWebPart     | b8bec0be-2354-443d-a3ca-24b36e8ea7dc | ProjectWebParts     |
| ProjectPhasesWebPart          | 4449d3dc-fa58-4982-b87c-5a893114e7b7 | ProjectWebParts     |
| ProjectStatusWebPart          | 681ad0dc-ddb5-4dba-a5d6-a42f6d1c90a6 | ProjectWebParts     |
| RiskMatrixWebPart             | e536ae15-0748-4d96-b160-3abb30f1b71e | ProjectWebParts     |
| ProjectTimelineWebPart        | d156652b-9121-47af-89ae-1fe8427c53da | ProjectWebParts     |

# 3. Build, package and deploy

## Build for development

To work with the various solutions, you have to to the following

1. Ensure you have `npm` installed
2. If you have `rush` installed run `rush update && rush build` (or use npm script `spfx:init` in the root of the project`

_To install `rush` globally run `npm i @microsoft/rush -g` in your terminal._

## Adding a new npm package with rush
Don't use `npm i [package-name] -S` anymore. With rush we should use `rush add -p [package-name]`. 

To install the package for all solutions append `--all` and apppend `-m` if you want to make the version consistent throughout your solutions.

Read more about the `rush add` command [here](https://rushjs.io/pages/commands/rush_add/).

## Updates to shared-library
If you have changes in `shared-library` that you want to take effect in a solution dependent on it, you can use `rush rebuild`.

Run the following to only rebuild `pp365-shared-library`:
```pwsh
rush rebuild -o pp365-shared-library
```

_It shouldn't take more than 30 seconds._

## Watch configuration and channels
If you want to watch/serve changes for a specific channel, you can set `SERVE_CHANNEL` in the `.env` file of your solution.

Then execute `npm run watch` as you normally do.

## Only build specific components
If you want to make the watch/serve quicker, you can set `SERVE_BUNDLE_REGEX` to filter the components you want to build.

**Example:**

```
SERVE_CHANNEL=test
SERVE_BUNDLE_REGEX=latest-projects-web-part
```

Only the `LatestProject` component will be built. The `config.json` will automatically be reverted when you cancel the watch script.

# 4. Versioning
Never update the version of the solutions independently. The version is automatically kept in sync with the other packages.

# 5. Tasks
See [Tasks](.tasks/README.md).
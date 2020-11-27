# 1. The solutions

## @Shared
Shared `functions` used by all the solutions.

Build by `npm` script `build`.

## PortfolioWebParts
Web parts for `portfolio` level of the portal.

Build by `npm` script `package`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

## ProjectExtensions
Extension for the `project` level of the portal.

Build by `npm` script `package`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

## ProjectWebParts
Web parts for `project` level of the portal.

Build by `npm` script `package`.

To package and deploy directly to SharePoint, see `2. Build, package and deploy`.

# 2. Build, package and deploy

## Build for development

To work with the various solutions, you have to to the following

1. Ensure you have pnpm installed
2. Build the Shared solution. Navigate to "@Shared" and run `pnpm i --shamefully-hoist` followed by `pnpm run-script build`
3. Navigate to "ProjectWebParts" and run `pnpm i --shamefully-hoist` followed by `pnpm run-script package`
4. Navigate to "PortfolioWebParts" and run `pnpm i --shamefully-hoist` followed by `pnpm run-script package`
5. Navigate to "ProjectExtensions" and run `pnpm i --shamefully-hoist` followed by `pnpm run-script package`

## Package and deploy

To be able to `package` and `deploy` directly you need to create a file `env.json` under `SharePointFramework/{solution}/config`. Take a look at `SharePointFramework/{solution}/config/env.sample.json`.

When `env.json` is filled out and ready to go you can run the `npm` script `package-deploy`.

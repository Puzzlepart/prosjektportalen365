# 1. The solutions

All the solutions are currenly using `v1.8.2` of `SharePoint Framework` due to 1.9.0 being down from NPM.

## @Shared
Shared `functions` used by all the solutions.

Build by using `tsc`.

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

To be able to `package` and `deploy` directly you need to create a file `env.json` under `SharePointFramework/{solution}/config`. Take a look at `SharePointFramework/{solution}/config/env.sample.json`.

When `env.json` is filled out and ready to go you can run the `npm` script `package-deploy`.



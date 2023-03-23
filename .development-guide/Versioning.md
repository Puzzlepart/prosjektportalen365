## Versioning

After updating the version using `npm version patch` or `npm version minor` the task `tasks/automatic-versioning.js` are run. This synchronizes versions across the solution.

This `automatic-versioning.js` task can also be run as a **npm script** outside the `postversion` event.

```powershell
npm run sync-version
```

After the `sync-version` script has been run, it is important to publish the SharePointFramework packages (@Shared, PortfolioWebParts, etc...) to npm.

This is done for each package by running the following script:

```powershell
npm install; npm run build; npm publish;
```

If you have to update and use a package under development add a temp tag:

```powershell
npm install; npm run build; npm publish --tag temp;
```

N.B.: To be able to publish you must sign in with an account that has access to the packages at [npmjs](https://www.npmjs.com)

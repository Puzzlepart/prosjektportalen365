# Shared

Shared code for the SharePoint Framework solutions in PP365.

Contains data services, helpers, interfaces, logging utils, models, utils and types.

_Published to **npm** as `pp365-shared`_

## Publishing a temp version
When working on a new version we want the other packages to be able to use the updates we do here.

After the current version in `package.json` add a hyphen `-`, an issue number and an index.


**Example for version 1.5.0**

You're working on issue #5900, and want the other packages to get the updates from `pp365-shared`.

Add the following to the version in `package.json`: **-5900.1**

The full version will then be `1.5.0-5900.1`.

Run the npm script `publish:temp` to publish your new changes.

Need to more changes? Update the index on the end of the version number and run `publish:temp` again.

```powershell
npm run-script publish:temp
```

## Versioning

Never update the version of this solution independently. The version is automatically kept in sync with the other packages.

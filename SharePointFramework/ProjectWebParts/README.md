# Project Web Parts 

This solution contains SPFx web parts for the project level.

_Published to **npm** as `pp365-projectwebparts`_

## Serve
- Take a copy of `config/serve.sample.json` and name it `serve.json`
- Run `npm run serve`

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
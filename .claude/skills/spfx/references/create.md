# Create SPFx Project

## Ensure CLI for Microsoft 365 is installed

Run `m365 version` to check if CLI for Microsoft 365 is installed. If the command fails (not found), install it globally:

```
npm install -g @pnp/cli-microsoft365@latest --silent --no-fund --no-audit
```

## Environment check

Run `m365 spfx doctor` to verify Node version, npm version, and other prerequisites. If Node is incompatible, check for `fnm` or `nvm` and try to switch to a compatible version. After switching Node versions, re-run `m365 spfx doctor` — each Node version has its own global packages, so previously installed tools (including CLI for Microsoft 365) may not be available. If the doctor reports missing packages (e.g., `yo`, `@microsoft/generator-sharepoint`), install them globally with `npm install -g --silent --no-fund --no-audit`. If no version manager is available, no compatible Node version is installed, or other errors remain that can't be resolved automatically, **stop and tell the user** what needs fixing before proceeding.

## Scaffold the project

```
yo @microsoft/sharepoint --solution-name "<name>" --framework react --component-type webpart --component-name "<WebPartName>" --skip-install --no-insight
```

For an **extension**, pass `--extension-type` (omit it for web parts):

```
yo @microsoft/sharepoint --solution-name "<name>" --component-type extension --extension-type ApplicationCustomizer --component-name "<Name>" --framework none --skip-install --no-insight
```

**Critical: always use non-interactive mode** with explicit flags as shown above. Interactive mode (arrow-key navigation) is unreliable in agent terminals and causes wrong template selection. Adjust flags based on what the user asks for.

Only if the user explicitly needs the **legacy gulp** toolchain, opt in via the generator using `--use-gulp`.

## Install dependencies

From the generated project directory, run `npm install --silent --no-fund --no-audit`.

## Packaging (when the user wants to deploy)

Produce the deployable `.sppkg` in `sharepoint/solution` using the project's toolchain:

- Heft (v1.22+): `heft build --production` then `heft package-solution --production`
- gulp (≤ v1.21.1): `gulp bundle --ship` then `gulp package-solution --ship`

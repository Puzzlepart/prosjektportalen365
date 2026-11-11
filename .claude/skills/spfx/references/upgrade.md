# Upgrade SPFx Project

## Ensure CLI for Microsoft 365 is installed

Run `m365 version` to check if CLI for Microsoft 365 is installed. If the command fails (not found), install it globally:

```
npm install -g @pnp/cli-microsoft365@latest --silent --no-fund --no-audit
```

## Before you start

1. **Ensure a clean, committed git state.** The upgrade rewrites many files; the user needs a clean baseline to review the diff and roll back. If the working tree is dirty, ask the user to commit or stash first.
2. **Detect the current version.** Read `.yo-rc.json` (`@microsoft/generator-sharepoint.version`) and the `@microsoft/sp-*` versions in `package.json`. State the current and target versions before running anything.
3. **Check Node/TypeScript compatibility for the target version.** Each SPFx version supports specific Node ranges. If the installed Node is outside the target's range the build will fail — surface this up front (use `m365 spfx doctor` if unsure).

## Run the upgrade

From the SPFx project root, run CLI for Microsoft 365:

- If the user specified a target version:
  ```
  m365 spfx project upgrade --toVersion <version> --output md
  ```
- If no version specified (upgrade to latest supported):
  ```
  m365 spfx project upgrade --output md
  ```

## Apply the upgrade

Read the generated report and apply **all** steps in the order listed. The report contains file modifications, package version changes, and configuration updates. Apply them sequentially — order matters. If a step targets a customized file, merge carefully rather than overwriting custom logic.

## Verify

1. Run `npm install --silent --no-fund --no-audit` to update dependencies.
2. Run `npm run build` and resolve every error — the upgrade is not complete until the build is clean.
3. Fix any **deprecated or removed APIs** flagged as build errors.
4. Tell the user to serve the project (`heft start` on v1.22+, `gulp serve` on legacy), smoke-test in the workbench, and review the git diff before committing.

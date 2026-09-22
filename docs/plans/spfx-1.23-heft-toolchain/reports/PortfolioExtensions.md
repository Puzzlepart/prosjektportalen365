# Upgrade project Prosjektportalen 365 - Portfolio Extensions to v1.23.2

Date: 9/16/2026

## Findings

Following is the list of steps required to upgrade your project to SharePoint Framework version 1.23.2. [Summary](#Summary) of the modifications is included at the end of the report.

### FN001001 @microsoft/sp-core-library | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-core-library

Execute the following command:

```sh
pnpm i -E @microsoft/sp-core-library@1.23.2
```

File: [./package.json:28:5](./package.json)

### FN001011 @microsoft/sp-dialog | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-dialog

Execute the following command:

```sh
pnpm i -E @microsoft/sp-dialog@1.23.2
```

File: [./package.json:29:5](./package.json)

### FN001012 @microsoft/sp-application-base | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-application-base

Execute the following command:

```sh
pnpm i -E @microsoft/sp-application-base@1.23.2
```

File: [./package.json:31:5](./package.json)

### FN001014 @microsoft/sp-listview-extensibility | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-listview-extensibility

Execute the following command:

```sh
pnpm i -E @microsoft/sp-listview-extensibility@1.23.2
```

File: [./package.json:32:5](./package.json)

### FN001032 @microsoft/sp-page-context | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-page-context

Execute the following command:

```sh
pnpm i -E @microsoft/sp-page-context@1.23.2
```

File: [./package.json:30:5](./package.json)

### FN001013 @microsoft/decorators | Required

Upgrade SharePoint Framework dependency package @microsoft/decorators

Execute the following command:

```sh
pnpm i -E @microsoft/decorators@1.23.2
```

File: [./package.json:27:5](./package.json)

### FN002002 @microsoft/sp-module-interfaces | Required

Upgrade SharePoint Framework dev dependency package @microsoft/sp-module-interfaces

Execute the following command:

```sh
pnpm i -DE @microsoft/sp-module-interfaces@1.23.2
```

File: [./package.json:56:5](./package.json)

### FN002022 @microsoft/eslint-plugin-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-plugin-spfx

Execute the following command:

```sh
pnpm i -DE @microsoft/eslint-plugin-spfx@1.23.2
```

File: [./package.json:53:5](./package.json)

### FN002023 @microsoft/eslint-config-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-config-spfx

Execute the following command:

```sh
pnpm i -DE @microsoft/eslint-config-spfx@1.23.2
```

File: [./package.json:52:5](./package.json)

### FN002030 @microsoft/spfx-web-build-rig | Required

Install SharePoint Framework dev dependency package @microsoft/spfx-web-build-rig

Execute the following command:

```sh
pnpm i -DE @microsoft/spfx-web-build-rig@1.23.2
```

File: [./package.json:51:3](./package.json)

### FN002034 @microsoft/spfx-heft-plugins | Required

Install SharePoint Framework dev dependency package @microsoft/spfx-heft-plugins

Execute the following command:

```sh
pnpm i -DE @microsoft/spfx-heft-plugins@1.23.2
```

File: [./package.json:51:3](./package.json)

### FN010001 .yo-rc.json version | Recommended

Update version in .yo-rc.json

```json
{
  "@microsoft/generator-sharepoint": {
    "version": "1.23.2"
  }
}
```

File: [./.yo-rc.json:3:5](./.yo-rc.json)

### FN002031 @rushstack/heft | Required

Install SharePoint Framework dev dependency package @rushstack/heft

Execute the following command:

```sh
pnpm i -DE @rushstack/heft@1.2.17
```

File: [./package.json:51:3](./package.json)

### FN027001 @rushstack/heft | Required

Install SharePoint Framework override dependency package @rushstack/heft

Execute the following command:

```sh
pnpm pkg set overrides.@rushstack/heft=1.2.17
```

File: [./package.json:1:1](./package.json)

### FN002025 eslint-plugin-react-hooks | Required

Install SharePoint Framework dev dependency package eslint-plugin-react-hooks

Execute the following command:

```sh
pnpm i -DE eslint-plugin-react-hooks@5.2.0
```

File: [./package.json:51:3](./package.json)

### FN002024 eslint | Required

Upgrade SharePoint Framework dev dependency package eslint

Execute the following command:

```sh
pnpm i -DE eslint@9.37.0
```

File: [./package.json:68:5](./package.json)

### FN015016 eslint.config.js | Required

Add file eslint.config.js

Execute the following command:

```sh
cat > "eslint.config.js" << EOF 
const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  }
];
EOF
```

File: [eslint.config.js](eslint.config.js)

### FN002021 @rushstack/eslint-config | Required

Remove SharePoint Framework dev dependency package @rushstack/eslint-config

Execute the following command:

```sh
pnpm un @rushstack/eslint-config
```

File: [./package.json:57:5](./package.json)

### FN002032 @typescript-eslint/parser | Required

Remove SharePoint Framework dev dependency package @typescript-eslint/parser

Execute the following command:

```sh
pnpm un @typescript-eslint/parser
```

File: [./package.json:64:5](./package.json)

### FN002036 @types/jest | Required

Install SharePoint Framework dev dependency package @types/jest

Execute the following command:

```sh
pnpm i -DE @types/jest@30.0.0
```

File: [./package.json:51:3](./package.json)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/Footer/Assistant/Assistant.module.scss](src/components/Footer/Assistant/Assistant.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/Footer/Footer.module.scss](src/components/Footer/Footer.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/Footer/HelpContent/HelpContentDialog/HelpContentDialog.module.scss](src/components/Footer/HelpContent/HelpContentDialog/HelpContentDialog.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/Footer/InstallVersion/InstallVersionTooltipContent/InstallVersionTooltipContent.module.scss](src/components/Footer/InstallVersion/InstallVersionTooltipContent/InstallVersionTooltipContent.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/Footer/InstallVersion/InstallVersionTooltipContent/LatestGitHubRelease/LatestGitHubRelease.module.scss](src/components/Footer/InstallVersion/InstallVersionTooltipContent/LatestGitHubRelease/LatestGitHubRelease.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/IdeaApprovalDialog/IdeaApprovalDialog.module.scss](src/components/IdeaApprovalDialog/IdeaApprovalDialog.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/IdeaDialog/IdeaDialog.module.scss](src/components/IdeaDialog/IdeaDialog.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/TemplatePackageCatalog/CatalogToolbar/CatalogToolbar.module.scss](src/components/TemplatePackageCatalog/CatalogToolbar/CatalogToolbar.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/TemplatePackageCatalog/InstallProgress/InstallProgress.module.scss](src/components/TemplatePackageCatalog/InstallProgress/InstallProgress.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/TemplatePackageCatalog/PackageCard/PackageCard.module.scss](src/components/TemplatePackageCatalog/PackageCard/PackageCard.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/TemplatePackageCatalog/PackageDetails/PackageDetails.module.scss](src/components/TemplatePackageCatalog/PackageDetails/PackageDetails.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/TemplatePackageCatalog/PackageList/PackageList.module.scss](src/components/TemplatePackageCatalog/PackageList/PackageList.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/TemplatePackageCatalog/TemplatePackageCatalog.module.scss](src/components/TemplatePackageCatalog/TemplatePackageCatalog.module.scss)

### FN002001 @microsoft/sp-build-web | Required

Remove SharePoint Framework dev dependency package @microsoft/sp-build-web

Execute the following command:

```sh
pnpm un @microsoft/sp-build-web
```

File: [./package.json:55:5](./package.json)

### FN002004 gulp | Required

Remove SharePoint Framework dev dependency package gulp

Execute the following command:

```sh
pnpm un gulp
```

File: [./package.json:73:5](./package.json)

### FN002007 ajv | Required

Remove SharePoint Framework dev dependency package ajv

Execute the following command:

```sh
pnpm un ajv
```

File: [./package.json:65:5](./package.json)

### FN002026 typescript | Required

Upgrade SharePoint Framework dev dependency package typescript

Execute the following command:

```sh
pnpm i -DE typescript@~5.8.0
```

File: [./package.json:76:5](./package.json)

### FN002033 css-loader | Required

Install SharePoint Framework dev dependency package css-loader

Execute the following command:

```sh
pnpm i -DE css-loader@7.1.2
```

File: [./package.json:51:3](./package.json)

### FN002035 @types/heft-jest | Required

Install SharePoint Framework dev dependency package @types/heft-jest

Execute the following command:

```sh
pnpm i -DE @types/heft-jest@1.0.2
```

File: [./package.json:51:3](./package.json)

### FN010011 .yo-rc.json useGulp | Recommended

Update useGulp property in .yo-rc.json

```json
{
    "useGulp": false
}
```

File: [./.yo-rc.json:2:38](./.yo-rc.json)

### FN014003 .vscode/launch.json | Recommended

In the .vscode folder, add the launch.json file

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Hosted workbench",
      "type": "msedge",
      "request": "launch",
      "url": "https://{tenantDomain}/_layouts/workbench.aspx",
      "webRoot": "${workspaceRoot}",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///.././src/*": "${webRoot}/src/*",
        "webpack:///../../../src/*": "${webRoot}/src/*",
        "webpack:///../../../../src/*": "${webRoot}/src/*",
        "webpack:///../../../../../src/*": "${webRoot}/src/*"
      },
      "runtimeArgs": [
        "--remote-debugging-port=9222",
        "-incognito"
      ]
    }
  ]
}
```

File: [.vscode/launch.json](.vscode/launch.json)

### FN015005 src/index.ts | Required

Remove file src/index.ts

Execute the following command:

```sh
rm "src/index.ts"
```

File: [src/index.ts](src/index.ts)

### FN015010 gulpfile.js | Required

Remove file gulpfile.js

Execute the following command:

```sh
rm "gulpfile.js"
```

File: [gulpfile.js](gulpfile.js)

### FN015011 tsconfig.json | Required

Add file tsconfig.json

Execute the following command:

```sh
cat > "tsconfig.json" << EOF 
{
  "extends": "./node_modules/@microsoft/spfx-web-build-rig/profiles/default/tsconfig-base.json"
}

EOF
```

File: [tsconfig.json](tsconfig.json)

### FN015014 config/rig.json | Required

Add file config/rig.json

Execute the following command:

```sh
cat > "config/rig.json" << EOF 
{
  // The "rig.json" file directs tools to look for their config files in an external package.
  // Documentation for this system: https://www.npmjs.com/package/@rushstack/rig-package
  "$schema": "https://developer.microsoft.com/json-schemas/rig-package/rig.schema.json",

  "rigPackageName": "@microsoft/spfx-web-build-rig"
}

EOF
```

File: [config/rig.json](config/rig.json)

### FN015015 config/typescript.json | Required

Add file config/typescript.json

Execute the following command:

```sh
cat > "config/typescript.json" << EOF 
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/typescript.json",

  "staticAssetsToCopy": {
    "fileExtensions": [".resx", ".jpg", ".png", ".woff", ".eot", ".ttf", ".svg", ".gif"],

    "includeGlobs": ["webparts/*/loc/*.js"]
  }
}

EOF
```

File: [config/typescript.json](config/typescript.json)

### FN020001 @types/react | Required

Add resolution for package @types/react

```json
{
  "resolutions": {
    "@types/react": "17.0.45"
  }
}
```

File: [./package.json:1:1](./package.json)

### FN021001 main | Required

Remove package.json property

```json
{
  "main": "undefined"
}
```

File: [./package.json:10:3](./package.json)

### FN021004 package.json scripts.build | Required

Update package.json scripts.build property

```json
{
  "scripts": {
    "build": "heft test --clean --production && heft package-solution --production"
  }
}
```

File: [./package.json:16:5](./package.json)

### FN021006 package.json scripts.clean | Required

Update package.json scripts.clean property

```json
{
  "scripts": {
    "clean": "heft clean"
  }
}
```

File: [./package.json:11:14](./package.json)

### FN021007 package.json scripts.start | Required

Update package.json scripts.start property

```json
{
  "scripts": {
    "start": "heft start --clean"
  }
}
```

File: [./package.json:11:14](./package.json)

### FN021008 package.json scripts.eject-webpack | Required

Update package.json scripts.eject-webpack property

```json
{
  "scripts": {
    "eject-webpack": "heft eject-webpack"
  }
}
```

File: [./package.json:11:14](./package.json)

### FN023003 .gitignore 'lib-dts' folder | Required

To .gitignore add the 'lib-dts' folder


File: [./.gitignore](./.gitignore)

### FN023004 .gitignore 'lib-commonjs' folder | Required

To .gitignore add the 'lib-commonjs' folder


File: [./.gitignore](./.gitignore)

### FN023005 .gitignore 'lib-esm' folder | Required

To .gitignore add the 'lib-esm' folder


File: [./.gitignore](./.gitignore)

### FN023006 .gitignore 'jest-output' folder | Required

To .gitignore add the 'jest-output' folder


File: [./.gitignore](./.gitignore)

### FN026001 sass.json schema | Required

Update sass.json schema URL

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft-sass-plugin.schema.json"
}
```

File: [./config/sass.json:2:3](./config/sass.json)

### FN026002 sass.json extends | Required

Update sass.json extends property

```json
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/sass.json"
}
```

File: [./config/sass.json:1:1](./config/sass.json)

### FN002029 @microsoft/rush-stack-compiler-5.3 | Required

Install SharePoint Framework dev dependency package @microsoft/rush-stack-compiler-5.3

Execute the following command:

```sh
pnpm i -DE @microsoft/rush-stack-compiler-5.3@0.1.0
```

File: [./package.json:51:3](./package.json)

### FN012017 tsconfig.json extends property | Required

Update tsconfig.json extends property

```json
{
  "extends": "./node_modules/@microsoft/rush-stack-compiler-5.3/includes/tsconfig-web.json"
}
```

File: [./tsconfig.json:2:3](./tsconfig.json)

### FN021003 package.json engines.node | Required

Update package.json engines.node property

```json
{
  "engines": {
    "node": ">=22.14.0 < 23.0.0"
  }
}
```

File: [./package.json:1:1](./package.json)

### FN010010 .yo-rc.json @microsoft/teams-js SDK version | Recommended

Update @microsoft/teams-js SDK version in .yo-rc.json

```json
{
  "@microsoft/generator-sharepoint": {
    "sdkVersions": {
      "@microsoft/teams-js": "2.24.0"
    }
  }
}
```

File: [./.yo-rc.json:2:3](./.yo-rc.json)

### FN014010 Exclude Jest output files in .vscode/settings.json | Required

Add excluding Jest output files in .vscode/settings.json

```json
{
  "files.exclude": {
    "**/jest-output": true
  }
}
```

File: [.vscode/settings.json:4:3](.vscode/settings.json)

### FN001035 @fluentui/react | Required

Upgrade SharePoint Framework dependency package @fluentui/react

Execute the following command:

```sh
pnpm i -E @fluentui/react@8.106.4
```

File: [./package.json:26:5](./package.json)

### FN007002 serve.json initialPage | Required

Update serve.json initialPage URL

```json
{
  "initialPage": "https://{tenantDomain}/_layouts/workbench.aspx"
}
```

File: [./config/serve.json:1:1](./config/serve.json)

## Summary

### Execute script

```sh
pnpm un @rushstack/eslint-config @typescript-eslint/parser @microsoft/sp-build-web gulp ajv
pnpm i -E @microsoft/sp-core-library@1.23.2 @microsoft/sp-dialog@1.23.2 @microsoft/sp-application-base@1.23.2 @microsoft/sp-listview-extensibility@1.23.2 @microsoft/sp-page-context@1.23.2 @microsoft/decorators@1.23.2 @fluentui/react@8.106.4
pnpm i -DE @microsoft/sp-module-interfaces@1.23.2 @microsoft/eslint-plugin-spfx@1.23.2 @microsoft/eslint-config-spfx@1.23.2 @microsoft/spfx-web-build-rig@1.23.2 @microsoft/spfx-heft-plugins@1.23.2 @rushstack/heft@1.2.17 eslint-plugin-react-hooks@5.2.0 eslint@9.37.0 @types/jest@30.0.0 typescript@~5.8.0 css-loader@7.1.2 @types/heft-jest@1.0.2 @microsoft/rush-stack-compiler-5.3@0.1.0
pnpm pkg set overrides.@rushstack/heft=1.2.17
pnpm i
cat > "eslint.config.js" << EOF 
const spfxProfile = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react');

module.exports = [
  ...spfxProfile,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: __dirname,
        project: './tsconfig.json'
      }
    }
  }
];
EOF
rm "src/index.ts"
rm "gulpfile.js"
cat > "tsconfig.json" << EOF 
{
  "extends": "./node_modules/@microsoft/spfx-web-build-rig/profiles/default/tsconfig-base.json"
}

EOF
cat > "config/typescript.json" << EOF 
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/typescript.json",

  "staticAssetsToCopy": {
    "fileExtensions": [".resx", ".jpg", ".png", ".woff", ".eot", ".ttf", ".svg", ".gif"],

    "includeGlobs": ["webparts/*/loc/*.js"]
  }
}

EOF
```

### Modify files

#### [./.yo-rc.json](./.yo-rc.json)

Update version in .yo-rc.json:

```json
{
  "@microsoft/generator-sharepoint": {
    "version": "1.23.2"
  }
}
```

Update useGulp property in .yo-rc.json:

```json
{
    "useGulp": false
}
```

Update @microsoft/teams-js SDK version in .yo-rc.json:

```json
{
  "@microsoft/generator-sharepoint": {
    "sdkVersions": {
      "@microsoft/teams-js": "2.24.0"
    }
  }
}
```

#### [src/components/Footer/Assistant/Assistant.module.scss](src/components/Footer/Assistant/Assistant.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/Footer/Footer.module.scss](src/components/Footer/Footer.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/Footer/HelpContent/HelpContentDialog/HelpContentDialog.module.scss](src/components/Footer/HelpContent/HelpContentDialog/HelpContentDialog.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/Footer/InstallVersion/InstallVersionTooltipContent/InstallVersionTooltipContent.module.scss](src/components/Footer/InstallVersion/InstallVersionTooltipContent/InstallVersionTooltipContent.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/Footer/InstallVersion/InstallVersionTooltipContent/LatestGitHubRelease/LatestGitHubRelease.module.scss](src/components/Footer/InstallVersion/InstallVersionTooltipContent/LatestGitHubRelease/LatestGitHubRelease.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/IdeaApprovalDialog/IdeaApprovalDialog.module.scss](src/components/IdeaApprovalDialog/IdeaApprovalDialog.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/IdeaDialog/IdeaDialog.module.scss](src/components/IdeaDialog/IdeaDialog.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/TemplatePackageCatalog/CatalogToolbar/CatalogToolbar.module.scss](src/components/TemplatePackageCatalog/CatalogToolbar/CatalogToolbar.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/TemplatePackageCatalog/InstallProgress/InstallProgress.module.scss](src/components/TemplatePackageCatalog/InstallProgress/InstallProgress.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/TemplatePackageCatalog/PackageCard/PackageCard.module.scss](src/components/TemplatePackageCatalog/PackageCard/PackageCard.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/TemplatePackageCatalog/PackageDetails/PackageDetails.module.scss](src/components/TemplatePackageCatalog/PackageDetails/PackageDetails.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/TemplatePackageCatalog/PackageList/PackageList.module.scss](src/components/TemplatePackageCatalog/PackageList/PackageList.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/TemplatePackageCatalog/TemplatePackageCatalog.module.scss](src/components/TemplatePackageCatalog/TemplatePackageCatalog.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [.vscode/launch.json](.vscode/launch.json)

In the .vscode folder, add the launch.json file:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Hosted workbench",
      "type": "msedge",
      "request": "launch",
      "url": "https://{tenantDomain}/_layouts/workbench.aspx",
      "webRoot": "${workspaceRoot}",
      "sourceMaps": true,
      "sourceMapPathOverrides": {
        "webpack:///.././src/*": "${webRoot}/src/*",
        "webpack:///../../../src/*": "${webRoot}/src/*",
        "webpack:///../../../../src/*": "${webRoot}/src/*",
        "webpack:///../../../../../src/*": "${webRoot}/src/*"
      },
      "runtimeArgs": [
        "--remote-debugging-port=9222",
        "-incognito"
      ]
    }
  ]
}
```

#### [./package.json](./package.json)

Add resolution for package @types/react:

```json
{
  "resolutions": {
    "@types/react": "17.0.45"
  }
}
```

Remove package.json property:

```json
{
  "main": "undefined"
}
```

Update package.json scripts.build property:

```json
{
  "scripts": {
    "build": "heft test --clean --production && heft package-solution --production"
  }
}
```

Update package.json scripts.clean property:

```json
{
  "scripts": {
    "clean": "heft clean"
  }
}
```

Update package.json scripts.start property:

```json
{
  "scripts": {
    "start": "heft start --clean"
  }
}
```

Update package.json scripts.eject-webpack property:

```json
{
  "scripts": {
    "eject-webpack": "heft eject-webpack"
  }
}
```

Update package.json engines.node property:

```json
{
  "engines": {
    "node": ">=22.14.0 < 23.0.0"
  }
}
```

#### [./.gitignore](./.gitignore)

To .gitignore add the 'lib-dts' folder:

```text
lib-dts
```

To .gitignore add the 'lib-commonjs' folder:

```text
lib-commonjs
```

To .gitignore add the 'lib-esm' folder:

```text
lib-esm
```

To .gitignore add the 'jest-output' folder:

```text
jest-output
```

#### [./config/sass.json](./config/sass.json)

Update sass.json schema URL:

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/heft/v0/heft-sass-plugin.schema.json"
}
```

Update sass.json extends property:

```json
{
  "extends": "@microsoft/spfx-web-build-rig/profiles/default/config/sass.json"
}
```

#### [./tsconfig.json](./tsconfig.json)

Update tsconfig.json extends property:

```json
{
  "extends": "./node_modules/@microsoft/rush-stack-compiler-5.3/includes/tsconfig-web.json"
}
```

#### [.vscode/settings.json](.vscode/settings.json)

Add excluding Jest output files in .vscode/settings.json:

```json
{
  "files.exclude": {
    "**/jest-output": true
  }
}
```

#### [./config/serve.json](./config/serve.json)

Update serve.json initialPage URL:

```json
{
  "initialPage": "https://{tenantDomain}/_layouts/workbench.aspx"
}
```

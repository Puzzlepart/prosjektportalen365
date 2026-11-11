# Upgrade project Prosjektportalen 365 - Portfolio Web Parts to v1.23.2

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

### FN001002 @microsoft/sp-lodash-subset | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-lodash-subset

Execute the following command:

```sh
pnpm i -E @microsoft/sp-lodash-subset@1.23.2
```

File: [./package.json:29:5](./package.json)

### FN001003 @microsoft/sp-office-ui-fabric-core | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-office-ui-fabric-core

Execute the following command:

```sh
pnpm i -E @microsoft/sp-office-ui-fabric-core@1.23.2
```

File: [./package.json:30:5](./package.json)

### FN001004 @microsoft/sp-webpart-base | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-webpart-base

Execute the following command:

```sh
pnpm i -E @microsoft/sp-webpart-base@1.23.2
```

File: [./package.json:33:5](./package.json)

### FN001021 @microsoft/sp-property-pane | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-property-pane

Execute the following command:

```sh
pnpm i -E @microsoft/sp-property-pane@1.23.2
```

File: [./package.json:32:5](./package.json)

### FN001027 @microsoft/sp-http | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-http

Execute the following command:

```sh
pnpm i -E @microsoft/sp-http@1.23.2
```

File: [./package.json:34:5](./package.json)

### FN001032 @microsoft/sp-page-context | Required

Upgrade SharePoint Framework dependency package @microsoft/sp-page-context

Execute the following command:

```sh
pnpm i -E @microsoft/sp-page-context@1.23.2
```

File: [./package.json:31:5](./package.json)

### FN001013 @microsoft/decorators | Required

Upgrade SharePoint Framework dependency package @microsoft/decorators

Execute the following command:

```sh
pnpm i -E @microsoft/decorators@1.23.2
```

File: [./package.json:27:5](./package.json)

### FN002002 @microsoft/sp-module-interfaces | Required

Install SharePoint Framework dev dependency package @microsoft/sp-module-interfaces

Execute the following command:

```sh
pnpm i -DE @microsoft/sp-module-interfaces@1.23.2
```

File: [./package.json:70:3](./package.json)

### FN002022 @microsoft/eslint-plugin-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-plugin-spfx

Execute the following command:

```sh
pnpm i -DE @microsoft/eslint-plugin-spfx@1.23.2
```

File: [./package.json:72:5](./package.json)

### FN002023 @microsoft/eslint-config-spfx | Required

Upgrade SharePoint Framework dev dependency package @microsoft/eslint-config-spfx

Execute the following command:

```sh
pnpm i -DE @microsoft/eslint-config-spfx@1.23.2
```

File: [./package.json:71:5](./package.json)

### FN002030 @microsoft/spfx-web-build-rig | Required

Install SharePoint Framework dev dependency package @microsoft/spfx-web-build-rig

Execute the following command:

```sh
pnpm i -DE @microsoft/spfx-web-build-rig@1.23.2
```

File: [./package.json:70:3](./package.json)

### FN002034 @microsoft/spfx-heft-plugins | Required

Install SharePoint Framework dev dependency package @microsoft/spfx-heft-plugins

Execute the following command:

```sh
pnpm i -DE @microsoft/spfx-heft-plugins@1.23.2
```

File: [./package.json:70:3](./package.json)

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

File: [./package.json:70:3](./package.json)

### FN027001 @rushstack/heft | Required

Install SharePoint Framework override dependency package @rushstack/heft

Execute the following command:

```sh
pnpm pkg set overrides.@rushstack/heft=1.2.17
```

File: [./package.json:1:1](./package.json)

### FN002025 eslint-plugin-react-hooks | Required

Upgrade SharePoint Framework dev dependency package eslint-plugin-react-hooks

Execute the following command:

```sh
pnpm i -DE eslint-plugin-react-hooks@5.2.0
```

File: [./package.json:90:5](./package.json)

### FN002024 eslint | Required

Upgrade SharePoint Framework dev dependency package eslint

Execute the following command:

```sh
pnpm i -DE eslint@9.37.0
```

File: [./package.json:86:5](./package.json)

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

File: [./package.json:75:5](./package.json)

### FN002032 @typescript-eslint/parser | Required

Remove SharePoint Framework dev dependency package @typescript-eslint/parser

Execute the following command:

```sh
pnpm un @typescript-eslint/parser
```

File: [./package.json:82:5](./package.json)

### FN002036 @types/jest | Required

Install SharePoint Framework dev dependency package @types/jest

Execute the following command:

```sh
pnpm i -DE @types/jest@30.0.0
```

File: [./package.json:70:3](./package.json)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss](src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/List/List.module.scss](src/components/List/List.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/Commands/Commands.module.scss](src/components/ProjectList/Commands/Commands.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/List/List.module.scss](src/components/ProjectList/List/List.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectCard/ProjectCard.module.scss](src/components/ProjectList/ProjectCard/ProjectCard.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss](src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectList.module.scss](src/components/ProjectList/ProjectList.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ResourceAllocation/ResourceAllocation.module.scss](src/components/ResourceAllocation/ResourceAllocation.module.scss)

### FN022001 Scss file import | Required

Remove scss file import

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

File: [src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss](src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss](src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/IdeaModule/Commands/Commands.module.scss](src/components/IdeaModule/Commands/Commands.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/IdeaModule/IdeaModule.module.scss](src/components/IdeaModule/IdeaModule.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/IdeaModule/IdeaPhaseBar/IdeaPhaseBar.module.scss](src/components/IdeaModule/IdeaPhaseBar/IdeaPhaseBar.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/LatestProjects/LatestProjects.module.scss](src/components/LatestProjects/LatestProjects.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/List/ItemColumn/ConfigColumn/ConfigColumn.module.scss](src/components/List/ItemColumn/ConfigColumn/ConfigColumn.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/List/ItemColumn/StatusReportColumn/StatusColumn.module.scss](src/components/List/ItemColumn/StatusReportColumn/StatusColumn.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/List/ItemColumn/StatusReportColumn/TooltipContent/TooltipContent.module.scss](src/components/List/ItemColumn/StatusReportColumn/TooltipContent/TooltipContent.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/List/List.module.scss](src/components/List/List.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/List/ListHeader/ListHeader.module.scss](src/components/List/ListHeader/ListHeader.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanel.module.scss](src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanel.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss](src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioAggregation/PortfolioAggregation.module.scss](src/components/PortfolioAggregation/PortfolioAggregation.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanel.module.scss](src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanel.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss](src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanel.module.scss](src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanel.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss](src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioOverview/PortfolioOverview.module.scss](src/components/PortfolioOverview/PortfolioOverview.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioOverview/ResultsCount/ResultsCount.module.scss](src/components/PortfolioOverview/ResultsCount/ResultsCount.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioOverview/ViewFormPanel/ViewFormPanel.module.scss](src/components/PortfolioOverview/ViewFormPanel/ViewFormPanel.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/PortfolioOverview/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss](src/components/PortfolioOverview/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/Commands/Commands.module.scss](src/components/ProjectList/Commands/Commands.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/List/List.module.scss](src/components/ProjectList/List/List.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectCard/ProjectCard.module.scss](src/components/ProjectList/ProjectCard/ProjectCard.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectCard/ProjectCardContent/ProjectCardContent.module.scss](src/components/ProjectList/ProjectCard/ProjectCardContent/ProjectCardContent.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss](src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectCard/ProjectCardHeader/ProjectCardHeader.module.scss](src/components/ProjectList/ProjectCard/ProjectCardHeader/ProjectCardHeader.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ProjectList/ProjectList.module.scss](src/components/ProjectList/ProjectList.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/components/ResourceAllocation/ResourceAllocation.module.scss](src/components/ResourceAllocation/ResourceAllocation.module.scss)

### FN022002 Scss file import | Optional

Add scss file import

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

File: [src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss](src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss)

### FN002001 @microsoft/sp-build-web | Required

Remove SharePoint Framework dev dependency package @microsoft/sp-build-web

Execute the following command:

```sh
pnpm un @microsoft/sp-build-web
```

File: [./package.json:74:5](./package.json)

### FN002004 gulp | Required

Remove SharePoint Framework dev dependency package gulp

Execute the following command:

```sh
pnpm un gulp
```

File: [./package.json:93:5](./package.json)

### FN002007 ajv | Required

Remove SharePoint Framework dev dependency package ajv

Execute the following command:

```sh
pnpm un ajv
```

File: [./package.json:83:5](./package.json)

### FN002026 typescript | Required

Upgrade SharePoint Framework dev dependency package typescript

Execute the following command:

```sh
pnpm i -DE typescript@~5.8.0
```

File: [./package.json:97:5](./package.json)

### FN002033 css-loader | Required

Install SharePoint Framework dev dependency package css-loader

Execute the following command:

```sh
pnpm i -DE css-loader@7.1.2
```

File: [./package.json:70:3](./package.json)

### FN002035 @types/heft-jest | Required

Install SharePoint Framework dev dependency package @types/heft-jest

Execute the following command:

```sh
pnpm i -DE @types/heft-jest@1.0.2
```

File: [./package.json:70:3](./package.json)

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

### FN021004 package.json scripts.build | Required

Update package.json scripts.build property

```json
{
  "scripts": {
    "build": "heft test --clean --production && heft package-solution --production"
  }
}
```

File: [./package.json:15:5](./package.json)

### FN021006 package.json scripts.clean | Required

Update package.json scripts.clean property

```json
{
  "scripts": {
    "clean": "heft clean"
  }
}
```

File: [./package.json:10:14](./package.json)

### FN021007 package.json scripts.start | Required

Update package.json scripts.start property

```json
{
  "scripts": {
    "start": "heft start --clean"
  }
}
```

File: [./package.json:10:14](./package.json)

### FN021008 package.json scripts.eject-webpack | Required

Update package.json scripts.eject-webpack property

```json
{
  "scripts": {
    "eject-webpack": "heft eject-webpack"
  }
}
```

File: [./package.json:10:14](./package.json)

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

### FN002029 @microsoft/rush-stack-compiler-5.3 | Required

Install SharePoint Framework dev dependency package @microsoft/rush-stack-compiler-5.3

Execute the following command:

```sh
pnpm i -DE @microsoft/rush-stack-compiler-5.3@0.1.0
```

File: [./package.json:70:3](./package.json)

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

File: [.vscode/settings.json:2:3](.vscode/settings.json)

### FN001035 @fluentui/react | Required

Upgrade SharePoint Framework dependency package @fluentui/react

Execute the following command:

```sh
pnpm i -E @fluentui/react@8.106.4
```

File: [./package.json:25:5](./package.json)

## Summary

### Execute script

```sh
pnpm un @rushstack/eslint-config @typescript-eslint/parser @microsoft/sp-build-web gulp ajv
pnpm i -E @microsoft/sp-core-library@1.23.2 @microsoft/sp-lodash-subset@1.23.2 @microsoft/sp-office-ui-fabric-core@1.23.2 @microsoft/sp-webpart-base@1.23.2 @microsoft/sp-property-pane@1.23.2 @microsoft/sp-http@1.23.2 @microsoft/sp-page-context@1.23.2 @microsoft/decorators@1.23.2 @fluentui/react@8.106.4
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

#### [src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss](src/components/EditViewColumnsPanel/EditViewColumnsPanel.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/List/List.module.scss](src/components/List/List.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/Commands/Commands.module.scss](src/components/ProjectList/Commands/Commands.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/List/List.module.scss](src/components/ProjectList/List/List.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/ProjectCard/ProjectCard.module.scss](src/components/ProjectList/ProjectCard/ProjectCard.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss](src/components/ProjectList/ProjectCard/ProjectCardFooter/ProjectCardFooter.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/ProjectList.module.scss](src/components/ProjectList/ProjectList.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ResourceAllocation/ResourceAllocation.module.scss](src/components/ResourceAllocation/ResourceAllocation.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss](src/webparts/basePortfolioWebPart/ErrorBoundary/ErrorBoundaryFallback.module.scss)

Remove scss file import:

```scss
@import '~@fluentui/react/dist/sass/References.scss'
```

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/IdeaModule/Commands/Commands.module.scss](src/components/IdeaModule/Commands/Commands.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/IdeaModule/IdeaModule.module.scss](src/components/IdeaModule/IdeaModule.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/IdeaModule/IdeaPhaseBar/IdeaPhaseBar.module.scss](src/components/IdeaModule/IdeaPhaseBar/IdeaPhaseBar.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/LatestProjects/LatestProjects.module.scss](src/components/LatestProjects/LatestProjects.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/List/ItemColumn/ConfigColumn/ConfigColumn.module.scss](src/components/List/ItemColumn/ConfigColumn/ConfigColumn.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/List/ItemColumn/StatusReportColumn/StatusColumn.module.scss](src/components/List/ItemColumn/StatusReportColumn/StatusColumn.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/List/ItemColumn/StatusReportColumn/TooltipContent/TooltipContent.module.scss](src/components/List/ItemColumn/StatusReportColumn/TooltipContent/TooltipContent.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/List/ListHeader/ListHeader.module.scss](src/components/List/ListHeader/ListHeader.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanel.module.scss](src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanel.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss](src/components/PortfolioAggregation/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioAggregation/PortfolioAggregation.module.scss](src/components/PortfolioAggregation/PortfolioAggregation.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanel.module.scss](src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanel.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss](src/components/PortfolioAggregation/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanel.module.scss](src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanel.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss](src/components/PortfolioOverview/ColumnFormPanel/ColumnFormPanelFooter/ColumnFormPanelFooter.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioOverview/PortfolioOverview.module.scss](src/components/PortfolioOverview/PortfolioOverview.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioOverview/ResultsCount/ResultsCount.module.scss](src/components/PortfolioOverview/ResultsCount/ResultsCount.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioOverview/ViewFormPanel/ViewFormPanel.module.scss](src/components/PortfolioOverview/ViewFormPanel/ViewFormPanel.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/PortfolioOverview/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss](src/components/PortfolioOverview/ViewFormPanel/ViewFormPanelFooter/ViewFormPanelFooter.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/ProjectCard/ProjectCardContent/ProjectCardContent.module.scss](src/components/ProjectList/ProjectCard/ProjectCardContent/ProjectCardContent.module.scss)

Add scss file import:

```scss
@import 'pkg:@fluentui/react/dist/sass/References.scss'
```

#### [src/components/ProjectList/ProjectCard/ProjectCardHeader/ProjectCardHeader.module.scss](src/components/ProjectList/ProjectCard/ProjectCardHeader/ProjectCardHeader.module.scss)

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

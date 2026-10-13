# Software Bill of Materials (SBOM)

**Project:** Prosjektportalen 365  
**Version:** 1.14.0  
**Generated:** 2026-10-08T06:40:33.078Z  
**Format:** CycloneDX-inspired Markdown

## Overview

This SBOM documents all software dependencies used in the Prosjektportalen 365 project, including all packages in the monorepo.

**Total Dependencies:** 115  
**Production Dependencies:** 74  
**Development Dependencies:** 41  
**Projects in Monorepo:** 12

## Projects in Monorepo

### pp365 (1.14.0)

- **Production Dependencies:** 0
- **Development Dependencies:** 5

### pp365-shared-library (1.14.0)

- **Production Dependencies:** 36
- **Development Dependencies:** 23

### pp365-portfolioextensions (1.14.0)

- **Production Dependencies:** 22
- **Development Dependencies:** 24

### pp365-portfoliowebparts (1.14.0)

- **Production Dependencies:** 37
- **Development Dependencies:** 25

### pp365-programwebparts (1.14.0)

- **Production Dependencies:** 32
- **Development Dependencies:** 24

### pp365-projectextensions (1.14.0)

- **Production Dependencies:** 32
- **Development Dependencies:** 24

### pp365-projectwebparts (1.14.0)

- **Production Dependencies:** 42
- **Development Dependencies:** 26

### pp365-templates (1.14.0)

- **Production Dependencies:** 3
- **Development Dependencies:** 3

### pp365-spfx-tasks (1.14.0)

- **Production Dependencies:** 6
- **Development Dependencies:** 2

### pp365-eslint-config (1.14.0)

- **Production Dependencies:** 9
- **Development Dependencies:** 0

### pp365-jest-config (1.14.0)

- **Production Dependencies:** 5
- **Development Dependencies:** 0

### pp365-e2e (1.14.0)

- **Production Dependencies:** 0
- **Development Dependencies:** 4

## All Dependencies

This section lists all unique dependencies across all projects.

### Production Dependencies (74)

| Package | Version(s) | Used By |
|---------|-----------|----------|
| @fluentui/react | 8.106.4 | pp365-shared-library |
| @fluentui/react-components | ~9.74.8 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @fluentui/react-datepicker-compat | ~0.6.38 | pp365-shared-library, pp365-projectwebparts |
| @fluentui/react-file-type-icons | ~8.16.0 | pp365-shared-library, pp365-projectextensions |
| @fluentui/react-icons | ~2.0.341 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @hello-pangea/dnd | ~16.6.0 | pp365-portfoliowebparts |
| @microsoft/decorators | 1.24.0-rc.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-projectextensions, +1 more |
| @microsoft/eslint-config-spfx | 1.24.0-rc.0 | pp365-eslint-config |
| @microsoft/microsoft-graph-types | 2.43.0 | pp365-projectextensions |
| @microsoft/sp-adaptive-card-extension-base | 1.24.0-rc.0 | pp365-programwebparts, pp365-projectwebparts |
| @microsoft/sp-application-base | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-projectextensions |
| @microsoft/sp-core-library | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @microsoft/sp-dialog | 1.24.0-rc.0 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts |
| @microsoft/sp-http | 1.24.0-rc.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| @microsoft/sp-listview-extensibility | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-projectextensions, +1 more |
| @microsoft/sp-lodash-subset | 1.24.0-rc.0 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +1 more |
| @microsoft/sp-office-ui-fabric-core | 1.24.0-rc.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| @microsoft/sp-page-context | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @microsoft/sp-property-pane | 1.24.0-rc.0 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +1 more |
| @microsoft/sp-webpart-base | 1.24.0-rc.0 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +1 more |
| @pnp/core | 4.21.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @pnp/graph | 4.21.0 | pp365-projectextensions |
| @pnp/logging | 4.21.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @pnp/queryable | 4.21.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @pnp/sp | 4.21.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @pnp/spfx-controls-react | 3.25.0 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +1 more |
| @pnp/spfx-property-controls | 3.24.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| @ptkdev/json-token-replace | ^1.2.2 | pp365-templates |
| @reduxjs/toolkit | ~2.13.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| @rushstack/eslint-config | 4.8.0 | pp365-eslint-config |
| @types/array-sort | 1.0.0 | pp365-portfoliowebparts, pp365-programwebparts |
| @types/react-calendar-timeline | 0.28.0 | pp365-shared-library |
| @typescript-eslint/eslint-plugin | 8.56.1 | pp365-eslint-config |
| array-sort | ~1.0.0, 1.0.0 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +1 more |
| array-unique | 0.3.2 | pp365-portfoliowebparts |
| clean-deep | 3.0.2 | pp365-portfoliowebparts, pp365-programwebparts |
| colors | 1.4.0 | pp365-spfx-tasks |
| colors-convert | ~1.4.1 | pp365-projectwebparts |
| dom-to-image | 2.6.0 | pp365-projectwebparts |
| dotenv | ~16.1.3, 16.1.3, 17.2.3 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +6 more |
| eslint-config-prettier | 10.1.8 | pp365-eslint-config |
| eslint-plugin-prettier | 5.5.6 | pp365-eslint-config |
| eslint-plugin-unused-imports | 4.4.1 | pp365-eslint-config |
| file-saver | ^2.0.5 | pp365-shared-library |
| get-value | 3.0.1 | pp365-projectwebparts |
| interactjs | 1.6.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| jszip | 3.10.1 | pp365-shared-library, pp365-portfolioextensions, pp365-projectextensions |
| lodash | ~4.17.21, 4.17.21 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +4 more |
| moment | ~2.29.4 | pp365-shared-library, pp365-portfoliowebparts, pp365-programwebparts, +1 more |
| msgraph-helper | 0.8.3 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| object-assign | 4.1.1 | pp365-portfoliowebparts, pp365-programwebparts |
| pp365-shared-library | workspace:* | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| react | 18.3.1 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| react-calendar-timeline | 0.28.0 | pp365-shared-library |
| react-dom | 18.3.1 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| react-error-boundary | ~4.0.11, ~4.0.10 | pp365-portfoliowebparts, pp365-projectwebparts |
| react-gauge-component | ~1.2.61 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| react-markdown | ^8.0.3 | pp365-shared-library, pp365-portfolioextensions, pp365-projectextensions, +1 more |
| react-virtualized-auto-sizer | ~1.0.24 | pp365-portfoliowebparts |
| react-window | ~1.8.10 | pp365-portfoliowebparts |
| rehype-raw | ^6.1.1 | pp365-shared-library, pp365-portfolioextensions, pp365-projectextensions, +1 more |
| resx-json-typescript-converter | ^1.0.1 | pp365-templates |
| shade-blend-color | ~1.0.0 | pp365-shared-library, pp365-projectwebparts |
| smoothscroll-polyfill | ~0.4.4 | pp365-projectwebparts |
| sp-js-provisioning | 1.4.0 | pp365-portfolioextensions, pp365-projectextensions |
| spfx-jsom | 0.6.6 | pp365-shared-library, pp365-projectextensions, pp365-projectwebparts |
| ts-morph | 25.0.1 | pp365-spfx-tasks |
| tslib | 2.8.1 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| underscore | ~1.13.6 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| use-image-color | ~0.0.9 | pp365-portfoliowebparts |
| usehooks-ts | ~2.9.1 | pp365-projectextensions, pp365-projectwebparts |
| valid-filename | 3.1.0 | pp365-projectextensions |
| xlsx | https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz | pp365-shared-library |
| xmldom | 0.6.0 | pp365-shared-library |

### Development Dependencies (41)

| Package | Version(s) | Used By |
|---------|-----------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +4 more |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +4 more |
| @playwright/test | 1.63.0 | pp365-e2e |
| @rushstack/heft | 1.3.2 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +4 more |
| @testing-library/dom | 10.4.2 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @testing-library/jest-dom | 6.6.3 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +4 more |
| @testing-library/react | 16.3.3 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @testing-library/user-event | 14.6.7 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/colors | 1.2.1 | pp365-spfx-tasks |
| @types/dom-to-image | 2.6.4 | pp365-projectwebparts |
| @types/get-value | 3.0.1 | pp365-projectwebparts |
| @types/heft-jest | 1.0.2 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/jest | 30.0.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/lodash | ~4.14.195, 4.14.195 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +5 more |
| @types/node | 22.20.3 | pp365-e2e |
| @types/object-assign | 4.0.30 | pp365-portfoliowebparts, pp365-programwebparts |
| @types/react | 18.2.79 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/react-dom | 18.2.25 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/react-window | ~1.8.8 | pp365-portfoliowebparts |
| @types/shade-blend-color | ~1.0.3 | pp365-shared-library, pp365-projectwebparts |
| @types/sharepoint | 2016.1.10 | pp365-portfolioextensions, pp365-projectextensions |
| @types/smoothscroll-polyfill | ~0.3.3 | pp365-projectwebparts |
| @types/underscore | ~1.11.5 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/webpack-env | ~1.15.2 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| @types/xmldom | ^0.1.29 | pp365-shared-library |
| buffer | 6.0.3 | pp365-portfolioextensions, pp365-projectextensions |
| css-loader | 7.1.2 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| eslint | 9.37.0 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +4 more |
| fs-extra | 11.1.0 | pp365 |
| glob | 7.2.0, 10.2.6 | pp365, pp365-spfx-tasks |
| pp365-eslint-config | workspace:* | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| pp365-jest-config | workspace:* | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +3 more |
| pp365-portfoliowebparts | workspace:* | pp365-programwebparts |
| pp365-projectwebparts | workspace:* | pp365-portfoliowebparts, pp365-programwebparts |
| prettier | 3.9.7 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +4 more |
| replace | 1.2.2 | pp365, pp365-templates |
| typescript | ~5.8.3 | pp365-shared-library, pp365-portfolioextensions, pp365-portfoliowebparts, +5 more |
| uuid | 9.0.0 | pp365 |
| xml2js | ~0.6.2 | pp365-templates |
| yargs | 17.7.1, 17.7.2 | pp365, pp365-spfx-tasks |

## Detailed Breakdown by Project

This section provides a detailed view of dependencies for each project.

### pp365

#### Development Dependencies (5)

| Package | Version |
|---------|----------|
| fs-extra | 11.1.0 |
| glob | 7.2.0 |
| replace | 1.2.2 |
| uuid | 9.0.0 |
| yargs | 17.7.1 |

### pp365-shared-library

#### Production Dependencies (36)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.74.8 |
| @fluentui/react-datepicker-compat | ~0.6.38 |
| @fluentui/react-file-type-icons | ~8.16.0 |
| @fluentui/react-icons | ~2.0.341 |
| @microsoft/sp-application-base | 1.24.0-rc.0 |
| @microsoft/sp-core-library | 1.24.0-rc.0 |
| @microsoft/sp-listview-extensibility | 1.24.0-rc.0 |
| @microsoft/sp-lodash-subset | 1.24.0-rc.0 |
| @microsoft/sp-page-context | 1.24.0-rc.0 |
| @microsoft/sp-property-pane | 1.24.0-rc.0 |
| @microsoft/sp-webpart-base | 1.24.0-rc.0 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @types/react-calendar-timeline | 0.28.0 |
| array-sort | ~1.0.0 |
| dotenv | ~16.1.3 |
| file-saver | ^2.0.5 |
| jszip | 3.10.1 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| react | 18.3.1 |
| react-calendar-timeline | 0.28.0 |
| react-dom | 18.3.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| shade-blend-color | ~1.0.0 |
| spfx-jsom | 0.6.6 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| xlsx | https://cdn.sheetjs.com/xlsx-0.20.3/xlsx-0.20.3.tgz |
| xmldom | 0.6.0 |

#### Development Dependencies (23)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/dom | 10.4.2 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 18.2.79 |
| @types/react-dom | 18.2.25 |
| @types/shade-blend-color | ~1.0.3 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| @types/xmldom | ^0.1.29 |
| css-loader | 7.1.2 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-portfolioextensions

#### Production Dependencies (22)

| Package | Version |
|---------|----------|
| @fluentui/react-components | ~9.74.8 |
| @fluentui/react-icons | ~2.0.341 |
| @microsoft/decorators | 1.24.0-rc.0 |
| @microsoft/sp-application-base | 1.24.0-rc.0 |
| @microsoft/sp-core-library | 1.24.0-rc.0 |
| @microsoft/sp-dialog | 1.24.0-rc.0 |
| @microsoft/sp-listview-extensibility | 1.24.0-rc.0 |
| @microsoft/sp-page-context | 1.24.0-rc.0 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| jszip | 3.10.1 |
| pp365-shared-library | workspace:* |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| sp-js-provisioning | 1.4.0 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |

#### Development Dependencies (24)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/dom | 10.4.2 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 18.2.79 |
| @types/react-dom | 18.2.25 |
| @types/sharepoint | 2016.1.10 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| buffer | 6.0.3 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-portfoliowebparts

#### Production Dependencies (37)

| Package | Version |
|---------|----------|
| @fluentui/react-components | ~9.74.8 |
| @fluentui/react-icons | ~2.0.341 |
| @hello-pangea/dnd | ~16.6.0 |
| @microsoft/decorators | 1.24.0-rc.0 |
| @microsoft/sp-core-library | 1.24.0-rc.0 |
| @microsoft/sp-http | 1.24.0-rc.0 |
| @microsoft/sp-lodash-subset | 1.24.0-rc.0 |
| @microsoft/sp-office-ui-fabric-core | 1.24.0-rc.0 |
| @microsoft/sp-page-context | 1.24.0-rc.0 |
| @microsoft/sp-property-pane | 1.24.0-rc.0 |
| @microsoft/sp-webpart-base | 1.24.0-rc.0 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @pnp/spfx-property-controls | 3.24.0 |
| @reduxjs/toolkit | ~2.13.0 |
| @types/array-sort | 1.0.0 |
| array-sort | 1.0.0 |
| array-unique | 0.3.2 |
| clean-deep | 3.0.2 |
| interactjs | 1.6.2 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| msgraph-helper | 0.8.3 |
| object-assign | 4.1.1 |
| pp365-shared-library | workspace:* |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-error-boundary | ~4.0.11 |
| react-gauge-component | ~1.2.61 |
| react-virtualized-auto-sizer | ~1.0.24 |
| react-window | ~1.8.10 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| use-image-color | ~0.0.9 |

#### Development Dependencies (25)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/dom | 10.4.2 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/object-assign | 4.0.30 |
| @types/react | 18.2.79 |
| @types/react-dom | 18.2.25 |
| @types/react-window | ~1.8.8 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| pp365-projectwebparts | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-programwebparts

#### Production Dependencies (32)

| Package | Version |
|---------|----------|
| @fluentui/react-components | ~9.74.8 |
| @fluentui/react-icons | ~2.0.341 |
| @microsoft/sp-adaptive-card-extension-base | 1.24.0-rc.0 |
| @microsoft/sp-core-library | 1.24.0-rc.0 |
| @microsoft/sp-http | 1.24.0-rc.0 |
| @microsoft/sp-lodash-subset | 1.24.0-rc.0 |
| @microsoft/sp-office-ui-fabric-core | 1.24.0-rc.0 |
| @microsoft/sp-page-context | 1.24.0-rc.0 |
| @microsoft/sp-property-pane | 1.24.0-rc.0 |
| @microsoft/sp-webpart-base | 1.24.0-rc.0 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @pnp/spfx-property-controls | 3.24.0 |
| @reduxjs/toolkit | ~2.13.0 |
| @types/array-sort | 1.0.0 |
| @types/underscore | ~1.11.5 |
| array-sort | 1.0.0 |
| clean-deep | 3.0.2 |
| interactjs | 1.6.2 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| msgraph-helper | 0.8.3 |
| object-assign | 4.1.1 |
| pp365-shared-library | workspace:* |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-gauge-component | ~1.2.61 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |

#### Development Dependencies (24)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/dom | 10.4.2 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/object-assign | 4.0.30 |
| @types/react | 18.2.79 |
| @types/react-dom | 18.2.25 |
| @types/webpack-env | ~1.15.2 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| pp365-portfoliowebparts | workspace:* |
| pp365-projectwebparts | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-projectextensions

#### Production Dependencies (32)

| Package | Version |
|---------|----------|
| @fluentui/react-components | ~9.74.8 |
| @fluentui/react-file-type-icons | ~8.16.0 |
| @fluentui/react-icons | ~2.0.341 |
| @microsoft/decorators | 1.24.0-rc.0 |
| @microsoft/microsoft-graph-types | 2.43.0 |
| @microsoft/sp-application-base | 1.24.0-rc.0 |
| @microsoft/sp-core-library | 1.24.0-rc.0 |
| @microsoft/sp-dialog | 1.24.0-rc.0 |
| @microsoft/sp-listview-extensibility | 1.24.0-rc.0 |
| @microsoft/sp-office-ui-fabric-core | 1.24.0-rc.0 |
| @microsoft/sp-page-context | 1.24.0-rc.0 |
| @pnp/core | 4.21.0 |
| @pnp/graph | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @reduxjs/toolkit | ~2.13.0 |
| jszip | 3.10.1 |
| lodash | ~4.17.21 |
| msgraph-helper | 0.8.3 |
| pp365-shared-library | workspace:* |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| sp-js-provisioning | 1.4.0 |
| spfx-jsom | 0.6.6 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| usehooks-ts | ~2.9.1 |
| valid-filename | 3.1.0 |

#### Development Dependencies (24)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/dom | 10.4.2 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 18.2.79 |
| @types/react-dom | 18.2.25 |
| @types/sharepoint | 2016.1.10 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| buffer | 6.0.3 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-projectwebparts

#### Production Dependencies (42)

| Package | Version |
|---------|----------|
| @fluentui/react-components | ~9.74.8 |
| @fluentui/react-datepicker-compat | ~0.6.38 |
| @fluentui/react-icons | ~2.0.341 |
| @microsoft/decorators | 1.24.0-rc.0 |
| @microsoft/sp-adaptive-card-extension-base | 1.24.0-rc.0 |
| @microsoft/sp-core-library | 1.24.0-rc.0 |
| @microsoft/sp-dialog | 1.24.0-rc.0 |
| @microsoft/sp-http | 1.24.0-rc.0 |
| @microsoft/sp-listview-extensibility | 1.24.0-rc.0 |
| @microsoft/sp-lodash-subset | 1.24.0-rc.0 |
| @microsoft/sp-office-ui-fabric-core | 1.24.0-rc.0 |
| @microsoft/sp-page-context | 1.24.0-rc.0 |
| @microsoft/sp-property-pane | 1.24.0-rc.0 |
| @microsoft/sp-webpart-base | 1.24.0-rc.0 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @pnp/spfx-property-controls | 3.24.0 |
| @reduxjs/toolkit | ~2.13.0 |
| array-sort | 1.0.0 |
| colors-convert | ~1.4.1 |
| dom-to-image | 2.6.0 |
| get-value | 3.0.1 |
| interactjs | 1.6.2 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| msgraph-helper | 0.8.3 |
| pp365-shared-library | workspace:* |
| react | 18.3.1 |
| react-dom | 18.3.1 |
| react-error-boundary | ~4.0.10 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| shade-blend-color | ~1.0.0 |
| smoothscroll-polyfill | ~0.4.4 |
| spfx-jsom | 0.6.6 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| usehooks-ts | ~2.9.1 |

#### Development Dependencies (26)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.24.0-rc.0 |
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/dom | 10.4.2 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 16.3.3 |
| @testing-library/user-event | 14.6.7 |
| @types/dom-to-image | 2.6.4 |
| @types/get-value | 3.0.1 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 18.2.79 |
| @types/react-dom | 18.2.25 |
| @types/shade-blend-color | ~1.0.3 |
| @types/smoothscroll-polyfill | ~0.3.3 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-templates

#### Production Dependencies (3)

| Package | Version |
|---------|----------|
| @ptkdev/json-token-replace | ^1.2.2 |
| dotenv | ~16.1.3 |
| resx-json-typescript-converter | ^1.0.1 |

#### Development Dependencies (3)

| Package | Version |
|---------|----------|
| @types/lodash | ~4.14.195 |
| replace | 1.2.2 |
| xml2js | ~0.6.2 |

### pp365-spfx-tasks

#### Production Dependencies (6)

| Package | Version |
|---------|----------|
| colors | 1.4.0 |
| dotenv | 16.1.3 |
| glob | 10.2.6 |
| lodash | 4.17.21 |
| ts-morph | 25.0.1 |
| yargs | 17.7.2 |

#### Development Dependencies (2)

| Package | Version |
|---------|----------|
| @types/colors | 1.2.1 |
| @types/lodash | 4.14.195 |

### pp365-eslint-config

#### Production Dependencies (9)

| Package | Version |
|---------|----------|
| @microsoft/eslint-config-spfx | 1.24.0-rc.0 |
| @rushstack/eslint-config | 4.8.0 |
| @typescript-eslint/eslint-plugin | 8.56.1 |
| eslint | 9.37.0 |
| eslint-config-prettier | 10.1.8 |
| eslint-plugin-prettier | 5.5.6 |
| eslint-plugin-unused-imports | 4.4.1 |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-jest-config

#### Production Dependencies (5)

| Package | Version |
|---------|----------|
| @microsoft/spfx-heft-plugins | 1.24.0-rc.0 |
| @microsoft/spfx-web-build-rig | 1.24.0-rc.0 |
| @rushstack/heft | 1.3.2 |
| @testing-library/jest-dom | 6.6.3 |
| lodash | 4.17.21 |

### pp365-e2e

#### Development Dependencies (4)

| Package | Version |
|---------|----------|
| @playwright/test | 1.63.0 |
| @types/node | 22.20.3 |
| dotenv | 17.2.3 |
| typescript | ~5.8.3 |

---

## About this SBOM

This Software Bill of Materials (SBOM) is automatically generated from the package.json files in the Prosjektportalen 365 monorepo. It provides transparency about the software components and dependencies used in the project.

### How to Update

To regenerate this SBOM, run:

```bash
npm run generate-sbom
```

The SBOM is automatically updated when a new version is released.

### Standards and Compliance

This SBOM follows best practices inspired by:
- CycloneDX specification
- SPDX (Software Package Data Exchange)
- NTIA Minimum Elements for SBOM

### License Information

For license information about specific packages, please refer to the individual package repositories or use tools like `license-checker` or `npm-license-crawler`.

### Security

For security advisories and vulnerability information, please:
1. Check the GitHub Security Advisory Database
2. Run `npm audit` in each project directory
3. Use tools like Snyk or Dependabot for continuous monitoring

### Contact

For questions about this SBOM or the dependencies used in Prosjektportalen 365, please contact the project maintainers.

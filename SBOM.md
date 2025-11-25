# Software Bill of Materials (SBOM)

**Project:** Prosjektportalen 365  
**Version:** 1.12.0  
**Generated:** 2025-11-19T15:27:04.923Z  
**Format:** CycloneDX-inspired Markdown

## Overview

This SBOM documents all software dependencies used in the Prosjektportalen 365 project, including all packages in the monorepo.

**Total Dependencies:** 130  
**Production Dependencies:** 82  
**Development Dependencies:** 48  
**Projects in Monorepo:** 8

## Projects in Monorepo

### pp365 (1.12.0)

- **Production Dependencies:** 0
- **Development Dependencies:** 5

### pp365-portfolioextensions (1.12.0)

- **Production Dependencies:** 22
- **Development Dependencies:** 28

### pp365-portfoliowebparts (1.12.0)

- **Production Dependencies:** 51
- **Development Dependencies:** 32

### pp365-programwebparts (1.12.0)

- **Production Dependencies:** 39
- **Development Dependencies:** 32

### pp365-projectextensions (1.12.0)

- **Production Dependencies:** 35
- **Development Dependencies:** 31

### pp365-projectwebparts (1.12.0)

- **Production Dependencies:** 48
- **Development Dependencies:** 34

### pp365-shared-library (1.12.0)

- **Production Dependencies:** 38
- **Development Dependencies:** 22

### pp365-templates (1.12.0)

- **Production Dependencies:** 4
- **Development Dependencies:** 4

## All Dependencies

This section lists all unique dependencies across all projects.

### Production Dependencies (82)

| Package | Version(s) | Used By |
|---------|-----------|----------|
| @fluentui/react | 8.98.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @fluentui/react-components | ~9.52.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @fluentui/react-datepicker-compat | ~0.4.38 | pp365-portfoliowebparts, pp365-projectwebparts, pp365-shared-library |
| @fluentui/react-file-type-icons | ~8.11.9 | pp365-portfoliowebparts |
| @fluentui/react-hooks | 8.6.27 | pp365-portfoliowebparts |
| @fluentui/react-icons | ~2.0.240 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @fluentui/react-motion-components-preview | ~0.3.0 | pp365-portfoliowebparts |
| @fluentui/react-motion-preview | ~0.5.20 | pp365-portfoliowebparts |
| @fluentui/react-nav-preview | ~0.9.1 | pp365-portfoliowebparts |
| @microsoft/decorators | 1.17.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-projectextensions, +1 more |
| @microsoft/microsoft-graph-types | ~2.38.0 | pp365-projectextensions |
| @microsoft/sp-adaptive-card-extension-base | 1.17.4 | pp365-programwebparts, pp365-projectwebparts |
| @microsoft/sp-application-base | 1.17.4 | pp365-portfolioextensions, pp365-projectextensions, pp365-shared-library |
| @microsoft/sp-core-library | 1.17.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/sp-dialog | 1.17.4 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts |
| @microsoft/sp-http | 1.17.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| @microsoft/sp-listview-extensibility | 1.17.4 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts, +1 more |
| @microsoft/sp-lodash-subset | 1.17.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @microsoft/sp-office-ui-fabric-core | 1.17.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| @microsoft/sp-page-context | 1.17.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/sp-property-pane | 1.17.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @microsoft/sp-webpart-base | 1.17.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @pnp/core | 3.17.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/graph | 3.17.0 | pp365-projectextensions |
| @pnp/logging | 3.17.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/odata | 2.15.0 | pp365-shared-library |
| @pnp/queryable | 3.17.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/sp | 3.17.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/sp-taxonomy | 1.3.8 | pp365-portfoliowebparts, pp365-programwebparts |
| @pnp/spfx-controls-react | ~3.15.0, 3.17.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @pnp/spfx-property-controls | ~3.19.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| @ptkdev/json-token-replace | ^1.2.2 | pp365-templates |
| @reduxjs/toolkit | 1.5.0, ~1.9.5 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +2 more |
| @types/array-sort | 1.0.0 | pp365-portfoliowebparts, pp365-programwebparts |
| @types/react-calendar-timeline | 0.28.0 | pp365-shared-library |
| @uifabric/file-type-icons | 7.6.27 | pp365-projectextensions |
| @uifabric/utilities | 6.45.1 | pp365-programwebparts, pp365-projectextensions, pp365-projectwebparts |
| array-sort | 1.0.0, ~1.0.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| array-unique | 0.3.2 | pp365-portfoliowebparts |
| clean-deep | 3.0.2 | pp365-portfoliowebparts, pp365-programwebparts |
| colors-convert | ~1.4.1 | pp365-projectwebparts |
| dom-to-image | 2.6.0 | pp365-projectwebparts |
| file-saver | ^2.0.5 | pp365-shared-library |
| get-value | 3.0.1 | pp365-projectwebparts |
| interactjs | 1.6.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| jsom-ctx | 1.2.0 | pp365-portfoliowebparts, pp365-programwebparts |
| lodash | ~4.17.21 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +2 more |
| moment | 2.11.1, ~2.29.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| msgraph-helper | 0.8.3 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| object-assign | 4.1.1 | pp365-portfoliowebparts, pp365-programwebparts |
| pp365-shared-library | 1.12.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| pzl-react-reusable-components | ~0.3.1, ^0.0.14 | pp365-portfoliowebparts, pp365-programwebparts |
| pzl-spfx-components | 0.0.11 | pp365-projectwebparts |
| react | 17.0.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| react-autocomplete | 1.8.1 | pp365-projectextensions |
| react-beautiful-dnd | ~13.1.1 | pp365-portfoliowebparts |
| react-calendar-timeline | 0.28.0 | pp365-shared-library |
| react-dom | 17.0.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| react-dropzone | ~14.3.8 | pp365-portfoliowebparts |
| react-error-boundary | ~4.0.11, ~4.0.10 | pp365-portfoliowebparts, pp365-projectwebparts |
| react-fade-in | ~2.0.1 | pp365-portfoliowebparts |
| react-gauge-component | ~1.2.61 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| react-highcharts | 16.0.2 | pp365-portfoliowebparts, pp365-programwebparts |
| react-image-fade-in | 1.0.2 | pp365-projectwebparts |
| react-markdown | ^8.0.3 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts, +1 more |
| react-scroll | 1.7.11 | pp365-projectwebparts |
| react-virtualized-auto-sizer | ~1.0.24 | pp365-portfoliowebparts |
| react-window | ~1.8.10 | pp365-portfoliowebparts |
| rehype-raw | ^6.1.1 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts, +1 more |
| resx-json-typescript-converter | ^1.0.1 | pp365-templates |
| shade-blend-color | ~1.0.0 | pp365-projectwebparts, pp365-shared-library |
| smoothscroll-polyfill | ~0.4.4 | pp365-projectwebparts |
| sp-entityportal-service | 2.3.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| sp-js-provisioning | 1.3.2, ~1.2.5 | pp365-projectextensions, pp365-shared-library |
| spfx-jsom | 0.6.6 | pp365-projectextensions, pp365-projectwebparts, pp365-shared-library |
| tslib | 2.3.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| underscore | ~1.13.6 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| use-image-color | ~0.0.9 | pp365-portfoliowebparts |
| usehooks-ts | ~2.9.1 | pp365-projectextensions, pp365-projectwebparts |
| valid-filename | 3.1.0 | pp365-projectextensions |
| xlsx | ^0.16.9 | pp365-shared-library |
| xmldom | 0.6.0 | pp365-shared-library |

### Development Dependencies (48)

| Package | Version(s) | Used By |
|---------|-----------|----------|
| @microsoft/eslint-config-spfx | 1.17.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| @microsoft/eslint-plugin-spfx | 1.17.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/sp-build-web | 1.17.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/sp-module-interfaces | 1.17.4 | pp365-portfolioextensions, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @rushstack/eslint-config | 2.5.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| @types/dom-to-image | 2.6.4 | pp365-projectwebparts |
| @types/get-value | 3.0.1 | pp365-projectwebparts |
| @types/lodash | ~4.14.195 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +4 more |
| @types/object-assign | 4.0.30 | pp365-portfoliowebparts, pp365-programwebparts |
| @types/react | 17.0.45 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/react-autocomplete | ^1.8.6 | pp365-projectextensions |
| @types/react-beautiful-dnd | ~13.1.4 | pp365-portfoliowebparts |
| @types/react-dom | 17.0.17 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/react-window | ~1.8.8 | pp365-portfoliowebparts |
| @types/shade-blend-color | ~1.0.3 | pp365-projectwebparts, pp365-shared-library |
| @types/sharepoint | 2016.1.10 | pp365-portfolioextensions, pp365-projectextensions |
| @types/smoothscroll-polyfill | ~0.3.3 | pp365-projectwebparts |
| @types/underscore | ~1.11.5 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/webpack-env | 1.18.0, ~1.15.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/xmldom | ^0.1.29 | pp365-shared-library |
| @typescript-eslint/eslint-plugin | 5.40.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @typescript-eslint/parser | 5.40.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| ajv | 6.12.5, ^6.12.5 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| colors | 1.4.0 | pp365-projectextensions, pp365-projectwebparts |
| concurrently | 7.4.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| dotenv | ~16.1.3 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +4 more |
| eslint | 8.25.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| eslint-config-prettier | 8.5.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| eslint-plugin-prettier | 4.2.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| eslint-plugin-react | 7.31.10 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| eslint-plugin-react-hooks | 4.3.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| eslint-plugin-unused-imports | 2.0.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| find | 0.3.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| fs-extra | 11.1.0 | pp365 |
| glob | 7.2.0, ~11.0.2 | pp365, pp365-templates |
| gulp | 4.0.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| livereload | 0.9.3 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| pp365-portfoliowebparts | 1.12.0 | pp365-programwebparts |
| pp365-projectwebparts | 1.12.0 | pp365-portfoliowebparts, pp365-programwebparts |
| prettier | 2.7.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| pzl-spfx-tasks | 0.5.15-1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +4 more |
| replace | 1.2.2 | pp365, pp365-templates |
| typescript | 4.5.5 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| uuid | 9.0.0 | pp365 |
| webpack | 5.74.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| xml2js | ^0.6.2 | pp365-templates |
| yargs | 17.7.1, 14.2.0 | pp365, pp365-programwebparts |

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

### pp365-portfolioextensions

#### Production Dependencies (22)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.98.1 |
| @fluentui/react-components | ~9.52.0 |
| @fluentui/react-icons | ~2.0.240 |
| @microsoft/decorators | 1.17.4 |
| @microsoft/sp-application-base | 1.17.4 |
| @microsoft/sp-core-library | 1.17.4 |
| @microsoft/sp-dialog | 1.17.4 |
| @microsoft/sp-listview-extensibility | 1.17.4 |
| @microsoft/sp-page-context | 1.17.4 |
| @pnp/core | 3.17.0 |
| @pnp/logging | 3.17.0 |
| @pnp/queryable | 3.17.0 |
| @pnp/sp | 3.17.0 |
| pp365-shared-library | 1.12.0 |
| react | 17.0.1 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| sp-entityportal-service | 2.3.0 |
| tslib | 2.3.1 |
| underscore | ~1.13.6 |

#### Development Dependencies (28)

| Package | Version |
|---------|----------|
| @microsoft/eslint-config-spfx | 1.17.4 |
| @microsoft/eslint-plugin-spfx | 1.17.4 |
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 |
| @microsoft/sp-build-web | 1.17.4 |
| @microsoft/sp-module-interfaces | 1.17.4 |
| @rushstack/eslint-config | 2.5.1 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
| @types/sharepoint | 2016.1.10 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | 1.18.0 |
| @typescript-eslint/eslint-plugin | 5.40.0 |
| @typescript-eslint/parser | 5.40.0 |
| ajv | 6.12.5 |
| concurrently | 7.4.0 |
| dotenv | ~16.1.3 |
| eslint | 8.25.0 |
| eslint-config-prettier | 8.5.0 |
| eslint-plugin-prettier | 4.2.1 |
| eslint-plugin-react | 7.31.10 |
| eslint-plugin-unused-imports | 2.0.0 |
| gulp | 4.0.2 |
| livereload | 0.9.3 |
| prettier | 2.7.1 |
| pzl-spfx-tasks | 0.5.15-1 |
| typescript | 4.5.5 |
| webpack | 5.74.0 |

### pp365-portfoliowebparts

#### Production Dependencies (51)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.98.1 |
| @fluentui/react-components | ~9.52.0 |
| @fluentui/react-datepicker-compat | ~0.4.38 |
| @fluentui/react-file-type-icons | ~8.11.9 |
| @fluentui/react-hooks | 8.6.27 |
| @fluentui/react-icons | ~2.0.240 |
| @fluentui/react-motion-components-preview | ~0.3.0 |
| @fluentui/react-motion-preview | ~0.5.20 |
| @fluentui/react-nav-preview | ~0.9.1 |
| @microsoft/decorators | 1.17.4 |
| @microsoft/sp-core-library | 1.17.4 |
| @microsoft/sp-http | 1.17.4 |
| @microsoft/sp-lodash-subset | 1.17.4 |
| @microsoft/sp-office-ui-fabric-core | 1.17.4 |
| @microsoft/sp-page-context | 1.17.4 |
| @microsoft/sp-property-pane | 1.17.4 |
| @microsoft/sp-webpart-base | 1.17.4 |
| @pnp/core | 3.17.0 |
| @pnp/logging | 3.17.0 |
| @pnp/queryable | 3.17.0 |
| @pnp/sp | 3.17.0 |
| @pnp/sp-taxonomy | 1.3.8 |
| @pnp/spfx-controls-react | ~3.15.0 |
| @pnp/spfx-property-controls | ~3.19.0 |
| @reduxjs/toolkit | 1.5.0 |
| @types/array-sort | 1.0.0 |
| array-sort | 1.0.0 |
| array-unique | 0.3.2 |
| clean-deep | 3.0.2 |
| interactjs | 1.6.2 |
| jsom-ctx | 1.2.0 |
| lodash | ~4.17.21 |
| moment | 2.11.1 |
| msgraph-helper | 0.8.3 |
| object-assign | 4.1.1 |
| pp365-shared-library | 1.12.0 |
| pzl-react-reusable-components | ~0.3.1 |
| react | 17.0.1 |
| react-beautiful-dnd | ~13.1.1 |
| react-dom | 17.0.1 |
| react-dropzone | ~14.3.8 |
| react-error-boundary | ~4.0.11 |
| react-fade-in | ~2.0.1 |
| react-gauge-component | ~1.2.61 |
| react-highcharts | 16.0.2 |
| react-virtualized-auto-sizer | ~1.0.24 |
| react-window | ~1.8.10 |
| sp-entityportal-service | 2.3.0 |
| tslib | 2.3.1 |
| underscore | ~1.13.6 |
| use-image-color | ~0.0.9 |

#### Development Dependencies (32)

| Package | Version |
|---------|----------|
| @microsoft/eslint-config-spfx | 1.17.4 |
| @microsoft/eslint-plugin-spfx | 1.17.4 |
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 |
| @microsoft/sp-build-web | 1.17.4 |
| @rushstack/eslint-config | 2.5.1 |
| @types/lodash | ~4.14.195 |
| @types/object-assign | 4.0.30 |
| @types/react | 17.0.45 |
| @types/react-beautiful-dnd | ~13.1.4 |
| @types/react-dom | 17.0.17 |
| @types/react-window | ~1.8.8 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | 1.18.0 |
| @typescript-eslint/eslint-plugin | 5.40.0 |
| @typescript-eslint/parser | 5.40.0 |
| ajv | 6.12.5 |
| concurrently | 7.4.0 |
| dotenv | ~16.1.3 |
| eslint | 8.25.0 |
| eslint-config-prettier | 8.5.0 |
| eslint-plugin-prettier | 4.2.1 |
| eslint-plugin-react | 7.31.10 |
| eslint-plugin-react-hooks | 4.3.0 |
| eslint-plugin-unused-imports | 2.0.0 |
| find | 0.3.0 |
| gulp | 4.0.2 |
| livereload | 0.9.3 |
| pp365-projectwebparts | 1.12.0 |
| prettier | 2.7.1 |
| pzl-spfx-tasks | 0.5.15-1 |
| typescript | 4.5.5 |
| webpack | 5.74.0 |

### pp365-programwebparts

#### Production Dependencies (39)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.98.1 |
| @fluentui/react-components | ~9.52.0 |
| @fluentui/react-icons | ~2.0.240 |
| @microsoft/sp-adaptive-card-extension-base | 1.17.4 |
| @microsoft/sp-core-library | 1.17.4 |
| @microsoft/sp-http | 1.17.4 |
| @microsoft/sp-lodash-subset | 1.17.4 |
| @microsoft/sp-office-ui-fabric-core | 1.17.4 |
| @microsoft/sp-page-context | 1.17.4 |
| @microsoft/sp-property-pane | 1.17.4 |
| @microsoft/sp-webpart-base | 1.17.4 |
| @pnp/core | 3.17.0 |
| @pnp/logging | 3.17.0 |
| @pnp/queryable | 3.17.0 |
| @pnp/sp | 3.17.0 |
| @pnp/sp-taxonomy | 1.3.8 |
| @pnp/spfx-controls-react | ~3.15.0 |
| @pnp/spfx-property-controls | ~3.19.0 |
| @reduxjs/toolkit | 1.5.0 |
| @types/array-sort | 1.0.0 |
| @types/underscore | ~1.11.5 |
| @uifabric/utilities | 6.45.1 |
| array-sort | 1.0.0 |
| clean-deep | 3.0.2 |
| interactjs | 1.6.2 |
| jsom-ctx | 1.2.0 |
| lodash | ~4.17.21 |
| moment | 2.11.1 |
| msgraph-helper | 0.8.3 |
| object-assign | 4.1.1 |
| pp365-shared-library | 1.12.0 |
| pzl-react-reusable-components | ^0.0.14 |
| react | 17.0.1 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| react-highcharts | 16.0.2 |
| sp-entityportal-service | 2.3.0 |
| tslib | 2.3.1 |
| underscore | ~1.13.6 |

#### Development Dependencies (32)

| Package | Version |
|---------|----------|
| @microsoft/eslint-config-spfx | 1.17.4 |
| @microsoft/eslint-plugin-spfx | 1.17.4 |
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 |
| @microsoft/sp-build-web | 1.17.4 |
| @microsoft/sp-module-interfaces | 1.17.4 |
| @rushstack/eslint-config | 2.5.1 |
| @types/lodash | ~4.14.195 |
| @types/object-assign | 4.0.30 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
| @types/webpack-env | 1.18.0 |
| @typescript-eslint/eslint-plugin | 5.40.0 |
| @typescript-eslint/parser | 5.40.0 |
| ajv | 6.12.5 |
| concurrently | 7.4.0 |
| dotenv | ~16.1.3 |
| eslint | 8.25.0 |
| eslint-config-prettier | 8.5.0 |
| eslint-plugin-prettier | 4.2.1 |
| eslint-plugin-react | 7.31.10 |
| eslint-plugin-react-hooks | 4.3.0 |
| eslint-plugin-unused-imports | 2.0.0 |
| find | 0.3.0 |
| gulp | 4.0.2 |
| livereload | 0.9.3 |
| pp365-portfoliowebparts | 1.12.0 |
| pp365-projectwebparts | 1.12.0 |
| prettier | 2.7.1 |
| pzl-spfx-tasks | 0.5.15-1 |
| typescript | 4.5.5 |
| webpack | 5.74.0 |
| yargs | 14.2.0 |

### pp365-projectextensions

#### Production Dependencies (35)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.98.1 |
| @fluentui/react-components | ~9.52.0 |
| @fluentui/react-icons | ~2.0.240 |
| @microsoft/decorators | 1.17.4 |
| @microsoft/microsoft-graph-types | ~2.38.0 |
| @microsoft/sp-application-base | 1.17.4 |
| @microsoft/sp-core-library | 1.17.4 |
| @microsoft/sp-dialog | 1.17.4 |
| @microsoft/sp-listview-extensibility | 1.17.4 |
| @microsoft/sp-office-ui-fabric-core | 1.17.4 |
| @microsoft/sp-page-context | 1.17.4 |
| @pnp/core | 3.17.0 |
| @pnp/graph | 3.17.0 |
| @pnp/logging | 3.17.0 |
| @pnp/queryable | 3.17.0 |
| @pnp/sp | 3.17.0 |
| @reduxjs/toolkit | 1.5.0 |
| @uifabric/file-type-icons | 7.6.27 |
| @uifabric/utilities | 6.45.1 |
| lodash | ~4.17.21 |
| msgraph-helper | 0.8.3 |
| pp365-shared-library | 1.12.0 |
| react | 17.0.1 |
| react-autocomplete | 1.8.1 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| sp-entityportal-service | 2.3.0 |
| sp-js-provisioning | 1.3.2 |
| spfx-jsom | 0.6.6 |
| tslib | 2.3.1 |
| underscore | ~1.13.6 |
| usehooks-ts | ~2.9.1 |
| valid-filename | 3.1.0 |

#### Development Dependencies (31)

| Package | Version |
|---------|----------|
| @microsoft/eslint-config-spfx | 1.17.4 |
| @microsoft/eslint-plugin-spfx | 1.17.4 |
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 |
| @microsoft/sp-build-web | 1.17.4 |
| @rushstack/eslint-config | 2.5.1 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-autocomplete | ^1.8.6 |
| @types/react-dom | 17.0.17 |
| @types/sharepoint | 2016.1.10 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | 1.18.0 |
| @typescript-eslint/eslint-plugin | 5.40.0 |
| @typescript-eslint/parser | 5.40.0 |
| ajv | 6.12.5 |
| colors | 1.4.0 |
| concurrently | 7.4.0 |
| dotenv | ~16.1.3 |
| eslint | 8.25.0 |
| eslint-config-prettier | 8.5.0 |
| eslint-plugin-prettier | 4.2.1 |
| eslint-plugin-react | 7.31.10 |
| eslint-plugin-react-hooks | 4.3.0 |
| eslint-plugin-unused-imports | 2.0.0 |
| find | 0.3.0 |
| gulp | 4.0.2 |
| livereload | 0.9.3 |
| prettier | 2.7.1 |
| pzl-spfx-tasks | 0.5.15-1 |
| typescript | 4.5.5 |
| webpack | 5.74.0 |

### pp365-projectwebparts

#### Production Dependencies (48)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.98.1 |
| @fluentui/react-components | ~9.52.0 |
| @fluentui/react-datepicker-compat | ~0.4.38 |
| @fluentui/react-icons | ~2.0.240 |
| @microsoft/decorators | 1.17.4 |
| @microsoft/sp-adaptive-card-extension-base | 1.17.4 |
| @microsoft/sp-core-library | 1.17.4 |
| @microsoft/sp-dialog | 1.17.4 |
| @microsoft/sp-http | 1.17.4 |
| @microsoft/sp-listview-extensibility | 1.17.4 |
| @microsoft/sp-lodash-subset | 1.17.4 |
| @microsoft/sp-office-ui-fabric-core | 1.17.4 |
| @microsoft/sp-page-context | 1.17.4 |
| @microsoft/sp-property-pane | 1.17.4 |
| @microsoft/sp-webpart-base | 1.17.4 |
| @pnp/core | 3.17.0 |
| @pnp/logging | 3.17.0 |
| @pnp/queryable | 3.17.0 |
| @pnp/sp | 3.17.0 |
| @pnp/spfx-controls-react | ~3.15.0 |
| @pnp/spfx-property-controls | ~3.19.0 |
| @reduxjs/toolkit | 1.5.0 |
| @uifabric/utilities | 6.45.1 |
| array-sort | 1.0.0 |
| colors-convert | ~1.4.1 |
| dom-to-image | 2.6.0 |
| get-value | 3.0.1 |
| interactjs | 1.6.2 |
| lodash | ~4.17.21 |
| moment | 2.11.1 |
| msgraph-helper | 0.8.3 |
| pp365-shared-library | 1.12.0 |
| pzl-spfx-components | 0.0.11 |
| react | 17.0.1 |
| react-dom | 17.0.1 |
| react-error-boundary | ~4.0.10 |
| react-gauge-component | ~1.2.61 |
| react-image-fade-in | 1.0.2 |
| react-markdown | ^8.0.3 |
| react-scroll | 1.7.11 |
| rehype-raw | ^6.1.1 |
| shade-blend-color | ~1.0.0 |
| smoothscroll-polyfill | ~0.4.4 |
| sp-entityportal-service | 2.3.0 |
| spfx-jsom | 0.6.6 |
| tslib | 2.3.1 |
| underscore | ~1.13.6 |
| usehooks-ts | ~2.9.1 |

#### Development Dependencies (34)

| Package | Version |
|---------|----------|
| @microsoft/eslint-config-spfx | 1.17.4 |
| @microsoft/eslint-plugin-spfx | 1.17.4 |
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 |
| @microsoft/sp-build-web | 1.17.4 |
| @microsoft/sp-module-interfaces | 1.17.4 |
| @rushstack/eslint-config | 2.5.1 |
| @types/dom-to-image | 2.6.4 |
| @types/get-value | 3.0.1 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
| @types/shade-blend-color | ~1.0.3 |
| @types/smoothscroll-polyfill | ~0.3.3 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | 1.18.0 |
| @typescript-eslint/eslint-plugin | 5.40.0 |
| @typescript-eslint/parser | 5.40.0 |
| ajv | 6.12.5 |
| colors | 1.4.0 |
| concurrently | 7.4.0 |
| dotenv | ~16.1.3 |
| eslint | 8.25.0 |
| eslint-config-prettier | 8.5.0 |
| eslint-plugin-prettier | 4.2.1 |
| eslint-plugin-react | 7.31.10 |
| eslint-plugin-react-hooks | 4.3.0 |
| eslint-plugin-unused-imports | 2.0.0 |
| find | 0.3.0 |
| gulp | 4.0.2 |
| livereload | 0.9.3 |
| prettier | 2.7.1 |
| pzl-spfx-tasks | 0.5.15-1 |
| typescript | 4.5.5 |
| webpack | 5.74.0 |

### pp365-shared-library

#### Production Dependencies (38)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.98.1 |
| @fluentui/react-components | ~9.52.0 |
| @fluentui/react-datepicker-compat | ~0.4.38 |
| @fluentui/react-icons | ~2.0.240 |
| @microsoft/sp-application-base | 1.17.4 |
| @microsoft/sp-core-library | 1.17.4 |
| @microsoft/sp-listview-extensibility | 1.17.4 |
| @microsoft/sp-lodash-subset | 1.17.4 |
| @microsoft/sp-page-context | 1.17.4 |
| @microsoft/sp-property-pane | 1.17.4 |
| @microsoft/sp-webpart-base | 1.17.4 |
| @pnp/core | 3.17.0 |
| @pnp/logging | 3.17.0 |
| @pnp/odata | 2.15.0 |
| @pnp/queryable | 3.17.0 |
| @pnp/sp | 3.17.0 |
| @pnp/spfx-controls-react | 3.17.0 |
| @reduxjs/toolkit | ~1.9.5 |
| @types/react-calendar-timeline | 0.28.0 |
| array-sort | ~1.0.0 |
| dotenv | ~16.1.3 |
| file-saver | ^2.0.5 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| react | 17.0.1 |
| react-calendar-timeline | 0.28.0 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| shade-blend-color | ~1.0.0 |
| sp-entityportal-service | 2.3.0 |
| sp-js-provisioning | ~1.2.5 |
| spfx-jsom | 0.6.6 |
| tslib | 2.3.1 |
| underscore | ~1.13.6 |
| xlsx | ^0.16.9 |
| xmldom | 0.6.0 |

#### Development Dependencies (22)

| Package | Version |
|---------|----------|
| @microsoft/rush-stack-compiler-4.5 | 0.2.2 |
| @microsoft/sp-build-web | 1.17.4 |
| @microsoft/sp-module-interfaces | 1.17.4 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
| @types/shade-blend-color | ~1.0.3 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| @types/xmldom | ^0.1.29 |
| @typescript-eslint/eslint-plugin | 5.40.0 |
| @typescript-eslint/parser | 5.40.0 |
| ajv | ^6.12.5 |
| eslint | 8.25.0 |
| eslint-config-prettier | 8.5.0 |
| eslint-plugin-prettier | 4.2.1 |
| eslint-plugin-react | 7.31.10 |
| eslint-plugin-unused-imports | 2.0.0 |
| gulp | 4.0.2 |
| prettier | 2.7.1 |
| pzl-spfx-tasks | 0.5.15-1 |
| typescript | 4.5.5 |

### pp365-templates

#### Production Dependencies (4)

| Package | Version |
|---------|----------|
| @ptkdev/json-token-replace | ^1.2.2 |
| dotenv | ~16.1.3 |
| glob | ~11.0.2 |
| resx-json-typescript-converter | ^1.0.1 |

#### Development Dependencies (4)

| Package | Version |
|---------|----------|
| @types/lodash | ~4.14.195 |
| pzl-spfx-tasks | 0.5.15-1 |
| replace | 1.2.2 |
| xml2js | ^0.6.2 |

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

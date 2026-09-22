# Software Bill of Materials (SBOM)

**Project:** Prosjektportalen 365  
**Version:** 1.14.0  
**Generated:** 2026-09-21T11:13:28.121Z  
**Format:** CycloneDX-inspired Markdown

## Overview

This SBOM documents all software dependencies used in the Prosjektportalen 365 project, including all packages in the monorepo.

**Total Dependencies:** 114  
**Production Dependencies:** 74  
**Development Dependencies:** 40  
**Projects in Monorepo:** 8

## Projects in Monorepo

### pp365 (1.14.0)

- **Production Dependencies:** 0
- **Development Dependencies:** 5

### pp365-portfolioextensions (1.14.0)

- **Production Dependencies:** 23
- **Development Dependencies:** 23

### pp365-portfoliowebparts (1.14.0)

- **Production Dependencies:** 41
- **Development Dependencies:** 26

### pp365-programwebparts (1.14.0)

- **Production Dependencies:** 35
- **Development Dependencies:** 24

### pp365-projectextensions (1.14.0)

- **Production Dependencies:** 35
- **Development Dependencies:** 24

### pp365-projectwebparts (1.14.0)

- **Production Dependencies:** 47
- **Development Dependencies:** 26

### pp365-shared-library (1.14.0)

- **Production Dependencies:** 37
- **Development Dependencies:** 23

### pp365-templates (1.14.0)

- **Production Dependencies:** 3
- **Development Dependencies:** 3

## All Dependencies

This section lists all unique dependencies across all projects.

### Production Dependencies (74)

| Package | Version(s) | Used By |
|---------|-----------|----------|
| @fluentui/react | 8.106.4 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @fluentui/react-components | ~9.72.10 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @fluentui/react-datepicker-compat | ~0.6.22 | pp365-projectwebparts, pp365-shared-library |
| @fluentui/react-file-type-icons | ~8.16.0 | pp365-shared-library |
| @fluentui/react-hooks | 8.6.27 | pp365-portfoliowebparts |
| @fluentui/react-icons | ~2.0.317 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/decorators | 1.23.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-projectextensions, +1 more |
| @microsoft/microsoft-graph-types | 2.43.0 | pp365-projectextensions |
| @microsoft/sp-adaptive-card-extension-base | 1.23.2 | pp365-programwebparts, pp365-projectwebparts |
| @microsoft/sp-application-base | 1.23.2 | pp365-portfolioextensions, pp365-projectextensions, pp365-shared-library |
| @microsoft/sp-core-library | 1.23.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/sp-dialog | 1.23.2 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts |
| @microsoft/sp-http | 1.23.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| @microsoft/sp-listview-extensibility | 1.23.2 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts, +1 more |
| @microsoft/sp-lodash-subset | 1.23.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @microsoft/sp-office-ui-fabric-core | 1.23.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| @microsoft/sp-page-context | 1.23.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/sp-property-pane | 1.23.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @microsoft/sp-webpart-base | 1.23.2 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @pnp/core | 4.21.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/graph | 4.21.0 | pp365-projectextensions |
| @pnp/logging | 4.21.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/queryable | 4.21.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/sp | 4.21.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @pnp/spfx-controls-react | 3.25.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| @pnp/spfx-property-controls | 3.24.0 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts |
| @ptkdev/json-token-replace | ^1.2.2 | pp365-templates |
| @reduxjs/toolkit | ~1.9.5 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +2 more |
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
| jszip | 3.10.1 | pp365-portfolioextensions, pp365-projectextensions, pp365-shared-library |
| lodash | ~4.17.21 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +2 more |
| moment | ~2.29.4 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectwebparts, +1 more |
| msgraph-helper | 0.8.3 | pp365-portfoliowebparts, pp365-programwebparts, pp365-projectextensions, +1 more |
| object-assign | 4.1.1 | pp365-portfoliowebparts, pp365-programwebparts |
| pp365-shared-library | workspace:* | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +2 more |
| pzl-react-reusable-components | ~0.3.1 | pp365-portfoliowebparts, pp365-programwebparts |
| pzl-spfx-components | 0.0.11 | pp365-projectwebparts |
| react | 17.0.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| react-autocomplete | 1.8.1 | pp365-projectextensions |
| react-beautiful-dnd | ~13.1.1 | pp365-portfoliowebparts |
| react-calendar-timeline | 0.28.0 | pp365-shared-library |
| react-dom | 17.0.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| react-error-boundary | ~4.0.11, ~4.0.10 | pp365-portfoliowebparts, pp365-projectwebparts |
| react-fade-in | ~2.0.1 | pp365-portfoliowebparts |
| react-gauge-component | ~1.2.61 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| react-image-fade-in | 1.0.2 | pp365-projectwebparts |
| react-markdown | ^8.0.3 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts, +1 more |
| react-scroll | 1.7.11 | pp365-projectwebparts |
| react-virtualized-auto-sizer | ~1.0.24 | pp365-portfoliowebparts |
| react-window | ~1.8.10 | pp365-portfoliowebparts |
| rehype-raw | ^6.1.1 | pp365-portfolioextensions, pp365-projectextensions, pp365-projectwebparts, +1 more |
| resx-json-typescript-converter | ^1.0.1 | pp365-templates |
| shade-blend-color | ~1.0.0 | pp365-projectwebparts, pp365-shared-library |
| smoothscroll-polyfill | ~0.4.4 | pp365-projectwebparts |
| sp-js-provisioning | 1.4.0 | pp365-portfolioextensions, pp365-projectextensions |
| spfx-jsom | 0.6.6 | pp365-projectextensions, pp365-projectwebparts, pp365-shared-library |
| tslib | 2.8.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| underscore | ~1.13.6 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| use-image-color | ~0.0.9 | pp365-portfoliowebparts |
| usehooks-ts | ~2.9.1 | pp365-projectextensions, pp365-projectwebparts |
| valid-filename | 3.1.0 | pp365-projectextensions |
| xlsx | ^0.16.9 | pp365-shared-library |
| xmldom | 0.6.0 | pp365-shared-library |

### Development Dependencies (40)

| Package | Version(s) | Used By |
|---------|-----------|----------|
| @microsoft/sp-module-interfaces | 1.23.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/spfx-heft-plugins | 1.23.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @microsoft/spfx-web-build-rig | 1.23.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @rushstack/heft | 1.2.17 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @testing-library/dom | 8.20.1 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @testing-library/jest-dom | 6.6.3 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @testing-library/react | 12.1.5 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @testing-library/user-event | 14.6.7 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/dom-to-image | 2.6.4 | pp365-projectwebparts |
| @types/get-value | 3.0.1 | pp365-projectwebparts |
| @types/heft-jest | 1.0.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/jest | 30.0.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
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
| @types/webpack-env | ~1.15.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| @types/xmldom | ^0.1.29 | pp365-shared-library |
| css-loader | 7.1.2 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| dotenv | ~16.1.3 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +4 more |
| eslint | 9.37.0 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| fs-extra | 11.1.0 | pp365 |
| glob | 7.2.0 | pp365 |
| pp365-eslint-config | workspace:* | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| pp365-jest-config | workspace:* | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| pp365-portfoliowebparts | workspace:* | pp365-programwebparts |
| pp365-projectwebparts | workspace:* | pp365-portfoliowebparts, pp365-programwebparts |
| prettier | 3.9.7 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| replace | 1.2.2 | pp365, pp365-templates |
| typescript | ~5.8.3 | pp365-portfolioextensions, pp365-portfoliowebparts, pp365-programwebparts, +3 more |
| uuid | 9.0.0 | pp365 |
| xml2js | ~0.6.2 | pp365-templates |
| yargs | 17.7.1 | pp365 |

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

#### Production Dependencies (23)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.72.10 |
| @fluentui/react-icons | ~2.0.317 |
| @microsoft/decorators | 1.23.2 |
| @microsoft/sp-application-base | 1.23.2 |
| @microsoft/sp-core-library | 1.23.2 |
| @microsoft/sp-dialog | 1.23.2 |
| @microsoft/sp-listview-extensibility | 1.23.2 |
| @microsoft/sp-page-context | 1.23.2 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| jszip | 3.10.1 |
| pp365-shared-library | workspace:* |
| react | 17.0.1 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| sp-js-provisioning | 1.4.0 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |

#### Development Dependencies (23)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.23.2 |
| @microsoft/spfx-heft-plugins | 1.23.2 |
| @microsoft/spfx-web-build-rig | 1.23.2 |
| @rushstack/heft | 1.2.17 |
| @testing-library/dom | 8.20.1 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 12.1.5 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
| @types/sharepoint | 2016.1.10 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-portfoliowebparts

#### Production Dependencies (41)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.72.10 |
| @fluentui/react-hooks | 8.6.27 |
| @fluentui/react-icons | ~2.0.317 |
| @microsoft/decorators | 1.23.2 |
| @microsoft/sp-core-library | 1.23.2 |
| @microsoft/sp-http | 1.23.2 |
| @microsoft/sp-lodash-subset | 1.23.2 |
| @microsoft/sp-office-ui-fabric-core | 1.23.2 |
| @microsoft/sp-page-context | 1.23.2 |
| @microsoft/sp-property-pane | 1.23.2 |
| @microsoft/sp-webpart-base | 1.23.2 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @pnp/spfx-property-controls | 3.24.0 |
| @reduxjs/toolkit | ~1.9.5 |
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
| pzl-react-reusable-components | ~0.3.1 |
| react | 17.0.1 |
| react-beautiful-dnd | ~13.1.1 |
| react-dom | 17.0.1 |
| react-error-boundary | ~4.0.11 |
| react-fade-in | ~2.0.1 |
| react-gauge-component | ~1.2.61 |
| react-virtualized-auto-sizer | ~1.0.24 |
| react-window | ~1.8.10 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| use-image-color | ~0.0.9 |

#### Development Dependencies (26)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.23.2 |
| @microsoft/spfx-heft-plugins | 1.23.2 |
| @microsoft/spfx-web-build-rig | 1.23.2 |
| @rushstack/heft | 1.2.17 |
| @testing-library/dom | 8.20.1 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 12.1.5 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/object-assign | 4.0.30 |
| @types/react | 17.0.45 |
| @types/react-beautiful-dnd | ~13.1.4 |
| @types/react-dom | 17.0.17 |
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

#### Production Dependencies (35)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.72.10 |
| @fluentui/react-icons | ~2.0.317 |
| @microsoft/sp-adaptive-card-extension-base | 1.23.2 |
| @microsoft/sp-core-library | 1.23.2 |
| @microsoft/sp-http | 1.23.2 |
| @microsoft/sp-lodash-subset | 1.23.2 |
| @microsoft/sp-office-ui-fabric-core | 1.23.2 |
| @microsoft/sp-page-context | 1.23.2 |
| @microsoft/sp-property-pane | 1.23.2 |
| @microsoft/sp-webpart-base | 1.23.2 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @pnp/spfx-property-controls | 3.24.0 |
| @reduxjs/toolkit | ~1.9.5 |
| @types/array-sort | 1.0.0 |
| @types/underscore | ~1.11.5 |
| @uifabric/utilities | 6.45.1 |
| array-sort | 1.0.0 |
| clean-deep | 3.0.2 |
| interactjs | 1.6.2 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| msgraph-helper | 0.8.3 |
| object-assign | 4.1.1 |
| pp365-shared-library | workspace:* |
| pzl-react-reusable-components | ~0.3.1 |
| react | 17.0.1 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |

#### Development Dependencies (24)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.23.2 |
| @microsoft/spfx-heft-plugins | 1.23.2 |
| @microsoft/spfx-web-build-rig | 1.23.2 |
| @rushstack/heft | 1.2.17 |
| @testing-library/dom | 8.20.1 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 12.1.5 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/object-assign | 4.0.30 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
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

#### Production Dependencies (35)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.72.10 |
| @fluentui/react-icons | ~2.0.317 |
| @microsoft/decorators | 1.23.2 |
| @microsoft/microsoft-graph-types | 2.43.0 |
| @microsoft/sp-application-base | 1.23.2 |
| @microsoft/sp-core-library | 1.23.2 |
| @microsoft/sp-dialog | 1.23.2 |
| @microsoft/sp-listview-extensibility | 1.23.2 |
| @microsoft/sp-office-ui-fabric-core | 1.23.2 |
| @microsoft/sp-page-context | 1.23.2 |
| @pnp/core | 4.21.0 |
| @pnp/graph | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @reduxjs/toolkit | ~1.9.5 |
| @uifabric/file-type-icons | 7.6.27 |
| @uifabric/utilities | 6.45.1 |
| jszip | 3.10.1 |
| lodash | ~4.17.21 |
| msgraph-helper | 0.8.3 |
| pp365-shared-library | workspace:* |
| react | 17.0.1 |
| react-autocomplete | 1.8.1 |
| react-dom | 17.0.1 |
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
| @microsoft/sp-module-interfaces | 1.23.2 |
| @microsoft/spfx-heft-plugins | 1.23.2 |
| @microsoft/spfx-web-build-rig | 1.23.2 |
| @rushstack/heft | 1.2.17 |
| @testing-library/dom | 8.20.1 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 12.1.5 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-autocomplete | ^1.8.6 |
| @types/react-dom | 17.0.17 |
| @types/sharepoint | 2016.1.10 |
| @types/underscore | ~1.11.5 |
| @types/webpack-env | ~1.15.2 |
| css-loader | 7.1.2 |
| dotenv | ~16.1.3 |
| eslint | 9.37.0 |
| pp365-eslint-config | workspace:* |
| pp365-jest-config | workspace:* |
| prettier | 3.9.7 |
| typescript | ~5.8.3 |

### pp365-projectwebparts

#### Production Dependencies (47)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.72.10 |
| @fluentui/react-datepicker-compat | ~0.6.22 |
| @fluentui/react-icons | ~2.0.317 |
| @microsoft/decorators | 1.23.2 |
| @microsoft/sp-adaptive-card-extension-base | 1.23.2 |
| @microsoft/sp-core-library | 1.23.2 |
| @microsoft/sp-dialog | 1.23.2 |
| @microsoft/sp-http | 1.23.2 |
| @microsoft/sp-listview-extensibility | 1.23.2 |
| @microsoft/sp-lodash-subset | 1.23.2 |
| @microsoft/sp-office-ui-fabric-core | 1.23.2 |
| @microsoft/sp-page-context | 1.23.2 |
| @microsoft/sp-property-pane | 1.23.2 |
| @microsoft/sp-webpart-base | 1.23.2 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @pnp/spfx-property-controls | 3.24.0 |
| @reduxjs/toolkit | ~1.9.5 |
| @uifabric/utilities | 6.45.1 |
| array-sort | 1.0.0 |
| colors-convert | ~1.4.1 |
| dom-to-image | 2.6.0 |
| get-value | 3.0.1 |
| interactjs | 1.6.2 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| msgraph-helper | 0.8.3 |
| pp365-shared-library | workspace:* |
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
| spfx-jsom | 0.6.6 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| usehooks-ts | ~2.9.1 |

#### Development Dependencies (26)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.23.2 |
| @microsoft/spfx-heft-plugins | 1.23.2 |
| @microsoft/spfx-web-build-rig | 1.23.2 |
| @rushstack/heft | 1.2.17 |
| @testing-library/dom | 8.20.1 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 12.1.5 |
| @testing-library/user-event | 14.6.7 |
| @types/dom-to-image | 2.6.4 |
| @types/get-value | 3.0.1 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
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

### pp365-shared-library

#### Production Dependencies (37)

| Package | Version |
|---------|----------|
| @fluentui/react | 8.106.4 |
| @fluentui/react-components | ~9.72.10 |
| @fluentui/react-datepicker-compat | ~0.6.22 |
| @fluentui/react-file-type-icons | ~8.16.0 |
| @fluentui/react-icons | ~2.0.317 |
| @microsoft/sp-application-base | 1.23.2 |
| @microsoft/sp-core-library | 1.23.2 |
| @microsoft/sp-listview-extensibility | 1.23.2 |
| @microsoft/sp-lodash-subset | 1.23.2 |
| @microsoft/sp-page-context | 1.23.2 |
| @microsoft/sp-property-pane | 1.23.2 |
| @microsoft/sp-webpart-base | 1.23.2 |
| @pnp/core | 4.21.0 |
| @pnp/logging | 4.21.0 |
| @pnp/queryable | 4.21.0 |
| @pnp/sp | 4.21.0 |
| @pnp/spfx-controls-react | 3.25.0 |
| @reduxjs/toolkit | ~1.9.5 |
| @types/react-calendar-timeline | 0.28.0 |
| array-sort | ~1.0.0 |
| dotenv | ~16.1.3 |
| file-saver | ^2.0.5 |
| jszip | 3.10.1 |
| lodash | ~4.17.21 |
| moment | ~2.29.4 |
| react | 17.0.1 |
| react-calendar-timeline | 0.28.0 |
| react-dom | 17.0.1 |
| react-gauge-component | ~1.2.61 |
| react-markdown | ^8.0.3 |
| rehype-raw | ^6.1.1 |
| shade-blend-color | ~1.0.0 |
| spfx-jsom | 0.6.6 |
| tslib | 2.8.1 |
| underscore | ~1.13.6 |
| xlsx | ^0.16.9 |
| xmldom | 0.6.0 |

#### Development Dependencies (23)

| Package | Version |
|---------|----------|
| @microsoft/sp-module-interfaces | 1.23.2 |
| @microsoft/spfx-heft-plugins | 1.23.2 |
| @microsoft/spfx-web-build-rig | 1.23.2 |
| @rushstack/heft | 1.2.17 |
| @testing-library/dom | 8.20.1 |
| @testing-library/jest-dom | 6.6.3 |
| @testing-library/react | 12.1.5 |
| @testing-library/user-event | 14.6.7 |
| @types/heft-jest | 1.0.2 |
| @types/jest | 30.0.0 |
| @types/lodash | ~4.14.195 |
| @types/react | 17.0.45 |
| @types/react-dom | 17.0.17 |
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

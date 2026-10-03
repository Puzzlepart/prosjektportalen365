# pp365-jest-config

Shared Jest configuration for the SPFx solutions, consumed through each solution's
`config/jest.config.json` (`"extends": "pp365-jest-config/jest-shared.config.json"`).

Heft runs Jest as part of every build (`heft test`), against the CommonJS output in
`lib-commonjs`. This package adds what SPFx component tests need on top of the rig defaults:
jest-dom matchers, jsdom polyfills for Fluent UI, resolution of SPFx localized string modules,
and an AMD to CommonJS transform for those string bundles.

See `.development-guide/spfx/testing.md` for the testing regime and how to write tests.

`lib/tagPickerStandIn.js` is for tests that type into Fluent UI v9's `TagPicker`, which loops the
Jest worker on React 17 the moment it opens (it works in the browser). Above a test's imports,
`jest.mock('@fluentui/react-components', () => jest.requireActual('pp365-jest-config/lib/tagPickerStandIn').withTagPickerStandIn())`
replaces the picker's parts with plain elements that keep its contract; see the file for what it
keeps.

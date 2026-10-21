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

`lib/axe.js` runs axe-core over a rendered component through jest-axe, with the WCAG 2.1 A and
AA and WCAG 2.2 AA rules (#1788): `import { axeComponent } from 'pp365-jest-config/lib/axe'`,
then `expect(await axeComponent(container)).toHaveNoViolations()`. Colour contrast is off, since
jsdom has no layout; the browser suite measures it. Requiring the module registers the matcher,
so only the tests that use it load axe-core.

`lib/announce.js` reads what Fluent's `AriaLiveAnnouncer` said, the newest message in each live
region: `import { announced } from 'pp365-jest-config/lib/announce'`, then
`await waitFor(() => expect(announced()).toContain(strings.Saved))`. jsdom keeps the announcer's
`innerText` as a property and ignores its clearing, so the newest message is the last span.

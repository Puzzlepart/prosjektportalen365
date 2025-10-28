# Patches

This directory contains patches for npm packages that are applied automatically after `npm install`.

## @pnp/spfx-controls-react@3.17.0

**Issue:** The Norwegian locale file (`nb-no.js`) in `@pnp/spfx-controls-react@3.17.0` was missing the `HoverReactionBarSearchEmojiPlaceholder` property that exists in other locale files like `en-us.js`. This missing property caused the entire locale object to fail loading in certain browsers, resulting in missing button text for the ModernTaxonomyPicker component.

**Symptoms:**
- Empty/missing text on "Bruk" (Apply) and "Avbryt" (Cancel) buttons in the term selector
- Issue appeared randomly for some users depending on browser JavaScript engine behavior
- Affected the Project Information (Prosjektinformasjon) fields that use taxonomy pickers

**Fix:** Added the missing `HoverReactionBarSearchEmojiPlaceholder` property to the Norwegian locale file with the translation "Søk emoji".

**Related Issue:** #[issue-number]

### How patches are applied

Patches are automatically applied after `npm install` via the `postinstall` script defined in `package.json`. The patches are managed by [patch-package](https://github.com/ds300/patch-package).

### Updating patches

If you need to modify a patch:

1. Make changes to the files in `node_modules`
2. Run `npx patch-package [package-name]` to update the patch file
3. Commit the updated patch file

// ESLint 9 flat config for this SPFx solution.
// Discovered by @rushstack/heft-lint-plugin during the `build` phase's `lint`
// task, and by the `npm run lint` CLI script.
//
// To temporarily disable linting for this solution (escape hatch for the first
// migration build), rename this file to eslint.config.js.disabled - the lint
// task then logs "No ESLint config file found" and does nothing.

'use strict'

module.exports = require('pp365-eslint-config')(__dirname)

// Copyright (c) Prosjektportalen 365. Shared ESLint 9 flat config for all SPFx solutions.
//
// Usage, from each solution's eslint.config.js:
//
//   module.exports = require('pp365-eslint-config')(__dirname)
//
// Layering (later entries win):
//   1. @microsoft/eslint-config-spfx flat React profile
//        = @rushstack/eslint-config flat/profile/web-app  (flat/profile/_common.js)
//        + SPFx overrides                                 (flat-profiles/default.js)
//        + @rushstack/eslint-config flat/mixins/react      (flat/mixins/react.js)
//   2. eslint-plugin-prettier/recommended (eslint-config-prettier "offs" + prettier/prettier)
//   3. unused-imports plugin registration
//   4. The rules translated from the old SharePointFramework/.eslintrc.yaml
//
// NOTE ON PARSER OPTIONS: under `heft build`, @rushstack/heft-lint-plugin REPLACES
// languageOptions.parserOptions wholesale with the TypeScript program it already built
// (Eslint.js:146-165), so `project` and `tsconfigRootDir` are ignored there. They only
// matter for the standalone `npm run lint` CLI path, which is why the factory takes a dir.

'use strict'

const spfxFlatReact = require('@microsoft/eslint-config-spfx/lib/flat-profiles/react')
const prettierRecommended = require('eslint-plugin-prettier/recommended')
const unusedImports = require('eslint-plugin-unused-imports')

/** File patterns every rule block is scoped to, matching the upstream SPFx profile. */
const TS_FILES = ['**/*.ts', '**/*.tsx']

/**
 * @param {string} solutionDir Absolute path to the solution root (pass __dirname).
 * @returns {import('eslint').Linter.Config[]}
 */
module.exports = function createProsjektportalenEslintConfig(solutionDir) {
  if (!solutionDir) {
    throw new Error("pp365-eslint-config: call it as require('pp365-eslint-config')(__dirname)")
  }

  return [
    // ------------------------------------------------------------------
    // 0. Global ignores. Heft only ever feeds files from the TypeScript
    //    program, so these mainly protect the standalone `eslint ./src` run.
    //    (**/*.d.ts and **/*.scss.ts are already globally ignored upstream:
    //    flat/profile/_common.js:190 and flat-profiles/default.js:19-26.)
    // ------------------------------------------------------------------
    {
      ignores: [
        'lib/**',
        'lib-commonjs/**',
        'lib-esm/**',
        'lib-dts/**',
        'dist/**',
        'temp/**',
        'release/**',
        'sharepoint/**',
        'jest-output/**',
        'node_modules/**',
        // Localization bundles are hand-written CommonJS resource files, never linted.
        // (Carried over from the per-solution .eslintignore files, which ESLint 9 no longer reads.)
        'src/loc/**/*.js'
      ]
    },

    // ------------------------------------------------------------------
    // 1. SPFx flat React profile (already registers @typescript-eslint,
    //    @rushstack, @rushstack/security, promise, @microsoft/spfx, react
    //    and react-hooks, and sets languageOptions.parser).
    // ------------------------------------------------------------------
    ...spfxFlatReact,

    // ------------------------------------------------------------------
    // 1b. tsconfigRootDir for standalone CLI runs only (no-op under Heft).
    // ------------------------------------------------------------------
    {
      files: TS_FILES,
      languageOptions: {
        parserOptions: {
          tsconfigRootDir: solutionDir
        }
      }
    },

    // ------------------------------------------------------------------
    // 2. Replaces `extends: ["prettier"]` from the old .eslintrc.yaml.
    //    This object is NOT an array - it must not be spread.
    //    It turns off all 358 formatting rules that fight Prettier and
    //    registers the `prettier` plugin (severity is set in block 4).
    // ------------------------------------------------------------------
    { ...prettierRecommended, files: TS_FILES },

    // ------------------------------------------------------------------
    // 3. unused-imports. Namespace must be exactly 'unused-imports'.
    // ------------------------------------------------------------------
    {
      files: TS_FILES,
      plugins: {
        'unused-imports': unusedImports
      }
    },

    // ------------------------------------------------------------------
    // 4. Prosjektportalen 365 house rules, translated 1:1 from the old
    //    SharePointFramework/.eslintrc.yaml.
    // ------------------------------------------------------------------
    {
      files: TS_FILES,
      rules: {
        // --- rules the v9 migration relaxed, back to error (2026-09-30); `no-void`, `eqeqeq` and
        // `react/jsx-key` promoted to error at the phase 4 close-out (2026-10-04), once clean ---

        // `dot-notation` is inherited from the rushstack profile and is AUTOFIXABLE, which makes it
        // actively dangerous here: `eslint --fix` rewrites `result['GtSiteIdOWSTEXT']` into
        // `result.GtSiteIdOWSTEXT`, and PnP result types (ISearchResult, ISiteGroupInfo, ...) do not
        // declare those SharePoint-specific properties, so the "fix" breaks compilation. Bracket
        // access on loosely-typed SharePoint payloads is deliberate in this codebase. The pre-migration
        // .eslintrc.yaml never enabled this rule.
        'dot-notation': 'off',

        // A promise left floating must say so: `void` marks a deliberate fire-and-forget (the
        // `no-void` override below allows it as a statement), anything else is awaited or caught.
        '@typescript-eslint/no-floating-promises': 'error',
        'no-void': ['error', { allowAsStatement: true }],

        // Function declarations are hoisted and a class used inside a method runs after the class
        // exists, so only variables are checked - the `const` below the callback that uses it,
        // which is what the rule is for.
        '@typescript-eslint/no-use-before-define': [
          'error',
          {
            functions: false,
            classes: false,
            variables: true,
            typedefs: true,
            ignoreTypeReferences: true
          }
        ],

        // The property checks are the rule's false-positive generator on the project setup tasks,
        // which write each step's result into a shared params object between awaits by design.
        'require-atomic-updates': ['error', { allowProperties: true }],

        // Formatting is part of the build, as `npm run prettier` always was of the workflow.
        'prettier/prettier': 'error',

        // --- verbatim from .eslintrc.yaml ----------------------------

        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-inferrable-types': 'off',
        'react/prop-types': 'off',
        'react/display-name': 'off',
        'no-compare-neg-zero': 'warn',
        'no-console': 'warn',
        'default-case': 'off',
        // `== null` is the idiom for "null or undefined" and stays allowed; any other loose
        // comparison is an error.
        eqeqeq: ['error', 'always', { null: 'ignore' }],
        'max-classes-per-file': 'off',
        yoda: 'error',
        'require-await': 'warn',
        'unused-imports/no-unused-imports': 'error',
        // A list without keys re-renders wrongly; the codebase has none left.
        'react/jsx-key': 'error',

        // Dropped on purpose (see the repo migration notes):
        //   @typescript-eslint/interface-name-prefix  - removed in typescript-eslint v5+
        //   @typescript-eslint/member-delimiter-style - moved to @stylistic, gone in v8
        //   no-inferrable-types                       - never a core ESLint rule
        //   jsx-quotes / quotes / semi                - already set to off by
        //                                               eslint-config-prettier, and
        //                                               enforced by prettier's
        //                                               jsxSingleQuote / singleQuote / semi
        //   env: browser                              - no-undef is never enabled by the
        //                                               profile, so no globals are needed
        //   settings.react.version: detect            - already set by
        //                                               @rushstack/eslint-config
        //                                               flat/mixins/react.js:17-23

        'no-restricted-syntax': [
          'error',
          {
            selector:
              "ImportDeclaration[source.value='@fluentui/react-icons'] > ImportNamespaceSpecifier",
            message:
              "Never `import * as ... from '@fluentui/react-icons'` (bloats every bundle). Use named imports via the shared-library icon catalog (SharePointFramework/shared-library/src/icons/iconCatalog.ts)."
          }
        ],

        'no-restricted-imports': [
          'error',
          {
            paths: [
              // Neither PnP package declares itself free of side effects, so webpack cannot drop the
              // controls a bundle does not use: an import from the package's root brings every
              // control, and their Fluent v8 list, picker and callout code, into the bundle.
              {
                name: '@pnp/spfx-controls-react',
                message:
                  "Import the control from its own entry point, e.g. '@pnp/spfx-controls-react/lib/ModernTaxonomyPicker': the package root bundles every control."
              },
              {
                name: '@pnp/spfx-property-controls',
                message:
                  "Import the property field from its own entry point, e.g. '@pnp/spfx-property-controls/lib/PropertyFieldMultiSelect': the package root bundles every field."
              },
              {
                name: 'pp365-shared-library/lib/icons/iconCatalog',
                message:
                  "Do not deep-import the icon catalog. Use getFluentIcons/resolveFluentIcon from 'pp365-shared-library'."
              }
            ]
          }
        ]
      }
    }
  ]
}

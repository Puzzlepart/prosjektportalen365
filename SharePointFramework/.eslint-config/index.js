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
        // --- migration relaxations -----------------------------------

        // Decision C: downgraded for the migration. The SPFx profile sets
        // this to a bare 'error' (flat-profiles/default.js:32), so a bare
        // 'warn' is the exact severity-only downgrade. Under Heft, ESLint
        // warnings never fail the build; errors always do.
        '@typescript-eslint/no-floating-promises': 'warn',

        // Two more severity-only relaxations for the migration. Both are 'error' in the
        // rushstack profile, neither was enforced before, and neither can be measured
        // without running ESLint over the tree:
        //  - no-use-before-define trips the common SPFx/React idiom of declaring IProps
        //    or a styled constant below the component that references it (typedefs:true,
        //    variables:true).
        //  - require-atomic-updates is the profile's best-known false-positive generator
        //    on await-heavy code.
        // Tighten both to 'error' once the tree is clean.
        '@typescript-eslint/no-use-before-define': 'warn',
        'require-atomic-updates': 'warn',

        // The old .eslintrc.yaml never enabled prettier/prettier at all -
        // formatting was enforced only by the separate `npm run prettier`.
        // eslint-plugin-prettier/recommended turns it on at 'error', which
        // would newly break `heft build --production` (where --fix is
        // force-disabled). Keep it visible but non-blocking; flip to
        // 'error' once the tree is clean.
        'prettier/prettier': 'warn',

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
        eqeqeq: 'warn',
        'max-classes-per-file': 'off',
        yoda: 'error',
        'require-await': 'warn',
        'unused-imports/no-unused-imports': 'error',

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

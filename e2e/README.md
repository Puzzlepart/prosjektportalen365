# pp365-e2e

Playwright tests that run against the test tenant after the test channel has been deployed
(`.github/workflows/ci-channel-test.yml`, job "End-to-end smoke (test channel)"). The smoke tests
(`tests/smoke`) open the hub, a project and a program, wait for the SPFx canvas, check that the
expected web parts mount, and fail on browser errors that mean a bundle is broken. They only read,
apart from `document-template-dialog.spec.ts`, which creates a folder when the project's library has
none and deletes it again. The flows (`tests/flows`) follow user journeys; four of them write to
the tenant and clean up after themselves. Which test covers which component:
`.development-guide/spfx/testoversikt.md`.

Before the tests, two setup steps run: `tests/auth.setup.ts` signs in, and
`tests/deployment.setup.ts` waits, for at most ten minutes, until the hub and the project home load
every bundle from the app catalog. Right after an upgrade SharePoint can still hand a page a
component's previous manifest, whose bundle the upgrade has removed; without the wait, the first
tests after a deployment fail on "Could not load ... in require".

Local run:

```bash
cp .env.example .env   # fill in the values
npx playwright install chromium
npm test               # or: npm run test:ui
```

The Playwright CLI skill in `.claude/skills/playwright-cli` documents how to plan, generate and heal
tests interactively. See `.development-guide/spfx/testing.md` for the testing regime.

## Reports

In CI the job publishes the HTML report, traces included, to the test report site: a private GitHub
Pages site that only those with read access to its repository (every Puzzlepart member) can open
(`.tasks/publish-test-report.js`; setup in `.development-guide/ci/kontinuerlig-integrasjon.md`
«Testrapportsiden»). The link is under «End-to-end report» in the job summary on the run's page, and
the site keeps 7 days of runs. The artifact `playwright-report-test-channel` holds the same report
without the traces, since anyone signed in to GitHub can download this public repository's artifacts.

A report keeps every step of every test, passed ones too, and a trace every action's arguments:

- Never type a secret with `fill()`, `type()`, `pressSequentially()` or `insertText()`: the step's
  title holds the value (`Fill "<value>"`), and until 2026-10-14 every CI report held the test
  user's password. Use `enterSecret` in `tests/auth.setup.ts`: `fill('')`, then Chromium's
  `Input.insertText`, a protocol call that is no step of the report.
- A failed test's `error-context.md` holds an ARIA snapshot of the page with every input's value,
  password fields too: an `afterEach` in `tests/auth.setup.ts` blanks them before it is taken, and
  the public artifact leaves the sign-in's results (`test-results/auth.setup*`) out.
- The `setup` project, the sign-in, is not traced in CI (`trace: 'off'` in `playwright.config.ts`;
  locally `--trace on` and UI mode override it).

## Checking a fix on the tenant before it is deployed

`tests/local/*` load a solution's *local* bundle onto the real page through SPFx's debug manifests
and make the same assertions as their `tests/smoke/*` counterparts. They are ignored unless asked
for, since they need a dev server:

```bash
cd SharePointFramework/ProjectWebParts && npx heft start --nobrowser   # serves https://localhost:4321
cd e2e && npx playwright test tests/local/timeline-list.spec.ts          # with E2E_LOCAL_BUNDLE=1 in e2e/.env
```

The browser is launched with the self-signed dev certificate accepted and Chromium's local-network
check disabled, which is what makes a public SharePoint page able to load scripts from localhost.

The dev build must carry the component ids of the channel the page uses (the test tenant's hub
and program pages are on the test channel), or the page never asks the dev server for a bundle:
`npm run watch` applies them through `pre-watch`, and a bare `npx heft start` needs
`node ../.tasks/modifySolutionFiles.js --force` first (and `--revert` after), with `SERVE_CHANNEL=test`
in the solution's `.env`. Setting the variables in the `.env` files works in every shell; a
`VAR=value command` prefix works only in bash and zsh.

## Measuring the footer's placeholders on list pages

On some loads of a list page SharePoint never defines its placeholders, and the footer, an
application customizer, has nowhere to render (SharePoint/sp-dev-docs#11070).
`tests/diagnostics/placeholders.spec.ts` measures how often, and keeps the logs Microsoft asked
for. It loads a custom list on the hub and the project's document library 20 times each
(`PLACEHOLDER_LOADS`), in one browser context (a warm cache) and in a fresh context for each load
(a cold cache), with the footer's placeholder trace on. It asserts nothing, takes half an hour or
more, and never runs in CI:

```bash
cd e2e && npx playwright test tests/diagnostics   # with E2E_PLACEHOLDER_DIAGNOSTICS=1 in e2e/.env
```

The results go to `e2e/placeholder-diagnostics/<time>/`, which git ignores. `summary.md` holds the
counts, and the trace of each load where the footer did not show. Next to it are each page and
cache's loads as JSON. `logs/` holds the console of those loads, and of the first load with the
footer for comparison. The tenant's name, the sites' paths, e-mail addresses and tokens are
replaced; read the files before you share them all the same.

The trace is in the footer itself (PortfolioExtensions, `src/extensions/footer/placeholderTrace.ts`),
so it needs a deployed build that has it. In a browser of your own, run
`localStorage.setItem('pp365.debug.placeholders', '1')` in DevTools on the site, open the list in
new tabs, and read the console lines that start with `[pp365 placeholders]`.
`localStorage.removeItem('pp365.debug.placeholders')` turns it off again.

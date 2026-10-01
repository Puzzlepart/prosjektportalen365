# pp365-e2e

Playwright smoke tests that run against the test tenant after the test channel has been deployed
(`.github/workflows/ci-channel-test.yml`, job "End-to-end smoke (test channel)"). They are read
only: they open the hub and one project, wait for the SPFx canvas, check that the expected web parts
mount, and fail on browser errors that mean a bundle is broken.

Local run:

```bash
cp .env.example .env   # fill in the values
npx playwright install chromium
npm test               # or: npm run test:ui
```

The Playwright CLI skill in `.claude/skills/playwright-cli` documents how to plan, generate and heal
tests interactively. See `.development-guide/spfx/testing.md` for the testing regime.

## Checking a fix on the tenant before it is deployed

`tests/local/*` load a solution's *local* bundle onto the real page through SPFx's debug manifests
and make the same assertions as their `tests/smoke/*` counterparts. They are ignored unless asked
for, since they need a dev server:

```bash
cd SharePointFramework/ProjectWebParts && npx heft start --nobrowser   # serves https://localhost:4321
cd e2e && E2E_LOCAL_BUNDLE=1 npx playwright test tests/local/timeline-list.spec.ts
```

The browser is launched with the self-signed dev certificate accepted and Chromium's local-network
check disabled, which is what makes a public SharePoint page able to load scripts from localhost.

The dev build must carry the component ids of the channel the page uses (the test tenant's hub
and program pages are on the test channel), or the page never asks the dev server for a bundle:
`npm run watch` applies them through `pre-watch`, and a bare `npx heft start` needs
`SERVE_CHANNEL=test node ../.tasks/modifySolutionFiles.js --force` first (and `--revert` after).

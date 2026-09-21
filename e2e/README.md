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

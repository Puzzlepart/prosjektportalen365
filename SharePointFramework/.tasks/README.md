# SPFx-oppgaver

Ett felles sted for `node`-oppgaver som brukes av våre SPFx-løsninger.

## createEnvironmentFile.js

Oppretter en `.env`-fil i gjeldende mappe (`process.cwd()`) basert på den delte `.env.template`-malen. Leser `config/config.json` for å finne tilgjengelige bundlenavn og legger dem til som kommentarer i `.env`-filen. Dette kjøres som en del av `pre-watch.js`-oppgaven.

## createServeConfig.js

Oppretter en `config/serve.json`-fil fra malen `config/serve.sample.json` for gjeldende mappe.

## modifySolutionFiles.js

Modifiserer `config/package-solution.json` og alle `manifest.json`-filer for en løsning slik at de samsvarer med ID-er fra den valgte kanalen.

## post-watch.js

Kjører `modifySolutionFiles.js` og `setBundleConfig.js`.

## pre-watch.js

Kjører `createEnvironmentFile.js` og `modifySolutionFiles.js`. Genererer også en `config/.generated-solution-config.json` hvis kanalets miljøvariabel `SERVE_CHANNEL` er satt og ikke er **main**.

## setBundleConfig.js

Oppdaterer `config/config.json` for løsningen basert på miljøvariabelen `SERVE_BUNDLE_REGEX`.

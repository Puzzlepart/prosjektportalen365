## Testregime

Dette kapittelet beskriver hvordan Prosjektportalen testes automatisk, hva som kjører når, hvordan du skriver tester, og hva vi gjør når en test feiler. Målet er at den manuelle smoke-testen før hver utgivelse over tid erstattes av tester som kjører i hvert bygg og etter hver utrulling til testkanalen.

### Lagene

| Lag | Hva testes | Verktøy | Kjører når | Trenger tenant? |
|---|---|---|---|---|
| Enhetstester | Ren logikk: modeller, hjelpefunksjoner, datamappere, reducere, tjenesteoperasjoner | Jest via Heft (`heft test`) | I hvert bygg av løsningen, lokalt og i CI | Nei |
| Komponenttester | React-komponenter rendret i jsdom: hva vises, hva skjer ved klikk | Jest + React Testing Library | I hvert bygg av løsningen | Nei |
| Pakkebevis | At hvert bygg faktisk produserer sin `.sppkg` og at det delte biblioteket er pakket inn (ikke en kjøretidsavhengighet) | `Install/Build-Release.ps1` | I hvert utgivelsesbygg | Nei |
| Ende-til-ende (E2E) | Hub og prosjektområde i testtenanten: sidene laster, webdelene monteres, ingen ødelagte bundler | Playwright (`e2e/`) | Etter utrulling til testkanalen i `ci-channel-test.yml` | Ja |
| Manuell smoke-test | Skriveflyter som ennå ikke er automatisert (prosjektoppsett, publisering av statusrapport, idéflyt) | Issue-maler, se «Smoke test-prosessen» | Før utgivelse, til E2E dekker flytene | Ja |

Kontraktstester for dataadapterne (PnPjs-kall mot innspilte svar) er planlagt, men ikke satt opp: PnPjs 4 er ESM-only og Heft kjører Jest på CommonJS-utdata, så `@pnp/*` kan ikke lastes i Jest i dag (se «Delt oppsett»).

### Hva skjer i et bygg

`npm run build` i en løsning kjører `heft test --clean --production && heft package-solution --production`. Heft kompilerer `src/**/*.ts(x)` til `lib-commonjs/`, kjører alle `*.test.ts`/`*.test.tsx` der, og stopper bygget hvis en test feiler. Det samme skjer i `rush build`/`rush rebuild` og dermed i alle CI-arbeidsflytene. Resultatet ligger i `jest-output/JUnit.xml` og dekningsrapporten i `jest-output/coverage/` (begge er ignorert av git).

Dekningsgrenser er med hensikt ikke slått på ennå. Tester innføres inkrementelt, med prioritet på kode som endres (Fluent UI v9-konverteringen) og kode som feiler stille (dataadaptere og provisjonering).

### Delt oppsett: `pp365-jest-config`

Alle løsningene peker på det samme Jest-oppsettet gjennom `config/jest.config.json` (`"extends": "pp365-jest-config/jest-shared.config.json"`). Pakken ligger i `SharePointFramework/.jest-config` og er et vanlig Rush-prosjekt, på samme måte som `pp365-eslint-config`. Den bygger på SPFx-riggens Jest-konfigurasjon (jsdom, `lib-commonjs`, dekning, JUnit) og legger til:

| Fil | Gjør |
|---|---|
| `lib/setup.js` | Registrerer `@testing-library/jest-dom`-matchere og polyfiller det Fluent UI trenger som jsdom mangler (`matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollTo`). |
| `lib/resolver.js` | Løser SPFx-strengmoduler (`SharedLibraryStrings`, `SharedResources`, `<Løsning>Strings`) slik SPFx gjør det: via `localizedResources` i `config/config.json`, til `nb-no`-bunten. Sett `PP365_TEST_LOCALE=en-us` for å teste engelsk. |
| `lib/amdTransform.js` | Gjør AMD-strengbuntene (`define([], function () { ... })`) om til CommonJS. En syntaksfeil i en `.js`-strengfil (for eksempel `,,`) feiler dermed testkjøringen i stedet for å krasje i nettleseren. |
| `lib/spfxStub.js`, `lib/reactMarkdownStub.js`, `lib/noopPluginStub.js` | Erstatter `@microsoft/sp-*` (krever Microsoft-interne moduler i Node), `react-markdown` og `rehype-*`/`remark-*` (ESM-only). `@microsoft/sp-lodash-subset` peker på ekte `lodash`. `window.__themeState__` får standardpaletten SharePoint ellers leverer. |
| `lib/pnpStub.js` | Erstatter alle `@pnp/*`-moduler. Import og kjeding (`spfi().using(...)`) går fint; et `await` på et PnP-kall feiler med en tydelig melding om at adapteren må mockes. |
| `moduleNameMapper` | Peker `pp365-shared-library`, `pp365-projectwebparts` og `pp365-portfoliowebparts` til `lib-commonjs/` (ESM i `lib/` kan ikke lastes av Jest). |

Konsekvens: en løsnings tester krever at det delte biblioteket er bygget først (`rush rebuild -o pp365-shared-library`), akkurat som selve bygget.

### Skrive enhetstester

- Legg testen ved siden av koden: `src/util/foo.ts` får `src/util/foo.test.ts`.
- Ikke importer `@pnp/*` i en test og ikke test kode som kaller PnPjs direkte. Test logikken mot strukturelle stand-ins i stedet, som `shared-library/src/services/EntityPortalService/pnpShapes.ts` og `operations.test.ts` viser, eller mock adapteren med `jest.mock`.
- Gode eksempler: `shared-library/src/taxonomy/*.test.ts` (paging, stier, etiketter), `shared-library/src/data/getAllItems.test.ts` (asynkron iterasjon med en falsk `IItems`).

### Skrive komponenttester

Komponenttester rendrer komponenten med React Testing Library og sjekker det brukeren ser. Data kommer alltid fra en hook eller en adapter, og den erstattes med `jest.mock`:

```tsx
import * as React from 'react'
import { render, screen } from '@testing-library/react'
import { Header } from './Header'

jest.mock('./useHeader', () => ({
  useHeader: jest.fn(() => ({ title: 'Prosjektstatus', description: 'Publisert' }))
}))

it('viser tittel og beskrivelse fra hooken', () => {
  render(<Header />)
  expect(screen.getByText('Prosjektstatus')).toBeInTheDocument()
})
```

Regler og fakta som gjelder:

- **`jest.mock(...)` må stå før import-linjene.** Heft kjører Jest på TypeScripts CommonJS-utdata uten Babel, så mock-kall heises ikke automatisk over importene; TypeScript beholder rekkefølgen i filen, og det er den som gjør at mocken er registrert før komponenten lastes.
- `@microsoft/sp-*` er stubbet (`lib/spfxStub.js`): importer går, og `DisplayMode`, `Guid`, `Log`, `Text`, `Version`, `UrlQueryParameterCollection` og noen få enums har ekte verdier. Trenger testen mer, legg det til i `KNOWN` der. `react-markdown` og `rehype-*`/`remark-*` er også stubbet (rendrer teksten som den er).
- `*.module.scss` løses til klassenavnene sine (`styles.foo === 'foo'`), så du kan spørre på klassenavn.
- Strengmoduler gir de norske tekstene, så `screen.getByText(strings.Nøkkel)` fungerer.
- Fluent UI v8 og v9 rendrer under jsdom. Første innlasting av `@fluentui/react-components` i en testfil tar 15-45 sekunder; samle testene for én funksjon i én fil i stedet for én fil per lite delkomponent.
- Interaksjon: bruk `@testing-library/user-event` (`userEvent.setup()`), ikke `fireEvent`, for klikk og tasting.
- Trenger komponenten SPFx-kontekst (`WebPartContext`, `pageContext`), lag et minimalt objekt med akkurat feltene komponenten leser og send det inn via props eller context-provider. Ikke bygg en generell SPFx-mock.
- Matcherne fra jest-dom (`toBeInTheDocument`, `toHaveClass`, ...) er gjort kjent for kompilatoren gjennom `src/jest-dom.d.ts` i hver løsning.

Kjør testene i en løsning med `npm test` (`heft test`), eller bare bygg-og-test uten pakking. Én fil: `npx heft test --test-path-pattern Header`.

### Ende-til-ende med Playwright (`e2e/`)

`e2e/` er Rush-prosjektet `pp365-e2e`. Testene er lesende røyk-tester mot testtenanten: de logger inn som en dedikert testbruker, åpner hub-sidene og et prosjektområde, venter på at SPFx-lerretet rendrer, sjekker at forventede webdeler monteres, og feiler på nettleserfeil som betyr at en bundle er ødelagt («Cannot find module», «Failed to load component», «ChunkLoadError»). Det siste er nettopp symptomet på et delt bibliotek som ikke er pakket inn, og er det pakkebeviset i `Build-Release.ps1` sikrer på byggetidspunktet.

Kjøring i CI: jobben «End-to-end smoke (test channel)» i `ci-channel-test.yml` kjører etter en vellykket «Upgrade (test channel)». Rapporten (`playwright-report`, sporinger og video ved feil) lastes opp som artefakt og ligger i 14 dager. `[skip-e2e]` i commit-emnet hopper over jobben.

Variabler og hemmeligheter i GitHub:

| Navn | Type | Innhold |
|---|---|---|
| `SP_URL_TEST` | variabel (finnes) | Hub-URL for testkanalen |
| `E2E_PROJECT_URL` | variabel | Et eksisterende, ferdig oppsatt prosjekt i huben (prosjekttestene hoppes over uten) |
| `E2E_USERNAME` | hemmelighet | Testbrukerens UPN |
| `E2E_PASSWORD` | hemmelighet | Testbrukerens passord |

Krav til testbrukeren: en egen konto (for eksempel `pp365-e2e@<tenant>.onmicrosoft.com`) som er medlem av porteføljen og prosjektet, med minst mulig rettigheter ellers, ekskludert fra MFA gjennom en Conditional Access-policy som gjelder bare denne kontoen, og med passord som roteres og bare finnes som GitHub-hemmelighet. Ikke bruk en personlig konto, og ikke gjenbruk sertifikat-appen som utrullingen bruker: E2E trenger en brukersesjon i nettleseren.

Lokalt: `cp e2e/.env.example e2e/.env`, fyll inn, `npx playwright install chromium`, så `npm test` eller `npm run test:ui` i `e2e/`. Nye tester planlegges, genereres og repareres med Playwright-CLI-ferdigheten i `.claude/skills/playwright-cli` (`references/test-generation.md`).

### Når en test feiler

**Enhets- eller komponenttest feiler i bygget**

1. Bygget stopper; ingenting pakkes. Les hvilken test i loggen eller i `jest-output/JUnit.xml`.
2. Reproduser lokalt med `npm test` i løsningen. Avgjør om koden eller testen er feil. En test som var riktig og nå feiler er en regresjon: rett koden.
3. Er kravet endret med hensikt, oppdater testen i samme commit som koden. Slett aldri en påstand bare for å få grønt.
4. Endringer i `pp365-jest-config` skal kjøres mot minst `shared-library` og én forbruker før de sjekkes inn.

**E2E feiler etter utrulling til testkanalen**

1. Åpne artefaktet `playwright-report-test-channel` fra kjøringen. Sporingen viser hvert steg, nettverkskall og konsoll.
2. Klassifiser:
   - *Miljø*: innlogging feilet (utløpt passord, MFA-krav, endret policy), siden finnes ikke, tenanten svarer ikke. Rett hemmelighet, policy eller variabel; kjør jobben på nytt.
   - *Regresjon*: en webdel monteres ikke, eller det er en fatal nettleserfeil. Opprett et issue i dette repoet med lenke til kjøringen og sporingen, merk det `bug` og `e2e`, og stopp utgivelsen til det er rettet. Det manuelle smoke-test-issuet for utgivelsen lenker til E2E-kjøringen.
   - *Testfeil*: siden endret seg med hensikt (ny tittel, ny side). Rett testen med Playwright-CLI-ferdigheten («heal»), i egen commit.
3. Én ny prøve i CI er slått på. En test som bare passerer på andre forsøk rapporteres som «flaky» i rapporten; tre flaky kjøringer på rad kvalifiserer til `test.fixme` med et issue, ikke til å øke antall forsøk.

**Eierskap**: den som åpner en PR fikser tester som feiler på grunn av PR-en. Den som lager en utgivelse sjekker at siste E2E-kjøring på testkanalen er grønn før smoke-test-issuene opprettes.

### Veikart

1. Komponenttester for komponentene som konverteres fra Fluent UI v8 til v9 (fase 3), skrevet før konverteringen.
2. Skriveflyter i E2E: prosjektoppsett, publisering av statusrapport, opprettelse av idé. Krever oppryddingslogikk i testtenanten.
3. Kontraktstester for dataadapterne når `@pnp/*` kan lastes under Jest (transform av ESM) eller ved å kjøre dem som `node:test` i ESM, slik `sp-js-provisioning` gjør.
4. Dekningsgrenser per løsning når grunnlinjen er kjent.

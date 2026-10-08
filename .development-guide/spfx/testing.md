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

| Kjøretidskontrakt | Kode som komponerer PnPjs-spørringer, kjørt mot det ekte PnPjs 4-biblioteket med falsk transport | `node --test` (`shared-library/test/runtime/*.test.mjs`, `npm run test:runtime`) | I byggeskriptet til shared-library, etter `heft test` | Nei |

Kjøretidskontraktene finnes fordi Jest ikke kan laste `@pnp/*` (ESM-only under CommonJS-kjøreren) og stand-ins ikke fanger feil i selve PnPjs-koblingen: `getTermStore` kastet i SPFx fordi `spfi().using(SPFx(context))` holder URL-er relative til forespørselen sendes, noe stand-ins aldri viste. Node kan importere ESM-PnPjs, så disse testene kjører pipelinen med både relative (SPFx-stil) og absolutte (`spfi(url)`) URL-er. Legg flere slike tester her når kode kobler seg direkte på PnPjs-kjøringen.

### Hva skjer i et bygg

`npm run build` i en løsning kjører `heft test --clean --production && heft package-solution --production`. Heft kompilerer `src/**/*.ts(x)` til `lib-commonjs/`, kjører alle `*.test.ts`/`*.test.tsx` der, og stopper bygget hvis en test feiler. Det samme skjer i `rush build`/`rush rebuild` og dermed i alle CI-arbeidsflytene. Resultatet ligger i `jest-output/JUnit.xml` og dekningsrapporten i `jest-output/coverage/` (begge er ignorert av git).

Hver løsning har dekningsgrenser i `config/jest.config.json` (`coverageThreshold.global`: setninger, grener, funksjoner, linjer), målt i fase 4. De heves når dekningen øker og senkes aldri. Jest melder en grense som ikke nås, men Heft-testfasen lykkes likevel, så lokalt går bygget gjennom; det er `Install/Build-Release.ps1` som stopper på det, og dermed CI. Sletter du tester eller legger til kode uten tester, kan altså bygget gå lokalt og feile i CI.

### Delt oppsett: `pp365-jest-config`

Alle løsningene peker på det samme Jest-oppsettet gjennom `config/jest.config.json` (`"extends": "pp365-jest-config/jest-shared.config.json"`). Pakken ligger i `SharePointFramework/.jest-config` og er et vanlig Rush-prosjekt, på samme måte som `pp365-eslint-config`. Den bygger på SPFx-riggens Jest-konfigurasjon (jsdom, `lib-commonjs`, dekning, JUnit) og legger til:

| Fil | Gjør |
|---|---|
| `lib/setup.js` | Registrerer `@testing-library/jest-dom`-matchere og polyfiller det Fluent UI trenger som jsdom mangler (`matchMedia`, `ResizeObserver`, `IntersectionObserver`, `scrollTo`). |
| `lib/resolver.js` | Løser SPFx-strengmoduler (`SharedLibraryStrings`, `SharedResources`, `<Løsning>Strings`) slik SPFx gjør det: via `localizedResources` i `config/config.json`, til `nb-no`-bunten. Sett `PP365_TEST_LOCALE=en-us` for å teste engelsk. |
| `lib/amdTransform.js` | Gjør AMD-strengbuntene (`define([], function () { ... })`) om til CommonJS. En syntaksfeil i en `.js`-strengfil (for eksempel `,,`) feiler dermed testkjøringen i stedet for å krasje i nettleseren. |
| `lib/spfxStub.js`, `lib/reactMarkdownStub.js`, `lib/noopPluginStub.js` | Erstatter `@microsoft/sp-*` (krever Microsoft-interne moduler i Node), `react-markdown` og `rehype-*`/`remark-*` (ESM-only). `@microsoft/sp-lodash-subset` peker på ekte `lodash`. `window.__themeState__` får standardpaletten SharePoint ellers leverer. |
| `lib/pnpStub.js` | Erstatter alle `@pnp/*`-moduler. Import og kjeding (`spfi().using(...)`) går fint; et `await` på et PnP-kall feiler med en tydelig melding om at adapteren må mockes. De rene hjelpefunksjonene i `@pnp/core` (`stringIsNullOrEmpty`, `dateAdd`, `getHashCode`, `getGUID`, `combine`, `isArray`, `isUrlAbsolute`, `PnPClientStorage` i minnet) er ekte, så kode som bruker dem på egne data oppfører seg som i nettleseren. |
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
- `@microsoft/sp-*` er stubbet (`lib/spfxStub.js`): importer går, og `DisplayMode`, `Guid`, `Log`, `Text`, `Version` (med sammenligningene til SPFx), `UrlQueryParameterCollection`, `Dialog.alert`/`prompt`, feltfabrikkene `PropertyPaneTextField`, `PropertyPaneToggle` og `PropertyPaneDropdown` (de gir `{ type, targetProperty, properties }` som i SPFx) og noen få enums har ekte verdier. Trenger testen mer, legg det til i `KNOWN` der. `react-markdown` og `rehype-*`/`remark-*` er også stubbet (rendrer teksten som den er).
- Utvidelser og web-deler testes som klasser. Stubben har små, ekte grunnklasser (`BaseApplicationCustomizer`, `BaseListViewCommandSet`, `BaseFieldCustomizer`, `BaseClientSideWebPart`, `BaseDialog`): lag instansen, sett `context` og `properties` (og `domElement` for en web-del) på den slik SharePoint gjør, og kall `onInit`. Grunnklassene er ES5-konstruktørfunksjoner, som SPFx sine egne, fordi løsningene kompileres til ES5 og en ES5-underklasse ikke kan kalle en ekte `class`-konstruktør («Class constructor ... cannot be invoked without 'new'»). `BaseDialog.show()` rendrer etter gjeldende oppgave og løses først når dialogen lukkes, og `onAfterClose` kjøres etter lukkingen, som i SPFx. Eksempler: `PortfolioExtensions/src/extensions/*/*.test.ts`, `ProjectExtensions/src/extensions/projectSetup/projectSetup.test.ts`, `ProgramWebParts/src/webparts/*/*.test.tsx`.
- Alle `@microsoft/sp-*`-pakker peker på samme stubfil, og alle `@pnp/*` på én annen, så en `jest.mock` av én av dem gjelder alle i den testfilen. Skal en test bytte ut én verdi, for eksempel at `spfi()` skal gi testens stand-in, pakker den stubben i en `Proxy` som bare erstatter den ene verdien; se `PortfolioExtensions/src/extensions/ideaProcessing/ideaProcessing.test.ts`.
- Verdier fra stubbene er kjedbare proxyer. Jest regner alt som har en `asymmetricMatch`-funksjon som en matcher, så stubbene svarer `undefined` på den egenskapen; ellers ville `expect.anything()` og enhver likhetssjekk med en stubverdi feile. `LogLevel` fra `@pnp/logging` har de ekte tallene.
- Kode som leser byggekonstanten `DEBUG` (SPFx erstatter den ved bygging) trenger `;(globalThis as any).DEBUG = false` i testfilen, over importene når modulen leser den mens den lastes.
- I en åpen Fluent-skuff (`BasePanel`) blir aldri inngangsanimasjonen ferdig under jsdom, så `toBeVisible()` feiler for alt i den. Sjekk attributtet som skjuler et element i stedet, for eksempel `element.closest('[hidden]')`. Rollespørringer hopper dessuten over skjulte elementer; `{ hidden: true }` tar dem med.
- Fluent v8-komponenter leser tasten fra `keyCode`/`which`, ikke fra `key`: `fireEvent.keyDown(element, { key: 'Escape', keyCode: 27, which: 27 })`.
- `new Image()` lastes aldri under jsdom. Kode som forhåndslaster et bilde, testes med en stand-in for `window.Image` som kaller `onload` eller `onerror`; se `shared-library/src/components/ProjectLogo/ProjectLogo.test.tsx`.
- jsdom kan ikke navigere. `location.reload()` og `location.href = ...` rapporteres som «Not implemented: navigation» via `console.error`, og koden fortsetter etter kallet, der nettleseren ville ha lastet siden på nytt. Svelg bare den meldingen (`ignoreNavigation` i `PortfolioExtensions/src/extensions/testFixtures.ts`), og sjekk det som ble skrevet før navigeringen.
- `*.module.scss` løses til klassenavnene sine (`styles.foo === 'foo'`), så du kan spørre på klassenavn.
- Strengmoduler gir de norske tekstene, så `screen.getByText(strings.Nøkkel)` fungerer.
- Fluent UI v8 og v9 rendrer under jsdom. Første innlasting av `@fluentui/react-components` i en testfil tar 15-45 sekunder; samle testene for én funksjon i én fil i stedet for én fil per lite delkomponent.
- Interaksjon: bruk `@testing-library/user-event` (`userEvent.setup()`), ikke `fireEvent`, for klikk og tasting. Unntak for Fluent v9-menyer: `user-event` sin pekersekvens på et menyelement stopper aldri under jsdom og lar Jest-arbeideren henge i minutter, så klikk menyelementer med `fireEvent.click`. En nestet v9-meny (undermeny) kan ikke åpnes under jsdom i det hele tatt; sjekk utløseren (`aria-haspopup="menu"`) og les valgene fra hooken som bygger dem. Hver åpen v9-meny koster dessuten titalls sekunder å rive ned under jsdom, og kostnaden vokser for hver meny en testfil har rendret: rendre menyen én gang per fil, og test valgene gjennom hooken.
- Rollespørringer (`getByRole`) regner ut tilgjengelighetstreet for hele dokumentet og tar sekunder per kall i et stort Fluent-tre, særlig på en maskin under last. Bruk `getByText`, `getByTitle` eller `getByLabelText` når treet er stort (en åpen popover eller dialog i tillegg til web-delen), og rollespørringer der treet er lite.
- Kombinasjonsboks-familien i Fluent v9 (`Combobox`, `Dropdown`, `TagPicker`) gikk i en endeløs render-løkke under jsdom på React 17 i det den åpnet. På React 18 åpner den og velger (prøvd 2026-10-07), men én åpning tok 40–60 sekunder på en belastet maskin, så testene står fortsatt inn for den. En test som skal velge noe, erstatter `Combobox` og `Option` med en vanlig `<select>` som holder Fluents kontrakt (`onOptionSelect` kalles med valgets verdi og tekst); se `PortfolioExtensions/src/components/IdeaApprovalDialog/IdeaApprovalDialog.test.tsx`. En test som skriver i en `TagPicker`, bruker harnessens stand-in: `jest.mock('@fluentui/react-components', () => jest.requireActual('pp365-jest-config/lib/tagPickerStandIn').withTagPickerStandIn())` (se `PeoplePicker.test.tsx`). I nettleseren fungerte familien også på React 17. En v9-komponent kan prøves i en ekte nettleser uten SharePoint ved å bunte den med webpack fra løsningens `node_modules` og kjøre den i Playwrights Chromium (slik personvelgeren ble prøvd i fase 4, slice 7).
- Feil som avhenger av layout, finnes ikke under jsdom. Et eksempel er en Fluent v9-drawer som beholder en `transform` etter at den har glidd inn, slik at elementet man drar i «Vis eller skjul kolonner» (med `position: fixed`) havnet utenfor skjermen. Slike feil fanges bare av en nettlesertest: `e2e/tests/flows/edit-view-columns-drag.spec.ts` starter en dra-operasjon, sjekker at elementet ligger under pekeren og avbryter med Escape, og `edit-view-columns-header.spec.ts` scroller panelet og sjekker at knappene i header-en står på linje med lukk-knappen og innenfor header-en.
- I en `TagPicker` har de valgte taggene også rollen `option`. En nettlesertest som skal velge et søkeresultat, finner det på noe bare resultatene viser, som e-postadressen (`e2e/tests/flows/people-picker.spec.ts`).
- En åpen Fluent v9-popover posisjoneres mot utløseren sin, og under jsdom kostet det 13 sekunder per test på en maskin under last og over ett minutt i CI. En test som skal åpne en popover, erstatter `Popover`, `PopoverTrigger` og `PopoverSurface` med en enkel utgave som holder Fluents kontrakt (utløseren veksler via `onOpenChange`, flaten vises mens den er åpen); se `ProjectWebParts/src/components/ProjectPhases/ProjectPhases.test.tsx`. Innholdet i popoveren kan også testes direkte, uten popoveren rundt.
- Feilen «The `document` global was defined when React was initialized, but is not defined anymore» betyr at en komponent fortsatt gjorde asynkront arbeid (posisjonering av popover, timere) etter at testen var ferdig, og den tar hele Jest-arbeideren ned. Rydd opp og la arbeidet bli ferdig i `afterEach`: `cleanup()` etterfulgt av `await act(() => new Promise((r) => setTimeout(r, 50)))`.
- Hovedlisten i PortfolioWebParts (`List`) rendrer radene med Fluent v9 `Table` (`List/ListGrid`): markeringskolonnen gir en navnløs `columnheader` som må filtreres bort, og elementradene finnes på avkrysningsboksen sin (`strings.ListSelectRowLabel`), siden grupperader har sin egen; se `List.test.tsx`. `WebPartTitle` rendrer en `<h2>` rundt en `span[role=heading]`, så spør på `getByText(tittel, { selector: 'span' })`.
- Trenger komponenten SPFx-kontekst (`WebPartContext`, `pageContext`), lag et minimalt objekt med akkurat feltene komponenten leser og send det inn via props eller context-provider. Ikke bygg en generell SPFx-mock.
- Matcherne fra jest-dom (`toBeInTheDocument`, `toHaveClass`, ...) er gjort kjent for kompilatoren gjennom `src/jest-dom.d.ts` i hver løsning.

Kjør testene i en løsning med `npm test` (`heft test`), eller bare bygg-og-test uten pakking. Én fil: `npx heft test --test-path-pattern Header`, et regulært uttrykk over stien til den kompilerte testfilen (for eksempel `ProjectStatus/reducer`). Med SPFx 1.23 (`@rushstack/heft-jest-plugin` 2.0.6) virket ikke dette: valget gikk videre under Jest 29-navnet, som Jest 30 overså, så alle filene kjørte. Fra SPFx 1.24 (2.0.19) sendes det som Jest 30s `testPathPatterns`.

### Ende-til-ende med Playwright (`e2e/`)

`e2e/` er Rush-prosjektet `pp365-e2e`, med tre mapper: `tests/smoke` (røyktester av sider og webdeler), `tests/flows` (brukerreiser; fire av dem skriver til testtenanten og rydder etter seg) og `tests/local` (en løsnings lokale bundle via en utviklingsserver, bare med `E2E_LOCAL_BUNDLE=1`, aldri i CI). Røyktestene logger inn som en dedikert testbruker, åpner hub-sidene og et prosjektområde, venter på at SPFx-lerretet rendrer, sjekker at forventede webdeler monteres, og feiler på nettleserfeil som betyr at en bundle er ødelagt («Cannot find module», «Failed to load component», «ChunkLoadError»). Det siste er nettopp symptomet på et delt bibliotek som ikke er pakket inn, og er det pakkebeviset i `Build-Release.ps1` sikrer på byggetidspunktet.

Kjøring i CI: jobben «End-to-end smoke (test channel)» i `ci-channel-test.yml` kjører etter en vellykket «Upgrade (test channel)», altså mot den pakken som nettopp ble rullet ut til `SP_URL_TEST`. Arbeidsflyten utløses av push til grenene i `on.push.branches` (i dag `releases/1.15`, `feat/fluent-v9*` og `feat/dependency-upgrades*`) når filer under `SharePointFramework/`, `Install/`, `Templates/` eller `e2e/` er endret, og kan startes manuelt fra Actions-fanen (`workflow_dispatch`). Merk at en push til en av disse grenene oppgraderer testtenanten. E2E-jobben følger begge oppgraderingsløpene: den vanlige oppgraderingen og pakke-oppgraderingen som `[apps-only]`/`[apps-only:<løsninger>]` bruker. `[skip-e2e]` i commit-emnet hopper over E2E-jobben; `[skip-upgrade]` hopper over oppgraderingen og dermed også E2E.

#### Finne og lese E2E-rapporten fra CI

- **Rask oversikt**: jobbloggen lister hver test som bestått, feilet eller hoppet over, og skriver ut påstanden og lokatoren for hver feil (`github`-reporteren). Feil vises også som annotasjoner på kjøringens oppsummeringsside.
- **Full rapport**: nederst på oppsummeringssiden, under «Artifacts», ligger `playwright-report-test-channel` (7 dager, det lengste repoet tillater; arbeidsflyten ber om 14). Zip-filen inneholder `playwright-report/` (HTML-rapporten) og `test-results/` (per feilet test: `error-context.md` med sidens tilgjengelighetssnapshot, skjermbilde, video og ved nytt forsøk `trace.zip`), samt `test-results/junit.xml`.
- **Åpne rapporten lokalt**: fra `e2e/`:

  ```bash
  gh run download <run-id> -n playwright-report-test-channel -D ci-report
  npx playwright show-report ci-report/playwright-report   # åpner http://localhost:9323
  npx playwright show-trace ci-report/test-results/<test>/trace.zip
  ```

  `index.html` kan også åpnes rett fra filsystemet, men sporinger krever `show-report` eller trace.playwright.dev.
- Rapporten inneholder snapshot av sider i testtenanten. Den publiseres ikke utenfor GitHub, og artefakt-tilgangen på repoet skal ikke utvides.

Variabler og hemmeligheter i GitHub:

| Navn | Type | Innhold |
|---|---|---|
| `SP_URL_TEST` | variabel (finnes) | Hub-URL for testkanalen |
| `E2E_PROJECT_URL` | variabel | Et eksisterende, ferdig oppsatt prosjektområde i huben, ikke huben selv (prosjekttestene hoppes over med melding hvis variabelen mangler eller peker på huben) |
| `E2E_PROGRAM_URL` | variabel | Et eksisterende programområde i huben med minst ett underprosjekt (programtestene hoppes over med melding hvis variabelen mangler eller peker på huben) |
| `E2E_USERNAME` | hemmelighet | Testbrukerens UPN |
| `E2E_PASSWORD` | hemmelighet | Testbrukerens passord |

Krav til testbrukeren: en egen konto (for eksempel `pp365-e2e@<tenant>.onmicrosoft.com`) som er medlem av porteføljen og prosjektet, med minst mulig rettigheter ellers, ekskludert fra MFA gjennom en Conditional Access-policy som gjelder bare denne kontoen, og med passord som roteres og bare finnes som GitHub-hemmelighet. Ikke bruk en personlig konto, og ikke gjenbruk sertifikat-appen som utrullingen bruker: E2E trenger en brukersesjon i nettleseren.

Testene gjør mer enn å vente på at webdelene monteres: de prøveklikker (trial click) kontroller som må kunne nås (prosjektlenkene i tidslinjen, fasene i fasevelgeren), åpner filterpanel og informasjonspanel og lukker dem igjen, søker i porteføljeoversikten og sjekker resultattelleren, og feiler hvis en webdel viser feilgrensen «Noe gikk galt» eller nettleseren melder at en bundle ikke kunne lastes («Could not load … in require»). Layout som dekker kontroller (slik tidslinjen gjorde da tredjeparts-CSS ble hashet) feiler dermed på prøveklikket. Utgivelsesbygget sjekker i tillegg at ingen bundle inneholder hashede klassenavn fra tredjeparts stilark.

Sidenavn varierer mellom norsk og engelsk provisjonering og mellom tenanter. Hver test slår derfor opp siden i hubens eget SitePages-bibliotek (første eksisterende kandidat vinner, `E2E_PAGE_*` først) og hopper over med listen over sider som finnes når ingen kandidat passer. En hub-URL uten avsluttende skråstrek normaliseres, og en 404 rapporteres med URL-en som ble forsøkt. Testene venter på `[data-sp-web-part-id]`, som finnes både på lerretssider (Home.aspx) og på enkeltwebdel-appsider (Porteføljeoversikt, Prosjekttidslinje, Nytteoversikt).

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
   - *Utrulling*: rett etter en oppgradering kan SharePoint i noen minutter gi en side forrige versjons manifest for en komponent, og bunten det peker på har oppgraderingen fjernet («Could not load … in require»). Oppsettet `tests/deployment.setup.ts` venter derfor inntil ti minutter på at hubben og prosjektets forside laster alle bunter fra appkatalogen før testene starter. Feiler oppsettet, er en bunt fortsatt borte etter ti minutter, og utrullingen er ødelagt.
   - *Regresjon*: en webdel monteres ikke, eller det er en fatal nettleserfeil. Opprett et issue i dette repoet med lenke til kjøringen og sporingen, merk det `bug`, og stopp utgivelsen til det er rettet. Det manuelle smoke-test-issuet for utgivelsen lenker til E2E-kjøringen.
   - *Testfeil*: siden endret seg med hensikt (ny tittel, ny side). Rett testen med Playwright-CLI-ferdigheten («heal»), i egen commit.
3. Én ny prøve i CI er slått på. En test som bare passerer på andre forsøk rapporteres som «flaky» i rapporten; tre flaky kjøringer på rad kvalifiserer til `test.fixme` med et issue, ikke til å øke antall forsøk.

**Eierskap**: den som åpner en PR fikser tester som feiler på grunn av PR-en. Den som lager en utgivelse sjekker at siste E2E-kjøring på testkanalen er grønn før smoke-test-issuene opprettes.

### Veikart

1. ~~Komponenttester for komponentene som konverteres fra Fluent UI v8 til v9.~~ Gjort i fase 3 og 4: hver webdel-rot, utvidelse og interaktiv komponent har tester.
2. Skriveflyter i E2E: kopi av dokumentmal, utkast til statusrapport, ny kolonne i porteføljeoversikten og underområde i et program er på plass og rydder etter seg. Gjenstår: prosjektoppsett, publisering av statusrapport og opprettelse av idé.
3. Flere kjøretidskontrakter (`test/runtime`) for dataadapterne, mot innspilte svar.
4. ~~Dekningsgrenser per løsning.~~ Gjort i fase 4 (se over).

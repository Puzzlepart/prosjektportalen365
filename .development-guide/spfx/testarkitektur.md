## Testarkitektur

Dette er den tekniske oversikten over testingen i Prosjektportalen 365: testlagene, bygg og utrulling, universell utforming (UU), rapporter og agent-skills. Praktiske mønstre og feilsøking står i [Testregime](testing.md), og dekningen per komponent står i [Testoversikt](testoversikt.md).

> **Kortversjonen:** Jest tester logikk og komponenter under bygg. Runtime-tester sjekker bibliotekets kjøretidskontrakter uten tenant. Integrasjon tester datalaget mot ekte SharePoint. Playwright tester brukergrensesnittet etter utrulling til testkanalen, inkludert axe og fokus. Manuell smoke-test og UU-gjennomgang dekker det automatikken ikke kan bevise. Grønn CI betyr ikke at hele løsningen er WCAG-verifisert.

### Testlag og ansvar

| Lag | Hva kjøres mot | Hva laget beviser | Oppsett |
|---|---|---|---|
| Enhetstester | Jest, kompilert TypeScript, ingen tenant | Logikk, modeller, reducere, hjelpefunksjoner og datamapping med kjente inndata | Testfiler ved siden av koden i løsningenes `src/` |
| Komponenttester | Jest, React Testing Library og jsdom | Hva komponenten viser, og hvordan den reagerer på handlinger og tilstand | Samme testkjøring som enhetstestene; hooks eller dataadaptere mockes |
| Runtime-kontrakter | Node, ekte PnPjs med falsk nettverkstransport, og maskinens tidssoner | PnPjs-kjeder, URL-er og sidehenting fungerer i kjøretid; datoer vises riktig på tvers av tidssoner | [shared-library/test/runtime](../../SharePointFramework/shared-library/test/runtime/) |
| Integrasjon | Node, ekte tjenester og PnPjs mot testtenanten | Hva SharePoint faktisk lagrer og returnerer: felt, datoer, søk, termer, hubsynkronisering og maltilstand | [integration](../../integration/README.md) |
| Ende-til-ende (E2E) | Playwright og ekte Chromium mot testtenanten | Sider, bundles og riktig releasekanal, brukerreiser, layout, fokus og nettleser-axe | [e2e](../../e2e/README.md) |
| Bygg- og scriptkontroller | Releasebygget og egne Node-tester, uten tenant | Dekningsgrenser, ferske pakker, korrekt bundling, scripts og malreferanser | [Build-Release.ps1](../../Install/Build-Release.ps1), repoets `.tasks/` og `Templates/.tasks/` |
| Manuell kontroll | Mennesker i testmiljøet | Brukerflyter uten automatisk dekning og WCAG-forhold som krever menneskelig vurdering | [Smoke test](../utgivelse/smoketest.md) og [UU-status](tilgjengelighet.md) |

De seks SPFx-pakkene deler [Jest-harnessen](../../SharePointFramework/.jest-config/jest-shared.config.json). Den løser strengmoduler som SPFx gjør, normalt på norsk, og gir jsdom de nettleser-API-ene komponentene trenger. SPFx og PnPjs erstattes med stand-ins; et ekte PnP-kall i Jest avvises med en melding om at adapteren må mockes. Derfor trengs både runtime- og integrasjonslaget: en mock kan ikke bevise at PnPjs eller SharePoint svarer slik vi antar.

Velg det laveste laget som kan bevise endringen, og legg til flere når grensen mellom lagene er viktig. En datoretting kan for eksempel kreve både logikktest, tur-retur til SharePoint og kontroll av datoen brukeren ser i nettleseren.

### Fra lokal endring til release

**Lokalt:** `npm test` i en SPFx-pakke bygger og kjører Jest. Bibliotekets script kjører også runtime-testene. `npm run build` bygger, tester og pakker. `npm run rush:build` fra roten gjør dette i avhengighetsrekkefølge, men integrasjons- og E2E-prosjektenes bygg typesjekker bare: tenanttestene startes separat. `heft build`, `watch` og løsningenes `build:<kanal>` kjører ikke Jest.

**Pull request:** [CI (build debug)](../../.github/workflows/ci-build-debug.yml) bygger testkanalens releasepakke på pull requests mot release-grenene og `main`. Den kjører SPFx-testene og runtime-testene, håndhever dekningsgrenser og pakkekontroller og kjører `npm run test:tasks`. Den trenger ingen tenanttilgang og ruller ikke ut noe. Integrasjon og E2E er ikke del av dette PR-bygget.

**Testkanalen:** [CI (channels/test)](../../.github/workflows/ci-channel-test.yml) utløses av relevante push-endringer på grenene workflowen angir, eller startes manuelt. Hovedløpet er:

```text
Bygg, Jest, runtime, dekningsgrenser og pakkekontroller
                         |
              Oppgrader testkanalen
                         |
             +-----------+-----------+
             |                       |
       Integrasjon                  E2E
       Ekte datalag       Innlogging -> bundle-gate
             |            -> smoke, flows og UU
             +-----------+-----------+
                         |
              Rapporter og CI-resultat
                         |
       Manuell smoke-test og UU før release
```

Integrasjon og E2E kjører parallelt etter vellykket oppgradering. E2E logger inn som testbrukeren og venter opptil ti minutter på at SharePoint serverer de oppgraderte bundlene. Vanlig CI kjører `tests/smoke` og `tests/flows`; `tests/local` krever lokale debug-bundles og `E2E_LOCAL_BUNDLE=1`, mens `tests/diagnostics` er målinger av SharePoint-feil med `E2E_PLACEHOLDER_DIAGNOSTICS=1`. De to siste er ikke del av vanlig CI.

I testkanal-workflowen gjelder CI-taggene bare første linje i commit-meldingen:

- `[apps-only]` og `[apps-only:<løsninger>]` begrenser pakking og utrulling og hopper over malene, ikke SPFx-testene eller de etterfølgende tenanttestene. Integrasjonstestene av maloppgraderingen kjører bare etter full oppgradering.
- `[skip-e2e]` og `[skip-integration]` hopper over hver sin testjobb. `[skip-upgrade]` hopper over oppgraderingen og dermed begge tenanttestjobbene.
- `[skip-ci] [build-debug]` kan brukes for å prøve et bygg uten utrulling. Bruk aldri skip-tagger for å skjule en regresjon.

Utrullinger til samme testmiljø køes for å unngå at de overskriver hverandre. Feil etter utrulling gjør CI rød, men utløser ikke automatisk rollback. Før release må resultatene vurderes sammen med den manuelle smoke-testen. Grenfiltre, tagger og releaseprosessen er beskrevet i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md) og [Smoke test](../utgivelse/smoketest.md).

### Hva stopper en kjøring, og hva rapporteres bare?

| Kontroll | Virkning |
|---|---|
| Kompilering, lint-feil eller feilende Jest-/runtime-påstand | SPFx-bygget feiler |
| Dekningsgrense (`coverageThreshold`) | Jest melder bruddet, men Heft kan fortsatt lykkes. Releasebygget leser loggene og feiler, også i PR-bygget |
| Manglende eller gammel `.sppkg`, delte pakker som kjøretidseksternaler, eller bestemte feilaktig hashende tredjeparts-CSS-klasser | Releasebygget feiler |
| Feilende integrasjons- eller E2E-påstand | Testjobben og CI-kjøringen feiler |
| Nettleser-axe for navn i `A11Y_BLOCKING` | `serious` eller `critical` gjør testen rød; øvrige funn rapporteres |
| Nettleser-axe for andre komponentnavn | Funn rapporteres uten automatisk blokkering |
| Visuelle UU-målinger | Målingene og bildene rapporteres; funnene gjør ikke automatisk testen rød |
| `validate-loc` i en SPFx-pakke | Rapporterer manglende strengnøkler, men kan avslutte med kode 0. Rapporten må leses |

Dekningsgrensene er per løsning og skal heves når dekningen øker, aldri senkes for å få grønt. Dekningen gjelder filene testene laster, ikke nødvendigvis hele kodebasen. Antall tester eller grønn CI sier derfor ikke alene hvor mye av produktet som er verifisert.

E2E bruker to arbeidere og ett nytt forsøk i CI; tester som bare består på nytt forsøk vises som ustabile («flaky»). Integrasjon kjører testfilene sekvensielt uten test-retries. Manglende sider, data eller rettigheter kan gi begrunnede skips. `INTEGRATION_STRICT=true` gjør manglende nødvendig konfigurasjon til feil i CI, men fjerner ikke alle rettighets- eller scenarioavhengige skips. Les også hva som ble hoppet over.

### UU: automatisk regresjonsvern og manuell verifisering

Målet er WCAG 2.1 nivå A og AA, med fire tilleggskriterier fra WCAG 2.2: fokus ikke skjult, alternativer til drabevegelser, målstørrelse og overflødig inntasting. Axe-reglene omfatter WCAG 2.1 A/AA og 2.2 AA. UU testes på flere måter:

- **I Jest:** [axeComponent](../../SharePointFramework/.jest-config/lib/axe.js) brukes i utvalgte komponenttester og feiler på rapporterte brudd. jsdom har ikke layout, så kontrastkontrollen er slått av. En test med en stand-in vurderer stand-in-en, ikke den ekte kontrollens nettlesermarkup.
- **I nettleseren:** [scanAccessibility](../../e2e/tests/fixtures/a11y.ts) skanner PP365-webdeler og åpne dialoger, paneler, menyer og popovere. Skanningene avgrenser vår markup og venter på animasjoner. `A11Y_BLOCKING` er den konkrete listen over komponentnavn med automatisk regresjonsvern; den er ikke en liste over ferdige manuelle WCAG-godkjenninger.
- **Fokus og tastatur:** overflatetestene kontrollerer blant annet at Escape lukker og at fokus går tilbake til utløseren. Dette supplerer axe, men erstatter ikke en full tastaturgjennomgang.
- **Visuelt:** den visuelle nettlesertesten samler målinger av reflow ved 320 CSS-piksler og økt tekstavstand, samt bilder i kontrastmodus (`forced-colors`), som underlag for håndrunden.
- **Manuelt:** skjermleser (NVDA og VoiceOver), tastaturrekkefølge, synlig fokus, zoom, kontrast, skjemaer og forståelige status- og feilmeldinger må vurderes av mennesker og dokumenteres per komponent.

Den dokumenterte WCAG-statusen er foreløpig til håndrundene er gjort. PP365s egen markup, SharePoints grensesnitt rundt den, redaktørinnhold og PnP-kontrollenes internals må skilles fra hverandre i vurderingen. Se [Tilgjengelighet](tilgjengelighet.md) for komponentstatus og [Tilgjengelighet per WCAG-kriterium](tilgjengelighet-wcag.md) for omfang, kjente avvik og vurderingene kundene kan bruke. **Ingen axe-funn betyr ikke at komponenten er tilgjengelig.**

### Kjøre tester og lese bevisene

Bruk repoets Node-versjon og Rush-oppsett, se [Kom i gang](../kom-i-gang.md). Bygg avhengighetene før en løsnings tester; integrasjon krever oppdaterte bygg av både biblioteket og ProjectWebParts. Tenanttestene trenger konfigurasjonen beskrevet i sine README-er.

| Hvor | Kommando | Formål |
|---|---|---|
| Repo-roten | `npm run rush:build` | Fullt bygg i avhengighetsrekkefølge, med SPFx-testene og runtime |
| En SPFx-pakke | `npm test` | Bygg og løsningens tester |
| En SPFx-pakke | `npx heft test --test-path-pattern ProjectStatus/reducer` | En avgrenset testkjøring |
| `SharePointFramework/shared-library` | `npm run test:runtime` | Runtime-kontrakter mot bibliotekets eksisterende bygg |
| `integration` | `npm test` | Datalaget mot testtenanten, samt offline-testene av harnessen og reporteren |
| `e2e` | `npm test` eller `npm run test:ui` | Nettlesersuiten, eventuelt interaktivt |
| Repo-roten | `npm run test:tasks` | Repo-scriptenes tester; inngår også i PR-/debug-workflowen |
| `Templates` | `npm test` | Malreferansetestene; ikke automatisk kjørt av pakkens `build` |
| Repo-roten | `npm run check-skills` | Struktur og metadata for agent-skills |

Integrasjon bruker app-only-sertifikat i CI og normalt testbrukerens lagrede nettleserøkt lokalt. Skriving går bare til `INTEGRATION_PROJECT_URL`, prosjektet reservert for integrasjon, og hub-rader testene selv lager. Det er et annet prosjekt enn `E2E_PROJECT_URL`. Testene leser lagrede verdier tilbake og gjenoppretter i `finally`; E2E-flyter som skriver, rydder også etter seg.

Jest skriver JUnit og coverage under løsningens `jest-output/`. Integrasjon og E2E skriver JUnit og HTML; E2E legger også ved axe-funn, feilbilder, video og traces etter behov. CI-jobbenes sammendrag lenker til den private testrapportsiden, som viser kjøringer og resultater i sju dager. Artefaktene `integration-report-test-channel` og `playwright-report-test-channel` er reserven dersom rapportpubliseringen feiler.

Traces kan inneholde øktinformasjon og utelates derfor fra de offentlige E2E-artefaktene. Innloggingen traces ikke i vanlig CI, og hemmeligheter skal ikke skrives med Playwright-metoder som legger verdien i rapportens stegtittel. Rapportpubliseringen er ikke-blokkerende: en manglende rapport betyr ikke i seg selv at testene bestod eller feilet. Kommandoer for å hente rapportene og klassifisere feil står i [Testregime](testing.md).

### Agent-skills og vedlikehold

Skills er arbeidsoppskrifter for AI-assistenter, ikke egne testmotorer:

| Skill | Ansvar |
|---|---|
| [pp365-testing](../../.claude/skills/pp365-testing/SKILL.md) | Velge testlag, skrive og kjøre tester, mocks, rapporter og feilsøking |
| [pp365-a11y](../../.claude/skills/pp365-a11y/SKILL.md) | UU-regler, komponentgjennomgang, axe-gater og registrering av resultat |
| [playwright-cli](../../.claude/skills/playwright-cli/SKILL.md) | Utforske nettleseren og planlegge, generere og reparere E2E-tester |
| [pp365-ui](../../.claude/skills/pp365-ui/SKILL.md), [pp365-toolchain](../../.claude/skills/pp365-toolchain/SKILL.md) og [pp365-release](../../.claude/skills/pp365-release/SKILL.md) | Komponentmønstre, bygg og overgangen fra ferdig endring til release |

Skills ligger bare i `.claude/skills/`. [Check skills-workflowen](../../.github/workflows/skills.yml) kontrollerer plassering og frontmatter, ikke at instruksjonene er faglig riktige eller oppdaterte.

Ved en endring i testoppsettet oppdateres de berørte detaljkapitlene og skillene sammen med konfigurasjonen. Denne oversikten beskriver arkitekturen, ikke løpende testantall eller en bestemt grønn kjøring. Bruk testenes rapporter for utfallet, [Testoversikt](testoversikt.md) for komponentdekningen og UU-kapitlene for dokumentert tilgjengelighet. Dersom dokumentasjon og konfigurasjon er uenige, er workflows og testkonfigurasjonen fasiten, og dokumentasjonen må rettes.

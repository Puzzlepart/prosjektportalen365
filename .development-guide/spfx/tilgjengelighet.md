## Tilgjengelighet

Status for universell utforming per komponent, arbeidet i [#1788](https://github.com/Puzzlepart/prosjektportalen365/issues/1788). Målet er WCAG 2.1 nivå A og AA, og i tillegg fire kriterier fra WCAG 2.2: 2.4.11, 2.5.7, 2.5.8 og 3.3.7. Planen og rekkefølgen står i `docs/plans/universal-design-wcag.md`. Reglene for koden og fremgangsmåten står i skillen `pp365-a11y`.

### Slik leses tabellene

- **axe** er det axe fant i grunnlagsmålingen 14.10.2026: regelen og hvor mange elementer som brøt den. «Ingen» betyr at axe ikke fant noe. Det betyr ikke at komponenten er tilgjengelig, siden axe bare finner en del av det WCAG krever.
- **Gjennomgått** er datoen komponenten har vært gjennom alle sju stegene: axe, jest-axe, tastatur, skjermleser, visuelt, skjema og registrering.
- **Tastatur**, **Skjermleser**, **Visuelt** og **Skjema** fylles ut ved gjennomgangen: ✓ for bestått, ✗ for funn (se merknaden) og – når det ikke er relevant.

### Grunnlagsmålingen

axe-core 4.13 gjennom `@axe-core/playwright` skannet hver PP365-webdel fra testkanalen på sidene røyktestene åpner, og flatene testene for tiltaksfeltet og «Hent dokumentmal» åpner. Reglene var WCAG 2.1 A og AA og WCAG 2.2 AA. Fluents fokusvakter (`i[data-tabster-dummy]`) er holdt utenfor. De flagges av `aria-hidden-focus`, men flytter fokus videre med en gang og er Fluents egne. Skanningen venter til Fluent er ferdig med å animere inn dialoger, paneler og menyer. Målt midt i animasjonen ga de kontrastfunn som ikke fantes, så flatene ble skannet på nytt samme dag.

Målingen er et øyeblikksbilde. Antallet varierer noe med hvor mye data som har lastet når skanningen går. Webdeler under folden, som Prosjektnyheter på prosjektets forside, monteres først når siden rulles og er ikke med. De skannes i sin egen gjennomgang.

Testene går i `e2e/tests/smoke/a11y-baseline.spec.ts`, `risk-action.spec.ts` og `document-template-dialog.spec.ts`. Hver skanning legger ved `axe-<komponent>.json` og en `a11y`-merknad i rapporten. En skanning feiler bare for komponenter som er gjennomgått og står i `A11Y_BLOCKING`.

### shared-library

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| BasePanel | Ingen, i tiltakspanelet |  |  |  |  |  |  |
| Toolbar | Ikke målt alene |  |  |  |  |  |  |
| DataGridList | Se «Hent dokumentmal» |  |  |  |  |  |  |
| FieldContainer og skjemafeltene | Ikke målt alene |  |  |  |  |  |  |
| CustomEditPanel | Ikke målt |  |  |  |  |  |  |
| FilterPanel | Ikke målt |  |  |  |  |  | Rettet: seksjonstoppen er en knapp som sier om filteret er åpent |
| UserMessage | Ikke målt |  |  |  |  |  | Rettet: leses opp, siden hver React-rot nå har en `AriaLiveAnnouncer` |
| WebPartTitle | Ikke målt alene |  |  |  |  |  | Rettet: én overskrift, der det var to, og info-knappen heter «Informasjon om …» på norsk, der Fluent kalte den «information» |
| ConfirmDialog | Ikke målt |  |  |  |  |  |  |
| OverflowTagMenu | Ikke målt |  |  |  |  |  | Taggene er knapper som ikke gjør noe. Vurderes med prosjektkortene |
| ItemColumn | Se porteføljeoversikten |  |  |  |  |  |  |
| LoadingSkeleton | aria-progressbar-name 1, i ressursallokeringen |  |  |  |  |  | Rettet: skjelettet heter «Laster...» |
| ProjectLogo og FileTypeIcon | Ikke målt alene |  |  |  |  |  |  |
| Autocomplete og ColumnSearchPropertyField | Ikke målt |  |  |  |  |  |  |
| ProjectTimeline | Se tidslinjene |  |  |  |  |  | Tidslinjebiblioteket har ikke tastaturstøtte |

### ProjectWebParts

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| Prosjektinformasjon | Ingen |  |  |  |  |  |  |
| Fasevelger | color-contrast 8–10, list 1 |  |  |  |  |  | Fasenavn med lav kontrast, `ul` med andre barn enn `li` |
| Prosjektstatus | Ingen |  |  |  |  |  |  |
| Prosjekttidslinje | color-contrast 2, scrollable-region-focusable 1 |  |  |  |  |  | Har en liste ved siden av |
| Risikomatrise | Ingen |  |  |  |  |  |  |
| Mulighetsmatrise | Ingen |  |  |  |  |  |  |
| Prosjektnyheter | Ikke målt |  |  |  |  |  | Under folden |
| Dynamisk liste | Ikke målt |  |  |  |  |  | Ingen side på testområdet |
| Prosjektinformasjonspanel | Ikke målt |  |  |  |  |  |  |

### ProjectExtensions

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| Oppsett av prosjekt | Ikke målt |  |  |  |  |  |  |
| Oppgradering av prosjekt | Ikke målt |  |  |  |  |  |  |
| Hent dokumentmal | Velg maler: target-size 2. Målmappe: target-size 3 |  |  |  |  |  | Overskriften på hver kopi er et klikkbart `div` |
| Planner-tiltak | Ingen, i cellen, menyen, panelet og migreringsdialogen |  |  |  |  |  |  |

### PortfolioWebParts

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| Prosjektutlisting | aria-roles 36 (kritisk), link-name 5–7 |  |  |  |  |  | Ugyldige roller på avatarene, lenker uten tekst på prosjektkortene |
| Siste prosjekter | Ingen |  |  |  |  |  |  |
| Porteføljeoversikt | Ingen |  |  |  |  |  |  |
| Aggregert oversikt | Ingen |  |  |  |  |  |  |
| Prosjekttidslinje (portefølje) | color-contrast 8, scrollable-region-focusable 1 |  |  |  |  |  | Ingen liste ved siden av |
| Ressursallokering | aria-progressbar-name 1 |  |  |  |  |  | Ingen liste ved siden av |
| Idémodul | Ingen |  |  |  |  |  |  |
| Prosjektkort | Ikke målt |  |  |  |  |  |  |

### PortfolioExtensions

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| Bunntekst | Ikke målt |  |  |  |  |  |  |
| Idéregistrering | Ikke målt |  |  |  |  |  |  |
| Idébehandling | Ikke målt |  |  |  |  |  |  |
| Idé – prosjektdata | Ikke målt |  |  |  |  |  |  |
| Malpakkekatalog | Ikke målt |  |  |  |  |  | Fokusrammen er fjernet i pakkedetaljene |

### ProgramWebParts

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| Administrasjon av underområder | Ingen |  |  |  |  |  |  |
| Innholdsaggregering for program | Ingen |  |  |  |  |  |  |
| Oversikt over underområder | aria-command-name 24 |  |  |  |  |  | Kommandoer uten navn |
| Tidslinje for underområder | color-contrast 4, scrollable-region-focusable 1 |  |  |  |  |  | Ingen liste ved siden av |

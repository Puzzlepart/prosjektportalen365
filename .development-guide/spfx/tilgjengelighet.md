## Tilgjengelighet

Status for universell utforming per komponent, arbeidet i [#1788](https://github.com/Puzzlepart/prosjektportalen365/issues/1788). Målet er WCAG 2.1 nivå A og AA, og i tillegg fire kriterier fra WCAG 2.2: 2.4.11, 2.5.7, 2.5.8 og 3.3.7. Planen og rekkefølgen står i `docs/plans/universal-design-wcag.md`. Reglene for koden og fremgangsmåten står i skillen `pp365-a11y`.

### Slik leses tabellene

- **axe** er det axe fant i grunnlagsmålingen 14.10.2026: regelen og hvor mange elementer som brøt den. «Ingen» betyr at axe ikke fant noe. Det betyr ikke at komponenten er tilgjengelig, siden axe bare finner en del av det WCAG krever.
- **Gjennomgått** er datoen komponenten har vært gjennom alle sju stegene: axe, jest-axe, tastatur, skjermleser, visuelt, skjema og registrering.
- **Tastatur**, **Skjermleser**, **Visuelt** og **Skjema** fylles ut ved gjennomgangen: ✓ for bestått, ✗ for funn (se merknaden) og – når det ikke er relevant.
- **Merknad** sier hva som er rettet og hva som gjenstår, og hva jest-axe fant der komponenten har komponenttester.

### Grunnlagsmålingen

axe-core 4.13 gjennom `@axe-core/playwright` skannet hver PP365-webdel fra testkanalen på sidene røyktestene åpner, og flatene testene for tiltaksfeltet og «Hent dokumentmal» åpner. Reglene var WCAG 2.1 A og AA og WCAG 2.2 AA. Fluents fokusvakter (`i[data-tabster-dummy]`) er holdt utenfor. De flagges av `aria-hidden-focus`, men flytter fokus videre med en gang og er Fluents egne. Skanningen venter til Fluent er ferdig med å animere inn dialoger, paneler og menyer. Målt midt i animasjonen ga de kontrastfunn som ikke fantes, så flatene ble skannet på nytt samme dag.

Målingen er et øyeblikksbilde. Antallet varierer noe med hvor mye data som har lastet når skanningen går. Webdeler under folden, som Prosjektnyheter på prosjektets forside, monteres først når siden rulles og er ikke med. De skannes i sin egen gjennomgang.

Testene går i `e2e/tests/smoke/a11y-baseline.spec.ts`, `risk-action.spec.ts` og `document-template-dialog.spec.ts`. Hver skanning legger ved `axe-<komponent>.json` og en `a11y`-merknad i rapporten. En skanning feiler bare for komponenter som er gjennomgått og står i `A11Y_BLOCKING`.

### shared-library

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| BasePanel | Ingen, i tiltakspanelet |  |  |  |  |  | jest-axe: ingen funn. Panelet heter det overskriften sier, også når toppen er skjult |
| Toolbar | Ikke målt alene |  |  |  |  |  | jest-axe: ingen funn. En knapp uten tekst heter det beskrivelsen sier |
| DataGridList | Se «Hent dokumentmal» |  |  |  |  |  | jest-axe: ingen funn, med sortering og avkrysning |
| FieldContainer og skjemafeltene | Ikke målt alene |  |  |  |  |  | jest-axe: ingen funn, også med datovelgeren |
| CustomEditPanel | Ikke målt |  |  |  |  |  | jest-axe: ingen funn |
| PeoplePicker | Ikke målt alene |  |  |  |  |  | Rettet: bildet ved navnet er skjult for skjermlesere, så navnet leses én gang, ikke to |
| FilterPanel | Ikke målt |  |  |  |  |  | Rettet: seksjonstoppen er en knapp som sier om filteret er åpent |
| UserMessage | Ikke målt |  |  |  |  |  | Rettet: leses opp, siden hver React-rot nå har en `AriaLiveAnnouncer`. jest-axe: ingen funn |
| WebPartTitle | Ikke målt alene |  |  |  |  |  | Rettet: én overskrift, der det var to, og info-knappen heter «Informasjon om …» på norsk, der Fluent kalte den «information». En seksjon inne i en webdel får nivå 3 (`headingLevel={3}`) |
| ConfirmDialog | Ikke målt |  |  |  |  |  | Rettet: dialogen beskrives av teksten sin, så spørsmålet leses opp når den åpnes, ikke bare tittelen |
| OverflowTagMenu | Ikke målt |  |  |  |  |  | Rettet: taggene er en liste med tekst, der de var knapper som ikke gjorde noe, og `+n`-knappen sier hvor mange tagger den skjuler |
| ItemColumn | Se porteføljeoversikten |  |  |  |  |  | Rettet: trendikonet har tekst, en lenke uten beskrivelse viser adressen (den var tom), filnavn er lenker, ikke knapper, og bildet ved et personnavn leses ikke opp i tillegg til navnet. Gjenstår: kontrasten i trendikonene (gull 1,4:1 og grønn 2,9:1, kravet er 3:1) rettes med gevinstoversikten. Flere personer i én celle har navnene bare i et verktøytips, uten tastaturvei, og måleren i instrumentkolonnen har ikke tekstalternativ |
| LoadingSkeleton | aria-progressbar-name 1, i ressursallokeringen |  |  |  |  |  | Rettet: skjelettet heter «Laster...» |
| ProjectLogo og FileTypeIcon | Ikke målt alene |  |  |  |  |  | jest-axe: ingen funn. Logoen og initialene har samme navn, og filtypeikonet er pynt (`alt=""`) ved filnavnet |
| Autocomplete og ColumnSearchPropertyField | Ikke målt |  |  |  |  |  | Komponenttestene bruker en erstatning for Fluents kombinasjonsboks, så de skannes i nettleseren, med kolonneskjemaene |
| ProjectTimeline | Se tidslinjene |  |  |  |  |  | Rettet: elementene er knapper som åpnes med Enter eller mellomrom, milepælene har navn, og fokus går tilbake til elementet når detaljene lukkes med Escape. Rulleområdet kan nås med tastaturet og rulles med piltastene. Teksten i et element er svart eller hvit der den konfigurerte fargen har for lav kontrast (standardfargene hadde 3,2–3,7:1), og en milepæl i en svak farge (standardgult har 1,6:1) får en kantlinje. Selve tidslinjebiblioteket har ingen tastaturstøtte, så dette er lagt på der vi tegner elementene. Gjenstår: en liste som alternativ der tidslinjen ikke har en (egen sak) |

### ProjectWebParts

| Komponent | axe | Gjennomgått | Tastatur | Skjermleser | Visuelt | Skjema | Merknad |
|---|---|---|---|---|---|---|---|
| Prosjektinformasjon | Ingen |  |  |  |  |  | Rettet: egenskapene er en beskrivelsesliste, så skjermleseren vet hvilken verdi som hører til hvilket navn, og en person leses én gang (bildet ved navnet leses ikke opp). Handlingene som går til en annen side (versjonshistorikk, administrer underområder) og de overordnede og underordnede prosjektene er lenker, ikke knapper, og prosjektene står i lister under overskrifter på nivå 3. Arkivstatusens popover holder fokus til den lukkes, og statusmerkene har ikke lenger oransje tekst (2:1). Lasteplassholderen og spinnerne i dialogene har navn. jest-axe: ingen funn |
| Fasevelger | color-contrast 8–10, list 1 |  |  |  |  |  | Rettet: fasene er en navngitt liste der hver fase er en knapp, og gjeldende fase er merket som gjeldende trinn. Popoveren holder fokus til den lukkes (Tab sendte fokus til toppen av siden og lot den stå åpen) og heter det fasen heter. Teksten er svart eller hvit der den leser best, også under pekeren (hvitt på standardfargene ga 1,7–2,7:1). Knappen for å endre fase er fokuserbar også når den ikke kan brukes, så grunnen nås. I dialogen for faseskifte har kommentaren etikett, sjekkpunktene er trinn i stedet for faner uten funksjon, deaktiverte knapper kan nås med grunnen, Escape lukker, faseskiftet leses opp når det starter, og oppsummeringen har tekst for statusikonene og sier om en kommentar vises. jest-axe: ingen funn |
| Prosjektstatus | Ingen |  |  |  |  |  |  |
| Prosjekttidslinje | color-contrast 2, scrollable-region-focusable 1 |  |  |  |  |  | Har en liste ved siden av, der en person nå leses én gang. Rettet i bibliotekets tidslinje: elementene kan åpnes med tastaturet, tidslinjen rulles med piltastene, og teksten og milepælene har nok kontrast |
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
| Prosjekttidslinje (portefølje) | color-contrast 8, scrollable-region-focusable 1 |  |  |  |  |  | Ingen liste ved siden av (egen sak). Rettet i bibliotekets tidslinje: elementene kan åpnes med tastaturet, tidslinjen rulles med piltastene, og teksten og milepælene har nok kontrast |
| Ressursallokering | aria-progressbar-name 1 |  |  |  |  |  | Ingen liste ved siden av (egen sak). Rettet i bibliotekets tidslinje: elementene kan åpnes med tastaturet, tidslinjen rulles med piltastene, og teksten og milepælene har nok kontrast |
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
| Tidslinje for underområder | color-contrast 4, scrollable-region-focusable 1 |  |  |  |  |  | Ingen liste ved siden av (egen sak). Rettet i bibliotekets tidslinje: elementene kan åpnes med tastaturet, tidslinjen rulles med piltastene, og teksten og milepælene har nok kontrast |

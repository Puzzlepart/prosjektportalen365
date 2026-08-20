# Terminologi-implementasjon (område C) — gjennomført 2026-08-20

Gevinst → nytte er gjennomført i malverket etter fasiten i
[`mapping-terminologi.csv`](mapping-terminologi.csv). Dette notatet dokumenterer
hva som ble endret, hvilke verdier som bevisst ble **frosset**, og hvilke krav
implementasjonen stiller til oppgraderingsstien (område K).

## Endret

- **`Resources.no-NB.resx`: 64 verdier** — feltvisningsnavn og -beskrivelser
  (`GtIdea*`, `GtGains*`, `GtStatusGainAchievement*`, `GtPrereqProfitAchievement`,
  `GtDesiredValue`, `GtRealizationTime`), valgverdier (`Choice_GtIdeaEconomicBenefit_*`,
  `Choice_GtIdeaQualityBenefit_*`, `Choice_GtIdeaRisk_*`), liste-/sidetitler
  (Nytteanalyse og plan for nyttestyring, Nytteoppfølging, Nytteoversikt), navigasjon,
  innholdstyper (Nyttevirkning, Nytteoppfølging), statusseksjonen «Nytteoppnåelse»,
  kolonnekonfigurasjon, hjelpeinnhold-titler, visning «Etter type nyttevirkning» og
  webdel-tittel «Nytteoversikt».
- **Rollefeltene** (besluttet 20.8): `GtGainsResponsible` «Gevinstansvarlig» → **«Nytteeier»**,
  `GtGainsOwner` «Gevinsteier» → **«Nytteansvarlig»** (forslag, bekreftes i M1).
  Beskrivelsene er omskrevet etter v6s rollefordeling (nytteeier overordnet,
  nytteansvarlig delegert). Begge er personfelt — ingen data berøres.
- **`Resources.en-US.resx`: 21 verdier** — «gain(s)» → «benefit(s)», «realization plan»
  → «benefit management plan», «Gains responsible/owner» → «Benefit owner/manager»
  (speiler den norske rollefordelingen).
- **`Taxonomy.xml`: 1 term** — «Forventede gevinster» → «Forventede nyttevirkninger»
  (dokumentkategori for byggeprosjekter; samme GUID, engelsk label «Expected benefits»
  uendret). Gjelder kun nyinstallasjoner — `Install.ps1` hopper over Taxonomy ved
  `-Upgrade`, og oppgraderingsmalen `1.14.0` skal ikke inneholde termnavn-endringer.

## Frosset — koblingsverdier som IKKE er endret

Disse tolv resx-verdiene brukes til *matching*, ikke visning, og må være identiske på
tvers av hub-data, webdel-egenskaper og SPFx-kode. Siden eksisterende installasjoner
beholder gamle verdier i data (jf. beslutningen om ingen datamigrering), fryses de:

| Nøkler | Hvorfor frosset |
|---|---|
| `Lists_DataSources_Category_BenefitOverview` (+ `_All`, `_Children`, `_PortfolioLevel`, `_Project`) | Kategorien matches i kode (`DataAdapter.ts`/`SPDataAdapter.ts`: `dataSrc.category.startsWith(...)`) og lagres i `Datakilder`-/`Prosjektinnholdskolonner`-rader som nøkles på `GtDataSourceId`/`GtInternalName` med `Skip` — eksisterende rader beholder gammel verdi, og radtitlene brukes som `dataSource`-egenskap i webdeler. |
| `WebParts_BenefitsOverviewCategory_Title`, `WebParts_BenefitsOverviewDataSource_Title` | Samme verdier brukt som `dataSourceCategory`/`dataSource` i `_JsonTemplateProject.json` — må matche hub-radene over. |
| `ClientSidePages_*BenefitOverview_PageName` (3), `Navigation_Benefits*_Url` (2) | Filnavn og URL-er endres aldri (områdets C-regel). |

Konsekvens: «Gevinstoversikt» vil fortsatt vises som *kategorinavn* i Datakilder-listen
og som datakildenavn i visningsvelgeren i nytteoversikten. En samlet omlegging av
datakildekategorien krever koordinert migrering (rader + webdel-egenskaper + kode) og
er utsatt — kandidat for v7 eller det frivillige oppryddingsskriptet i område K.

## Krav til område K (oppgraderingsstien)

1. **`UpgradeAllSitesToLatest`**: feltvisningsnavn på prosjektområdene oppdateres via
   `Set-PnPField -Values @{Title=...}` (allerede planlagt) — nå også for
   `GtGainsResponsible` → «Nytteeier» og `GtGainsOwner` → «Nytteansvarlig».
2. **`PreInstallUpgrade.ps1` må omdøpe én `Statusseksjoner`-rad in place** (samme
   item-ID): «Gevinstoppnåelse» → «Nytteoppnåelse». Listen nøkles på `Title` med
   `Skip` — uten omdøping vil reprovisjonering legge til en *duplikat seksjon* for
   `GtStatusGainAchievement` i statusrapporten. Samme mekanisme som omdøpingen av
   Fasesjekkliste-radene i Listeinnhold (område B).
3. **`Prosjektkolonnekonfigurasjon`** (Title-nøklet, `Skip`): de fem
   «Status gevinstoppnåelse (…)»-radene bør tilsvarende omdøpes in place; ellers
   oppstår fem duplikatrader med identisk kolonne/verdi-mapping (trolig harmløst,
   men støy).
4. **`Hjelpeinnhold`** (Title-nøklet, `Overwrite`): nye brukermanual-titler gir *nye*
   rader ved oppgradering; de gamle består med gamle titler. Håndteres i område J
   (innholdsrevisjon) og K (frivillig opprydding) — ikke et feilscenario.

## Verifisering (kjørt 2026-08-20)

- `npm run build` i `Templates/` — OK; genererte loc-filer (`src/loc/shared/`) og
  prosjektmaler er regenerert (gitignorert).
- `npm run validate-project-template` — ingen tokens uten oversettelse.
- `npm run validate-loc` (PortfolioWebParts, ProjectWebParts, PortfolioExtensions) —
  kun pre-eksisterende hull uten kobling til terminologien
  (`ProjectInformationPanelButton`, `ColorPickerStrings` m.fl.).
- Bygd Standardmal verifisert: `dataSourceCategory` fortsatt «Gevinstoversikt»
  (frosset), nye titler («Nytteoversikt», «Nyttevirkning») på plass.
- Ingen `*_Url`-/`*_PageName`-nøkler endret; ingen endringer i `SiteFields/`
  (interne navn urørt); nøkkelantall identisk i begge resx (1442).

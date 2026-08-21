# Listearkitektur-implementasjon (område B) — gjennomført 2026-08-20

v6-innholdets strukturelle fundament: hub-listene er splittet i to generasjoner, side om
side. Dette notatet dokumenterer endringene, rekkefølgekravene og avvikene fra planteksten.

## Nøkkelsplitten (resx, begge språk — 16 nye nøkler per språk)

| Nøkkelfamilie | Verdi (no) | Betyr heretter |
|---|---|---|
| `Lists_PhaseChecklist_*` *(uendret)* | Fasesjekkliste / `Lists/Fasesjekkliste` | **Prosjektområdets destinasjonsliste** (JsonTemplates, SPFx `useProjectPhasesDataFetch`, `GtLccDestinationList`) |
| `Lists_PhaseChecklistLegacy_*` *(ny)* | Fasesjekkliste (tidligere) / `Lists/Fasesjekkliste` | Hub, forrige generasjon — gammel URL, ny tittel |
| `Lists_PhaseChecklistV6_*` *(ny)* | Fasesjekkliste / `Lists/Fasesjekklistev6` | Hub, v6-generasjonen — opprinnelig tittel, ny URL |
| `Lists_PlannerTasks[Legacy/V6]_*` | tilsvarende | tilsvarende |
| `Lists_ListContent_PhaseCheckpointsLegacy_*`, `..._PlannerTasksLegacy_*` *(ny)* | «… (tidligere)» | Listeinnhold-radene for forrige generasjon |

## Endrede/nye filer

- `Objects/Lists/Fasesjekkliste.xml`, `Planneroppgaver.xml` → Legacy-nøkler (tittel/URL/beskrivelse)
- `Objects/Lists/Fasesjekklistev6.xml`, `Planneroppgaverv6.xml` → **nye**, V6-nøkler, samme
  innholdstyper/visninger/sikkerhet som originalene
- `Objects/Lists/@.xml` → de to nye listene registrert
- `Objects/Lists/Listeinnhold.xml` → **5 rader**: Fasesjekkpunkter (v6-kilde),
  Fasesjekkpunkter (tidligere), Planneroppgaver (v6-kilde), Planneroppgaver (tidligere),
  Tidslinje (uendret). Destinasjonen er alltid prosjektlisten `Lists_PhaseChecklist_Title` /
  Planner-planen — den splittes ikke.
- `Objects/ClientSidePages/Konfigurasjon.xml` → konfigurasjonssidens to lenker peker på
  v6-listene (tittel/beskrivelse/URL)
- `Portfolio_content.{no-NB,en-US}.xml` → de to `ListInstance Title`-attributtene satt til
  legacy-titlene («Fasesjekkliste (tidligere)» osv.). **Uten dette ville innholdsmalen
  omdøpt legacy-listen tilbake ved hver kjøring.** Radene (44+66) er ikke rørt — de
  provisjoneres fortsatt til legacy-listene (v6-radene kommer i område D/E).
- `Install/Scripts/PreInstallUpgrade.ps1` → i 1.14.0-blokken, **før** malene:
  1. hub-listene omdøpes på URL-oppslag til «… (tidligere)» (kun `Title`, idempotent)
  2. de to Listeinnhold-radene omdøpes **på plass** (samme item-ID via `SystemUpdate`) —
     `Title`, `GtDescription` og `GtLccSourceList` — slik at alle
     `Maloppsett.ListContentConfigLookup` (LookupMulti på ID) overlever uendret
- `Install/Scripts/PostInstall.ps1` →
  1. innholdstype-deaktivering identifiserer nå listene på **URL** (begge generasjoner),
     ikke tittel
  2. **Standardmal-koblingen gates**: `ListContentConfigLookup` settes kun når feltet er
     tomt (ren installasjon). Uten gaten ville oppgradering re-koblet Standardmal til
     v6-radene og stille byttet innholdssett — feilen planen advarer mot i «Standardvalg».
- `Install/Scripts/PostInstallUpgrade.ps1` → 1.14.0-verifisering: varsler (rødt) hvis
  legacy-listen fortsatt bærer originaltittelen — signalet på at omdøpingen feilet og
  `getByTitle` vil treffe feil liste.

## Rekkefølgen som bærer alt

`Install.ps1` kjører `PreInstallUpgrade.ps1` (linje ~405) **før** PnP-malene. Omdøpingen
ligger først i 1.14.0-blokken. Kjeden ved oppgradering:

1. PreInstallUpgrade: «Fasesjekkliste» → «Fasesjekkliste (tidligere)» (kun Title, URL står)
2. PreInstallUpgrade: Listeinnhold-radene omdøpes på plass, kilde → legacy-tittel
3. Portfolio.pnp: oppretter v6-listene (originaltitlene) og de to nye Listeinnhold-radene
   (`KeyColumn="Title"` — de omdøpte radene skippes, de nye legges til)
4. Innholdsmalen: fyller legacy-listene (uendrede rader, skip) — v6-lister står tomme til D/E
5. PostInstall: Standardmal-kobling hoppes over (feltet er ikke tomt)
6. PostInstallUpgrade: verifiserer generasjonene

## Avvik fra planteksten (bevisste)

1. **`GtLccDefault` står på 0 også for v6-radene.** Planen sier «v6-radene er default
   (GtLccDefault)», men dagens rader har 0 og defaulting skjer via PostInstalls kobling av
   Standardmal. Å sette 1 ville endret oppførsel for *alle* maler, ikke bare Standardmal.
   Ren installasjon får v6 som standard likevel — via Standardmal-koblingen, som nå matcher
   v6-radtitlene. Kan revurderes i M1/testrunden.
2. **Konfigurasjonssiden viser kun v6-generasjonen** (planen sa «vurder å vise begge»).
   Webdelens `items[n]`-struktur patches per indeks; å legge til flere elementer krever
   endring i webdelens grunnoppsett. Legacy-listene er tilgjengelige via områdeinnhold.
3. `Lists_ListContent_PhaseCheckpoints_Title` («Fasesjekkpunkter») og
   `..._PlannerTasks_Title` («Planneroppgaver») beholdt navn og verdi og betyr nå
   **v6-radene** — dermed treffer PostInstalls `$ListContentMap` v6-generasjonen på ren
   installasjon uten skriptendring.

## Verifisert (statisk, 2026-08-20)

`npm run build` og `validate-project-template` grønne; begge resx har 1458 nøkler;
Listeinnhold har 5 rader; bygd Standardmal har prosjektlisten «Fasesjekkliste» på uendret
URL; gjenværende bruk av `Lists_PhaseChecklist_*`/`Lists_PlannerTasks_*` er utelukkende
prosjektnivå (JsonTemplates + `GtLccDestinationList`). **Ende-til-ende-testene (test 1–4 i
planen, særlig «ingenting skal skje»-testen) gjenstår og kjøres i testleietaker i uke 35.**

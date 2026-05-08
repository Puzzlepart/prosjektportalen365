# Fasebytte og arkivering

Teknisk gjennomgang av fasebytte (`ProjectPhases`) og arkivering i Prosjektportalen 365.

## Kort oppsummering

Arkivering kan startes på to måter:

1. **Som del av fasebytte** — fra `ProjectPhases`-webdelens dialog, hvis `useArchive=true` på den webdelen.
2. **Manuelt fra prosjektinformasjon** — egen "Start arkivering"-knapp i `ProjectInformation`-webdelens arkiveringsseksjon, hvis `useArchive=true` på den webdelen.

Begge flytene bruker den **delte komponenten `ArchiveSelection`** for valg av dokumenter/lister og skriver "Til arkiv"-rader til hub-listen `Arkiveringslogg`. Selve flyttingen utføres av eksterne flyter (Power Automate / Logic Apps) som lytter på listen og oppdaterer status til `Arkivert` / `Feil` / `Advarsel`. Det finnes ingen webhook-kall fra SPFx-koden — koblingen er ren listebasert.

Brukere kan følge arkiveringsstatus via `ArchiveStatus`-komponenten i prosjektinformasjon (synlig når `useArchive=true`). Tidligere arkiverte elementer stemples i velgeren med dato og status, men dobbel-arkivering blokkeres ikke.

---

## A) Fasebytte

### Inngangspunkt

- Webdel: [ProjectPhases.tsx](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/ProjectPhases.tsx)
- Dialog: [ChangePhaseDialog.tsx](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/ChangePhaseDialog/ChangePhaseDialog.tsx)
- Webdel-properties: [webparts/projectPhases/index.ts](../SharePointFramework/ProjectWebParts/src/webparts/projectPhases/index.ts)

### Tjeneste / kjernelogikk

- Hook som orkestrerer byttet: [useChangePhase.ts](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/useChangePhase.ts)
- Selve oppdateringen: `ProjectDataService.updateProjectPhase()` i [ProjectDataService.ts](../SharePointFramework/shared-library/src/services/ProjectDataService/ProjectDataService.ts)
  - Skriver fase-termfeltet på prosjektegenskaper-elementet (`-1;#{Navn}|{TermId}`) og `…Text`-skyggefeltet
  - Synkroniseres også til hub via entity-tjenesten dersom tilgjengelig

### Sjekkliste før bytte

- Liste: **Fasesjekkliste** (`Lists/Fasesjekkliste`)
- Modell: [ChecklistItemModel.ts](../SharePointFramework/shared-library/src/models/ChecklistItemModel.ts) — feltene `GtChecklistStatus`, `GtComment`, `GtProjectPhase`
- Statusverdier: `Åpen`, `Utført`, `Ikke relevant`, `Fortsatt åpen`, `Arkivert`
- Fasemodellens `ChecklistMandatory`-flagg avgjør om bytte blokkeres når åpne punkter finnes ([ProjectPhaseModel.ts](../SharePointFramework/shared-library/src/models/ProjectPhaseModel.ts))

### Dialog-flyt (state machine)

[reducer.ts](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/ChangePhaseDialog/reducer.ts) definerer fem visninger:

| View | Når vises den |
|------|---------------|
| `Initial` | Åpne sjekklistepunkter for målfasen finnes |
| `Summary` | Sjekkliste fullført |
| `Archive` | `useArchive` aktiv og sjekkliste OK (eller tom) — viser delt `<ArchiveSelection mode='phase-change' />` |
| `Confirm` | Siste bekreftelse |
| `ChangingPhase` | Spinner mens skriving pågår |

### Etter-handlinger ved fasebytte

I rekkefølge i [useChangePhase.ts](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/useChangePhase.ts):

1. `updateProjectPhase()` — skriver fase
2. `usePhaseHooks().runHook()` — POST til `hookUrl` (hvis `usePhaseHooks` er på)
3. `changeWelcomePage()` — bytter forsiden hvis `useDynamicHomepage` er på
4. `modifyCurrentPhaseView()` — oppdaterer "Gjeldende fase"-visning
5. Tømmer sessionStorage, dispatcher `SET_PHASE`
6. Eventuell `syncPropertiesToHub` + reload

### Eksterne integrasjoner

- **Generell fase-hook** (`hookUrl`, `hookAuth`, gated på `usePhaseHooks`): kjøres _etter_ fasebyttet via [usePhaseHooks.ts](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/usePhaseHooks.ts)
- **Arkiv-hook (`hookArchiveUrl`/`hookArchiveAuth`) er fjernet.** Tidligere kalte koden en webhook med `archiveConfiguration` som JSON. Nå skrives kun til `Arkiveringslogg`, og eksterne flyter trigges av list-events (se [Eksterne flyter](#eksterne-flyter)).

---

## B) Arkivering

### To inngangspunkter, én delt komponent

Arkivering bruker den delte komponenten **[`ArchiveSelection`](../SharePointFramework/ProjectWebParts/src/components/ArchiveDialog/ArchiveSelection/ArchiveSelection.tsx)** — en ren presentasjonskomponent som tar `documents`, `lists`, `history` og valgfri `currentPhaseId` som props. Den vet ikke om den lever inne i fasebytte eller en manuell flyt.

Brukes fra:

1. **`ChangePhaseDialog`** — i `View.Archive`-steget. Adapteren ligger i [Views/index.tsx](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/ChangePhaseDialog/Views/index.tsx) og leser docs/lists/history fra `ProjectPhasesContext`. Setter `currentPhaseId` for å filtrere dokumenter til gjeldende fase.
2. **Standalone `ArchiveDialog`** ([ArchiveDialog.tsx](../SharePointFramework/ProjectWebParts/src/components/ArchiveDialog/ArchiveDialog.tsx)) — åpnes manuelt fra `ProjectInformation`. Henter sin egen data via [useArchiveDialogData.ts](../SharePointFramework/ProjectWebParts/src/components/ArchiveDialog/useArchiveDialogData.ts). **Ingen fase-filter** — viser alle dokumenter/lister.

### Manuell arkivering fra ProjectInformation

- Wrapper: [ArchiveSection](../SharePointFramework/ProjectWebParts/src/components/ProjectInformation/ArchiveSection/index.tsx) — header + "Start arkivering"-knapp + `ArchiveStatus`-historikk
- Container som åpner dialogen: [ArchiveDialogContainer](../SharePointFramework/ProjectWebParts/src/components/ProjectInformation/ArchiveDialogContainer/index.tsx)
- Kun synlig når `ProjectInformation.useArchive = true`. Knappen dispatcher `OPEN_DIALOG('ArchiveDialog')` og containeren åpner `ArchiveDialog` med prosjektets `webAbsoluteUrl`.

### Arkivlisten — `Arkiveringslogg`

- **Definisjon:** [Arkiveringslogg.xml](../Templates/Portfolio/Objects/Lists/Arkiveringslogg.xml)
- **URL:** `Lists/Arkiveringslogg` (ligger på **hub/portefølje-siden**, ikke på prosjektsiden)
- **Skjult:** ja (`Hidden=TRUE`), versjonering på (5000)
- **Innholdstype:** `Arkiveringsloggelement` (`0x0100D9254F0E5237494285C0BB7BEA0A754A`)

Felter (alle tekst):

| Internt navn | Verdier / formål |
|--------------|------------------|
| `Title` | Navn på dokument/liste som arkiveres (på tidspunktet for arkiveringen) |
| `GtLogStatus` | `Arkivert`, `Til arkiv`, `Advarsel`, `Feil` (custom column formatter) |
| `GtLogOperation` | `Faseovergang` eller `Manuell arkivering` |
| `GtLogScope` | `Dokument` eller `Liste` |
| `GtLogMessage` | Detaljmelding |
| `GtLogWebUrl` | Prosjekt-URL (brukes til oppslag mot prosjekt) |
| `GtLogReference` | URL til arkivert objekt (menneskelesbar referanse) |
| `GtLogItemId` | **Stabil GUID** (UniqueId for dokumenter, list Id for lister) — overlever rename |
| `GtLogArchiveUrl` | URL til mottaker/arkiv-destinasjon |

Feltdefinisjoner under [Templates/Portfolio/Objects/SiteFields/Log/](../Templates/Portfolio/Objects/SiteFields/Log/).

### Tjenester for arkivering

Alle ligger i [SPDataAdapter/index.ts](../SharePointFramework/ProjectWebParts/src/data/SPDataAdapter/index.ts):

| Metode | Hva den gjør |
|--------|--------------|
| `getDocumentsForArchive()` | Henter alle filer i `Dokumenter` (inkl. `UniqueId` som `itemId`) |
| `getListsForArchive()` | Henter ikke-skjulte, ikke-system-lister med antall elementer (list-`Id` som `itemId`) |
| `writeToArchiveLog()` | Skriver én rad til `Arkiveringslogg` på hub (med valgfri `itemId`) |
| `logDocumentArchive()` | Wrapper: scope=`Dokument`, valgfri `itemId` + `operation` |
| `logListArchive()` | Wrapper: scope=`Liste`, valgfri `itemId` + `operation` |
| `getArchiveStatus()` | Leser logg for prosjektets `webUrl`, grupperer på operasjon+dato |
| `getArchiveHistoryForItems()` | Returnerer mest-nylige logg-rad per element, keyet på `GtLogItemId` → `GtLogReference` → `Title` |

### Stempling av "tidligere arkivert"

`ArchiveSelection` anriker hvert valg med `previousArchive`-metadata via `getArchiveHistoryForItems()`:

- Primær key: `GtLogItemId` (stabil GUID, overlever rename)
- Fallback 1: `GtLogReference` (URL — fungerer for ikke-omdøpte elementer)
- Fallback 2: `Title` (svakest, men dekker legacy-rader uten itemId)

Visning under hvert valg: _"Sist arkivert {dato} — {status}"_, fargekodet etter status. Hvis tittelen har endret seg siden forrige arkivering vises også _"Sist arkivert som «{gammelt navn}»"_.

**Dobbel-arkivering blokkeres ikke** — kun informert om. Bevisst valg fordi dokumenter kan spenne over flere faser.

### "Arkivstatus" i Prosjektinformasjon

Vise-komponent som leser arkiveringshistorikken (uendret fra før, kun gating endret):

- Komponent: [ArchiveStatus/index.tsx](../SharePointFramework/ProjectWebParts/src/components/ProjectInformation/ArchiveStatus/index.tsx)
- Hook: [useArchiveStatus.ts](../SharePointFramework/ProjectWebParts/src/components/ProjectInformation/ArchiveStatus/useArchiveStatus.ts)
- Plassering: inne i [ArchiveSection](../SharePointFramework/ProjectWebParts/src/components/ProjectInformation/ArchiveSection/index.tsx) under "Start arkivering"-knappen
- Synlighetsregel: `useArchive=true` _og_ historikk finnes for prosjektet (skjuler seg automatisk når tom)

Komponenten leser fra `Arkiveringslogg` via `getArchiveStatus()` og viser sist-arkivert-dato + sammenslått historikk med farge-ikoner per status. **Den endrer ingenting** — den bare viser.

### Det "ekte" feltet på prosjektet

- `GtArchiveReference` (Sak-/arkivreferanse), tekstfelt — definert i [GtArchiveReference.xml](../Templates/Portfolio/Objects/SiteFields/ProjectInformation/GtArchiveReference.xml). Settes manuelt — ingen kode oppdaterer dette feltet automatisk.
- **Ingen `GtArchiveStatus`-kolonne eksisterer.**

---

## C) `useArchive`-bryteren

Én enhetlig toggle på begge webdelene som styrer all arkiveringsfunksjonalitet:

| Webdel | Property | Effekt når `true` | Effekt når `false` |
|--------|----------|-------------------|---------------------|
| `ProjectPhases` | `useArchive` | Arkivvelger-steg vises i fasebytte-dialog | Ingen arkivering ved fasebytte |
| `ProjectInformation` | `useArchive` | "Arkivering"-seksjon med knapp + status vises | Hele seksjonen er skjult |

Hver webdel har sin egen property-instans. Admin må aktivere på begge for konsistent oppførsel. Default for begge er `false`.

`hideArchiveStatus` er fjernet — `useArchive=false` på `ProjectInformation` gir samme effekt (skjult).

---

## D) Eksterne flyter

Tredjepartsflyter (typisk Power Automate eller Logic Apps) skal trigges av **list-events på `Arkiveringslogg`** — _"When an item is created"_ med filter `GtLogStatus eq 'Til arkiv'`.

Kontrakten:

- Pp-koden skriver én rad per valgt element med status `Til arkiv`, og fyller ut alle relevante felter.
- Ekstern flyt leser raden, gjør faktisk arkivering (kopiering/flytting/Noark-overlevering), og oppdaterer `GtLogStatus` til `Arkivert` / `Feil` / `Advarsel`. Ev. setter `GtLogArchiveUrl` til destinasjonen.
- `ArchiveStatus`-komponenten plukker opp den oppdaterte raden og presenterer for bruker.

Webhook-kallet fra SPFx (`hookArchiveUrl`) er fjernet — flyt-trigging skjer nå utelukkende på listenivå. Eksisterende deployments som baserte seg på webhook-kallet må migrere flyt-triggeren.

---

## E) Sekvenser

### Fasebytte med arkivering

Fra [Actions.tsx](../SharePointFramework/ProjectWebParts/src/components/ProjectPhases/ChangePhaseDialog/Actions/Actions.tsx):

```text
ChangePhaseDialog åpnes
  ↓ sjekklistesteg (om åpne punkter finnes)
  ↓ ArchiveSelection — bruker velger dokumenter/lister (filtrert på currentPhaseId)
  ↓ ConfirmView — bruker bekrefter
  ↓ View.ChangingPhase
     1. logArchiveOperations()  → skriver "Til arkiv"-rader til Arkiveringslogg
                                  med GtLogOperation='Faseovergang' og GtLogItemId satt
     2. onChangePhase()          → updateProjectPhase() oppdaterer fase-feltet
     3. ev. usePhaseHooks().runHook() (vanlig fase-hook)
     4. lukker dialog, evt. reload
```

### Manuell arkivering

Fra [ArchiveDialog.tsx](../SharePointFramework/ProjectWebParts/src/components/ArchiveDialog/ArchiveDialog.tsx):

```text
Bruker klikker "Start arkivering" på ArchiveSection
  ↓ OPEN_DIALOG('ArchiveDialog') i ProjectInformation-state
  ↓ ArchiveDialog åpnes — useArchiveDialogData laster docs/lists/history
  ↓ ArchiveSelection — bruker velger dokumenter/lister (alle synlige)
  ↓ Confirm-view — bruker bekrefter
  ↓ writeArchiveLogEntries() → skriver "Til arkiv"-rader til Arkiveringslogg
                                med GtLogOperation='Manuell arkivering' og GtLogItemId satt
  ↓ CLOSE_DIALOG + PROPERTIES_UPDATED
```

---

## F) Oppslagstabell

| Funksjon | UI | Tjeneste | Liste / felt |
|----------|----|----------|---------------|
| Fasebytte | `ChangePhaseDialog` | `ProjectDataService.updateProjectPhase` | `GtProjectPhase` (term) på prosjektegenskaper |
| Sjekkliste | `InitialView` / `SummaryView` | `getChecklistData` | `Fasesjekkliste` |
| Arkivvalg (delt) | `ArchiveSelection` | `getDocumentsForArchive`, `getListsForArchive`, `getArchiveHistoryForItems` | `Dokumenter` + alle åpne lister |
| Manuell arkivering | `ArchiveSection` + `ArchiveDialog` | `useArchiveDialogData` + `logDocumentArchive`/`logListArchive` (op=`Manuell arkivering`) | **`Arkiveringslogg` (hub)** |
| Arkivering ved fasebytte | `ChangePhaseDialog` view `Archive` | `logArchiveOperations` (op=`Faseovergang`) | **`Arkiveringslogg` (hub)** |
| Arkivstatus i prosjektinfo | `ArchiveStatus` (inne i `ArchiveSection`) | `getArchiveStatus` (leser hub-logg) | (kun lesing) |
| Sak-/arkivreferanse | Prosjektegenskaper-skjema | (manuell) | `GtArchiveReference` |

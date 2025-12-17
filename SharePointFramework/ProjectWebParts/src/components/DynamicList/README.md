# Dynamisk listewebdel

NB! Dokumentasjonen under er generert med KI, og kan inneholde feil eller unøyaktigheter. Vennligst dobbeltsjekk informasjonen.

En fleksibel og konfigurerbar webdel for visning av data fra SharePoint-lister og dokumentbibliotek.

## Funksjoner

- **Fleksibel datakilde**: Vis data fra nåværende prosjekt, hub-område eller egendefinert område
- **Flere visningsmoduser**: Liste, rutenett, enkeltvisning og dokumentbibliotek
- **Mappehåndtering**: Full støtte for mapper i dokumentbibliotek med navigering
- **Prosjektmappe**: Automatisk opprettelse og filtrering av prosjektspesifikke mapper
- **Sorterbare kolonner**: Alle kolonner kan sorteres ved å klikke på kolonneoverskriftene
- **Flervalgsmodus**: Velg flere elementer med avkrysningsbokser
- **Justerbare kolonner**: Dra kolonnekanter for å justere bredde
- **Kommandolinje**: Valgfri verktøylinje med handlinger som oppdater, filtrer, opprett og slett
- **Responsiv**: Tilpasser seg automatisk til containerbredde
- **Redigering**: Opprett, rediger og slett elementer direkte fra webdelen
- **Filopplasting**: Last opp filer til dokumentbibliotek med dra-og-slipp
- **Taksonomifelt**: Full støtte for taksonomifelt med automatisk transformering
- **Office Online**: Filer åpnes alltid i Office Online

## Egenskaper

## Egenskaper

### Konfigurasjonsegenskaper

| Egenskap | Type | Standard | Beskrivelse |
|----------|------|---------|-------------|
| `webContextMode` | 'current' \| 'hub' \| 'custom' | 'current' | Bestemmer hvilket SharePoint-område som skal brukes: **current** (nåværende prosjekt), **hub** (porteføljeområde), eller **custom** (egendefinert URL) |
| `webUrl` | string | - | Egendefinert område-URL (brukes kun når webContextMode er 'custom') |
| `listName` | string | - | Det interne navnet på SharePoint-listen som skal vises. **Velges fra nedtrekksliste** med tilgjengelige lister |
| `viewName` | string | 'All Fields' | Visningstittel som skal brukes for feltvalg (for bakoverkompatibilitet) |
| `defaultViewId` | string | null | **Standard visnings-ID** (SharePoint element-ID). **Tar presedens over viewName**. Velges fra nedtrekksliste med tilgjengelige visninger |
| `hiddenColumns` | string[] | [] | Array med interne feltnavn som skal skjules. Hvis spesifisert, vil disse kolonnene ekskluderes fra visning. Bruk flervalgs-kontrollen i egenskapsruten for å velge kolonner som skal skjules |
| `nonFilterableColumns` | string[] | [] | Array med interne feltnavn som IKKE skal være filtrerbare. Som standard legges Note-, Date- og Number-felt automatisk til denne listen. Bruk flervalgs-kontrollen for å legge til/fjerne felt fra filtrering |
| `title` | string | - | Tittel som skal vises over listen (standard er listetittel) |
| `showSearchBox` | boolean | `false` | Vis/skjul søkeboks for filtrering av elementer |
| `mode` | 'multi' \| 'single' | 'multi' | Visningsmodus: flervalgs-liste eller enkeltvisning |
| `documentLibraryViewMode` | 'folders' \| 'flat' | 'folders' | Visning for dokumentbibliotek: 'folders' for mappenavigering, 'flat' for alle dokumenter i én liste |
| `showCommandBar` | boolean | `true` | Vis/skjul kommandolinjen med handlinger |
| `showFilters` | boolean | `false` | Aktiver filterpanel |
| `useProjectContentColumnNames` | boolean | `true` | Bruk kolonnenavn fra ProjectContentColumns (Prosjektinnholdskolonner). Hvis false, brukes navn direkte fra listen/biblioteket |
| `useSiteIdFiltering` | boolean | `false` | Aktiver filtrering basert på GtSiteId-felt. Når aktivert, vises kun elementer som matcher nåværende områdets ID |
| `useProjectFolder` | boolean | `false` | For dokumentbibliotek: Opprett og bruk prosjektspesifikk mappe. Når aktivert, opprettes en mappe med områdets tittel og brukes som rot ved oppretting/opplasting av filer |
| `showNewButton` | boolean | `true` | Vis/skjul "Ny"-knappen for å opprette nye listeelementer |
| `showEditButton` | boolean | `true` | Vis/skjul "Rediger"-knappen for å redigere valgte elementer |
| `showDeleteButton` | boolean | `true` | Vis/skjul "Slett"-knappen for å slette valgte elementer |
| `showRefreshButton` | boolean | `true` | Vis/skjul "Oppdater"-knappen for å laste data på nytt |
| `showExportButton` | boolean | `true` | Vis/skjul "Eksporter til Excel"-knappen |
| `showUploadButton` | boolean | `true` | Vis/skjul filopplastingsalternativet i dokumentbibliotek |
| `showNewWordButton` | boolean | `true` | Vis/skjul "Nytt Word-dokument"-alternativet i dokumentbibliotek |
| `showNewExcelButton` | boolean | `true` | Vis/skjul "Nytt Excel-dokument"-alternativet i dokumentbibliotek |
| `showNewPowerPointButton` | boolean | `true` | Vis/skjul "Nytt PowerPoint-dokument"-alternativet i dokumentbibliotek |
| `showViewModeToggle` | boolean | `true` | Vis/skjul veksleknappen for mappe-/flat visning i dokumentbibliotek |
| `showViewSelector` | boolean | `false` | Vis/skjul visningsvelgeren i verktøylinjen |
| `infoText` | string | - | Tilleggsinformasjon som skal vises |
| `minHeight` | number \| string | - | Minimum høyde for komponentbeholderen (f.eks. '500px' eller '50vh') |

### Visningsvalg

Webdelen støtter visningsvalg på samme måte som PortfolioOverview, der **defaultViewId tar presedens** over viewName.

#### Prioritet for kolonnevalg

1. **hiddenColumns** (hvis spesifisert) - Skjuler valgte kolonner fra visningen
2. **defaultViewId** (hvis spesifisert) - Bruker kolonner fra SharePoint-visning med gitt ID
3. **viewName** (hvis spesifisert) - Bruker kolonner fra visning med gitt tittel (bakoverkompatibilitet)
4. **"All Fields"** (standard) - Viser alle listens felt

#### Alle felt (standard)

- Henter alle felt direkte fra listens feltsamling
- Filtrerer: `Hidden eq false and ReadOnlyField eq false`
- Viser alle redigerbare, ikke-systemfelt
- Ingen spesifikk rekkefølge (alfabetisk som standard)

#### Spesifikk visning (etter ID eller tittel)

- Henter kun felt inkludert i den valgte visningen
- Respekterer visningens feltrekkefølge
- Ideelt for å vise spesifikke delsett av felt
- Standardvisningen merkes med "(Standard)"-merkelapp
- Bruker SharePoint visnings-ID for pålitelig identifikasjon

### Visningsmoduser

#### Flervalgs-modus (`mode: 'multi'`)

- Standardmodus for visning av flere elementer
- Viser data i et sorterbart, justerbart rutenett
- Støtter flervalgsmodus og massehandlinger
- Paginering for store lister
- Best for: Oppgaver, problemer, dokumenter, enhver liste med flere elementer

#### Enkeltvisning (`mode: 'single'`)

- Viser ett element i en detaljert felt-for-felt-visning
- Rutenettoppsett med responsive kolonner (450px minimum)
- Rediger- og slett-handlingsknapper
- Filtrerer automatisk ut systemfelt
- Best for: Innstillinger, konfigurasjon, områdeinformasjon, enhver liste med én post

**Merk:** Når en liste bare har ett element, bytter modusen automatisk til 'single' selv om den ikke er eksplisitt konfigurert.

#### Dokumentbibliotek-modus

Aktiveres automatisk når den valgte listen er et dokumentbibliotek.

**Visningsmoduser for dokumentbibliotek:**

- **Mappevisning** (`documentLibraryViewMode: 'folders'`): Standard. Viser mapper og filer med full navigering og brødsmuler
- **Flat visning** (`documentLibraryViewMode: 'flat'`): Viser alle dokumenter i én liste uten mappehierarki

**Funksjoner i dokumentbibliotek:**

- Filopplasting med dra-og-slipp (støtter ubegrenset mappedybde)
- Opprett nye dokumenter fra maler (Word, Excel, PowerPoint)
- Mappenavigering med brødsmuler
- Filer åpnes alltid i Office Online (Word Online, Excel Online, PowerPoint Online)
- Prosjektmappe-funksjonalitet for prosjektspesifikk filorganisering

## Bruk

### Grunnleggende oppsett

1. Legg til webdelen på en SharePoint-side
2. Rediger webdelens egenskaper
3. **Velg en områdemodus** for å bestemme hvor listen befinner seg:
   - **Gjeldende prosjekt** (Current Project): Bruker nåværende prosjektområde
   - **Porteføljeområde (hub)** (Hub Site): Bruker porteføljens hub-område som prosjektet er tilkoblet til
   - **Egendefinert område** (Custom Site): Lar deg spesifisere en egendefinert SharePoint-område-URL
4. **(Hvis Egendefinert område er valgt)** Skriv inn full SharePoint-område-URL
5. **Velg en liste** fra nedtrekkslisten - alle tilgjengelige lister fra det valgte området vises med elementtall
6. **Velg en visning** for å bestemme hvilke felt som skal vises:
   - **All Fields** (standard): Viser alle ikke-skjulte, redigerbare felt fra listen
   - **Spesifikk visning**: Viser kun feltene inkludert i den valgte visningen, i visningens rekkefølge
7. Konfigurer visningsalternativer etter behov

Webdelen henter automatisk alle tilgjengelige lister og visninger fra det valgte området og viser dem i nedtrekkslister for enkel valg.

## Datahenting

Webdelen håndterer automatisk:

- Henting av alle listeelementer
- Henting av kolonnemetadata
- Transformering av oppslags- og personfelt for visning
- Håndtering av flerverdifelt
- Taksonomifelt-transformering for korrekt visning og redigering

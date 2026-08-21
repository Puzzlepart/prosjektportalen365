# Plan: Oppdatere Prosjektportalen 365 til Prosjektveiviseren v6

## Kontekst

Prosjektportalen 365 (PP365) er tuftet på Prosjektveiviseren, men innholdet stammer fra en
tidligere versjon: dokumentmalene i `Malbibliotek` er merket v3.0/v4.0, og de 44
fasesjekkpunktene og 66 prosjektoppgavene er formulert etter den gamle aktivitetsstrukturen.
Digdir har siden gitt ut versjon 6, som både omformulerer aktiviteter, endrer sentral
terminologi (gevinst → nytte) og innfører nye konsepter (bærekraft som styringsparameter,
smidig/produktorientert gjennomføring, endrings- og kommunikasjonsledelse, oppdaterte
rollebeskrivelser).

Dette er allerede erkjent i repoet som [issue #1044 "Oppdater malverk fra Prosjektveiviseren 6"](https://github.com/Puzzlepart/prosjektportalen365/issues/1044)
(åpen siden mars 2023, milestone 1.14.0), men uten en gjennomføringsplan.

**Avklart omfang:**

| Spørsmål | Valg |
|---|---|
| Ambisjonsnivå | Innhold **+** nye v6-konsepter (ikke full modellrevisjon) |
| Leveransemål | PP365 kjerneprodukt, via release — alle virksomheter får det ved oppgradering |
| Dokumentmaler | Bytt til nye v6-filer fra Digdir |
| Innføringsstrategi | **Side om side** — v6-innhold i nye lister, eksisterende lister beholdes urørt, virksomheten velger selv |

**Uttrykkelig utenfor omfang:** endring av fasenavn, faserekkefølge, fase-GUID-er eller
beslutningspunktstrukturen. Se «Hvorfor vi ikke rører fasestrukturen». Endring av
**interne** feltnavn er også utenfor omfang — se område C.

**Ønsket utfall:** en virksomhet som oppgraderer PP365 får v6-innhold tilgjengelig, kan velge
det per prosjektmal, og mister ingenting av sine egne tilpasninger. Ingen duplikater oppstår,
fordi ingen eksisterende rad endres.

**Status (per fr 21.8, port M2 passert):** områdene A–G, J og innholdsdelene av H/I er
gjennomført på branchen `claude/prosjektportalen-v6-update-70sbom` — se beslutningsloggen i
`docs/prosjektveiviseren-v6/README.md`. Gjenstår: område K (kolonnekonfig for G,
UpgradeAllSitesToLatest, frivillig opprydding), E2E-test i testleietaker (uke 35) og
område L (release).

---

## Forutsetning: tilgang til v6-kildematerialet — ✅ LØST 2026-08-06

Egress-blokkeringen av `prosjektveiviseren.digdir.no` som tidligere lå i utviklingsmiljøet
er ikke lenger aktiv. Hele nettstedet (74 innholdssider) ble hentet automatisk 2026-08-06 og
ligger ordrett i `docs/prosjektveiviseren-v6/kilder/`, strukturert i
`docs/prosjektveiviseren-v6/kildesett-v6.md`. Dokumentmalene (11 filer) er lastet ned og
filnavnene verifisert. Kildeinnhentingen som fremdriftsplanen la på PL i uke 32 er dermed
gjort; PLs rolle i område A endres til å **verifisere og godkjenne** mappingtabellene.

### Verifisert mot kilden (v6.0, publisert juni 2026)

Terminologifasiten står i `docs/prosjektveiviseren-v6/mapping-terminologi.csv`. Hovedpunkter:

- ✅ **«nyttevirkninger» erstatter «gevinster»** — men «gevinster» omtales fortsatt
  sekundært, ofte i parentes («nyttevirkninger (gevinster)»).
- ✅ **«plan for nyttestyring»** — malen heter eksakt «Plan for nyttestyring - gevinstrealisering».
- ❌ **Antagelsen om «nytteansvarlig» var feil vei:** v6 har snudd hierarkiet.
  **Nytteeier** (tidligere gevinst*eier*) er nå den overordnede rollen; «nytteansvarlig» er
  en delegert underrolle. PP365s «Gevinstansvarlig» svarer semantisk til v6s «Nytteeier».
  Egen M1-beslutning (TERM-003/004).
- ✅ Sju styringsparametere: **nyttevirkninger, kostnader, tid, kvalitet, omfang, bærekraft,
  risiko**. Ny planleggingsaktivitet «Definere akseptansekriterier for styringsparametrene».
- ✅ Smidig: tre egne sider + smidige roller (produkteier, produktsjef, smidig coach,
  tverrfaglig smidig team) og egen begrepsseksjon.
- ✅ Endringsledelse og kommunikasjon styrket; KI nytt tema med egen side.
- ⚠ **Flere antatte «v6-nyheter» er gamle:** samfunnsøkonomisk analyse avviklet som aktivitet
  allerede i v2.6 (2017); faseovergangsaktivitetene kom i v3.1 (2018). Mappingen må
  sammenligne faktisk tekst, ikke anta at alt er nytt.
- ⚠ **v6 har bare 25 aktiviteter + 6 BP-er** (mot PP365s 44 sjekkpunkter + 66 oppgaver) —
  aktivitetene er bredere, med «bør avklare»-lister som brytes ned i mappingen.
- ⚠ **Ingen nynorskversjoner av v6-malene hos Digdir** — åpen sak til M1 (berører område F).
- ✅ URL-struktur: `god-praksis-og-tilpasning/`, `godt-vite/`, `ta-i-bruk/`. Gamle
  `god-praksis/gevinster/116` gir 403. Alle dyplenker må testes (område J).
- «Ledelsesprodukter» utgått som struktur — erstattet av styringsdokumentasjon /
  produktdokumentasjon / øvrig prosjektdokumentasjon.

---

## Slik henger innholdet sammen i PP365

Fire lag, og det er avgjørende å vite hvilket lag man endrer:

```
1. TAKSONOMI      Templates/Taxonomy/Taxonomy.xml
                  Termsett "Fase" (abcfc9d9-…) med LocalCustomProperties:
                  PhaseSubText, PhaseDescription (+ _en-us). Også "Rolle", "Tjenesteområde".
                  ⚠ Install.ps1 hopper over Taxonomy ved -Upgrade

2. STRUKTUR (hub) Templates/Portfolio/Objects/{SiteFields,ContentTypes,Lists,ClientSidePages}/
                  Strenger via {resource:Key} → Resources.{no-NB,en-US}.resx

3. INNHOLD (hub)  Templates/Content/Portfolio_content.{no-NB,en-US}/…xml
                  ★ Fasesjekkliste: 44 DataRows   ★ Planneroppgaver: 66 DataRows
                  ★ Malbibliotek: 22 Office-filer som <pnp:File> (kun no-NB)

4. PROSJEKTMAL    Templates/JsonTemplates/_JsonTemplate{Project,Program,Parent}.json
                  Lager listene på prosjektområdet. Innholdet kopieres FRA hub
                  ved provisjonering (Listeinnhold → CopyListData).
```

### Den avgjørende mekanikken: hvordan innhold når et prosjektområde

`SharePointFramework/shared-library/src/models/ContentConfig.ts`:

```ts
get sourceList()      { return this.web.lists.getByTitle(this._sourceListName) }      // HUB
get destinationList() { return this._sp.web.lists.getByTitle(this._destinationListName) } // PROSJEKT
```

**Lister slås opp på visningstittel, ikke på URL.** Dette er premisset hele område B hviler på,
og samtidig den største fellen: gir vi en ny hub-liste tittelen «Fasesjekkliste», vil
`getByTitle('Fasesjekkliste')` treffe den nye listen for *alle* som ikke er migrert.

### Fem koblinger som må respekteres

1. `GtProjectPhase` lagres som `Navn|GUID` (`Konsept|99e85650-…`).
2. `GtCategory` på Planneroppgaver lagres som **ren fasenavn-streng** uten GUID.
3. `ProjectPhaseModel.getFilteredPhaseChecklistViewUrl()` filtrerer på fasens **visningsnavn**.
   Punkt 1–3 er tilsammen grunnen til at vi ikke rører fasenavn.
4. `<pnp:DataRows KeyColumn="Title" UpdateBehavior="Skip">` — nøkkelen er *tittelen*. Endret
   ordlyd = ny rad. Område B eliminerer dette som risiko, ved at ingen eksisterende rad endres.
5. `Resources.*.resx` genereres videre til `SharePointFramework/*/src/loc/shared/`
   (gitignorert) — resx-endringer krever `npm run build` i `Templates/` og rebuild av SPFx.

---

## Tilnærming

### Rollefordeling

| Rolle | Eier |
|---|---|
| **Prosjektleder** | Faglige beslutninger: hvilke sjekkpunkter og oppgaver, ordlyd, fasetilhørighet, terminologivalg. Skaffer v6-kildematerialet. Godkjenner mappingtabellen. Tester i testleietaker. |
| **AI** | Ekstraherer v6-innhold til strukturert form. Foreslår gammel→ny-mapping med begrunnelse. Genererer PnP-XML for begge språk. Oversetter nb→en. Konsistenssjekker. Utkast til releasenotes. |
| **Teknisk ressurs** | Repo-mekanikk, resx og byggekjede, ny listearkitektur, nye kolonner/innholdstyper, oppgraderingsskript, release og smoketest. |

### Metodisk kjerne: mappingtabellen

Ikke rediger XML direkte. Innfør et menneskelesbart mellomprodukt som blir arbeidsdokumentet
og senere revisjonssporet:

```
docs/prosjektveiviseren-v6/
  README.md                  Kildehenvisninger, v6-versjonsdato, beslutningslogg
  kildesett-v6.md            v6-aktiviteter og beslutningspunkter per fase, ordrett fra Digdir
  mapping-sjekkpunkter.csv
  mapping-oppgaver.csv
  mapping-terminologi.csv    ← gammelt begrep → v6-begrep → berørte resx-nøkler
```

CSV-format for innhold:

```csv
id,fase,gammel_tittel,ny_tittel,handling,sortorder,v6_kilde,begrunnelse
```

`handling` ∈ `behold` | `omformuler` | `ny` | `fjern` | `flytt-fase`

Selv om side-om-side-strategien (område B) fjerner duplikatrisikoen, er `handling` fortsatt
verdifull: den dokumenterer *hva som skjedde med* hvert gammelt punkt, som er det
prosjektledere trenger når de skal vurdere om de vil bytte.

**Generator:** `assets/scripts/Generate-V6ContentRows.js` — engangsskript som leser CSV-ene og
skriver `<pnp:DataRows>`-blokkene for `no-NB` og `en-US`. Ligger sammen med de øvrige
hjelpeskriptene (`Set-ListDataRows.ps1`, `Add-ResxEntry.ps1`). Ikke del av byggekjeden.

### Sorteringsnummerering

Dagens `GtSortOrder` går 10–440 i steg på 10. I den nye listen: renummerer i steg på **100**,
gruppert per fase. Da kan v7 sette inn punkter uten å renummerere alt.

### Hvorfor vi ikke rører fasestrukturen

v6 beholder fasestyringen; det er aktivitetene og temaene som endres. Å endre fasenavn ville
krevd samtidig oppdatering av termsett-labels, alle 110 `GtProjectPhase`/`GtCategory`-verdier,
`GtProjectPhaseText`, `Choice_GtProjectPhaseChoice_*` i to resx-filer,
`getFilteredPhaseChecklistViewUrl()`, `Maloppsett.GtProjectPhaseTermId`, samt migrering av
hver installasjons termstore og listedata. Kostnad og risiko står ikke i forhold til gevinsten.
Fasetekstene (`PhaseSubText`, `PhaseDescription`) oppdateres derimot — de er fritekst uten
referanser.

---

## Område for område

| | Område | Eier | Avhengighet |
|---|---|---|---|
| A | v6-baseline og mappingtabell | PL + AI | blokkerer alt |
| B | Ny listearkitektur (side om side) | Teknisk | A |
| C | Terminologi og felt: gevinst → nytte | Teknisk + PL | A |
| D | Fasesjekkpunkter | AI + PL | A, B |
| E | Prosjektoppgaver | AI + PL | A, B |
| F | Dokumentmaler | PL + Teknisk | A |
| G | Bærekraft og omfang som styringsparametere | Teknisk + PL | A |
| H | Endrings- og kommunikasjonsledelse | PL + AI | D, E |
| I | Smidig / produktorientert gjennomføring | PL + AI | D, E |
| J | Fasetekster, roller, tjenesteområder, lenker | PL + AI | A |
| K | Oppgraderingssti | Teknisk | B–G låst |
| L | Release | Teknisk | alt |

---

### A. v6-baseline og mappingtabell  ·  *blokkerende*

**Hva:** Etabler fasiten. ~~Prosjektlederen henter fra Digdir~~ **Gjort 2026-08-06:** alle
aktivitetssider per fase, beslutningspunktsidene, styringsparametere, smidig, nyttestyring,
begrepssiden, rollebeskrivelsene og dokumentmalene er hentet automatisk og strukturert i
`kildesett-v6.md`. Digdir tilbyr **ikke** nynorskversjoner av v6-malene (åpen sak til M1).
Gjenstår: AI fyller ut `mapping-sjekkpunkter.csv` og `mapping-oppgaver.csv`; PL verifiserer
og godkjenner (M1).

**Terminologien er verifisert** (se `mapping-terminologi.csv` for fasit med kildebelegg):

- «Nyttevirkning(er)» er hovedbegrepet; «gevinster» omtales fortsatt sekundært.
- «Gevinstansvarlig» er **ikke** omdøpt til «nytteansvarlig» — v6 har snudd hierarkiet:
  «Nytteeier» (tidligere gevinsteier) er den overordnede rollen, «nytteansvarlig» en
  delegert underrolle. TERM-003/004 er M1-beslutninger.
- Malen heter «Plan for nyttestyring - gevinstrealisering».
- «Gevinstrealisering» er erstattet av «nyttestyring» som begrep; fasenavnet «Realisere»
  røres uansett ikke (kun undertekst, område J).

**Referansepunkter i dag:**
- 44 sjekkpunkter: `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml`
  linje ~197–420 (Idé 7, Konsept 10, Planlegge 10, Gjennomføre 7, Avslutte 8, Realisere 2)
- 66 oppgaver: samme fil fra linje ~421 (Idé 10, Konsept 17, Planlegge 12, Gjennomføre 11,
  Avslutte 12, Realisere 4)
- 76 resx-verdier i `Resources.no-NB.resx` inneholder «gevinst»

**Ferdig når:** hver av de 110 radene har en `handling`, alle v6-aktiviteter er representert,
terminologitabellen er verifisert mot kilden, PL har godkjent, og v6-versjonsdato er i README.

**Merk:** Prosjektveiviseren-innhold gjenbrukes under Digdirs vilkår (NLOD). Dokumentmalene
lastes ned fra Digdir, ikke gjenskrives.

---

### B. Ny listearkitektur — v6-innhold side om side  ·  *strukturelt fundament*

**Hva:** Fremfor å endre eksisterende rader, provisjoneres v6-innholdet i **nye hub-lister**.
Eksisterende lister beholdes urørt under nytt visningsnavn. Virksomheten velger per prosjektmal
hvilket sett som skal brukes, via `Listeinnhold` og `Maloppsett`.

**Hvorfor dette løser problemet:** ingen eksisterende rad endres → `KeyColumn="Title"` skaper
ingen duplikater. Ingen eksisterende rad slettes → egne tilpasninger overlever. Virksomheten
bytter når *de* er klare, ikke når de oppgraderer.

#### Splittet gjelder kun hub-siden

Prosjektområdets `Fasesjekkliste` er destinasjonen og forblir én liste med uendret navn og URL.
Det er *kilden* som blir to. Dermed berøres **ikke**: venstremenyen i prosjektmalen,
`Prosjekttillegg/EnkelVenstremeny.json` og `EnkeltProsjekt.json` (som hardkoder
`Lists/Fasesjekkliste/AllItems.aspx`), `Hjelpeinnhold.xml`, eller
`getFilteredPhaseChecklistViewUrl()`.

#### Navnestruktur

| Nivå | Visningstittel | URL | resx-nøkkel |
|---|---|---|---|
| Hub, gammel | Fasesjekkliste (tidligere) | `Lists/Fasesjekkliste` *(uendret)* | `Lists_PhaseChecklistLegacy_Title` / `_Url` |
| Hub, ny | Fasesjekkliste | `Lists/Fasesjekklistev6` | `Lists_PhaseChecklistV6_Title` / `_Url` |
| Prosjekt | Fasesjekkliste | `Lists/Fasesjekkliste` *(uendret)* | `Lists_PhaseChecklist_Title` / `_Url` *(uendret)* |
| Hub, gammel | Planneroppgaver (tidligere) | `Lists/Planneroppgaver` *(uendret)* | `Lists_PlannerTasksLegacy_Title` / `_Url` |
| Hub, ny | Planneroppgaver | `Lists/Planneroppgaverv6` | `Lists_PlannerTasksV6_Title` / `_Url` |

Planneroppgaver har ingen motsvarende liste på prosjektområdet — destinasjonen er
Planner-planen «Prosjektoppgaver» via `GtPlannerName`. Splittet er derfor enklere der.

#### ⚠ Resx-nøkkelen `Lists_PhaseChecklist_Title` må splittes

Denne nøkkelen brukes i dag av **både** hub-listen
(`Templates/Portfolio/Objects/Lists/Fasesjekkliste.xml`) **og** prosjektområdets liste
(`_JsonTemplateProject.json:776`, `_JsonTemplateProgram.json:941`). Endrer man verdien til
«Fasesjekkliste (tidligere)», omdøpes prosjektområdets liste også. Nøklene må derfor skilles
først, som vist i tabellen over: `Lists_PhaseChecklist_*` beholdes og betyr heretter
*prosjektområdets destinasjonsliste*.

#### Listeinnhold — konfigurasjonspunktet

`Templates/Portfolio/Objects/Lists/Listeinnhold.xml` seeder i dag tre rader. Etter splittet:

| Rad | Kilde (hub) | Destinasjon | Merknad |
|---|---|---|---|
| Fasesjekkpunkter (tidligere) | Fasesjekkliste (tidligere) | Fasesjekkliste | eksisterende rad, oppdatert i migrering |
| Fasesjekkpunkter | Fasesjekkliste | Fasesjekkliste | ny |
| Planneroppgaver (tidligere) | Planneroppgaver (tidligere) | plan «Prosjektoppgaver» | eksisterende rad, oppdatert |
| Planneroppgaver | Planneroppgaver | plan «Prosjektoppgaver» | ny |
| Tidslinje | Tidslinjeelementer | – | uendret |

`Maloppsett.ListContentConfigLookup` er en **LookupMulti mot Listeinnhold på ID**. Oppdaterer
migreringsskriptet den eksisterende raden *på plass* (samme ID), overlever alle
malkonfigurasjoner uendret. Det er derfor migreringen skal endre raden, ikke erstatte den.

#### ⚠ Rekkefølge i migreringen er kritisk

SharePoint krever unike listetitler innenfor et område. Den gamle listen **må** døpes om før
PnP-malen oppretter den nye med tittelen «Fasesjekkliste». Rekkefølgen blir:

1. `Install/Scripts/PreInstallUpgrade.ps1` — døp om hub-listene:
   «Fasesjekkliste» → «Fasesjekkliste (tidligere)», «Planneroppgaver» → «Planneroppgaver (tidligere)».
   **Kun `Title`. URL-en står.**
2. `PreInstallUpgrade.ps1` — oppdater de eksisterende `Listeinnhold`-radene på plass:
   `Title` → «… (tidligere)», `GtLccSourceList` → den nye tittelen.
3. Portfolio.pnp og innholdsmalen kjører — oppretter de nye listene og de nye Listeinnhold-radene.
4. `PostInstallUpgrade.ps1` — verifiser at ingen malkonfigurasjon utilsiktet har byttet kilde.

Blir steg 1 hoppet over, treffer `getByTitle('Fasesjekkliste')` den nye v6-listen og alle
virksomheter bytter innhold uten å ha bedt om det. Dette er det ene stedet i hele planen der
rekkefølgefeil gir stille datafeil.

#### Standardvalg

- **Ren installasjon:** v6-radene er default (`GtLccDefault`), og `PostInstall.ps1` kobler
  dem til Standardmal.
- **Oppgradering:** behold virksomhetens eksisterende valg. v6 blir *tilgjengelig*, ikke
  påtvunget. `PostInstall.ps1` sitt `$ListContentMap` (som matcher på tittel) må oppdateres
  til de nye nøklene, og oppgraderingsstien må ikke re-koble `ListContentConfigLookup` på
  eksisterende Maloppsett-rader.

#### Navnekonvensjon for framtiden

`v6`-suffikset gjentar problemet ved v7. Etabler konvensjonen nå og dokumenter den i
`docs/prosjektveiviseren-v6/README.md`: ny liste får versjonssuffiks i URL
(`Lists/Fasesjekklistev6`), forrige generasjon får «(tidligere)» i visningstittelen, og det
finnes til enhver tid maksimalt to generasjoner. Ved v7 slettes v5-generasjonen.

#### Filer

- `Templates/Portfolio/Objects/Lists/Fasesjekkliste.xml` — bytt til `_Legacy`-nøklene
- `Templates/Portfolio/Objects/Lists/Fasesjekklistev6.xml` — **ny**, kopi med `_V6`-nøkler
- `Templates/Portfolio/Objects/Lists/Planneroppgaver.xml` + `Planneroppgaverv6.xml` — tilsvarende
- `Templates/Portfolio/Objects/Lists/@.xml` — registrer de to nye
- `Templates/Portfolio/Objects/Lists/Listeinnhold.xml` — to nye `DataRow`s
- `Templates/Portfolio/Objects/ClientSidePages/Konfigurasjon.xml` — konfigurasjonssiden på hub
  lenker i dag til `{resource:Lists_PhaseChecklist_Url}` og `Lists_PlannerTasks_Url`; pek på
  v6-listene og vurder å vise begge generasjoner
- `Templates/Portfolio/Resources.{no-NB,en-US}.resx` — nye nøkler
- `Install/Scripts/PreInstallUpgrade.ps1`, `PostInstall.ps1`, `PostInstallUpgrade.ps1`

**Ferdig når:** ren installasjon gir to hub-lister der den nye har v6-innhold; oppgradering av
en v1.13-installasjon endrer ingen eksisterende rad; et prosjekt opprettet etter oppgradering
med uendret malkonfigurasjon får nøyaktig samme innhold som før.

#### Samme prinsipp for dokumentmaler

`Malbibliotek` har ingen tilsvarende konfigurasjonsmekanisme — `Maloppsett.GtDocumentTemplateLibrary`
peker på et *bibliotek*, ikke en mappe. Bruk derfor mappe-nivå: v6-filene provisjoneres til
`Malbibliotek/Fra Prosjektveiviseren (v6)`, mens `Malbibliotek/Fra Prosjektveiviseren` blir
stående med dagens innhold. Brukeren ser begge og velger selv. Se område F.

---

### C. Terminologi og felt: gevinst → nytte  ·  *størst tekstflate*

**Hva:** v6 bytter «gevinst» mot «nytte». PP365 har 76 resx-verdier med «gevinst», ni
`Gt*`-felt med Gain/Benefit i navnet, fire gevinstlister på prosjektområdet, en egen
`Gevinstoversikt.aspx`, en rolle «Gevinstansvarlig» i taksonomien, og tre dokumentmaler.

#### Det bærende skillet: visningsnavn kan endres, interne navn kan ikke

| | Kan endres trygt | Kan ikke endres |
|---|---|---|
| Felt | `DisplayName` (fra resx) | `StaticName`/`Name` (`GtGainsOwner`, `GtStatusGainAchievement`, …), felt-GUID |
| Liste | `Title` | `Url` |
| Side | tittel | filnavn (`Gevinstoversikt.aspx`) |
| Innholdstype | `Name` | `ID` |

Interne feltnavn er referert fra OData-spørringer, visninger, `ViewQuery`-XML,
`_JsonTemplate*.json`, datakilder (`Lists_DataSources_Category_BenefitOverview*`) og
webdeler. Å endre dem betyr å slette og gjenopprette felt — datatap på hver eksisterende
installasjon. **Det gjør vi ikke.** `GtStatusGainAchievement` heter fortsatt
`GtStatusGainAchievement` i 2030; brukeren ser «Nytteoppnåelse».

Praktisk konsekvens: dette området er i all hovedsak et **resx-arbeid**, ikke et
strukturarbeid. Det gjør det stort i omfang, men lavt i risiko.

#### Gjennomføring

1. **`mapping-terminologi.csv`** fra område A er fasiten. Én rad per begrepspar med berørte
   resx-nøkler.
2. **Resx, begge språk.** Norsk endres reelt; engelsk `Benefit*` er allerede nær «benefit»
   og trenger sannsynligvis lite. Nøkkelfamilier som berøres:
   `Lists_Benefits*`, `Navigation_Benefits*`, `ClientSidePages_*BenefitOverview_*`,
   `ContentTypes_Benefit*`, `Choice_GtStatusGainAchievement_*`, `Choice_GtGainsType_*`,
   `Choice_GtIdea{Economic,Quality}Benefit_*`, `Lists_StatusSections_StatusGainAchievement_Title`,
   `ListFields_GainLookup_*`, `Lists_ProjectColumnConfiguration_GtStatusGainAchievement_*`,
   `Lists_HelpContent_Benefit*`, `Lists_DataSources_Category_BenefitOverview*`.
   ⚠ `*_Url`- og `*_PageName`-nøkler skal **ikke** endres.
3. **SPFx-loc:** kun tre treff på «gevinst» i `nb-no.js`-filene — lite arbeid, men nøkkelsettet
   må forbli identisk i `nb-no.js`, `en-us.js` og `mystrings.d.ts`.
4. **Rollene Gevinstansvarlig/Gevinsteier** *(korrigert 2026-08-20)*: antagelsen om et
   `Rolle`-termsett i taksonomien var feil — `Taxonomy.xml` har ikke noe slikt termsett.
   Begge rollene er visningsnavn på **personfelt** (`GtGainsResponsible`/`GtGainsOwner`,
   `Type="User"`), så omdøping er en ren resx-endring uten datakonsekvens.
   **Besluttet (TR):** `GtGainsResponsible` («Gevinstansvarlig») → «Nytteeier»; forslag
   `GtGainsOwner` («Gevinsteier») → «Nytteansvarlig» (bekreftes i M1). Ingen migrering av
   data eller termer der gamle begreper er brukt. Den eneste reelle taksonomitermen med
   «gevinst» i navnet er «Forventede gevinster» (dokumentkategori, bygg) — den omdøpes i
   `Taxonomy.xml` for nyinstallasjoner, men røres ikke av oppgraderingsløpet
   (`Install.ps1` hopper uansett over Taxonomy ved `-Upgrade`, og oppgraderingsmalen
   `1.14.0` skal ikke endre termnavn).
   Merk [issue #162](https://github.com/Puzzlepart/prosjektportalen365/issues/162): skillet
   mellom overordnet rolle og eier av enkeltgevinst er bevisst, og bevares — v6-navnene
   krysser bare navnelinjene (se `mapping-terminologi.csv` TERM-003/004).
5. **Dokumentmaler:** `Gevinstrealiseringsplan_v4.0.docx` erstattes trolig av «Plan for
   nyttestyring». Håndteres i område F.
6. **Fasen «Realisere»** har engelsk label «Benefits realization» og
   `PhaseSubText` «Realisere mål og gevinster». Fasenavnet (`Realisere`) står; underteksten
   oppdateres i område J.

#### Nye felt

Terminologiendringen i seg selv krever ingen nye felt. Nye felt kommer fra område G
(bærekraft, omfang). Skulle område A avdekke at v6 innfører et nytt nyttebegrep som ikke har
en kolonne i dag — for eksempel et skille mellom nyttevirkning og kostnadsvirkning — følges
samme mønster som i område G: nytt `Gt*`-felt med ny GUID, registrert i `SiteFields/@.xml`,
lagt inn i berørte innholdstyper og speilet i `_JsonTemplate*.json`.

**Ferdig når:** ingen brukervendt streng bruker «gevinst» der v6 bruker «nytte»; ingen internt
feltnavn, liste-URL eller sidefilnavn er endret; `npm run validate-loc` og
`validate-project-template` er grønne.

---

### D. Fasesjekkpunkter  ·  *inn i den nye listen*  ·  ✅ GJENNOMFØRT 2026-08-21

**Hva:** v6-sjekkpunktene provisjoneres til `Fasesjekklistev6`. Konseptfasens punkter knyttes
til de seks obligatoriske spørsmålene i utredningsinstruksen. Nye punkter for faseoverganger
(start av planleggings-, gjennomførings- og avslutningsfasen) og for avslutningsanbefaling i BP4.
Bruk v6-terminologi fra område C.

**Levert:** den godkjente `mapping-sjekkpunkter.csv` er avledet til fasiten
`docs/prosjektveiviseren-v6/innhold-sjekkpunkter.csv` — **63 sjekkpunkter**
(Idé 8, Konsept 9, Planlegge 16, Gjennomføre 12, Avslutte 12, Realisere 6; 5 fjernet,
3 slått sammen ved faseflytting, 27 nye fra BP-vurderingslistene) — og generert inn i begge
innholdsmalene med `Generate-V6ContentRows.js`. Global `GtSortOrder` i 100-steg (100–6300);
innenfor hver fase kommer videreførte punkter først (gammel rekkefølge), deretter de nye.

**Filer:**
- `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml` — ny
  `<pnp:ListInstance Title="Fasesjekkliste" Url="Lists/Fasesjekklistev6">` ✔; den eksisterende
  blokken uendret med `Title` «Fasesjekkliste (tidligere)» ✔ (gjort i område B).
- `Templates/Content/Portfolio_content.en-US/Portfolio_content.en-US.xml` — tilsvarende ✔

**Krav:** Identisk radtall og `GtSortOrder` i de to språkfilene. `GtProjectPhase` beholder
`Navn|GUID`-formatet med GUID-ene fra `Templates/Taxonomy/Taxonomy.xml`. Ingen duplikate
`Title` innenfor listen.

---

### E. Prosjektoppgaver  ·  *inn i den nye listen*  ·  ✅ GJENNOMFØRT 2026-08-21

**Hva:** Oppgavene er «oversettelsen» av sjekkpunktene til handlinger og må holdes i takt med D.

**Levert:** PL leverte fasiten som regneark (26 oppgaver med beskrivelse og sjekkliste per
oppgave — bredere oppgaver enn de gamle 66, i tråd med v6s aktivitetsstruktur). Konvertert
til `docs/prosjektveiviseren-v6/innhold-oppgaver.csv` (begge språk, én kilde) og generert
inn i begge innholdsmalene med `assets/scripts/Generate-V6ContentRows.js`:
`<pnp:ListInstance Title="Planneroppgaver" Url="Lists/Planneroppgaverv6">` med feltene
Title, GtDescription, GtCategory, GtSortOrder og GtChecklist — beskrivelse og sjekkliste
flyter til Planner-oppgavene via `CopyListData`.

**Krav:** `GtCategory` er **ren fasenavn-streng** (`Idé`, `Konsept`, …) — ikke `Navn|GUID`.
~~Behold konvensjonen med BP-numre i klartekst i oppgavetitlene.~~ **Besluttet 2026-08-21:**
BP-oppgavene utgår — beslutningspunktene er implisitte i fasesjekklisten, som er sjekkpunktenes
domene (D).

---

### F. Dokumentmaler  ·  ✅ GJENNOMFØRT 2026-08-21 *(nynorsk-avklaring gjenstår — M1)*

**Hva:** v6-malene provisjoneres til en ny mappe; dagens mappe blir stående.

**Filer:**
- `Templates/Content/Portfolio_content.no-NB/Malbibliotek/` — nye .docx/.xlsx (bokmål + `Nynorsk_-_*`)
- `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml` linje ~6–195 — nye
  `<pnp:File>`-oppføringer med `Folder="Malbibliotek/Fra Prosjektveiviseren (v6)"`
- `Malbibliotek/!README.md` — forklar de to mappene

**Gjør:**
1. Legg v6-filene i ny mappe med versjon i filnavn (`Styringsdokument_v6.0.docx`).
2. La `Malbibliotek/Fra Prosjektveiviseren` stå urørt. Rydding av v3.0/v2.2-parallellene der
   tas som en frivillig opprydding i område K, ikke automatisk.
3. Fyll hullene i fasemerkingen: **ingen** mal er i dag merket `Gjennomføre` eller `Realisere`.
   Avslutningsanbefaling hører til gjennomføringsfasen.
4. Følg terminologien: «Gevinstrealiseringsplan» blir trolig «Plan for nyttestyring» (verifiser
   i område A).
5. Hold nynorskvariantene i takt.
6. Oppdater `!README.md` med v6-referanse, forklaring av de to mappene og lenke til Digdirs
   malside.

**Merk:** `Templates/Content/Portfolio_content.en-US/` har ingen Malbibliotek-mappe.
Dokumentmalene er bevisst norskspråklige; ikke innfør en engelsk parallell.

---

### G. Bærekraft og omfang som styringsparametere  ·  ✅ GJENNOMFØRT 2026-08-21 *(kolonnekonfig-fargene settes i K-skriptet; se listearkitektur-/commit-notat)*

v6 opererer med sju styringsparametere; PP365 har statusseksjoner for fem, pluss muligheter:

| v6-parameter | PP365 i dag |
|---|---|
| Gevinster / nytte | `GtStatusGainAchievement` ✔ |
| Kostnader | `GtStatusBudget` ✔ |
| Tid | `GtStatusTime` ✔ |
| Kvalitet | `GtStatusQuality` ✔ |
| Risiko | `GtStatusRisk` ✔ |
| **Omfang** | **mangler** |
| **Bærekraft** | **mangler** |
| *(i tillegg)* | `GtStatusOpportunities` |

Statusseksjoner er datadrevet: `Templates/Portfolio/Objects/Lists/Statusseksjoner.xml` har én
`DataRow` per seksjon som peker på et `GtStatus*`-felt via `GtSecFieldName`. Følg mønsteret fra
`GtStatusQuality` (enklest — ingen `GtSecList`):

1. Nye kolonner: `Templates/Portfolio/Objects/SiteFields/ProjectStatus/GtStatusSustainability.xml`
   + `GtStatusSustainabilityComment.xml` (og `GtStatusScope*.xml`). Nye GUID-er. Registrer i
   `SiteFields/@.xml`.
2. `FieldRef` inn i innholdstypene under `Objects/ContentTypes/ProjectStatus/`.
3. Nye `DataRow`s i `Statusseksjoner.xml` med `GtSecFieldName`, `GtSecIcon`, `GtSortOrder`.
4. resx i **begge** språk (`Lists_StatusSections_StatusSustainability_Title`,
   `SiteFields_GtStatusSustainability_DisplayName`/`_Description`, valgverdier). Bruk
   `assets/scripts/Add-ResxEntry.ps1`.
5. Speil i `_JsonTemplateProject.json` og `_JsonTemplateProgram.json`
   (ProjectStatus-innholdstypen og Prosjektstatus-listen).
6. `npm run build` i `Templates/` → `npm run validate-project-template`. Rebuild berørte
   SPFx-løsninger.

**Bindeledd som finnes:** termsettet `FNs bærekraftsmål` ligger allerede i
`Templates/Taxonomy/Taxonomy.xml` med alle 17 målene, og ikonene i `assets/`.

**Merk:** nye statusseksjoner er en *tilføyelse*, ikke en endring — de kan trygt rulles ut til
alle uten side-om-side-mekanikk. De må imidlertid legges på eksisterende prosjektområder av
oppgraderingsskriptet (område K).

---

### H. Endrings- og kommunikasjonsledelse

v6 løfter disse til egne faglige temaer. PP365 har allerede kommunikasjonsplan
(`Navigation_CommunicationPlan_Title`, `SiteFields/Communication/`) og interessentregister —
dette handler primært om innhold, ikke ny struktur.

- Sjekkpunkter og oppgaver for endringsledelse i planleggings-, gjennomførings- og
  avslutningsfasen (område D og E).
- v6 presiserer at *behovet* for endringer i arbeidsprosesser og organisering skal beskrives,
  ikke de endrede prosessene. Omformuler eksisterende punkter om arbeidsprosesser.
- Vurder om kommunikasjonsplanen trenger felt for målgruppe/kanal/frekvens. Hold dette lite.

---

### I. Smidig / produktorientert gjennomføring

v6 beholder fasestyring, men åpner for produktorientert arbeid og kortere iterasjoner i
gjennomføringsfasen.

**Gjør:** formuler gjennomføringsfasens sjekkpunkter og oppgaver slik at de fungerer for både
delfaser og iterasjoner. Dagens `PhaseSubText` for Gjennomføre er «Gjennomføre leveranser og
planlegge delfaser» — vurder ordlyd som også dekker iterativt arbeid.

**Ikke gjør:** ikke innfør ny fase eller egen smidig-prosjektmal i denne runden.
`Prosjekttillegg/EnkeltProsjekt.json` og `EnkelVenstremeny.json` finnes allerede som
forenklingsmekanisme.

---

### J. Fasetekster, roller, tjenesteområder og lenker  ·  ✅ GJENNOMFØRT 2026-08-21 *(fasetekster i Taxonomy + 1.14.0-malen; ingen dyplenker fantes; tjenesteområder uendret — intet v6-motstykke)*

**Fasetekster:** `Templates/Taxonomy/Taxonomy.xml` — `PhaseSubText`, `PhaseDescription` og
`_en-us`-variantene for alle sju termer. Navn, GUID og `CustomSortOrder` røres ikke.

**Roller:** termsettet `Rolle`. Oppdater beskrivelser for Virksomhetsledelsen, Gevinstansvarlig,
Prosjekteier og Prosjektleder. Omdøping av termnavn: se område C punkt 4.

**Tjenesteområder:** termsettet `Tjenesteområde` (10 termer, kommunalt orientert). Nevnt i
issue #1044. Verifiser mot v6; endre bare ved faktisk avvik.

**Lenker og hjelpeinnhold:** `Objects/Lists/Lenker.xml`, `Hjelpeinnhold.xml` og
`ClientSidePages/Home.xml` peker til `prosjektveiviseren.digdir.no`. v6 har flyttet sider —
`god-praksis/` → `god-praksis-og-tilpasning/` — så **alle dyplenker må testes**, ikke bare
inspiseres. Jf. [issue #1311](https://github.com/Puzzlepart/prosjektportalen365/issues/1311),
der Prosjektveiviseren-lenken tidligere måtte oppdateres.

---

### K. Oppgraderingssti  ·  *kritisk, men vesentlig enklere med område B*

Side-om-side-strategien fjerner duplikat- og datatapsrisikoen. Det som gjenstår er
omdøping, tilføyelser og konfigurasjon.

**1. `PreInstallUpgrade.ps1` — må kjøre før PnP-malene** (jf. rekkefølgekravet i område B):
- døp om hub-listene «Fasesjekkliste» og «Planneroppgaver» (kun `Title`)
- oppdater de to eksisterende `Listeinnhold`-radene på plass (bevar item-ID)

**2. Versjonert oppgraderingsmal** — `Templates/Upgrade/1.14.0/1.14.0.xml`
(mønster: `1.5.0`, `1.8.1`, `1.12.0`). Nødvendig fordi `Install/Install.ps1` **hopper over
Taxonomy-malen ved `-Upgrade`** — endrede fasetekster og rollebeskrivelser når ellers ikke ut.
`Install/Build-Release.ps1` pakker hver undermappe som egen `.pnp`.

**3. `UpgradeAllSitesToLatest/` — per prosjektområde:**
- legg til nye statuskolonner fra område G
- oppdater feltvisningsnavn fra område C (`Set-PnPField -Values @{Title=…}`; internnavn urørt)
- ikke rør listedata

**4. Frivillig opprydding, ikke automatisk:** et separat, dokumentert skript som virksomheten
*kan* kjøre for å fjerne den gamle generasjonen (legacy-listene, v3.0-dokumentmalene) når de
har byttet. Skal ikke inngå i den ordinære oppgraderingen.

**Ferdig når:** oppgradering av en testinstallasjon med v1.13-innhold og lokale tilpasninger
gir uendret oppførsel for eksisterende prosjektmaler, v6-innholdet tilgjengelig som valg, og
ingen egne rader eller maler rørt.

**Alternativ distribusjon å vurdere:** `docs/plans/template-catalog.md` beskriver en
malpakkekatalog (`.pppkg`, `catalog.json`, `PpPkg*`-feltene i `Maloppsett.xml`) under arbeid.
Et v6-innholdssett kunne distribueres som malpakke uavhengig av release-syklusen — samme
side-om-side-prinsipp, men uten å måtte vente på en produktversjon. Ta det som oppfølging;
unngå designvalg som stenger døren.

---

### L. Release

- `releasenotes/1.14.0.md` — eget avsnitt om Prosjektveiviseren v6: v6-versjonsdato, hva som er
  nytt, **hvordan man tar i bruk v6-innholdet** (Maloppsett → Listeinnhold), og eksplisitt at
  oppgraderingen ikke endrer eksisterende prosjekter.
- `CHANGELOG.md`.
- Lukk [issue #1044](https://github.com/Puzzlepart/prosjektportalen365/issues/1044) med
  henvisning til `docs/prosjektveiviseren-v6/`.
- Følg `.development-guide/utgivelse/` og commit-konvensjonen i
  `.development-guide/git/commit-praksis.md`.
- Brukerdokumentasjon: [prosjektportalen-manual](https://github.com/Puzzlepart/prosjektportalen-manual)
  må få et avsnitt om valget mellom de to generasjonene — `Hjelpeinnhold.xml` lenker dit.

---

## Fremdriftsplan: 6. august – 4. september 2026

Fire uker, fire beslutningsporter. Roller: **PL** (prosjektleder), **AI** (AI-assistent),
**TR** (teknisk ressurs). Forutsetninger: PL og TR har reell kapasitet ca. 2–3 dager/uke;
testleietaker er tilgjengelig fra dag én; v6-materialet på Digdir er stabilt i perioden.

Kritisk sti: **A → M1 → D/E → M2 → K → M3 → L**. Område B, C og G ligger *utenfor* kritisk
sti fram til M2 og fungerer som buffer-arbeid for TR dersom A drar ut.

### Uke 32 (to 6.8 – fr 7.8) — oppstart og kildeinnhenting

| Dato | Aktivitet | Område | Ansvarlig | Støtte |
|---|---|---|---|---|
| to 6.8 | Oppstartsmøte: gjennomgå denne planen, bekreft omfang og roller, avtal beslutningsporter | – | PL | TR, AI |
| to 6.8 – fr 7.8 | Hente v6-kildemateriale fra Digdir: alle aktivitetssider per fase, BP-sidene, styringsparametere, smidig, nyttestyring, begrepssiden, rollebeskrivelser, dokumentmaler (bokmål **og** nynorsk) | A | **PL** | AI strukturerer fortløpende til `kildesett-v6.md` |
| to 6.8 – fr 7.8 | Rigge testleietaker: installere v1.13.1, legge inn testdata (egne sjekkpunkter, egen dokumentmal, egen Maloppsett-rad, ett prosjekt) — grunnlaget for «ingenting skal skje»-testen | K | **TR** | |
| fr 7.8 | Opprette `docs/prosjektveiviseren-v6/` med README og beslutningslogg | A | **AI** | PL |

### Uke 33 (ma 10.8 – fr 14.8) — baseline og mapping · *port M1*

| Dato | Aktivitet | Område | Ansvarlig | Støtte |
|---|---|---|---|---|
| ma 10.8 – on 12.8 | Fylle ut `mapping-sjekkpunkter.csv` og `mapping-oppgaver.csv`: hver av de 110 eksisterende radene får en `handling`, alle v6-aktiviteter representert | A | **AI** | PL avklarer tvilstilfeller |
| ma 10.8 – on 12.8 | Verifisere `mapping-terminologi.csv` mot kilden: nyttevirkning/nytte, nytteansvarlig?, «Plan for nyttestyring», hva skjedde med gevinsteier | A/C | **PL** | AI lager tabellutkast |
| ma 10.8 – fr 14.8 | Starte listearkitektur: splitte resx-nøkler, nye listedefinisjoner (`Fasesjekklistev6.xml`, `Planneroppgaverv6.xml`), `Listeinnhold`-rader, `@.xml` | B | **TR** | |
| to 13.8 | Gjennomgangsmøte: PL går gjennom mappingtabellene med AI-begrunnelsene | A | PL | AI |
| **fr 14.8** | **Port M1: PL godkjenner de tre mappingtabellene.** Uten M1 stopper D, E og C. | A | **PL** | |

### Uke 34 (ma 17.8 – fr 21.8) — innholdsproduksjon · *port M2*

| Dato | Aktivitet | Område | Ansvarlig | Støtte |
|---|---|---|---|---|
| ma 17.8 – ti 18.8 | Generere `<pnp:DataRows>` for begge språk fra CSV (`Generate-V6ContentRows.js`), inkl. punkter for endringsledelse, kommunikasjon og smidig gjennomføring | D, E, H, I | **AI** | TR committer |
| ma 17.8 – on 19.8 | Terminologi i resx (begge språk) + de tre SPFx-loc-treffene; statiske sjekker på at ingen `*_Url`/`StaticName` er endret | C | **TR** | AI foreslår ordlyd, PL godkjenner |
| ma 17.8 – on 19.8 | Bærekraft- og omfangskolonner: SiteFields, innholdstyper, `Statusseksjoner.xml`, resx, speiling i `_JsonTemplate*.json` | G | **TR** | PL bestemmer valgverdier/ordlyd |
| on 19.8 – to 20.8 | v6-dokumentmaler inn i `Malbibliotek/Fra Prosjektveiviseren (v6)` + nynorsk + `!README.md` | F | **PL** | TR provisjonerer |
| on 19.8 – to 20.8 | Kvalitetssikre ordlyd på alle nye sjekkpunkter/oppgaver i begge språk | D, E | **PL** | AI retter |
| fr 21.8 | Fasetekster, rollebeskrivelser (kun beskrivelse, ikke termnavn), tjenesteområder | J | **AI** | PL godkjenner |
| **fr 21.8** | **Port M2: alt innhold committet, `npm run build` + `validate-project-template` + `validate-loc` grønne.** | – | **TR** | |

### Uke 35 (ma 24.8 – fr 28.8) — oppgraderingssti og test · *port M3*

| Dato | Aktivitet | Område | Ansvarlig | Støtte |
|---|---|---|---|---|
| ma 24.8 – ti 25.8 | `PreInstallUpgrade.ps1` (omdøping i riktig rekkefølge), oppgraderingsmal `1.14.0.xml`, `UpgradeAllSitesToLatest`-skript, oppdatert `PostInstall.ps1` | K | **TR** | |
| ti 25.8 | Frivillig oppryddingsskript (fjerne legacy når virksomheten vil) — dokumentert, ikke i ordinær oppgradering | K | **TR** | |
| on 26.8 | Test 1–2: ren installasjon + faseovergang i testleietaker | Verif. | **TR** | PL verifiserer innhold |
| to 27.8 | Test 3: **«ingenting skal skje»-testen** — oppgradere v1.13.1-miljøet fra uke 32, verifisere at eksisterende prosjekter og tilpasninger er urørt | Verif. | **TR** | PL |
| to 27.8 | Test 4: bytte generasjon i Maloppsett, nytt prosjekt får v6-innhold | Verif. | **PL** | TR |
| fr 28.8 | Test 5: lenketest av alle Prosjektveiviseren-URL-er (`Lenker.xml`, `Hjelpeinnhold.xml`, `Home.xml`) | J/Verif. | **PL** | AI lager sjekkliste |
| **fr 28.8** | **Port M3: test 1–5 grønne, funn logget.** | – | **TR** | |

### Uke 36 (ma 31.8 – fr 4.9) — retting og release · *port M4*

| Dato | Aktivitet | Område | Ansvarlig | Støtte |
|---|---|---|---|---|
| ma 31.8 – ti 1.9 | Rette funn fra testrunden; re-kjøre berørte tester | – | **TR** | AI, PL |
| ti 1.9 – on 2.9 | `releasenotes/1.14.0.md` (inkl. «slik tar dere i bruk v6-innholdet»), `CHANGELOG.md`, utkast til brukermanual-avsnitt om generasjonsvalget | L | **AI** | PL godkjenner tekst |
| on 2.9 – to 3.9 | Bygge releasekandidat (`Build-Release.ps1`), smoketest etter `.development-guide/utgivelse/smoketest.md` | L | **TR** | |
| to 3.9 | Oppdatere issue #1044 med status og lenke til plan/leveranse | L | **PL** | |
| **fr 4.9** | **Port M4: releasekandidat godkjent — klar for ordinær releaseprosess.** | L | **PL** | TR |

### Innebygd slakk og varsellamper

- **Buffer:** TR-arbeidet i B, C og G (uke 33–34) kan forskyves ±3 dager uten å flytte M2,
  siden kritisk sti går gjennom A → D/E.
- **Varsel 1:** hvis PL ikke har fått hentet komplett v6-materiale innen **ti 11.8**, flyttes
  M1 — og da flyttes alt. Meld fra første dag det butter (f.eks. manglende nynorskmaler hos
  Digdir).
- **Varsel 2:** hvis terminologiverifiseringen viser at «gevinstansvarlig»-termen *må* endres
  (ikke bare beskrivelsen), er det en omfangsendring som tas som egen beslutning i M1-møtet —
  den skal ikke smugles inn i uke 34.
- **Utenfor planen:** selve publiseringen av release 1.14.0 følger produktets ordinære
  releaseprosess og eies av Puzzlepart; M4 leverer en godkjent kandidat.

---

## Verifisering

**Statiske sjekker (hver commit):**

```bash
cd Templates && npm run build                      # resx → JSON + TS, prosjektmaler
cd Templates && npm run validate-project-template  # tokens uten oversettelse
npm run validate-loc                               # loc-nøkler i balanse
```

- Radtall og `GtSortOrder` identisk i `Portfolio_content.no-NB.xml` og `.en-US.xml`.
- Ingen duplikate `Title` innenfor en `<pnp:DataRows>`-blokk.
- Alle `GtProjectPhase`-GUID-er finnes i `Templates/Taxonomy/Taxonomy.xml`.
- Alle `GtCategory`-verdier matcher et fasenavn eksakt.
- **Ingen `*_Url`- eller `*_PageName`-resx-nøkkel er endret** (område C).
- **Ingen `StaticName`/`Name` på et `Gt*`-felt er endret** — `git diff` på `SiteFields/`
  skal bare vise nye filer og `DisplayName`-endringer.
- Hver `<pnp:File Src="Malbibliotek/…">` peker på en fil som finnes.
- Ved endring i `src/loc/*.js`: nøkkelsettet identisk i `nb-no.js`, `en-us.js`, `mystrings.d.ts`.

**Ende-til-ende i testleietaker:**

1. **Ren installasjon:** `Install/Install.ps1` mot tomt område. Hub har fire lister
   (`Fasesjekkliste`, `Fasesjekkliste (tidligere)`, `Planneroppgaver`,
   `Planneroppgaver (tidligere)`). Nytt prosjekt fra Standardmal får v6-innhold. Bærekraft og
   omfang vises i statusrapporten. Malbibliotek har begge mapper.
2. **Faseovergang:** bytt fase via `ChangePhaseDialog` og bekreft at sjekkpunktvisningen
   filtrerer riktig — testen på at `getFilteredPhaseChecklistViewUrl()` fortsatt treffer.
3. **Oppgraderingstest — «ingenting skal skje»-testen (viktigst):** installer v1.13.1, legg inn
   to egendefinerte sjekkpunkter, en egen dokumentmal og en egen Maloppsett-rad, opprett et
   prosjekt. Oppgrader og kjør `UpgradeAllSitesToLatest.ps1`. Verifiser:
   - et **nytt** prosjekt fra den gamle malkonfigurasjonen får nøyaktig samme innhold som før
   - de egendefinerte sjekkpunktene ligger fortsatt i legacy-listen
   - ingen duplikater noe sted
   - v6-listene finnes og er valgbare i Maloppsett
   - nye statuskolonner er lagt på det eksisterende prosjektområdet
   - feltvisningsnavn er oppdatert, interne navn uendret (`Get-PnPField`)
4. **Bytt-generasjon-testen:** endre Maloppsett til v6-radene, opprett nytt prosjekt, verifiser
   v6-innhold. Eksisterende prosjekter skal være uberørt.
5. **Lenketest:** alle Prosjektveiviseren-URL-er i `Lenker.xml`, `Hjelpeinnhold.xml` og
   `Home.xml` åpnes og gir 200.
6. Smoketest etter `.development-guide/utgivelse/smoketest.md`.

---

## Risiko

| Risiko | Tiltak |
|---|---|
| **Stille kildebytte:** ny hub-liste får tittelen «Fasesjekkliste» før den gamle er omdøpt → `getByTitle` treffer feil liste og alle bytter innhold utilsiktet | Omdøpingen ligger i `PreInstallUpgrade.ps1`, altså **før** PnP-malene. Test 3 er porten. Dette er planens farligste enkeltpunkt. |
| Endring av internt feltnavn ved uhell under terminologiarbeidet | Eksplisitt statisk sjekk på `git diff` i `SiteFields/`. Regelen står i område C. |
| ~~v6-fasiten mangler — egress blokkert~~ *(løst 2026-08-06)* | Kildematerialet er innhentet og ligger i `docs/prosjektveiviseren-v6/kilder/`; terminologien er verifisert mot kilden. Restrisiko: Digdir endrer innhold i perioden — diff mot `kilder/` ved behov. |
| Terminologiendringen er større enn antatt (76 resx-verdier + roller) | `mapping-terminologi.csv` gir full oversikt før arbeidet starter. Interne navn røres ikke, så flaten er stor men risikoen lav. |
| ~~Omdøping av taksonomitermen «Gevinstansvarlig» endrer lagrede listeverdier~~ *(avkreftet 2026-08-20)* | «Gevinstansvarlig» er ikke en taksonomiterm, men visningsnavn på personfeltet `GtGainsResponsible` — omdøping er datasikker. Besluttet omdøpt til «Nytteeier»; ingen migrering av eksisterende data/termer. |
| To generasjoner lister forvirrer brukerne | «(tidligere)»-konvensjonen, konfigurasjonssiden viser begge, releasenotes og brukermanual forklarer valget. Maks to generasjoner samtidig. |
| Døde dyplenker etter v6s URL-omlegging | Lenketest (test 5), ikke bare inspeksjon. |
| nb og en kommer ut av takt | Statisk sjekk på radtall + `GtSortOrder`. AI genererer begge fra samme CSV. |
| Nynorsk glemmes | Egen sjekkpost i F. |
| Regenerert loc/resx sjekkes inn ved uhell | `src/loc/shared/`, `Templates/Resources.json` og `ProjectTemplates/*.txt` er gitignorert — verifiser `git status` før commit. |
| Omfangskryp mot full modellrevisjon | Fasenavn, fase-GUID-er, BP-struktur og interne feltnavn er uttrykkelig utenfor omfang. |

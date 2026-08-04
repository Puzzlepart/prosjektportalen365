# Plan: Oppdatere Prosjektportalen 365 til Prosjektveiviseren v6

## Kontekst

Prosjektportalen 365 (PP365) er tuftet på Prosjektveiviseren, men innholdet stammer fra en
tidligere versjon: dokumentmalene i `Malbibliotek` er merket v3.0/v4.0, og de 44
fasesjekkpunktene og 66 prosjektoppgavene er formulert etter den gamle aktivitetsstrukturen.
Digdir har siden gitt ut versjon 6, som både omformulerer aktiviteter og innfører nye
konsepter (bærekraft som styringsparameter, smidig/produktorientert gjennomføring,
endrings- og kommunikasjonsledelse, oppdaterte rollebeskrivelser).

Dette er allerede erkjent i repoet som [issue #1044 "Oppdater malverk fra Prosjektveiviseren 6"](https://github.com/Puzzlepart/prosjektportalen365/issues/1044)
(åpen siden mars 2023, milestone 1.14.0), men uten en gjennomføringsplan.

**Avklart omfang for dette arbeidet:**

| Spørsmål | Valg |
|---|---|
| Ambisjonsnivå | Innhold **+** nye v6-konsepter (ikke full modellrevisjon) |
| Leveransemål | PP365 kjerneprodukt, via release — alle virksomheter får det ved oppgradering |
| Dokumentmaler | Bytt til nye v6-filer fra Digdir |
| Plandokument | Markdown i repoet, pushet på `claude/prosjektportalen-v6-update-70sbom` |

**Uttrykkelig utenfor omfang:** endring av fasenavn, faserekkefølge, fase-GUID-er eller
beslutningspunktstrukturen. Se «Hvorfor vi ikke rører fasestrukturen» nedenunder — dette er
en bevisst risikoreduksjon, ikke en forglemmelse.

**Ønsket utfall:** en virksomhet som oppgraderer PP365 får fasesjekkpunkter, prosjektoppgaver,
dokumentmaler, fasetekster og styringsparametere som samsvarer med Prosjektveiviseren v6,
uten å miste egne tilpasninger, og uten duplikater i listene sine.

**Status:** dette dokumentet er arbeidsdokumentet for oppdateringen og ligger på branchen
`claude/prosjektportalen-v6-update-70sbom`. Ingen innholdsendringer er gjort ennå — arbeidet
starter med område A nedenunder.

---

## Forutsetning som må løses først: tilgang til v6-kildematerialet

Egress-policyen i dette miljøet blokkerer `prosjektveiviseren.digdir.no`,
`prosjektportalen.no`, `prosjektskole.no` og `prosjektbloggen.no` (bekreftet: proxyen svarer
403 på CONNECT). Innholdet under er derfor hentet fra søketreff, ikke fra kilden.

**Konsekvens for planen:** den autoritative v6-fasiten kan ikke hentes maskinelt herfra.
Steg A nedenunder er derfor et eget, manuelt arbeidssteg der prosjektlederen skaffer
kildematerialet. Alt annet arbeid avhenger av det.

### Antatt innhold i v6 (må verifiseres i steg A)

Fra [Digdirs versjonshistorikk](https://prosjektveiviseren.digdir.no/godt-vite/versjonshistorikk/144)
og [Puzzleparts egen blogg](https://www.prosjektportalen.no/blogg/ny-prosjektportal-moter-oppdatert-prosjektveiviseren):

- **Smidige faser** — fasestyringen beholdes, men det legges til rette for produktorientert
  arbeid og kortere iterasjoner i gjennomføringsfasen. Ny side om hvordan smidig påvirker
  prosjektstyringen i de ulike fasene.
- **Bærekraft som styringsparameter** — prosjekttrekanten utvides til et sekskant/hexagon.
  Sju styringsparametere: gevinster, kostnader, tid, kvalitet, omfang, bærekraft, risiko.
- **Menneskene i sentrum** — endringsledelse og kommunikasjonsledelse løftes til egne
  faglige temaer.
- **Teknologi og KI** — veiviseren oppdatert for at KI er del av prosjekthverdagen.
- **Nye aktiviteter i venstremenyen**, samordnet med de seks obligatoriske spørsmålene i
  utredningsinstruksen.
- **Oppdaterte rollebeskrivelser** for Virksomhetsledelsen, Gevinstansvarlig, Prosjekteier og
  Prosjektleder. Gevinsteiere som lokale eiere av enkeltgevinster er bygget inn i
  rollebeskrivelsen for Gevinstansvarlig.
- **Aktivitetsendringer:** «Gjennomføre samfunnsøkonomisk analyse» er avviklet som egen
  aktivitet; løsningens innhold og utforming skal ikke fastlåses i planleggingsfasen;
  behovet for endringer i arbeidsprosesser og organisering beskrives, ikke de endrede
  prosessene; nye aktiviteter i starten av planleggings-, gjennomførings- og avslutningsfasen
  for gode faseoverganger; avslutningsanbefaling utarbeides sist i gjennomføringsfasen og
  legges fram i BP4.

---

## Slik henger innholdet sammen i PP365

Fire lag, og det er avgjørende å vite hvilket lag man endrer:

```
1. TAKSONOMI      Templates/Taxonomy/Taxonomy.xml
                  Termsett "Fase" (abcfc9d9-…) med LocalCustomProperties:
                  PhaseSubText, PhaseDescription (+ _en-us)
                  ⚠ Install.ps1 hopper over Taxonomy ved -Upgrade

2. STRUKTUR (hub) Templates/Portfolio/Objects/{SiteFields,ContentTypes,Lists,ClientSidePages}/
                  Listedefinisjoner, kolonner, innholdstyper. Strenger via {resource:Key}
                  → Templates/Portfolio/Resources.{no-NB,en-US}.resx

3. INNHOLD (hub)  Templates/Content/Portfolio_content.{no-NB,en-US}/…xml
                  ★ Fasesjekkliste: 44 DataRows   ★ Planneroppgaver: 66 DataRows
                  ★ Malbibliotek: 22 Office-filer som <pnp:File>-oppføringer (kun no-NB)

4. PROSJEKTMAL    Templates/JsonTemplates/_JsonTemplate{Project,Program,Parent}.json
                  Lager tomme lister på prosjektområdet. Innholdet kopieres fra hub
                  ved provisjonering via "Listeinnhold" (Listeinnhold.xml →
                  ProjectExtensions/…/CopyListData) og Planner-plan "Prosjektoppgaver".
```

**Fem koblinger som må respekteres:**

1. `GtProjectPhase` lagres som `Navn|GUID` (`Konsept|99e85650-…`) i hver DataRow.
2. `GtCategory` på Planneroppgaver lagres som **ren fasenavn-streng** uten GUID.
3. `ProjectPhaseModel.getFilteredPhaseChecklistViewUrl()`
   (`SharePointFramework/shared-library/src/models/ProjectPhaseModel.ts`) filtrerer på
   **fasens visningsnavn**. Punkt 1–3 er tilsammen grunnen til at vi ikke rører fasenavn.
4. `<pnp:DataRows KeyColumn="Title" UpdateBehavior="Skip">` — nøkkelen er *tittelen*. Endrer
   vi ordlyden på et sjekkpunkt, ser PnP det som en **ny** rad. Eksisterende installasjoner
   får da både gammel og ny formulering. Dette er den største enkeltrisikoen i hele arbeidet.
5. `Resources.*.resx` er generert videre til `SharePointFramework/*/src/loc/shared/`
   (gitignorert) — resx-endringer krever `npm run build` i `Templates/` og rebuild av berørte
   SPFx-løsninger.

---

## Tilnærming

### Rollefordeling

| Rolle | Eier |
|---|---|
| **Prosjektleder** | Faglige beslutninger: hvilke sjekkpunkter og oppgaver som skal finnes, ordlyd, fasetilhørighet. Skaffer v6-kildematerialet. Godkjenner mappingtabellen. Tester i testleietaker. |
| **AI** | Ekstraherer v6-innhold til strukturert form. Foreslår gammel→ny-mapping med begrunnelse. Genererer PnP-XML for begge språk. Oversetter nb→en. Konsistenssjekker (radtall, sorteringshull, duplikate titler). Utkast til releasenotes. |
| **Teknisk ressurs** | Repo-mekanikk, resx og byggekjede, nye kolonner/innholdstyper, oppgraderingsmal og migreringsskript, release og smoketest. |

### Metodisk kjerne: mappingtabellen som mellomprodukt

Ikke rediger XML direkte. Innfør et menneskelesbart mellomprodukt som blir arbeidsdokumentet
og senere revisjonssporet:

```
docs/prosjektveiviseren-v6/
  README.md              Kildehenvisninger, v6-versjonsdato, beslutningslogg
  kildesett-v6.md        v6-aktiviteter og beslutningspunkter, per fase, ordrett fra Digdir
  mapping-sjekkpunkter.csv
  mapping-oppgaver.csv
```

CSV-format (samme for begge):

```csv
id,fase,gammel_tittel,ny_tittel,handling,sortorder,v6_kilde,begrunnelse
```

`handling` ∈ `behold` | `omformuler` | `ny` | `fjern` | `flytt-fase`

Dette gir tre gevinster: prosjektlederen kan godkjenne innhold uten å lese XML; `handling`
gir teknisk ressurs presis instruks for oppgraderingsskriptet (særlig `omformuler` og
`fjern`, som er de som skaper duplikater); og CSV-en dokumenterer *hvorfor* for neste
Prosjektveiviser-versjon.

**Generator:** `assets/scripts/Generate-V6ContentRows.js` — engangsskript som leser de to
CSV-ene og skriver `<pnp:DataRows>`-blokkene for både `no-NB` og `en-US`. Legges i
`assets/scripts/` sammen med de øvrige hjelpeskriptene (`Set-ListDataRows.ps1`,
`Add-ResxEntry.ps1`). Det skal *ikke* inn i byggekjeden — XML-en committes som vanlig.

### Sorteringsnummerering

Dagens `GtSortOrder` går 10–440 i steg på 10. Renummerer i steg på **100** (100, 200, …) med
`GtCategory`/fase som primær gruppering. Da kan senere versjoner sette inn punkter uten å
renummerere alt.

### Hvorfor vi ikke rører fasestrukturen

v6 beholder fasestyringen; det er aktivitetene og temaene som endres. Å endre fasenavn ville
krevd samtidig oppdatering av: termsett-labels, alle 110 `GtProjectPhase`/`GtCategory`-verdier,
`GtProjectPhaseText`, `Choice_GtProjectPhaseChoice_*` i to resx-filer,
`getFilteredPhaseChecklistViewUrl()`, `Maloppsett.GtProjectPhaseTermId`, samt et migreringsskript
for hver eksisterende installasjons termstore og listedata. Kostnad og oppgraderingsrisiko står
ikke i forhold til gevinsten. Fasetekstene (`PhaseSubText`, `PhaseDescription`) oppdateres
derimot — de er fritekst og bærer ingen referanser.

---

## Område for område

Rekkefølgen er valgt slik at hvert område kan slås sammen og testes for seg. A er blokkerende
for alt; B–F kan gå parallelt etter A; G og H avslutter.

---

### A. v6-baseline og mappingtabell  ·  *PL + AI*  ·  blokkerende

**Hva:** Etabler fasiten. Prosjektlederen henter fra Digdir: alle aktivitetssider per fase,
beslutningspunktsidene, siden om styringsparametere, siden om smidig, de oppdaterte
rollebeskrivelsene, og selve dokumentmalene (.docx/.xlsx, bokmål **og** nynorsk). AI
strukturerer dette til `kildesett-v6.md` og fyller ut de to CSV-ene mot dagens innhold.

**Nye filer:** `docs/prosjektveiviseren-v6/` (fire filer, som over).

**Referansepunkter i dag:**
- 44 sjekkpunkter: `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml`
  linje ~197–420 (Idé 7, Konsept 10, Planlegge 10, Gjennomføre 7, Avslutte 8, Realisere 2)
- 66 oppgaver: samme fil fra linje ~421 (Idé 10, Konsept 17, Planlegge 12, Gjennomføre 11,
  Avslutte 12, Realisere 4)

**Ferdig når:** hver av de 110 eksisterende radene har en `handling`, alle nye v6-aktiviteter
er representert, prosjektlederen har godkjent CSV-ene, og v6-versjonsdato er ført i README.

**Merk:** Prosjektveiviseren-innhold gjenbrukes under Digdirs vilkår (NLOD). Dokumentmalene
skal lastes ned fra Digdir, ikke gjenskrives. Behold kildehenvisning i `!README.md`.

---

### B. Fasesjekkpunkter  ·  *AI genererer, PL godkjenner, teknisk committer*

**Hva:** Erstatt de 44 sjekkpunktene med v6-sett. v6 knytter aktivitetene i konseptfasen til
de seks obligatoriske spørsmålene i utredningsinstruksen — det bør gjenspeiles i
konseptfase-punktene. Nye punkter for faseoverganger (start av planleggings-, gjennomførings-
og avslutningsfasen) og for avslutningsanbefaling i BP4.

**Filer:**
- `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml` — `<pnp:ListInstance Title="Fasesjekkliste">`
- `Templates/Content/Portfolio_content.en-US/Portfolio_content.en-US.xml` — `<pnp:ListInstance Title="Phase Checklist">`

**Krav:** Identisk radtall og `GtSortOrder` i de to filene. `GtProjectPhase` må beholde
`Navn|GUID`-formatet med GUID-ene fra `Templates/Taxonomy/Taxonomy.xml`. Ingen duplikate
`Title` innenfor listen (`KeyColumn="Title"`).

**Ferdig når:** begge språkfiler generert fra CSV, radtall stemmer, ingen duplikate titler,
fasefordelingen dokumentert i commit-meldingen.

---

### C. Prosjektoppgaver (Planneroppgaver)  ·  *AI genererer, PL godkjenner*

**Hva:** Oppgavene er «oversettelsen» av sjekkpunktene til handlinger, og må holdes i takt
med B. Fjern «Gjennomføre samfunnsøkonomisk analyse» som egen oppgave. Legg til oppgaver for
endrings- og kommunikasjonsledelse (jf. område F) og for smidig/produktorientert gjennomføring
(jf. område G).

**Filer:** samme to XML-filer, `<pnp:ListInstance Title="Planneroppgaver">` /
`"Planner Tasks"`.

**Krav:** `GtCategory` er **ren fasenavn-streng** (`Idé`, `Konsept`, …) — ikke `Navn|GUID`.
Eksisterende oppgavetitler viser til BP-numre i klartekst («…legge det fram til vedtak i
Beslutningspunkt 1 (BP1)»); behold denne konvensjonen.

**Ferdig når:** hvert sjekkpunkt i B har minst én tilsvarende oppgave, begge språk i takt.

---

### D. Dokumentmaler  ·  *PL skaffer filer, teknisk provisjonerer*

**Hva:** Bytt ut de 22 Office-filene med v6-utgaver, og rydd.

**Filer:**
- `Templates/Content/Portfolio_content.no-NB/Malbibliotek/` — .docx/.xlsx (bokmål + `Nynorsk_-_*`)
- `Templates/Content/Portfolio_content.no-NB/Portfolio_content.no-NB.xml` linje ~6–195 —
  `<pnp:File>`-oppføringene med `Title` og `GtProjectPhase`
- `Templates/Content/Portfolio_content.no-NB/Malbibliotek/!README.md` — brukerteksten som
  følger med biblioteket

**Gjør:**
1. Legg inn v6-filene med versjonsnummer i filnavnet, som i dag (`Styringsdokument_v6.0.docx`).
2. **Fjern de utdaterte v3.0/v2.2-parallellene.** I dag ligger både v3.0 og v4.0 av
   Mandat, Prosjektforslag, Prosjektbegrunnelse, Styringsdokument, Gevinstrealiseringsplan og
   Sluttrapport side om side. Behold én versjon per mal.
3. Fyll hullene i fasemerkingen: **ingen** mal er i dag merket `Gjennomføre` eller `Realisere`.
   Sjekk om v6 har maler der (avslutningsanbefaling hører til gjennomføringsfasen).
4. Oppdater `!README.md` med v6-referanse og lenke til Digdirs malside.
5. Hold nynorskvariantene i takt — én per bokmålsmal som Digdir tilbyr på nynorsk.

**Merk:** `Templates/Content/Portfolio_content.en-US/` har **ingen** Malbibliotek-mappe.
Dokumentmalene er bevisst norskspråklige; ikke innfør en engelsk parallell.

**Merk 2:** `Install.ps1` kjører innholdsmalen med `-Handlers Files` ved oppgradering, så
filene overskrives hos eksisterende installasjoner — men *slettede* filer fjernes ikke.
Fjerning av v3.0-filene må gjøres i migreringsskriptet (område I).

**Ferdig når:** hver fil har v6-opphav, ingen doble versjoner, hver fase har relevante maler,
nynorsk i takt, `!README.md` oppdatert.

---

### E. Bærekraft (og omfang) som styringsparameter  ·  *teknisk, med PL på ordlyd*

Den største strukturelle nyheten. v6 opererer med sju styringsparametere; PP365 har i dag
statusseksjoner for fem av dem pluss muligheter:

| v6-parameter | PP365 i dag |
|---|---|
| Gevinster | `GtStatusGainAchievement` ✔ |
| Kostnader | `GtStatusBudget` ✔ |
| Tid | `GtStatusTime` ✔ |
| Kvalitet | `GtStatusQuality` ✔ |
| Risiko | `GtStatusRisk` ✔ |
| **Omfang** | **mangler** |
| **Bærekraft** | **mangler** |
| *(i tillegg)* | `GtStatusOpportunities` (muligheter) |

Statusseksjoner er datadrevet: `Templates/Portfolio/Objects/Lists/Statusseksjoner.xml`
har én `DataRow` per seksjon som peker på et `GtStatus*`-felt via `GtSecFieldName`. Å legge
til en seksjon er derfor godt avgrenset. Følg mønsteret fra `GtStatusQuality` (den enkleste —
ingen `GtSecList`):

1. Nye kolonner: `Templates/Portfolio/Objects/SiteFields/ProjectStatus/GtStatusSustainability.xml`
   + `GtStatusSustainabilityComment.xml` (og `GtStatusScope*.xml` hvis omfang tas med).
   Nye GUID-er. Registrer i `SiteFields/@.xml`.
2. Legg `FieldRef` inn i innholdstypene under `Templates/Portfolio/Objects/ContentTypes/ProjectStatus/`.
3. Ny `DataRow` i `Statusseksjoner.xml` med `GtSecFieldName`, `GtSecIcon`, `GtSortOrder`.
4. resx-oppføringer i **begge** `Templates/Portfolio/Resources.{no-NB,en-US}.resx`
   (`Lists_StatusSections_StatusSustainability_Title`,
   `SiteFields_GtStatusSustainability_DisplayName`/`_Description`). Bruk
   `assets/scripts/Add-ResxEntry.ps1`.
5. Speil kolonnene i `Templates/JsonTemplates/_JsonTemplateProject.json`
   (ProjectStatus-innholdstypen og Prosjektstatus-listen) og i `_JsonTemplateProgram.json`.
6. `npm run build` i `Templates/` → `npm run validate-project-template`. Rebuild berørte
   SPFx-løsninger.

**Bindeledd som finnes:** termsettet `FNs bærekraftsmål` ligger allerede i
`Templates/Taxonomy/Taxonomy.xml` med alle 17 målene, og ikonene ligger i `assets/`.
Bærekraftsseksjonen kan referere til hvilke bærekraftsmål prosjektet påvirker.

**Anbefaling om omfang:** ta med `GtStatusScope` i samme runde. Kostnaden er marginal når
mønsteret først er etablert, og v6 lister omfang som en av de sju parameterne.

**Ferdig når:** seksjonene vises i statusrapporten, kan settes i et prosjekt, og
oppgraderingsskriptet legger dem til på eksisterende prosjektområder.

---

### F. Endrings- og kommunikasjonsledelse  ·  *PL + AI*

**Hva:** v6 løfter disse til egne faglige temaer. PP365 har allerede en kommunikasjonsplan
(`Navigation_CommunicationPlan_Title`, `SiteFields/Communication/`) og et interessentregister
— så dette handler primært om innhold, ikke ny struktur.

**Gjør:**
- Sjekkpunkter og oppgaver for endringsledelse i planleggings-, gjennomførings- og
  avslutningsfasen (område B og C).
- v6 presiserer at *behovet* for endringer i arbeidsprosesser og organisering skal beskrives,
  ikke de endrede prosessene. Gå gjennom eksisterende sjekkpunkter om arbeidsprosesser og
  omformuler.
- Vurder om kommunikasjonsplanen trenger felt for målgruppe/kanal/frekvens ut over dagens.
  Hold dette lite; hovedvekten er tekst.

**Filer:** de to innholds-XML-ene, evt. `Templates/Portfolio/Objects/Lists/` +
`SiteFields/Communication/` hvis felt legges til.

---

### G. Smidig / produktorientert gjennomføring  ·  *PL + AI*

**Hva:** v6 beholder fasestyring men åpner for produktorientert arbeid og kortere iterasjoner
i gjennomføringsfasen.

**Gjør:** Formuler gjennomføringsfasens sjekkpunkter og oppgaver slik at de fungerer for både
delfaser og iterasjoner. Dagens fasetekst for Gjennomføre er «Gjennomføre leveranser og
planlegge delfaser» (`PhaseSubText` i `Templates/Taxonomy/Taxonomy.xml`) — vurder ordlyd som
også dekker iterativt arbeid.

**Ikke gjør:** ikke innfør en ny fase eller en egen «smidig»-prosjektmal i denne runden.
`Prosjekttillegg/EnkeltProsjekt.json` og `EnkelVenstremeny.json` finnes allerede som
forenklingsmekanisme hvis behovet melder seg senere.

**Filer:** `Templates/Taxonomy/Taxonomy.xml` (`PhaseSubText`, `PhaseDescription`, + `_en-us`),
de to innholds-XML-ene.

---

### H. Fasetekster, roller og lenker  ·  *PL + AI*

**Fasetekster:** `Templates/Taxonomy/Taxonomy.xml` — `PhaseSubText`, `PhaseDescription`
og `_en-us`-variantene for alle sju termer, mot v6-ordlyden. Navn, GUID og `CustomSortOrder`
røres ikke.

**Roller:** termsettet `Rolle` i samme fil. v6 har oppdatert Virksomhetsledelsen,
Gevinstansvarlig, Prosjekteier og Prosjektleder, og bygget gevinsteier-begrepet inn i
Gevinstansvarlig. Merk at [issue #162](https://github.com/Puzzlepart/prosjektportalen365/issues/162)
i sin tid slo fast at «Gevinstansvarlig» hører på porteføljenivå og «Gevinsteier» i
gevinstlisten — sjekk at v6-ordlyden ikke bryter dette skillet.

**Tjenesteområder:** termsettet `Tjenesteområde` (10 termer, kommunalt orientert). Nevnt i
issue #1044. Verifiser mot v6 og mot Digdirs egen inndeling; endre bare hvis det finnes et
faktisk avvik.

**Lenker og hjelpeinnhold:** `Templates/Portfolio/Objects/Lists/Lenker.xml` og
`Hjelpeinnhold.xml` peker til `prosjektveiviseren.digdir.no`. Verifiser at alle dyplenker
fortsatt løser (jf. [issue #1311](https://github.com/Puzzlepart/prosjektportalen365/issues/1311),
der Prosjektveiviseren-lenken tidligere måtte oppdateres). Sjekk også
`Templates/Portfolio/Objects/ClientSidePages/Home.xml` (QuickLinks-webdelen).

**Beskrivelsestekster:** `Templates/Portfolio/Resources.no-NB.resx` inneholder strenger som
«Fasesjekkpunkter basert på Prosjektveiviserens beslutningspunkter.» og «Standard
prosjektoppgaver fra Prosjektveiviseren» — legg til versjonsangivelse der det er naturlig.
Speil i `Resources.en-US.resx`.

---

### I. Oppgraderingssti for eksisterende installasjoner  ·  *teknisk*  ·  kritisk

Uten dette området får eksisterende kunder duplikater. To mekanismer i repoet, begge med
etablert presedens:

**1. Versjonert oppgraderingsmal** — `Templates/Upgrade/1.14.0/1.14.0.xml`
(mønster: `1.5.0`, `1.8.1`, `1.12.0`). Nødvendig fordi `Install/Install.ps1` **hopper over
Taxonomy-malen ved `-Upgrade`** — endrede fasetekster og rolletermer når derfor ikke ut via
den ordinære installasjonen. Legg inn oppdaterte `LocalCustomProperties` her.
`Install/Build-Release.ps1` pakker hver undermappe i `Templates/Upgrade/` som en egen `.pnp`.

**2. Migreringsskript** — nytt skript under `Install/Scripts/UpgradeAllSitesToLatest/`,
modellert på `Install/Scripts/Add-EnglishPhaseProperties.ps1` (som gjør nøyaktig samme type
retrofit av termegenskaper). Det må, drevet av `handling`-kolonnen i mappingtabellen:

- for `omformuler` og `fjern`: **slette de gamle radene** i `Fasesjekkliste` og
  `Planneroppgaver` på hub og på hvert prosjektområde — dette er det som hindrer duplikater
- slette de utdaterte v3.0/v2.2-dokumentmalene fra `Malbibliotek`
- legge de nye statusseksjonskolonnene på eksisterende prosjektområder (område E)
- **bevare kundetilpasninger:** rader og maler som kunden selv har lagt til skal ikke røres.
  Bare rader som matcher en kjent gammel tittel fra mappingtabellen slettes.

`assets/scripts/Set-ListDataRows.ps1` finnes som utgangspunkt for listeoperasjonene.

**Alternativ distribusjon å vurdere:** `docs/plans/template-catalog.md` beskriver en
malpakkekatalog (`.pppkg`, `catalog.json`, `PpPkg*`-feltene i `Maloppsett.xml`) som er under
arbeid. Et v6-innholdssett kunne distribueres som en malpakke uavhengig av release-syklusen.
Ta det som en oppfølging, ikke som forutsetning — men unngå designvalg som stenger døren.

**Ferdig når:** oppgradering av en testinstallasjon med v1.13-innhold og lokale tilpasninger
gir v6-innhold, ingen duplikater, og tilpasningene intakt.

---

### J. Release  ·  *teknisk*

- `releasenotes/1.14.0.md` — eget avsnitt om Prosjektveiviseren v6 med v6-versjonsdato,
  hva som er endret, og hva oppgraderingen gjør med eksisterende data.
- `CHANGELOG.md`.
- Lukk [issue #1044](https://github.com/Puzzlepart/prosjektportalen365/issues/1044) med
  henvisning til `docs/prosjektveiviseren-v6/`.
- Følg `.development-guide/utgivelse/` (`opprette-ny-versjon.md`, `bygge-utgivelse.md`,
  `smoketest.md`) og commit-konvensjonen i `.development-guide/git/commit-praksis.md`.

---

## Rekkefølge

| Bolk | Områder | Avhengighet |
|---|---|---|
| 1 | **A** — v6-baseline og mappingtabell | blokkerer alt |
| 2 | **B**, **C**, **D** parallelt | A godkjent |
| 3 | **E** (bærekraft/omfang) | uavhengig av B–D, kan starte samtidig med bolk 2 |
| 4 | **F**, **G**, **H** | bakes inn i B/C-radene; H kan gå parallelt |
| 5 | **I** — oppgraderingssti | krever at B, C, D, E er låst |
| 6 | **J** — release | alt over |

Bolk 5 kan ikke komprimeres eller hoppes over. Den er avhengig av at innholdet er endelig,
fordi migreringsskriptet er generert fra mappingtabellens `handling`-kolonne.

---

## Verifisering

**Statiske sjekker (hver commit):**

```bash
cd Templates && npm run build                      # resx → JSON + TS, prosjektmaler
cd Templates && npm run validate-project-template  # tokens uten oversettelse
npm run validate-loc                               # loc-nøkler i balanse
```

- Radtall og `GtSortOrder` identisk i `Portfolio_content.no-NB.xml` og `.en-US.xml`
  (i dag 44 + 66 i begge).
- Ingen duplikate `Title` innenfor en `<pnp:DataRows>`-blokk.
- Alle `GtProjectPhase`-GUID-er finnes i `Templates/Taxonomy/Taxonomy.xml`.
- Alle `GtCategory`-verdier matcher et fasenavn eksakt.
- Hver `<pnp:File Src="Malbibliotek/…">` peker på en fil som finnes.
- Generert `Standardmal-validation.md` viser ingen manglende tokens.
- Ved endring i `src/loc/*.js`: nøkkelsettet identisk i `nb-no.js`, `en-us.js`, `mystrings.d.ts`.

**Ende-til-ende i testleietaker:**

1. **Ren installasjon:** `Install/Install.ps1` mot tomt område. Verifiser at hub-listene
   `Fasesjekkliste` og `Planneroppgaver` har v6-innhold, at `Malbibliotek/Fra
   Prosjektveiviseren` har v6-filene (med nynorsk-undermappe), og at fasetekstene i
   fase-webdelen viser v6-ordlyd.
2. **Nytt prosjekt:** opprett prosjekt fra `Standardmal`. Verifiser at `CopyListData` har
   kopiert sjekkpunktene til prosjektområdet, at Planner-planen «Prosjektoppgaver» er fylt,
   og at bærekraft (og omfang) vises i statusrapporten.
3. **Faseovergang:** bytt fase via `ChangePhaseDialog` og bekreft at
   sjekkpunktvisningen filtrerer riktig — dette er testen på at
   `getFilteredPhaseChecklistViewUrl()` fortsatt treffer.
4. **Oppgraderingstest (viktigst):** installer v1.13.1 først, legg inn to egendefinerte
   sjekkpunkter og en egen mal i `Malbibliotek`, opprett et prosjekt. Oppgrader til den nye
   versjonen og kjør `UpgradeAllSitesToLatest.ps1`. Verifiser: v6-innhold på plass,
   **ingen duplikater**, egendefinerte punkter og egen mal intakt, v3.0-filene borte, nye
   statuskolonner på det eksisterende prosjektområdet.
5. Smoketest etter `.development-guide/utgivelse/smoketest.md`.

---

## Risiko

| Risiko | Tiltak |
|---|---|
| **Duplikater ved oppgradering** (`KeyColumn="Title"`, `UpdateBehavior="Skip"`) | Område I. Slettelisten genereres fra mappingtabellens `handling`-kolonne. Test 4 er selve kvalitetsporten. |
| v6-fasiten mangler — egress blokkert herfra | Område A er et eget, manuelt steg med PL som eier. Ingen annet arbeid starter før A er godkjent. |
| Kundetilpasninger overskrives | Migreringsskriptet sletter bare rader med kjent gammel tittel. `!README.md` sier allerede at mappen overskrives; behold og presiser den teksten. |
| nb og en kommer ut av takt | Statisk sjekk på radtall + `GtSortOrder`. AI genererer begge fra samme CSV. |
| Nynorsk glemmes | Egen sjekkpost i D: én nynorskvariant per bokmålsmal Digdir tilbyr. |
| Nye statuskolonner får ikke verdi på eksisterende prosjekter | Del av migreringsskriptet i I, verifisert i test 4. |
| Regenerert loc/resx sjekkes inn ved uhell | `src/loc/shared/`, `Templates/Resources.json` og `ProjectTemplates/*.txt` er gitignorert — verifiser `git status` før commit. |
| Omfangskryp mot full modellrevisjon | Fasenavn, fase-GUID-er og BP-struktur er uttrykkelig utenfor omfang. Nye faser eller egen smidig-mal tas som separat sak. |

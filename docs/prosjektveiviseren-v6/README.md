# Prosjektveiviseren v6 — arbeidsmappe

Arbeidsdokumenter for oppdateringen av Prosjektportalen 365 til Prosjektveiviseren
versjon 6. Overordnet plan: [`docs/plans/prosjektveiviseren-v6.md`](../plans/prosjektveiviseren-v6.md).
Sporing: [issue #1044](https://github.com/Puzzlepart/prosjektportalen365/issues/1044).

## Team

| Navn | Rolle i planen |
|---|---|
| Marit | Prosjektleder (PL) — faglige beslutninger, kildeinnhenting, godkjenning av mapping |
| Tarjei | Teknisk ressurs (TR) — repo, byggekjede, listearkitektur, oppgraderingssti |
| Remi | Teammedlem — bidrar i kvalitetssikring av innhold og test |
| Ole K | Teammedlem — bidrar i kvalitetssikring av innhold og test |
| AI | Strukturering, mapping-forslag, XML-generering, oversettelse, konsistenssjekker |

## Filene i denne mappen

| Fil | Innhold | Status |
|---|---|---|
| `kildesett-v6.md` | Strukturert oversikt over v6: faser, aktiviteter, BP-er, terminologi, roller, maler | **Innhentet 2026-08-06** (automatisk — egress-blokkeringen er borte) |
| ~~`kilder/`~~ | 74 innholdssider fra prosjektveiviseren.digdir.no (rådata for mapping) | **Fjernet fra branchen 2026-08-25** — finnes i git-historikken; dokumentene lenker nå direkte til Digdir |
| `mapping-sjekkpunkter.csv` | 44 eksisterende sjekkpunkter mappet + 27 nye v6-punkter | **GODKJENT 2026-08-21** — avledet til `innhold-sjekkpunkter.csv`; beholdes som revisjonsspor |
| `mapping-oppgaver.csv` | 66 eksisterende oppgaver mappet + 24 nye v6-oppgaver | **ERSTATTET 2026-08-21** av `innhold-oppgaver.csv` som fasit for nytt innhold — beholdes som revisjonsspor for hva som skjedde med de 66 gamle radene |
| `innhold-sjekkpunkter.csv` | FASIT for Fasesjekklistev6: 63 sjekkpunkter, begge språk (avledet fra godkjent mapping) — kilde for Generate-V6ContentRows.js | **Generert inn i malverket 2026-08-21** |
| `innhold-oppgaver.csv` | FASIT for Planneroppgaverv6: 26 oppgaver med beskrivelse og sjekkliste, begge språk (fra PLs regneark) — kilden til Generate-V6ContentRows.js | **Levert av PL, generert inn i malverket 2026-08-21** |
| `mapping-terminologi.csv` | Begrepspar gammel → v6 med fasit og kildebelegg | **VERIFISERT 2026-08-06** — TERM-003/004/006/007 trenger M1-beslutning |
| `terminologi-implementasjon.md` | Gjennomført resx-/taksonomi-endring: hva som ble endret, frosne koblingsverdier, krav til område K | Gjennomført 2026-08-20 |
| `listearkitektur-implementasjon.md` | Gjennomført generasjonssplitt av hub-listene (område B): nøkkelsplitt, rekkefølgekrav, avvik | Gjennomført 2026-08-20 |
| `oppstartsnotat-prosjektleder.md` | Gjennomgangsnotat til PL: hva som skal vurderes før M1, med lenker | Sendt PL 2026-08-06 |

## CSV-format for sjekkpunkter og oppgaver

```
id, fase, sortorder, gammel_tittel, gammel_tittel_en, ny_tittel, ny_tittel_en, handling, v6_kilde, begrunnelse
```

- `handling` ∈ `behold` | `omformuler` | `ny` | `fjern` | `flytt-fase`
- `behold` = teksten videreføres uendret (`ny_tittel` står da tom); `omformuler` = ny ordlyd
  i `ny_tittel`/`ny_tittel_en`; `fjern` = utgår i v6-settet (begrunnelse forklarer hvorfor).
- **Sammenslåing:** en `flytt-fase`-rad kan peke på samme `ny_tittel` som en annen rad —
  da slås punktene sammen til én rad i den nye listen (generatoren dedupliserer på
  `ny_tittel`). Hvilke rader som slås sammen står i `begrunnelse`.
- Formatet utvider planens format med de to engelske kolonnene, slik at begge språkfiler
  genereres fra én og samme CSV.
- Nye v6-punkter legges til som nye rader med `handling=ny` og tom `gammel_tittel`.
  Nye rader får `sortorder` i den nye 100-serien (100, 200, …) per fase.
- `v6_kilde` = URL eller sidenavn hos Digdir som punktet er utledet fra.
- Eksisterende rader er hentet fra `Templates/Content/Portfolio_content.{no-NB,en-US}/`
  og matchet på `sortorder` (verifisert 1:1, 44 + 66 rader).

## Arbeidsflyt

1. ~~Marit henter materialet~~ **Gjort 2026-08-06** — hele nettstedet er hentet automatisk
   og strukturert i `kildesett-v6.md` (rådataene i `kilder/` er senere fjernet fra branchen). Dokumentmalene (11 filer, kun bokmål)
   er lastet ned og verifisert; selve filene committes først i område F.
2. **AI** fyller `ny_tittel`, `handling`, `v6_kilde` og `begrunnelse` i de to
   mapping-CSV-ene. Terminologitabellen er allerede verifisert med kildebelegg.
3. **Marit** går gjennom med Remi og Ole K (gjennomgangsmøte to 13.8) og godkjenner.
   M1-beslutninger som venter: TERM-003/004 (Gevinstansvarlig/Nytteeier), TERM-006/007
   (Nytteoversikt/Nytteanalyse som PP365-konstruksjoner), nynorskmaler (finnes ikke hos Digdir).
4. **Port M1 (fr 14.8):** godkjente mappingtabeller. Deretter genereres XML fra CSV-ene
   (`Generate-V6ContentRows.js`, lages i uke 34).

## Beslutningslogg

| Dato | Beslutning | Hvem |
|---|---|---|
| 2026-08-05 | Omfang: innhold + nye v6-konsepter; leveranse i kjerneproduktet; dokumentmaler byttes til v6-filer | Tarjei |
| 2026-08-05 | Side-om-side-strategi: v6-innhold i nye hub-lister (`Fasesjekklistev6`, `Planneroppgaverv6`), eksisterende lister beholdes som «(tidligere)», virksomheten velger per prosjektmal | Tarjei |
| 2026-08-05 | Interne feltnavn/URL-er endres aldri; kun visningsnavn følger v6-terminologien | Tarjei |
| 2026-08-06 | Onboarding gjennomført; team etablert (Marit PL, Remi, Ole K, Tarjei TR) | Teamet |
| 2026-08-06 | Egress-blokkeringen er borte: hele v6-kilden (74 sider + 11 maler) innhentet automatisk; terminologi verifisert. PLs kildeinnhenting utgår — PL verifiserer og godkjenner i stedet | AI/Tarjei |
| 2026-08-20 | TERM-003 avgjort: «Gevinstansvarlig» (visningsnavnet på `GtGainsResponsible`) omdøpes til «Nytteeier» i malverket. Ingen forsøk på å oppdatere data/termer der gammelt begrep er brukt. Korreksjon: rollen er et personfelt, ikke en taksonomiterm — omdøpingen er datasikker | Tarjei |
| 2026-08-20 | Område C gjennomført i malverket (64 no-NB + 21 en-US resx-verdier + 1 taksonomiterm). Datakildekategorien og 11 andre koblingsverdier frosset — se terminologi-implementasjon.md | Tarjei/AI |
| 2026-08-20 | Område B gjennomført i malverket: hub-listene splittet i to generasjoner (Fasesjekklistev6/Planneroppgaverv6), Listeinnhold utvidet til 5 rader, omdøping lagt i PreInstallUpgrade, Standardmal-kobling gatet i PostInstall | Tarjei/AI |
| 2026-08-21 | BP-oppgavene utgår fra Planneroppgaver — beslutningspunktene er implisitte i fasesjekklisten | Teamet |
| 2026-08-21 | Område E gjennomført: PLs regneark (26 oppgaver med sjekklister) konvertert til innhold-oppgaver.csv og generert inn i begge innholdsmalene (Planneroppgaverv6). Generate-V6ContentRows.js etablert | Teamet/AI |
| 2026-08-21 | Sjekkpunkt-mappingen godkjent som den står. Område D gjennomført: 63 v6-sjekkpunkter avledet til innhold-sjekkpunkter.csv og generert inn i begge innholdsmalene (Fasesjekklistev6) | Teamet/AI |
| 2026-08-21 | Områdene G, F og J gjennomført i malverket. **Port M2 passert:** alt innhold committet; build, validate-project-template og validate-loc grønne (kun pre-eksisterende loc-hull). Gjenstår før M3: område K (1.14.0-skriptene har alt B/C-stegene; kolonnekonfig for G + UpgradeAllSites gjenstår) og E2E-test i testleietaker | Teamet/AI |
| 2026-08-21 | Område F revidert: ingen «(v6)»-mappe — v6-malene provisjoneres rett i «Fra Prosjektveiviseren» med Overwrite, og det gamle malsettet (15 filer, v2.2–v5.0) er fjernet fra malverket. Gamle filer består fysisk hos oppgraderte kunder til frivillig opprydding (K). Nynorsk v4-mappen beholdt i påvente av M1 | Tarjei |
| 2026-08-24 | Område K skriptdel levert: (1) PreInstallUpgrade omdøper Statusseksjoner-, kolonnekonfig- og Prosjektkolonner-rader in place med gammel-tittel-vakt; (2) PostInstall sikrer kolonnekonfig-fargene for GtStatusScope/GtStatusSustainability med runtime-ID-oppslag; (3) nytt EnsureV6BenefitTerminology.ps1 i UpgradeAllSitesToLatest, gated på ny bryter -GevinstTilNytte (opt-in per installasjon). Frivillig oppryddingsskript besluttet BORT; M3-testene kjøres av teamet | Tarjei |
| 2026-08-25 | Fase-termsettet fjernet fra oppgraderingsmalen 1.14.0: v6-fasetekstene gjelder kun nye installasjoner (kun noen ord i undertekst/beskrivelse — kan oppdateres manuelt i termlageret av de som ønsker). kilder/-mappen fjernet fra branchen samme dag | Tarjei |
| 2026-09-01 | Copilot-review på PR #1764 håndtert: (1) v6-splitten i PreInstallUpgrade gates på `-SkipTemplate` og re-trigges på tilstand (v6-listen mangler), så apps-only-oppgradering ikke etterlater halvferdig migrering; (2) hub-liste-omdøpingen vaktes på kjente standardtitler, med Listeinnhold-raden koblet til utfallet; (3) EnsureV6BenefitTerminology dropper `-UpdateExistingLists` og omdøper listefeltene enkeltvis med per-felt-vakt | Tarjei/AI |
| *(M1, fr 14.8)* | *TERM-004: bekrefte «Nytteansvarlig» som nytt visningsnavn for `GtGainsOwner` («Gevinsteier»)* | *Marit* |
| *(M1, fr 14.8)* | *TERM-006/007: visningsnavnene «Nytteoversikt» og «Nytteanalyse» (PP365-konstruksjoner — v6 har ikke egne begreper)* | *Marit* |
| *(M1, fr 14.8)* | *Nynorsk: Digdir tilbyr ikke nynorskversjoner av v6-malene — avklar strategi for område F* | *Marit* |

## v6-referanse

- Versjonsdato for Prosjektveiviseren v6: **6.0, juni 2026** (fasesider sist endret
  12. juni 2026; begreper/roller 24. juni 2026; dokumentmaler 25. juni 2026). Kilde:
  [versjonshistorikk](https://prosjektveiviseren.digdir.no/godt-vite/versjonshistorikk/144).
- v6 bygger på PRINCE2 versjon 7.
- Innhold gjenbrukes under Digdirs vilkår (NLOD), med kildehenvisning (kilde-URL-ene står i `kildesett-v6.md`).

## Navnekonvensjon for framtidige versjoner

Ny innholdsgenerasjon får versjonssuffiks i liste-URL (`Lists/Fasesjekklistev6`); forrige
generasjon får «(tidligere)» i visningstittelen. Maksimalt to generasjoner samtidig — ved
v7 fjernes v5-generasjonen.

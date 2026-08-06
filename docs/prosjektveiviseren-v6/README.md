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
| `kilder/` | Alle 74 innholdssider fra prosjektveiviseren.digdir.no, ordrett som markdown med kilde-URL | Innhentet 2026-08-06 |
| `mapping-sjekkpunkter.csv` | De 44 eksisterende fasesjekkpunktene, klare for mapping mot v6 | Generert fra dagens XML — `handling` ufylt |
| `mapping-oppgaver.csv` | De 66 eksisterende prosjektoppgavene, klare for mapping mot v6 | Generert fra dagens XML — `handling` ufylt |
| `mapping-terminologi.csv` | Begrepspar gammel → v6 med fasit og kildebelegg | **VERIFISERT 2026-08-06** — TERM-003/004/006/007 trenger M1-beslutning |

## CSV-format for sjekkpunkter og oppgaver

```
id, fase, sortorder, gammel_tittel, gammel_tittel_en, ny_tittel, ny_tittel_en, handling, v6_kilde, begrunnelse
```

- `handling` ∈ `behold` | `omformuler` | `ny` | `fjern` | `flytt-fase`
- Formatet utvider planens format med de to engelske kolonnene, slik at begge språkfiler
  genereres fra én og samme CSV.
- Nye v6-punkter legges til som nye rader med `handling=ny` og tom `gammel_tittel`.
  Nye rader får `sortorder` i den nye 100-serien (100, 200, …) per fase.
- `v6_kilde` = URL eller sidenavn hos Digdir som punktet er utledet fra.
- Eksisterende rader er hentet fra `Templates/Content/Portfolio_content.{no-NB,en-US}/`
  og matchet på `sortorder` (verifisert 1:1, 44 + 66 rader).

## Arbeidsflyt

1. ~~Marit henter materialet~~ **Gjort 2026-08-06** — hele nettstedet er hentet automatisk
   til `kilder/` og strukturert i `kildesett-v6.md`. Dokumentmalene (11 filer, kun bokmål)
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
| *(M1, fr 14.8)* | *Mappingtabeller godkjent* | *Marit* |
| *(M1, fr 14.8)* | *TERM-003/004: «Gevinstansvarlig»-termen — v6 har snudd hierarkiet (Nytteeier er overordnet, nytteansvarlig delegert). Beskrivelse vs omdøping/datamigrering* | *Marit* |
| *(M1, fr 14.8)* | *TERM-006/007: visningsnavnene «Nytteoversikt» og «Nytteanalyse» (PP365-konstruksjoner — v6 har ikke egne begreper)* | *Marit* |
| *(M1, fr 14.8)* | *Nynorsk: Digdir tilbyr ikke nynorskversjoner av v6-malene — avklar strategi for område F* | *Marit* |

## v6-referanse

- Versjonsdato for Prosjektveiviseren v6: **6.0, juni 2026** (fasesider sist endret
  12. juni 2026; begreper/roller 24. juni 2026; dokumentmaler 25. juni 2026). Kilde:
  [versjonshistorikk](kilder/godt-vite__versjonshistorikk__144.md).
- v6 bygger på PRINCE2 versjon 7.
- Innhold gjenbrukes under Digdirs vilkår (NLOD), med kildehenvisning (kilde-URL står
  øverst i hver fil i `kilder/`).

## Navnekonvensjon for framtidige versjoner

Ny innholdsgenerasjon får versjonssuffiks i liste-URL (`Lists/Fasesjekklistev6`); forrige
generasjon får «(tidligere)» i visningstittelen. Maksimalt to generasjoner samtidig — ved
v7 fjernes v5-generasjonen.

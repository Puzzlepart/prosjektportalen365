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
| `kildesett-v6.md` | Handleliste for innhenting fra Digdir + selve kildematerialet | **Venter på innhenting (Marit, frist ti 11.8)** |
| `mapping-sjekkpunkter.csv` | De 44 eksisterende fasesjekkpunktene, klare for mapping mot v6 | Generert fra dagens XML — `handling` ufylt |
| `mapping-oppgaver.csv` | De 66 eksisterende prosjektoppgavene, klare for mapping mot v6 | Generert fra dagens XML — `handling` ufylt |
| `mapping-terminologi.csv` | Begrepspar gammel → v6 med verifiseringsspørsmål | **Alle rader UVERIFISERT** — fasit hentes fra Begreper-siden |

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

1. **Marit** henter materialet etter handlelisten i `kildesett-v6.md` (del 1) og limer inn
   i del 2. Dokumentmalene (.docx/.xlsx) sendes Tarjei.
2. **AI** strukturerer kildesettet og fyller `ny_tittel`, `handling`, `v6_kilde` og
   `begrunnelse` i de to mapping-CSV-ene, samt fasit-kolonnene i terminologitabellen.
3. **Marit** går gjennom med Remi og Ole K (gjennomgangsmøte to 13.8) og godkjenner.
4. **Port M1 (fr 14.8):** godkjente mappingtabeller. Deretter genereres XML fra CSV-ene
   (`Generate-V6ContentRows.js`, lages i uke 34).

## Beslutningslogg

| Dato | Beslutning | Hvem |
|---|---|---|
| 2026-08-05 | Omfang: innhold + nye v6-konsepter; leveranse i kjerneproduktet; dokumentmaler byttes til v6-filer | Tarjei |
| 2026-08-05 | Side-om-side-strategi: v6-innhold i nye hub-lister (`Fasesjekklistev6`, `Planneroppgaverv6`), eksisterende lister beholdes som «(tidligere)», virksomheten velger per prosjektmal | Tarjei |
| 2026-08-05 | Interne feltnavn/URL-er endres aldri; kun visningsnavn følger v6-terminologien | Tarjei |
| 2026-08-06 | Onboarding gjennomført; team etablert (Marit PL, Remi, Ole K, Tarjei TR) | Teamet |
| *(M1, fr 14.8)* | *Mappingtabeller godkjent* | *Marit* |
| *(M1, fr 14.8)* | *TERM-003: skjebnen til termen «Gevinstansvarlig» (beskrivelse vs omdøping/datamigrering)* | *Marit* |

## v6-referanse

- Versjonsdato for Prosjektveiviseren v6: **(fylles inn fra versjonshistorikksiden)**
- Innhold gjenbrukes under Digdirs vilkår (NLOD), med kildehenvisning.

## Navnekonvensjon for framtidige versjoner

Ny innholdsgenerasjon får versjonssuffiks i liste-URL (`Lists/Fasesjekklistev6`); forrige
generasjon får «(tidligere)» i visningstittelen. Maksimalt to generasjoner samtidig — ved
v7 fjernes v5-generasjonen.

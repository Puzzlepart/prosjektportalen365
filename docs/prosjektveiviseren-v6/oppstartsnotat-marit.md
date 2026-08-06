# Til Marit: gjennomgang av v6-mappingen før M1

**Fra:** Tarjei / AI-assistenten · **Dato:** 6. august 2026
**Til møtet:** gjennomgangsmøte torsdag 13.8 · **Beslutningsport M1:** fredag 14.8

## Kort om status — gode nyheter

Kildeinnhentingen som sto på deg i uke 32 er allerede gjort. Vi fikk maskinell tilgang
til prosjektveiviseren.digdir.no, og hele nettstedet (74 sider) pluss alle 11
dokumentmalene er hentet, verifisert og lagt i prosjektet. Terminologien er sjekket
ordrett mot Digdirs egne sider, og forslagene til hva som skal skje med hvert enkelt
sjekkpunkt og hver oppgave er ferdig utfylt.

**Din rolle er dermed endret fra å *hente* til å *vurdere og godkjenne*.** Det er tre
tabeller som trenger dine øyne før M1 på fredag 14.8.

## De tre tabellene

Klikk på lenkene — de åpnes i nettleseren som vanlige tabeller (du trenger ikke laste
ned noe eller kunne Git). Bruk gjerne søkefeltet over tabellen for å finne et bestemt ord.

1. **[Terminologi — gammelt begrep → nytt begrep](https://github.com/Puzzlepart/prosjektportalen365/blob/claude/prosjektportalen-v6-update-70sbom/docs/prosjektveiviseren-v6/mapping-terminologi.csv)**
   (9 rader). Ferdig verifisert mot Digdir; her skal du først og fremst ta stilling til
   beslutningspunktene under.
2. **[Fasesjekkpunkter](https://github.com/Puzzlepart/prosjektportalen365/blob/claude/prosjektportalen-v6-update-70sbom/docs/prosjektveiviseren-v6/mapping-sjekkpunkter.csv)**
   (71 rader): alle dagens 44 sjekkpunkter med forslag til hva som skjer med dem,
   pluss 27 nye punkter fra v6.
3. **[Prosjektoppgaver](https://github.com/Puzzlepart/prosjektportalen365/blob/claude/prosjektportalen-v6-update-70sbom/docs/prosjektveiviseren-v6/mapping-oppgaver.csv)**
   (90 rader): alle dagens 66 oppgaver, pluss 24 nye fra v6.

### Slik leser du tabell 2 og 3

Hver rad er ett sjekkpunkt eller én oppgave. De viktigste kolonnene:

| Kolonne | Betyr |
|---|---|
| `gammel_tittel` | Teksten slik den står i Prosjektportalen i dag |
| `ny_tittel` | Forslag til ny tekst (tom hvis teksten beholdes uendret) |
| `handling` | Hva vi foreslår skjer med punktet — se under |
| `v6_kilde` | Hvilken side hos Digdir forslaget bygger på |
| `begrunnelse` | Hvorfor |

`handling` kan være: **behold** (uendret), **omformuler** (ny ordlyd), **ny** (nytt
v6-punkt uten motsvar i dag), **fjern** (utgår — begrunnelsen forklarer hvorfor) eller
**flytt-fase** (flyttes til en annen fase, ofte slått sammen med et annet punkt).

Du trenger ikke lese alle 161 radene like grundig: **behold**-radene er ukontroversielle,
og **omformuler**-radene er i hovedsak språklig oppdatering til v6-begrepene. Bruk tiden
på **fjern**- og **flytt-fase**-radene (12 stk.) og skumles **ny**-radene (51 stk.).

## Beslutningene som venter på deg (M1)

1. **Rollen «Gevinstansvarlig» — den viktigste.** Vi antok at v6 hadde døpt rollen om
   til «nytteansvarlig». Det stemmer ikke: v6 har snudd hierarkiet. Den overordnede
   rollen heter nå **nytteeier** (og bygger på det gamle «gevinsteier»-begrepet), mens
   «nytteansvarlig» er en underrolle man delegerer til i store prosjekter.
   *Vårt forslag:* behold navnet «Gevinstansvarlig» i denne runden (å døpe om rollen
   krever endring av lagrede data hos alle kunder) og oppdater bare beskrivelsen.
   Se rad TERM-003 og TERM-004 i terminologitabellen.
2. **Navnene «Nytteoversikt» og «Nytteanalyse».** v6 har ingen egne begreper for disse
   to sidene/listene i Prosjektportalen — navnene blir våre egne konstruksjoner i
   v6-språkdrakt. Er du komfortabel med dem? (TERM-006/007.)
3. **Nynorsk.** Digdir tilbyr **ikke** nynorskversjoner av v6-malene, i motsetning til
   forrige generasjon. Skal vi vente på Digdir, oversette selv, eller la v6-malmappen
   være bokmål-only? (Digdir har imidlertid en nynorsk *ordliste* vi kan bruke.)
4. **To punkter foreslås fjernet som du bør se på:** «Informere interessenter om
   avslutning av prosjektet» (finnes ikke i v6, men er lett å beholde hvis du vil) og
   spørsmålene om egne rollebeskrivelser (v6 har felles rollebeskrivelser på nett).
5. **Rolleetablering flyttes fra konseptfasen til planleggingsfasen.** v6 legger
   prosjektstyre, prosjektleder og ressurser til planleggingsfasen; konseptfasen ledes
   av en egen «leder av utredningsarbeidet». Seks av dagens punkter flyttes/slås sammen
   som følge av dette.

## Slik gir du tilbakemelding

Det enkleste: noter **id-en** på rader du vil endre eller diskutere (f.eks. «SJ-013» eller
«OP-059») med en kort kommentar, i e-post eller et notat, og ta det med til møtet
torsdag 13.8. Du trenger ikke redigere filene selv — det gjør vi etter møtet.

## Vil du se mer av grunnlaget?

- [Kildesettet](https://github.com/Puzzlepart/prosjektportalen365/blob/claude/prosjektportalen-v6-update-70sbom/docs/prosjektveiviseren-v6/kildesett-v6.md) —
  strukturert oversikt over hele v6: faser, aktiviteter, beslutningspunkter, roller og maler.
- [kilder/-mappen](https://github.com/Puzzlepart/prosjektportalen365/tree/claude/prosjektportalen-v6-update-70sbom/docs/prosjektveiviseren-v6/kilder) —
  alle 74 Digdir-sidene ordrett, hvis du vil slå opp originalteksten bak et forslag.
  (Hver fil har lenke til Digdir-siden øverst, så du kan også lese på prosjektveiviseren.digdir.no.)
- [Fremdriftsplanen](https://github.com/Puzzlepart/prosjektportalen365/blob/claude/prosjektportalen-v6-update-70sbom/docs/plans/prosjektveiviseren-v6.md) —
  hele planen med datoer og roller.

Takk! Med dette i boks fredag 14.8 er innholdsproduksjonen i uke 34 klar til å starte
på skinner.

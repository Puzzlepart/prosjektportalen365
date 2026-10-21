## Tilgjengelighet per WCAG-kriterium

Denne oversikten viser hvordan Prosjektportalen 365 versjon 1.15.0 står mot hvert suksesskriterium i WCAG 2.1 nivå A og AA. Den tar også med de fire kriteriene fra WCAG 2.2 som er tatt med i arbeidet ([#1788](https://github.com/Puzzlepart/prosjektportalen365/issues/1788)). Den er skrevet for virksomheter som skal vurdere eller anskaffe løsningen. Resultatet per webdel og utvidelse står i [Tilgjengelighet](tilgjengelighet.md).

### Hva oversikten gjelder

- Webdelene og utvidelsene i Prosjektportalen 365, slik de selv viser innhold.
- Ikke SharePoints eget grensesnitt, som sidetopp, navigasjon, listevisninger, kommandolinje og egenskapsruten. Det står som «SharePoint» i tabellen.
- Ikke innhold redaktørene lager, som nyheter, sidetekst, hjelpeinnhold og dokumentmaler.
- Ikke det indre av PnP-kontrollene, som taksonomivelgeren.
- Ikke idé-utvidelsene (idéregistrering, idébehandling og prosjektdata for idé). De skal fases ut.

### Grunnlag og status

- **Grunnlaget er foreløpig, per 20.10.2026.**
  - Automatiske tester med axe i nettleseren mot testmiljøet, både på sidene og i panelene, dialogene og menyene.
  - jest-axe i komponenttestene.
  - Kontroll av tastatur og fokus i testene.
  - Gjennomgang av koden.
- **Håndrundene gjenstår:** VoiceOver og NVDA, zoom, tekstavstand og kontrastmodus. Til de er gjort, er «Støttes» en vurdering fra testene og koden, og statusen kan endre seg.
- **Statusene:**
  - **Støttes:** kriteriet er oppfylt i det PP365 selv viser.
  - **Delvis støttet:** oppfylt de fleste steder, med kjente unntak i merknaden.
  - **Støttes ikke:** ikke oppfylt.
  - **Ikke relevant:** PP365 har ikke innhold kriteriet gjelder.
  - **SharePoint:** kriteriet gjelder SharePoints side rundt webdelene.
- **Farger fra konfigurasjonen** er kundens valg. Det gjelder temaets primærfarge, fasefarger og farger i tidslinjekonfigurasjonen. Der vi tegner dem, velger koden lesbar tekstfarge og kanter med nok kontrast. Men den kan ikke gjøre en svak farge god nok som flate.

### Oppfattbar

| Kriterium | Nivå | Status | Merknad |
|---|---|---|---|
| 1.1.1 Ikke-tekstlig innhold | A | Støttes | Ikoner som bærer mening har tekst. Det gjelder trend, status, fase, prosjekttype og logo. Pynt er skjult for skjermlesere. |
| 1.2.1 Bare lyd og bare video (forhåndsinnspilt) | A | Ikke relevant | PP365 viser ikke egen lyd eller video. |
| 1.2.2 Teksting (forhåndsinnspilt) | A | Ikke relevant | Som over. |
| 1.2.3 Synstolking eller mediealternativ (forhåndsinnspilt) | A | Ikke relevant | Som over. |
| 1.2.4 Teksting (direkte) | AA | Ikke relevant | Som over. |
| 1.2.5 Synstolking (forhåndsinnspilt) | AA | Ikke relevant | Som over. |
| 1.3.1 Informasjon og relasjoner | A | Delvis støttet | Webdelene har en overskriftsstruktur under tittelen. Lister, navn og verdier er beskrivelseslister, og matrisene er tabeller. Tidslinjene i porteføljen, programmet og ressursallokeringen har ingen liste ved siden av, slik prosjekttidslinjen har ([#1789](https://github.com/Puzzlepart/prosjektportalen365/issues/1789)). |
| 1.3.2 Meningsfylt rekkefølge | A | Støttes | |
| 1.3.3 Sensoriske egenskaper | A | Støttes | Ingen instruksjoner bygger bare på form, plassering eller farge. |
| 1.3.4 Visningsretning | AA | Støttes | Ingen visning er låst til én retning. |
| 1.3.5 Identifiser formål med inndata | AA | Ikke relevant | Skjemaene samler prosjektdata, ikke opplysninger om brukeren selv. |
| 1.4.1 Bruk av farge | A | Støttes | Status, fase og trend vises også med tekst, navn eller form, og dagens dato i tidslinjene har etiketten «I dag». Statusikonene i statuskolonnen, på statussiden og i sammendraget i Prosjektinformasjon, også med «Vis kun ikoner», har et lite merke ved siden av: en hake, et varseltegn eller et kryss etter fargen i Prosjektkolonnekonfigurasjon, eller statusverdiens eget ikon der den har et. En farge som verken er grønn, gul eller rød, gir ikke noe merke når verdien heller ikke har eget ikon. |
| 1.4.2 Styring av lyd | A | Ikke relevant | |
| 1.4.3 Kontrast (minimum) | AA | Støttes | Fluents farger og våre egne er kontrollert. Konfigurerte farger får lesbar tekstfarge. Se avsnittet om farger over. |
| 1.4.4 Endring av tekststørrelse | AA | Støttes | Foreløpig. Zoom 200 % kontrolleres i håndrunden. |
| 1.4.5 Bilder av tekst | AA | Støttes | Øyeblikksbildet av en publisert statusrapport er et bilde av rapporten. Det samme innholdet vises som tekst når rapporten velges. |
| 1.4.10 Dynamisk tilpasning (Reflow) | AA | Delvis støttet | På verktøylinjene er det søkefeltet som gir etter når bredden minker. Først under 480 px, som ved 320 px, går knappene til neste linje. Bunnteksten brytes også, statussidens faner og sammendrag tilpasses, og idémodulens meny starter lukket på smale skjermer. Datatabeller og tidslinjer trenger to dimensjoner og er unntatt etter kriteriet. Resten måles i nettlesertestene og kontrolleres i håndrunden. |
| 1.4.11 Kontrast for ikke-tekstlig innhold | AA | Støttes | Søyler, milepæler, markører og trendikoner har kanter med minst 3:1, og fokusrammen kommer fra Fluent. |
| 1.4.12 Tekstavstand | AA | Delvis støttet | Lange prosjektnavn på prosjektkortene brytes og slutter med «…» etter fire linjer. Tagger i listecellene som ikke får plass, slutter med «…», og hele teksten står i `title` og leses av skjermlesere; de ble klippt uten «…». Titler i listene avkortes med «…» som før. Et verktøytips med hele teksten ved peker og fokus ble vurdert og valgt bort for å holde visningen lik den vi har. Resten måles i nettlesertestene og kontrolleres i håndrunden. |
| 1.4.13 Pekerfølsomt innhold eller innhold ved tastaturfokus | AA | Støttes | Verktøytips og popovere fra Fluent kan lukkes med Escape og holdes åpne under pekeren. Innhold som før bare fantes i verktøytips, kan nås med tastaturet. |

### Mulig å betjene

| Kriterium | Nivå | Status | Merknad |
|---|---|---|---|
| 2.1.1 Tastatur | A | Støttes | Alt kan nås og brukes med tastatur. Det gjelder også elementene i tidslinjene og matrisene, flytting av kolonner uten å dra, og kolonnebredden i Dynamisk liste (fra kolonnemenyen). Unntak: det indre av PnP-kontrollene. |
| 2.1.2 Ingen tastaturfelle | A | Støttes | Dialoger, paneler og popovere holder fokus mens de er åpne og slipper det når de lukkes. |
| 2.1.4 Hurtigtaster | A | Ikke relevant | PP365 har ingen hurtigtaster med ett tegn. |
| 2.2.1 Justerbar hastighet | A | Ikke relevant | Ingen tidsgrenser. |
| 2.2.2 Pause, stopp, skjul | A | Ikke relevant | Ingen innhold beveger seg av seg selv, utenom innlastingsindikatorer. |
| 2.3.1 Terskelverdi på maksimalt tre glimt | A | Støttes | Ingenting blinker. |
| 2.4.1 Hoppe over blokker | A | SharePoint | SharePoint gir snarveien til hovedinnholdet. Webdelene har egne overskrifter. |
| 2.4.2 Sidetitler | A | SharePoint | |
| 2.4.3 Fokusrekkefølge | A | Støttes | Fokus går tilbake til det som åpnet et panel, en dialog, en meny eller en popover når den lukkes. Nettlesertestene kontrollerer det. |
| 2.4.4 Formål med lenker (i kontekst) | A | Støttes | |
| 2.4.5 Flere måter | AA | SharePoint | |
| 2.4.6 Overskrifter og ledetekster | AA | Støttes | |
| 2.4.7 Synlig fokus | AA | Støttes | |
| 2.5.1 Pekerbevegelser | A | Støttes | Ingen funksjon krever bevegelser med flere fingre eller i en bane. |
| 2.5.2 Pekeravbrytelse | A | Støttes | |
| 2.5.3 Ledetekst i navn | A | Støttes | Et navn på en knapp med tekst begynner med teksten. |
| 2.5.4 Bevegelsesaktivering | A | Ikke relevant | |

### Forståelig

| Kriterium | Nivå | Status | Merknad |
|---|---|---|---|
| 3.1.1 Språk på siden | A | SharePoint | |
| 3.1.2 Språk på deler av innhold | AA | Støttes | Tekstene kommer fra språkfilene. Engelske standardnavn fra Fluent, som «clear» i søkefeltene og «information» på info-knappen, er erstattet. |
| 3.2.1 Fokus | A | Støttes | |
| 3.2.2 Inndata | A | Støttes | |
| 3.2.3 Konsekvent navigering | AA | SharePoint | |
| 3.2.4 Konsekvent identifikasjon | AA | Støttes | |
| 3.3.1 Identifikasjon av feil | A | Støttes | Feil vises i tekst og leses opp, også når lagring, opplasting og henting feiler. |
| 3.3.2 Ledetekster eller instruksjoner | A | Støttes | Feltene har etiketter, og påkrevde felt er merket. En knapp som ikke kan brukes ennå, kan nås med tastaturet og sier hva den trenger. |
| 3.3.3 Forslag ved feil | AA | Støttes | For eksempel om formatet på en nettadresse og grensene for et beløp. |
| 3.3.4 Forhindre feil (juridiske feil, økonomiske feil, datafeil) | AA | Støttes | Sletting og faseskifte krever bekreftelse. |

### Robust

| Kriterium | Nivå | Status | Merknad |
|---|---|---|---|
| 4.1.1 Parsing | A | Støttes | Utgått i WCAG 2.2. |
| 4.1.2 Navn, rolle, verdi | A | Støttes | Unntak: det indre av PnP-kontrollene. |
| 4.1.3 Statusbeskjeder | AA | Støttes | Søk, antall treff, lasting, lagring og fremdrift leses opp. |

### Fra WCAG 2.2

| Kriterium | Nivå | Status | Merknad |
|---|---|---|---|
| 2.4.11 Fokus ikke skjult (minimum) | AA | Støttes | Det som får fokus under de festede fanene på statussiden, holdes fritt. |
| 2.5.7 Drabevegelser | AA | Støttes | Kolonner flyttes også med knapper og tastatur. |
| 2.5.8 Målstørrelse (minimum) | AA | Støttes | Foreløpig. Mappenavnene i «Hent dokumentmal» ble gjort minst 24 px høye. Resten kontrolleres i håndrunden. |
| 3.3.7 Overflødig inntasting | A | Støttes | Ingen skjemaer ber om det samme to ganger. |

### Kjente avvik

- **Tidslinjene i porteføljen, programmet og ressursallokeringen** har ingen liste ved siden av (1.3.1). Se [#1789](https://github.com/Puzzlepart/prosjektportalen365/issues/1789).
- **Bunnteksten på listesider:** på SharePoints listesider vises bunnteksten ikke på omtrent 1 av 4 lastinger, fordi SharePoint ikke definerer plassholderne den skal tegnes i. Det er meldt til Microsoft ([SharePoint/sp-dev-docs#11068](https://github.com/SharePoint/sp-dev-docs/issues/11068)). En React-feil som også ble meldt der, har ikke vist seg siden 20.10.2026.

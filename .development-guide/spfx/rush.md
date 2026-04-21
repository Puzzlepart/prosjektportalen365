## Rush og bygging

### Rush

Rush er et byggverktøy som brukes i Prosjektportalen for å administrere løsningene. Dette er spesielt nyttig da vi har et monorepo-oppsett hvor alle løsningene lagres i samme repo, og det lar oss administrere avhengigheter, byggprosesser og versjonering på tvers av alle løsninger på en konsistent måte.

I Prosjektportalen er Rush konfigurert via [`rush.json`](../../rush.json)-filen. Denne filen spesifiserer Rush-versjonen som skal brukes, løsningene inkludert i monorepoet, og ulike innstillinger relatert til versjonering og publisering.

Her er noen vanlige Rush-kommandoer vi ofte bruker når vi jobber med Prosjektportalen:

- `rush add -p [pakkenavn]`: Legger til en ny pakke i monorepoet. Den vil automatisk oppdatere `rush.json` og `package.json` for å inkludere den nye pakken.

- `rush update`: Installerer pakkens avhengigheter og sørger for at riktige versjoner brukes på tvers av alle løsninger. Du bør kjøre denne kommandoen hver gang du kloner repoet eller endrer noen pakkers avhengigheter.

- `rush build`: Bygger alle løsningene i Prosjektportalen. Den ordner byggprosessen intelligent basert på løsningsavhengigheter, slik at avhengige løsninger bygges i riktig rekkefølge.

- `rush rebuild`: Ligner på `rush build`, men tvinger en ren bygging av alle løsninger og ignorerer eventuell mellomlagret byggetilstand.

For mer detaljert informasjon om hvordan du bruker Rush, se den offisielle [Rush-dokumentasjonen](https://rushjs.io/).

### Bygging for utvikling

For å jobbe med de ulike løsningene, må du gjøre følgende:

1. Forsikre deg om at `npm` er installert.
2. Hvis du har `rush` installert, kjør `rush update && rush build` (eller bruk npm-skriptet `rush:init` i roten av prosjektet).

_For å installere `rush` globalt, kjør `npm i @microsoft/rush -g` i terminalen._

### Legge til en ny npm-pakke med Rush

Ikke bruk lenger `npm i [pakkenavn] -S`. Med Rush skal vi bruke `rush add -p [pakkenavn]`.

For å installere pakken for alle løsningene, legg til `--all` og legg til `-m` hvis du vil gjøre versjonen konsistent i alle løsningene.

Les mer om kommandoen `rush add` [her](https://rushjs.io/pages/commands/rush_add/).

### Oppdateringer til delt-bibliotek (shared-library)

Hvis du har utført endringer i `shared-library` som du vil skal ha effekt i en løsning som er avhengig av det, kan du bruke `rush rebuild`.

Kjør følgende for å bare bygge `pp365-shared-library` på nytt:

```pwsh
rush rebuild -o pp365-shared-library
```

_Det bør ikke ta mer enn 30 sekunder._

### Overvåk konfigurasjon og kanaler

Hvis du vil overvåke endringer for en spesifikk kanal, kan du sette `SERVE_CHANNEL` i `.env`-filen til løsningen din.

Deretter kjører du `npm run watch` som vanlig.

### Bygg bare spesifikke komponenter

Hvis du vil gjøre overvåking/serving raskere, kan du sette `SERVE_BUNDLE_REGEX` for å filtrere komponentene du vil bygge.

**Eksempel:**

```text
SERVE_CHANNEL=test
SERVE_BUNDLE_REGEX=latest-projects-web-part
```

Bare komponenten `LatestProject` vil bli bygget. `config.json` vil automatisk bli tilbakestilt når du avbryter overvåkingsskriptet.

### Oppgaver

Se [Oppgaver](../../SharePointFramework/.tasks/README.md) for en oversikt over tilgjengelige oppgaveskript.

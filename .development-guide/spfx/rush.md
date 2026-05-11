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

### Full tilbakestilling av Rush-tilstand

Når du støter på rare bygg- eller installasjonsfeil som ikke lar seg løse med `rush update` alene — typisk etter en branch-bytte som endrer mange `package.json`-filer, merge-konflikter i lockfilen, eller når `pp365-shared-library`-symlinker virker utdaterte — kan du gjøre en full tilbakestilling:

```pwsh
rush unlink && rush purge && rush update && rush rebuild
```

Hva de fire kommandoene gjør:

- `rush unlink`: Fjerner de lokale symlinkene Rush oppretter i hver løsnings `node_modules` mot andre prosjekter i monorepoet (f.eks. `pp365-shared-library`). Nyttig når symlinker har blitt utdaterte eller ødelagte.
- `rush purge`: Sletter Rush sin midlertidige tilstand under `common/temp` og alle `node_modules`-mapper i hver løsning. Den tyngste opprydningen.
- `rush update`: Reinstallerer alle avhengigheter på nytt fra lockfilen og kobler prosjektene sammen igjen.
- `rush rebuild`: Tvinger en ren bygging av alle løsningene og ignorerer mellomlagret byggetilstand.

Når dette er nyttig:

- Etter å ha byttet til en branch som endrer mange `package.json`-filer eller lockfilen
- Etter at en merge-konflikt i lockfilen er løst
- Når du ser «module not found», versjonskonflikter, eller at endringer i `shared-library` ikke slår igjennom selv etter `rush rebuild -o pp365-shared-library`
- Når du mistenker at mellomlagret tilstand i `common/temp` eller `node_modules` er problemet
- Etter en større dependency-oppgradering

Merk at hele sekvensen tar flere minutter — bruk den som «nullstilling» når mindre tiltak ikke holder, ikke som førstevalg.

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

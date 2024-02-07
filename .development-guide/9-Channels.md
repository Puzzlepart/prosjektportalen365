## Installasjonskanaler

For å støtte installasjon av flere forekomster av _Prosjektportalen 365_ i en leietaker, støtter vi **installasjonskanaler**.

### Generere en ny kanalkonfigurasjon

For å generere en ny kanalkonfigurasjon, bruk `npm`-skriptet `generate-channel-config`.

For å generere en ny kanalkonfigurasjon for `test`:

```javascript
npm run-script generate-channel-config test
```

For å oppdatere en eksisterende kanalkonfigurasjon, legg til flagget `/update`:

```javascript
npm run-script generate-channel-config test /update
```

### Bygge en ny versjon for en kanal

For å bygge en ny versjon for en kanal, legg til flagget `-Channel` når du kjører utgivelsesskriptet.

**Eksempel (bygger for testkanal):**

```powershell
Install/Build-Release.ps1 -Channel test
```

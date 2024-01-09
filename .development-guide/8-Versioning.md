## Versjonering

Etter oppdatering av versjonen ved bruk av `npm version patch` eller `npm version minor`, kjøres oppgaven `tasks/automatic-versioning.js`. Dette synkroniserer versjonene på tvers av løsningen.

Denne oppgaven, `automatic-versioning.js`, kan også kjøres som en **npm-skript** utenfor hendelsen `postversion`.

```powershell
npm run sync-version
```

Etter at skriptet `sync-version` har blitt kjørt, er det viktig å publisere SharePointFramework-pakkene (@Shared, PortfolioWebParts, osv...) til npm.

Dette gjøres for hver pakke ved å kjøre følgende skript:

```powershell
npm install; npm run build; npm publish;
```

Hvis du må oppdatere og bruke en pakke under utvikling, legg til en midlertidig tag:

```powershell
npm install; npm run build; npm publish --tag temp;
```

Obs.: For å kunne publisere må du logge inn med en konto som har tilgang til pakkene på [npmjs](https://www.npmjs.com).
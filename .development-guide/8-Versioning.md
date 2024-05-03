## Versjonering

Etter oppdatering av versjonen ved bruk av `npm version patch` eller `npm version minor`, kjøres oppgaven `tasks/automatic-versioning.js`. Dette synkroniserer versjonene på tvers av løsningen.

Denne oppgaven, `automatic-versioning.js`, kan også kjøres som en **npm-skript** utenfor hendelsen `postversion`.

```powershell
npm run sync-version
```

Sjekk at versjoenene av pakkene som brukes som avhengigheter i `package.json` er oppdatert til den nye versjonen.

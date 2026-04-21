## Versjonering

Oppdater aldri versjonen av løsningene uavhengig. Versjonen holdes automatisk synkronisert med de andre pakkene.

Etter oppdatering av versjonen ved bruk av `npm version patch` eller `npm version minor`, kjøres oppgaven `.tasks/automatic-versioning.js`. Dette synkroniserer versjonene på tvers av løsningen.

Denne oppgaven, `automatic-versioning.js`, kan også kjøres som et **npm-skript** utenfor hendelsen `postversion`:

```powershell
npm run sync-version
```

Sjekk at versjonene av pakkene som brukes som avhengigheter i `package.json` er oppdatert til den nye versjonen.

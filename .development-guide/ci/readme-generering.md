## README-generering

README er automatisk generert ved hjelp av [@appnest/readme](https://github.com/andreasbm/readme). Hoved-README er generert fra [.README](../../.README), mens denne utviklerguiden er generert fra [.README](../.README). Generering konfigureres med `blueprint.json`-filene.

For hoved-[.README](../../.README)-generering er de forskjellige delene inkludert fra [readme](../../readme)-mappen på rotnivå.

For å kjøre generering manuelt:

```powershell
npm run generate-readme
```

Generering kjøres også automatisk som del av `postversion`-hooken.

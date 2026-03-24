## Smoke test-prosessen

Denne siden forklarer hvordan smoke test gjennomføres for Prosjektportalen før hver release. Smoke test sikrer at alle hovedfunksjoner virker etter oppgradering eller ny installasjon.

### Hva er en smoke test?
En smoke test er en overfladisk, men bred test av alle sentrale funksjoner. Målet er å avdekke kritiske feil raskt, slik at man kan stoppe en release før den går videre til produksjon hvis noe vesentlig er ødelagt.

### Issue-maler for smoke test
Det finnes 8 maler for smoke test:

| Malnavn | Dekker |
|---|---|
| smoketest.md | Oppsummeringsissue for hele testen |
| smoketest-portfolioextensions.yml | PortfolioExtensions (footer, idémodul) |
| smoketest-portfoliowebparts.yml | PortfolioWebParts (porteføljeoversikt, prosjektliste, idémodul m.m.) |
| smoketest-programwebparts.yml | ProgramWebParts (programadministrasjon, aggregering, prosjektoversikt, tidslinje, status) |
| smoketest-projectextensions.yml | ProjectExtensions (oppsettveiviser, dokumentmalvelger, usikkerhetstiltak) |
| smoketest-projectwebparts.yml | ProjectWebParts (prosjektinformasjon, faser, status, tidslinje, matriser, gevinstoversikt, dynamisk liste, nyheter) |
| smoketest-sharepoint-sider.yml | SharePoint-sider (porteføljehjem, konfigurasjon, navigasjon, konfigurasjonslister) |
| smoketest-dokumentasjon.yml | Dokumentasjon og hjelpeinnhold |

### Slik gjennomføres smoke test

1. **Opprett oppsummeringsissue**
   - Bruk `smoketest.md`-malen for å opprette et hoved-issue for releasen.
   - Fyll inn versjon, miljø, tenant-URL og dato.
2. **Opprett per-pakke issues**
   - Opprett ett issue for hver av de 7 pakkene fra de respektive YAML-malene.
   - Lenke til disse fra oppsummerings-issue.
3. **Tilordne testere**
   - Fyll ut tabellen for tester-tilordning i oppsummerings-issue.
4. **Gjennomfør testing**
   - Hver tester går gjennom sjekkpunktene i sitt tildelte issue.
   - Kryss av for hvert punkt som er bestått.
   - Ved feil: legg igjen kommentar med beskrivelse og skjermbilde.
5. **Oppdater status**
   - Oppsummerings-issue oppdateres med statusikoner for hver pakke etter hvert som testing fullføres.

### Vedlikehold av malene

- Smoke test-maler må holdes oppdatert når det skjer endringer i kodebasen (f.eks. nye webdeler, endrede felter, fjernede funksjoner).
- Malene ligger i `.github/ISSUE_TEMPLATE/` og bør revideres ved større endringer i funksjonalitet.
- Se også kommentarer i YAML-filene for detaljer om hvert testpunkt.

### Tips
- Smoke test bør alltid kjøres på både ny installasjon og oppgradering.
- Dokumentasjon og hjelpeinnhold testes separat i `smoketest-dokumentasjon.yml`.
- Oppsummerings-issue gir oversikt over fremdrift og ansvar.

## SBOM-generering

### Hva er SBOM?

SBOM (Software Bill of Materials) er en omfattende liste over alle programvarekomponenter, biblioteker og avhengigheter som brukes i Prosjektportalen 365. Den gir innsyn i hvilke åpen kildekode- og tredjepartskomponenter som er inkludert i prosjektet, noe som er viktig for:

- **Sikkerhet**: Identifisering av sårbare avhengigheter
- **Etterlevelse**: Oppfyllelse av regulatoriske krav
- **Lisenshåndtering**: Forståelse av lisensforpliktelser
- **Åpenhet**: Gi interessenter innsikt i prosjektets komponenter

### Automatisk generering

SBOM-en genereres automatisk når:

1. **Versjonsoppdateringer**: Når du kjører `npm version patch` eller `npm version minor`, regenererer `postversion`-hooken automatisk SBOM-en
2. **GitHub-utgivelser**: Når en versjons-tag (f.eks. `v1.12.0`) pushes til GitHub, genererer og committar arbeidsflyten automatisk den oppdaterte SBOM-en
3. **Manuell utløsning**: GitHub-arbeidsflyten kan utløses manuelt fra fanen «Actions»

### Manuell generering

For å generere SBOM-en manuelt:

```bash
npm run generate-sbom
```

Dette vil:
- Skanne alle `package.json`-filer i monorepoet
- Samle alle avhengigheter (både produksjons- og utviklingsavhengigheter)
- Generere en omfattende SBOM.md-fil i roten av repoet
- Inkludere metadata som versjoner og hvilke prosjekter som bruker hver avhengighet

### Innhold i SBOM

Den genererte SBOM-en inkluderer:

- **Prosjektoversikt**: Totalt antall avhengigheter og prosjekter
- **Prosjekter i monorepoet**: Liste over alle pakker med antall avhengigheter
- **Alle avhengigheter**: Konsolidert liste over alle unike avhengigheter
  - Produksjonsavhengigheter
  - Utviklingsavhengigheter
  - Versjonsinformasjon
  - Bruksinformasjon (hvilke prosjekter som bruker hver avhengighet)
- **Detaljert oversikt**: Prosjektspesifikke avhengighetslister
- **Dokumentasjon**: Hvordan oppdatere SBOM-en og etterlevelsesformasjon

### Filplassering

SBOM-en genereres som `SBOM.md` i roten av repoet og committes til versjonskontroll.

### GitHub-arbeidsflyt

Arbeidsflyten for SBOM-generering (`.github/workflows/generate-sbom.yml`) kjøres automatisk når versjons-tagger pushes. Den kan også utløses manuelt via GitHub Actions.

Arbeidsflyten:
1. Installerer avhengigheter
2. Genererer SBOM-en
3. Committer den oppdaterte SBOM-en hvis den har endret seg
4. Laster opp SBOM-en som et byggartefakt

### Skriptdetaljer

Skriptet for SBOM-generering ligger i `.tasks/generate-sbom.js` og følger disse beste praksisene:

- **CycloneDX-inspirert format**: Basert på industristandarder
- **Fullstendig dekning**: Inkluderer alle prosjekter i Rush-monorepoet
- **Lesbart format**: Generert som Markdown for enkel visning
- **Rik på metadata**: Inkluderer versjonsnumre og avhengighetsrelasjoner
- **Automatisert**: Integreres med eksisterende bygge- og versjoneringsprosesser

### Oppdatering av avhengigheter

Når du oppdaterer avhengigheter:

1. Oppdater de relevante `package.json`-filene
2. Kjør `npm install` eller `rush update`
3. Kjør `npm run generate-sbom` for å oppdatere SBOM-en
4. Commit både endringene i package.json og den oppdaterte SBOM.md

Merk: SBOM-en vil bli automatisk regenerert under versjonsoppdateringer, men det er god praksis å oppdatere den når du gjør betydelige avhengighetsendringer.

### Sikkerhetshensyn

SBOM-en kan brukes med sikkerhetsanalyseverktøy for å:
- Identifisere kjente sårbarheter i avhengigheter
- Sjekke for utdaterte pakker
- Verifisere lisensoverensstemmelse
- Overvåke sikkerhetsadvarsler

Anbefalte verktøy:
- `npm audit` - Innebygd npm-sikkerhetsskanner
- GitHub Dependabot - Automatiske sikkerhetsoppdateringer
- Snyk - Kontinuerlig sikkerhetsovervåking
- OWASP Dependency-Check - Sårbarhetsdeteksjon

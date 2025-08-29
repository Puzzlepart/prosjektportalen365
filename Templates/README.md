## Maler

### Språkressurser og RESX-filer

Templates-mappen inneholder språkressurser for Prosjektportalen 365 som brukes på tvers av SharePoint Framework-komponenter. Språkressursene er definert i `.resx`-filer og må bygges om til JavaScript-format når de endres.

#### RESX-filer

Språkressursene er definert i:

- `Portfolio/Resources.en-US.resx` - Engelske ressurser
- `Portfolio/Resources.no-NB.resx` - Norske ressurser

Disse filene inneholder alle strenger som brukes i SharePoint Framework-komponentene, inkludert navigasjonselementer, feltlabels, meldinger, osv.

#### Bygging av språkressurser

Etter at du har lagt til eller endret strenger i `.resx`-filene, må du kjøre følgende kommandoer for å generere oppdaterte JavaScript-filer:

```bash
# Generer JSON fra RESX-filer
npm run generate-resx-json

# Generer TypeScript-definisjoner og JavaScript-filer
npm run generate-resx-ts

# Eller kjør begge på én gang
npm run build
```

Dette vil automatisk oppdatere språkfilene i alle SharePoint Framework-prosjektene:

- `SharePointFramework/shared-library/src/loc/shared/`
- `SharePointFramework/PortfolioWebParts/src/loc/shared/`
- `SharePointFramework/PortfolioExtensions/src/loc/shared/`
- `SharePointFramework/ProjectWebParts/src/loc/shared/`
- `SharePointFramework/ProjectExtensions/src/loc/shared/`
- `SharePointFramework/ProgramWebParts/src/loc/shared/`

#### Rebuilding SharePoint Framework-komponenter

Etter at språkressursene er oppdatert, må du bygge om de relevante SharePoint Framework-prosjektene for at endringene skal tre i kraft:

```bash
# Eksempel: Bygg om PortfolioWebParts
cd SharePointFramework/PortfolioWebParts
npm run build

# Eller bruk Rush for å bygge alle prosjekter
npm run rush:build
```

#### Bruk av språkressurser

Språkressursene importeres i SharePoint Framework-komponentene som:

```typescript
import resource from 'SharedResources'

// Bruk ressursene
const taskUrl = resource.Navigation_Tasks_Url
const taskTitle = resource.Navigation_Tasks_Title
```

Se **3. Maler** i [Utviklingsguiden](./.development-guide/README.md).

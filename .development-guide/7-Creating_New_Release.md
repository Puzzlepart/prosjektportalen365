## Opprettelse av en ny versjon

For å opprette en ny versjon har vi to alternativer: `Minor` og `Patch`. En ny minor-versjon bør opprettes når det er ny funksjonalitet av interesse for brukerne, mens patch-versjoner kan opprettes ofte med feilrettinger, justeringer og minimale funksjonelle forbedringer.

Økningen av versjonsnummeret gjøres ved hjelp av npm-skript. Dette gjøres på `releases/*` branch når funksjonaliteten som for øyeblikket er under utvikling, anses som klar for utgivelse.

### Patch-utgivelse

```powershell
npm version patch
git push --tags
```

### Minor-utgivelse

```powershell
npm version minor
git push --tags
```

Opprett deretter en PR for å merge `releases/*` inn i `main`. Resultatet fra GitHub Actions vil inkludere en utgivelsespakke som kan deles som en utgivelse på GitHub. Ingen manuell bygging er nødvendig.

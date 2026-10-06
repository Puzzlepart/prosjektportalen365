## Commit-praksis

### Semantiske commit-meldinger

Vi bruker semantiske commit-meldinger for å gjøre historikken mer lesbar og for å automatisere versjonering og changelog-generering.

**OBS: Alle commit-meldinger skal skrives på engelsk.**

**Format:** `<type>(<scope>): <subject>`

`<scope>` er valgfri

**Eksempel:**

```text
feat: add hat to cat
^--^  ^------------^
|     |
|     +-> Sammendrag i presens
|
+-------> Type: chore, docs, feat, fix, refactor, style, ci eller install
```

**Commit-typer:**

- `feat`: ny funksjonalitet for brukeren (ikke ny funksjonalitet for byggskript)
- `fix`: feilretting for brukeren (ikke retting av byggskript)
- `docs`: endringer i dokumentasjon og/eller markdown-filer (changelog, readme...)
- `style`: formatering, manglende semikolon osv.; ingen endring i produksjonskode
- `refactor`: refaktorering av produksjonskode, f.eks. omdøping av en variabel
- `chore`: oppdatering av grunt-oppgaver osv.; ingen endring i produksjonskode
- `ci`: endringer i kontinuerlig integrasjon-konfigurasjon og skript (f.eks. GitHub Actions)
- `install`: endringer i installasjonsskript

**Flere eksempler:**

```text
feat(portfoliowebparts): add new risk matrix component
fix(projectwebparts): resolve timeline rendering issue
docs: update installation guide
style(shared): fix indentation in utils
refactor(projectextensions): simplify project setup logic
chore: update dependencies
ci: improve build process
install: update installation scripts
```

**Referanser:**

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic_commit_messages)
- [Karma Git Commit Msg](http://karma-runner.github.io/1.0/dev/git-commit-msg.html)

### GitHub Actions og commit-triggere

Prosjektportalen bruker GitHub Actions for kontinuerlig integrasjon og utrulling. Forskjellige commit-meldinger kan påvirke hvilke actions som kjøres:

Nøkkelordene leses bare fra emnelinjen (første linje) i commit-meldingen. Den fullstendige listen og hva hver arbeidsflyt gjør, står i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md). De mest brukte:

- `[skip-ci]` – ingen bygging eller utrulling (unntatt `skills.yml`, som bare sjekker agentferdighetene)
- `[apps-only]` – bygger og ruller ut bare pakkene (appkatalogen), ikke malene. Brukes når ingenting i `Templates/` er endret.
- `[apps-only:<løsninger>]` – som `[apps-only]`, men pakker og ruller ut bare de oppgitte løsningene (alle seks bygges fortsatt)
- `[skip-e2e]` – hopper over Playwright-testene etter utrullingen til testkanalen
- `[build-debug]` – bygger pakken i feilsøkingsarbeidsflyten, uten utrulling

**Eksempler på bruk:**

```text
docs: update the development guide [skip-ci]
fix(PortfolioWebParts): long column names end in an ellipsis [apps-only:PortfolioWebParts,ProgramWebParts]
feat(shared-library): a new utility function [apps-only]
ci: try a change to the build [skip-ci] [build-debug]
```

**Tips:** Bruk `[skip-ci]` når endringen ikke påvirker det som bygges (for eksempel bare dokumentasjon), og `[apps-only]` når malene ikke er endret: en full kjøring oppgraderer testtenanten med maler og tar rundt 40 minutter.

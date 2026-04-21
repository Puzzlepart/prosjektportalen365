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

**Actions som hopper over CI:**

- `[skip-ci]` - Hopper over alle CI-prosesser
- `[skip-main-ci]` - Hopper over hovedbygging (build-release.yml)
- `[skip-test-ci]` - Hopper over test-kanal bygging
- `[apps-only]` - Bygger kun pakker (appkatalog), hopper over utrulling av maler. Brukes dersom du ikke har gjort noen endringer på .xml-filene i Templates.

**Eksempler på bruk:**

```text
docs: update README [skip-ci]
chore: update package.json [skip-main-ci]
fix(portfoliowebparts): minor styling fix [skip-test-ci]
feat(shared): add new utility function [apps-only]
```

**Aktive arbeidsflyter:**

- **ci-releases.yml** - Kjører på `main`-branch for utgivelsesbygging
- **build-release.yml** - Kjører på siste releases-branch og `main` for full bygging
- **pr-package-spfx-dev.yml** - Kjører på pull requests mot release-branches
- **automatic_chores.yml** - Kjører automatiske vedlikeholdsoppgaver (linting m.m.)
- **ci-channel-test.yml** - Kanalspesifikt bygg for testing

**Tips:** Bruk skip-flaggene når du gjør endringer som ikke påvirker funksjonaliteten (som dokumentasjonsoppdateringer) for å spare CI-ressurser. Eller dersom det ikke er nødvendig å få med endringene dine når du skal gjøre flere relaterte endringer i samme branch.

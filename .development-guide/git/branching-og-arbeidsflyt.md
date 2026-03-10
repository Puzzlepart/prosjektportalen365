## Branching-strategi og arbeidsflyt

### Branching-strategi

Prosjektportalen bruker en utgivelsesbasert branching-strategi hvor vi har dedikerte branches for hver utgivelse:

Eksempel:

- `releases/1.12` - Gjeldende utviklings-branch
- `releases/1.11` - Forrige utgivelse
- `releases/1.10` - Tidligere utgivelse
- osv...

Alle nye funksjoner og feilrettinger skal utvikles mot den aktuelle release-branchen. Formatet på versjonene følger [Semantic Versioning](http://semver.org/spec/v2.0.0.html). `Minor`-utgivelse får egen branch. `Patch`-utgivelse inngår i den relevante branchen.

### Arbeidsflyt for GitHub Issues

Når du jobber med et spesifikt GitHub issue, opprett en branch fra gjeldende release-branch med følgende navnekonvensjon:

```text
issues/<issue-nummer>
```

**Eksempler:**

```bash
git checkout releases/1.12
git checkout -b issues/1628
```

Når arbeidet er ferdig, opprett en pull request tilbake til release-branchen. Husk å referere til issue-nummeret i PR-beskrivelsen.

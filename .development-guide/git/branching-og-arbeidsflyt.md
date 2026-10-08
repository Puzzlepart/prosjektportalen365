## Branching-strategi og arbeidsflyt

### Branching-strategi

`main` er siste utgivelse. Hver minor-versjon utvikles på sin egen release-branch, `releases/x.y`:

- `releases/1.15`: gjeldende utviklings-branch
- `releases/1.14`, `releases/1.13`, …: tidligere utgivelser

Nye funksjoner og feilrettinger går mot gjeldende release-branch. Versjonene følger [Semantic Versioning](https://semver.org/spec/v2.0.0.html). En minor får sin egen branch. Hvilken branch en patch lages fra, avtales i teamet; se [Opprettelse av en ny versjon](../utgivelse/opprette-ny-versjon.md).

En push til `releases/1.15` bygger og ruller ut til utviklingsmiljøet og testtenanten; se [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md).

### Din branch

Lag branchen fra gjeldende release-branch, og gi den navn etter typen arbeid, som commit-typene: `feat/<emne>`, `fix/<emne>`, `chore/<emne>` eller `docs/<emne>`. For et enkelt issue går også `issues/<issue-nummer>`.

```bash
git checkout releases/1.15
git pull
git checkout -b fix/tidslinje-zoom
```

Lag ikke en branch fra en annen langvarig branch (som `feat/dependency-upgrades-phase-5`): da følger alle dens commits med i pull requesten. `git log --oneline origin/releases/1.15..HEAD` skal bare vise dine egne.

### Pull request og merge

- Opprett pull requesten mot release-branchen, med milepælen for versjonen (`1.15.0`), og fyll ut `.github/PULL_REQUEST_TEMPLATE.md`. Referer til issuet i beskrivelsen.
- Slå sammen med **Squash and merge**. CI leser emnelinjen i squash-commiten, så legg en CI-tag som `[apps-only]` på slutten av emnelinjen i merge-dialogen, ikke i PR-tittelen. En vanlig merge-commit har ingen tag og starter alltid hele løpet. Se [Commit-praksis](commit-praksis.md) og taggene i [Kontinuerlig integrasjon](../ci/kontinuerlig-integrasjon.md).
- Pull requester kjører ingen bygg, bare `skills.yml` når agentferdighetene er endret. Bygg og test lokalt før du ber om review.

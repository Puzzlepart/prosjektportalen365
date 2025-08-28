# PortfolioExtensions

Denne løsningen inneholder SPFx-utvidelser for porteføljenivået.

_Publiseres til **npm** som `pp365-portfolioextensions`_

## Utvidelser

### Footer

Legg til footer `custom action` manuelt ved å kjøre følgende skript:

```powershell
Add-PnPApplicationCustomizer -Title "Footer" -ClientSideComponentId "84f27cec-ffde-4e00-a4cf-25c69f691054" -ClientSideComponentProperties "{`"listName`":`"Hjelpeinnhold`",`"linkText`":`"Hjelp tilgjengelig`"}"
```

## Serve

- Ta en kopi av `config/serve.sample.json` og gi den navnet `serve.json`
- Kjør `npm run serve`

## Versjonering

Aldri oppdater versjonen av denne løsningen uavhengig. Versjonen holdes automatisk synkronisert med de andre pakkene.

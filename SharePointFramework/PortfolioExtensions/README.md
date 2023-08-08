# Portfolio extensions

This solution contains SPFx extensions for the portfolio level.

_Published to **npm** as `pp365-portfolioextensions`_

## Extensions

### Footer
Add the footer custom action manually by running the following script:

```powershell
Add-PnPApplicationCustomizer -Title "Footer" -ClientSideComponentId "84f27cec-ffde-4e00-a4cf-25c69f691054" -ClientSideComponentProperties "{`"listName`":`"Hjelpeinnhold`",`"linkText`":`"Hjelp tilgjengelig`"}"
```

## Serve

- Take a copy of `config/serve.sample.json` and name it `serve.json`
- Run `npm run serve`

## Versioning

Never update the version of this solution independently. The version is automatically kept in sync with the other packages.

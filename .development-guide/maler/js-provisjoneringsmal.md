## Prosjektmaler (JSON)

Nye prosjektområder settes opp av oppsettveiviseren, `ProjectSetup`-utvidelsen i `ProjectExtensions`. Site scriptet `002000 - Setup extension.txt` knytter den til området (se [Site design og site scripts](site-design-og-site-scripts.md)). Veiviseren legger på en JSON-mal med motoren [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning), som er låst til versjon `1.5.1` i `ProjectExtensions` og `PortfolioExtensions`.

### Kildene og de genererte malene

| Kilde i `Templates/JsonTemplates/` | Norsk mal | Engelsk mal |
|---|---|---|
| `_JsonTemplateProject.json` | `Standardmal` | `DefaultTemplate` |
| `_JsonTemplateProgram.json` | `Programmal` | `ProgramTemplate` |
| `_JsonTemplateParent.json` | `Overordnet` | `ParentTemplate` |

`npm run generate-project-templates` i `Templates/` (også en del av `npm run build` der) skriver hver mal til `Templates/Content/Portfolio_content.<språk>/ProjectTemplates/<navn>.txt`. Innholdsmalen laster filene opp til hubens bibliotek `Prosjektmaler`, og hver rad i listen `Maloppsett` peker på én fil. Filnavnene står i `templateNames` i `Templates/.tasks/generate-project-templates.js`, som bare kjenner `Project`, `Program` og `Parent`.

Tokens i kildene:

| Token | Byttes med |
|---|---|
| `{{Nøkkel}}` | Teksten for nøkkelen i språkets `.resx`-fil, f.eks. `"Name": "{{ContentTypes_Uncertainty_Name}}"` |
| `{{ControlId_<alias>}}` | ID-en til SPFx-komponenten med det aliaset, fra kanalfila; se [Installasjonskanaler](kanaler.md) |
| `{version}` | Versjonen i rotens `package.json` |

Rediger kildene, ikke `.txt`-filene: de er genererte og står i `.gitignore`.

### Parameters

Hver mal har et `Parameters`-objekt. I alle tre kildene ser det slik ut:

```json
{
  "Parameters": {
    "ProvisionSiteFields": "{{SiteFields_Project_Group}}",
    "CustomSiteFields": "{{SiteFields_CustomFields_Group}}",
    "ProjectContentTypeId": "0x0100805E9E4FEAAB4F0EABAB2600D30DB70C",
    "ProjectStatusContentTypeId": "0x010022252E35737A413FB56A1BA53862F6D5"
  }
}
```

Veiviseren leser malfila som raden brukeren velger i `Maloppsett`, peker på (kolonnen `Mal`). En verdi i raden går foran verdien i fila (`ProjectTemplate.getSchema()` i `shared-library`).

| Parameter | Brukes til | Kolonnen i `Maloppsett` som overstyrer |
|---|---|---|
| `ProvisionSiteFields` | Hubens nettstedskolonner i denne gruppen («Kolonner for Prosjektportalen (Prosjekt)») kopieres til prosjektområdet. Beregnede kolonner og kolonner som finnes fra før, hoppes over | `Prosjektkolonner` (`GtProjectColumns`) |
| `CustomSiteFields` | Kolonner i denne gruppen («Egendefinerte kolonner for Prosjektportalen») synkroniseres med huben, selv om navnet ikke begynner med `Gt` | `Kundespesifikke kolonner` (`GtProjectCustomColumns`) |
| `ProjectContentTypeId` | Innholdstypen på huben som egenskapslisten (`Prosjektegenskaper`) bygges fra | `Prosjekt innholdstype` (`GtProjectContentType`) |
| `ProjectStatusContentTypeId` | Innholdstypen for statusrapportene i `Prosjektstatus` | `Prosjektstatus innholdstype` (`GtProjectStatusContentType`) |
| `TimelineContentTypeId` | Innholdstypen for tidslinjeelementer. Uten den hopper veiviseren over oppsettet av tidslinjen. Finnes ikke i kildefilene | `Tidslinje innholdstype` (`GtTimelineContentType`) |
| `TermSetIds` | Termsett per felt (under) | `Prosjektfase Termsett ID` (`GtProjectPhaseTermId`), for `GtProjectPhase` |

Parameterne lagres som JSON i det skjulte feltet `TemplateParameters` i prosjektets egenskapsliste, og `Prosjektstatus` henter `ProjectStatusContentTypeId` derfra. Når veiviseren kjøres på nytt fra `Prosjektinformasjon`, beholdes de lagrede parameterne.

### TermSetIds

`TermSetIds` er et kart fra internt feltnavn til termsett-ID:

```json
{
  "Parameters": {
    "TermSetIds": {
      "<internt feltnavn>": "<termsett-ID>"
    }
  }
}
```

- Veiviseren bygger kartet fra `Parameters.TermSetIds` i fila, med `GtProjectPhase` fra kolonnen `Prosjektfase Termsett ID` i `Maloppsett`. Kolonnen har standardverdien `abcfc9d9-a263-4abb-8234-be973c46258a` (termsettet `Fase`); raden for programmalen bruker `54f92279-2602-4d70-95b5-e6113f27666e` (`Fase (Program)`). Kildefilene har ingen `TermSetIds`.
- Oppgaven `SetTaxonomyFields` kobler hvert felt i kartet til termsettet i standard termlager. Feltet må finnes på prosjektområdet.
- Utvidelsens egenskap `termSetIds`, som site scriptet setter, brukes bare når skjemaet mangler `Parameters.TermSetIds`. For vanlige maler lager veiviseren alltid kartet, så standardverdiene i site scriptet gjelder i praksis bare sentrale malpakker som har egne `Parameters` uten `TermSetIds`.

### Hva veiviseren gjør

Oppgavene kjører i denne rekkefølgen (`ProjectExtensions/src/extensions/projectSetup/tasks/index.ts`):

1. `PreTask` henter malen og parameterne. For en vanlig mal sjekker den at hver parameterverdi med `0x` er en innholdstype på huben, og at termsettet for `GtProjectPhase` finnes; ellers stopper veiviseren. Sjekken hoppes over når utvidelsens egenskap `forceTemplate` er satt. En sentral malpakke (`Malpakketype` = `Sentral` i `Maloppsett`) tar skjemaet fra `.pppkg`-fila raden peker på, bruker malfila raden peker på når pakken ikke har `Parameters`, og sjekkes ikke.
2. `SitePermissions`.
3. `SetupProjectInformation` lager egenskapslisten fra innholdstypen i `ProjectContentTypeId` og legger prosjektet til i hublisten `Prosjekter`.
4. `ProvisionSiteFields` kopierer kolonnene i gruppen `ProvisionSiteFields`.
5. `ApplyTemplate` legger på malen med sp-js-provisioning, og deretter hvert valgt prosjekttillegg (`Prosjekttillegg`) uten `Hooks`. Har et valgt tillegg sin egen `QuickLaunch` eller `TopNavigationBar` i `Navigation`, legges malen på uten den menyen, så tilleggets meny blir den prosjektet får. Motorens advarsler og feil kommer i den avanserte loggen under steget.
6. `SetTaxonomyFields` kobler feltene i `TermSetIds`.
7. `CopyListData` kopierer det valgte listeinnholdet (`Listeinnhold`), også Planner-oppgaver og tidslinjeelementer.
8. `CustomActions` og `Hooks`.

Veiviseren kjører bare når området settes opp, eller når en administrator kjører den på nytt. Hvordan eksisterende prosjekter ellers får endringer, står i [Maler](maler.md), «Slik når innholdet prosjektområdene».

### Når veiviseren kjøres på nytt

`Kjør oppsettveiviser` og `Gjør om til overordnet prosjekt` i `Prosjektinformasjon` legger en mal og tillegg på et område som allerede har innhold. Fra sp-js-provisioning 1.5.1 gjelder dette:

- En listekolonne i `Fields` som finnes, oppdateres der den står og beholder verdiene. Før 1.5.0 ble den slettet og laget på nytt, så en ny kjøring tømte blant annet oppslagskolonnene i standardmalene. En utvidende typeendring (tekst til flere linjer tekst, oppslag til flervalgsoppslag, person til flere personer) tas i bruk. En annen typeendring logges som advarsel, og kolonnen beholder typen sin. Et oppslag eller termsett som peker et annet sted enn kolonnen gjør, følger malen bare når listen ble laget i samme kjøring; ellers logges det som advarsel, og kolonnen beholder målet sitt. Programområder fra før 1.15.0 mangler `Prosjektloggprodukt` (`GtProjectLogProductLookup`) i `Prosjektlogg`: malen pekte den på `Prosjektleveranser`, som programområder ikke har, og SharePoint avviste kolonnen. Nye programområder slår opp i programmets egen `Programleveranser`. På eksisterende programområder legger oppgraderingssteget `EnsureProgramProjectLogProductLookup.ps1` den til (se [Oppgraderingssteg](maler.md#oppgraderingssteg)), og en ny kjøring av veiviseren gjør det samme, siden kolonnen mangler.
- En liste som finnes, får bare innstillingene malen angir. `RemoveExistingContentTypes` og `RemoveExistingViews` virker bare på lister som ble laget i denne kjøringen, tilleggene medregnet, og gjør ingenting med en liste som fantes fra før.
- Områdekolonner (`SiteFields`) flettes inn i det kolonnen har, og skrives bare når noe endres; det malen ikke nevner, for eksempel en indeks eller en formatering, beholdes. Et underelement malen angir (`CHOICES`, `Default`, `Formula`), erstatter fortsatt det lagrede. Endringen når ikke kopiene av kolonnen i listene.
- Menyen (`Navigation`) avstemmes på tittel, nivå for nivå. Et menypunkt med samme tittel beholder id, adresse og målgrupper, og ingenting skrives for det; mangler et punkt, legges det til, og motoren sletter punktene malen ikke har, også lenker eiere har lagt til (veiviseren legger dem tilbake, se under). Skal malen endre adressen til et punkt som finnes, trenger punktet `IgnoreExisting`. Titlene sammenlignes på språket til den som kjører veiviseren: SharePoints egne `Hjem` og `Dokumenter` kjennes bare igjen for en bruker med norsk språk, ellers legges malens punkt til og SharePoints slettes.
- Har et valgt prosjekttillegg sin egen `QuickLaunch` eller `TopNavigationBar`, legger `ApplyTemplate` malen på uten den menyen (`_omitNavigationOfExtensions`), og tillegget avstemmer menyen alene. Ellers la malen ved hver kjøring til punktene tillegget så slettet, og stoppet på et av malens punkter som pekte på noe som var slettet.
- Eiernes lenker legges tilbake etter oppsettet. `Prosjektinformasjon` lagrer menyen (`getMenuState`) med områdets adresse i nettleserens lokale lagring (`pp_navigationNodes`, `saveNavigationNodes.ts` i `ProjectWebParts`) før siden lastes på nytt. Kan menyen ikke leses eller lagres, fjernes en tidligere lagring, og dialogen sier fra og lar brukeren avbryte eller fortsette uten at eiernes lenker legges tilbake. Når oppgavene er ferdige, legger veiviseren hvert lagret punkt som menyen mangler på sitt nivå (på tittel), tilbake sist på nivået, med ny id og uten målgrupper, med mindre punktet er malens eget. Det er det når malen (slik skjemaet har den, også menyen et tillegg tok over) eller et valgt tillegg har et punkt med samme tittel på samme nivå eller med samme adresse, eller når punktet har en tittel malen hadde før en omdøping og nivået har den nye (`Gevinstoversikt` der nivået har `Nytteoversikt`). Det gjelder også de norske titlene de engelske malene hadde til og med 1.11, fordi skriptet som laget malene bare byttet ut `{{tokens}}` (`Hjem` der nivået har `Home`, `Programinnhold` der det har `Program Content`). Listen står per mal og nivå i `projectSetup/templateQuickLaunch.ts`, med de nye titlene fra `SharedResources`, som er på områdets språk når veiviseren har slått av områdets alternative språk. Et slikt punkt legges ikke tilbake, og heller ikke punktene under det, eiernes lenker der medregnet, så et tillegg med egen meny kan forenkle menyen. Eiernes lenker under et punkt med en tidligere tittel, som `Gevinstarbeid`, og på et engelsk prosjekt fra 1.11 eller eldre også `Programinnhold` og `Underordnet innhold`, kommer derfor ikke tilbake der nivået har den nye tittelen. Under et punkt menyen har, legges eiernes underpunkter tilbake etter samme regel. Et punkt SharePoint avviser, logges og hoppes over. `Gjør om til overordnet prosjekt` gjør det samme; malen `Overordnet` har bare `Underordnet innhold`, så resten av prosjektets meny kommer tilbake.
- En områdekolonne SharePoint avviser, en listekolonne, visningsfeltene, en innholdstype på en liste eller en rad i `DataRows` som feiler, logges som feil med navnet på det som feilet, og malen fortsetter. Et menypunkt SharePoint avviser (en adresse til en side eller liste som ikke finnes), stopper fortsatt malen, men menyen blir stående som den var, og feilen navngir punktet og adressen.
- Veiviseren legger motorens advarsler og feil i den avanserte loggen, under steget de kom fra. Et steg som logget feil, vises som «fullført med advarsler», den siste dialogen advarer med antallet («Oppsettet er fullført med feil»), og loggen på porteføljeområdet får feilene i stedet for «Prosjektet ... ble provisjonert uten feil». Elementer `CopyListData` ikke kunne kopiere, telles på samme måte. I `Malpakkekatalog` avsluttes en import eller oppdatering med en advarsel når provisjoneringen av porteføljeområdet logget feil, og tilgjengeliggjøring som skymal lister feilene.

### Prøve en mal lokalt

sp-js-provisioning er et eget repo. I en klone av det legger `npm run provision -- --package <mappe|.pppkg|template.json>` en mal på et ekte område fra Node. Påloggingen og området står i `.env` der (fra `.env.example`): lokalt logger den på med øktinformasjonskapslene (cookies) etter Playwright-påloggingen til e2e-brukeren i dette repoet (`e2e/.auth/user.json`, fornyes med `npx playwright test --project=setup` i `e2e/`; `INTEGRATION_COOKIES_FILE` finner den uten videre når klonen ligger ved siden av `prosjektportalen365`), i CI med et appsertifikat. Uten `--site` brukes `INTEGRATION_SITE_URL`, og et annet område må ligge under det, med mindre `--allow-site` gjentar adressen. `--twice` legger malen på to ganger og viser hva en ny kjøring gjør, `--strict` gir exit 1 når en håndterer har logget en feil og fortsatt, og `--dry-run` viser bare planen. Kjøringen etterligner hubimporten av malpakker (`--mode cloud`: tilgjengeliggjøring som skymal), ikke veiviseren, og hopper over håndtererne som ikke virker i Node (taksonomi og innholdstyper, som bruker JSOM, samt `Files` og `PropertyBagEntries`) med mindre `--handlers` tvinger dem. Feilsøk taksonomi og innholdstyper i nettleseren. Flaggene og loggen står i `debug/README.md` og ferdigheten `spjs-provision` i det repoet.

Designet for malpakker (`.pppkg`) og malpakkekatalogen står i [`docs/plans/template-catalog.md`](../../docs/plans/template-catalog.md).

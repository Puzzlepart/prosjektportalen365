## Prosjektmaler (JSON)

Nye prosjektområder settes opp av oppsettveiviseren, `ProjectSetup`-utvidelsen i `ProjectExtensions`. Site scriptet `002000 - Setup extension.txt` knytter den til området (se [Site design og site scripts](site-design-og-site-scripts.md)). Veiviseren legger på en JSON-mal med motoren [sp-js-provisioning](https://github.com/Puzzlepart/sp-js-provisioning), som er låst til versjon `1.4.0` i `ProjectExtensions` og `PortfolioExtensions`.

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
5. `ApplyTemplate` legger på malen med sp-js-provisioning, og deretter hvert valgt prosjekttillegg (`Prosjekttillegg`) uten `Hooks`.
6. `SetTaxonomyFields` kobler feltene i `TermSetIds`.
7. `CopyListData` kopierer det valgte listeinnholdet (`Listeinnhold`), også Planner-oppgaver og tidslinjeelementer.
8. `CustomActions` og `Hooks`.

Veiviseren kjører bare når området settes opp, eller når en administrator kjører den på nytt. Hvordan eksisterende prosjekter ellers får endringer, står i [Maler](maler.md), «Slik når innholdet prosjektområdene».

### Prøve en mal lokalt

sp-js-provisioning er et eget repo. I en klone av det legger `npm run provision -- --site <url> --package <mappe|.pppkg|template.json>` en mal på et ekte område fra Node, med app-only-pålogging fra `debug/provision.settings.ts` (se `debug/README.md` der). Det etterligner hubimporten av malpakker, ikke veiviseren, og hopper over håndtererne som bare virker i nettleseren (taksonomi og innholdstyper). Feilsøk dem i nettleseren.

Designet for malpakker (`.pppkg`) og malpakkekatalogen står i [`docs/plans/template-catalog.md`](../../docs/plans/template-catalog.md).
